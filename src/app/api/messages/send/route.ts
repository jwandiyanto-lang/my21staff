import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { sendMessage as kapsoSendMessage } from '@/lib/kapso/client'
import { safeDecrypt } from '@/lib/crypto'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
} from '@/lib/instrumentation/with-timing'

/**
 * POST /api/messages/send
 *
 * Send message via Kapso API, store in Convex.
 *
 * Authentication: Clerk auth
 */
async function postHandler(request: NextRequest) {
  try {
    console.log('[MessagesSend] Step 1: Starting send request')

    // 1. Authenticate via Clerk and get token
    const { userId, getToken } = await auth()
    if (!userId) {
      console.log('[MessagesSend] Step 1: Auth failed - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Clerk JWT for Convex authentication
    const token = await getToken({ template: 'convex' })
    console.log('[MessagesSend] Step 1: Auth success, userId:', userId, 'token:', token ? 'present' : 'missing')

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    convex.setAuth(token!)

    // 2. Parse request body
    const body = await request.json()
    const { workspace_id, conversation_id, content, message_type = 'text' } = body
    console.log('[MessagesSend] Step 2: Parsed body:', { workspace_id, conversation_id, content, message_type })

    if (!workspace_id || !conversation_id || !content) {
      console.log('[MessagesSend] Step 2: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const metrics = createRequestMetrics()

    // 3. Get conversation and contact
    console.log('[MessagesSend] Step 3: Fetching conversation...')
    let queryStart = performance.now()
    const conversationResult = await convex.query(
      api.conversations.getByIdInternal,
      { conversation_id }
    )
    logQuery(metrics, 'convex.conversations.getByIdInternal', Math.round(performance.now() - queryStart))

    // Type assertion - getByIdInternal returns conversation type
    const conversation = conversationResult as { contact_id: string } | null
    console.log('[MessagesSend] Step 3: Conversation result:', conversation)

    if (!conversation) {
      console.log('[MessagesSend] Step 3: Conversation not found')
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    console.log('[MessagesSend] Step 4: Fetching contact...')
    queryStart = performance.now()
    const contactResult = await convex.query(
      api.contacts.getByIdInternal,
      { contact_id: conversation.contact_id }
    )
    logQuery(metrics, 'convex.contacts.getByIdInternal', Math.round(performance.now() - queryStart))

    // Type assertion - getByIdInternal returns contact type
    const contact = contactResult as { phone: string } | null
    console.log('[MessagesSend] Step 4: Contact result:', contact)

    if (!contact) {
      console.log('[MessagesSend] Step 4: Contact not found')
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // 4. Get workspace with Kapso credentials
    console.log('[MessagesSend] Step 5: Fetching workspace...')
    queryStart = performance.now()
    const workspaceResult = await convex.query(
      api.workspaces.getByIdInternal,
      { workspace_id }
    )
    logQuery(metrics, 'convex.workspaces.getByIdInternal', Math.round(performance.now() - queryStart))

    // Type assertion - getByIdInternal returns workspace type
    const workspace = workspaceResult as { kapso_phone_id?: string; meta_access_token?: string } | null
    console.log('[MessagesSend] Step 5: Workspace result:', { hasWorkspace: !!workspace, hasPhoneId: !!workspace?.kapso_phone_id, hasToken: !!workspace?.meta_access_token })

    if (!workspace || !workspace.kapso_phone_id || !workspace.meta_access_token) {
      console.log('[MessagesSend] Step 5: Kapso not configured')
      return NextResponse.json(
        { error: 'Kapso not configured for this workspace' },
        { status: 400 }
      )
    }

    // 5. Decrypt Kapso API key (safeDecrypt handles both encrypted and plain text)
    console.log('[MessagesSend] Step 6: Decrypting API key...')
    const apiKey = safeDecrypt(workspace.meta_access_token)
    console.log('[MessagesSend] Step 6: API key decrypted, length:', apiKey?.length)

    // 6. Send via Kapso FIRST
    console.log('[MessagesSend] Step 7: Sending via Kapso...', { phoneId: workspace.kapso_phone_id, toPhone: contact.phone })
    queryStart = performance.now()
    const kapsoResult = await kapsoSendMessage(
      { apiKey, phoneId: workspace.kapso_phone_id },
      contact.phone,
      content
    )
    logQuery(metrics, 'kapso.sendMessage', Math.round(performance.now() - queryStart))
    console.log('[MessagesSend] Step 7: Kapso result:', kapsoResult)

    // 7. Store message in Convex with kapso_message_id
    console.log('[MessagesSend] Step 8: Storing in Convex...')
    console.log('[MessagesSend] → Creating OUTBOUND message with kapso_id:', kapsoResult.messages?.[0]?.id)
    queryStart = performance.now()
    const message = await convex.mutation(
      api.mutations.createOutboundMessage,
      {
        workspace_id,
        conversation_id,
        sender_id: userId,
        content,
        message_type,
        kapso_message_id: kapsoResult.messages?.[0]?.id,
      }
    )
    logQuery(metrics, 'convex.mutations.createOutboundMessage', Math.round(performance.now() - queryStart))
    console.log('[MessagesSend] ✓ Created OUTBOUND message:', {
      id: message._id,
      direction: message.direction,
      kapso_id: message.kapso_message_id,
      content: content.substring(0, 30)
    })

    return NextResponse.json({
      success: true,
      message,
      kapso_message_id: kapsoResult.messages?.[0]?.id,
    })

  } catch (error) {
    console.error('[MessagesSend] Full error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    })

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

export const POST = withTiming('/api/messages/send', postHandler)
