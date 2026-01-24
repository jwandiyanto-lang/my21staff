import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { sendMessage as kapsoSendMessage } from '@/lib/kapso/client'
import { decrypt } from '@/lib/crypto'
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
    // 1. Authenticate via Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { workspace_id, conversation_id, content, message_type = 'text' } = body

    if (!workspace_id || !conversation_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const metrics = createRequestMetrics()

    // 3. Get conversation and contact
    let queryStart = performance.now()
    const conversation = await fetchQuery(
      api.conversations.getByIdInternal,
      { conversation_id }
    )
    logQuery(metrics, 'convex.conversations.getByIdInternal', Math.round(performance.now() - queryStart))

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    queryStart = performance.now()
    const contact = await fetchQuery(
      api.contacts.getByIdInternal,
      { contact_id: conversation.contact_id }
    )
    logQuery(metrics, 'convex.contacts.getByIdInternal', Math.round(performance.now() - queryStart))

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // 4. Get workspace with Kapso credentials
    queryStart = performance.now()
    const workspace = await fetchQuery(
      api.workspaces.getByIdInternal,
      { workspace_id }
    )
    logQuery(metrics, 'convex.workspaces.getByIdInternal', Math.round(performance.now() - queryStart))

    if (!workspace || !workspace.kapso_phone_id || !workspace.meta_access_token) {
      return NextResponse.json(
        { error: 'Kapso not configured for this workspace' },
        { status: 400 }
      )
    }

    // 5. Decrypt Kapso API key
    const apiKey = decrypt(workspace.meta_access_token)

    // 6. Send via Kapso
    queryStart = performance.now()
    const kapsoResult = await kapsoSendMessage(
      { apiKey, phoneId: workspace.kapso_phone_id },
      contact.phone,
      content
    )
    logQuery(metrics, 'kapso.sendMessage', Math.round(performance.now() - queryStart))

    // 7. Store message in Convex
    queryStart = performance.now()
    const message = await fetchMutation(
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

    return NextResponse.json({
      success: true,
      message,
      kapso_message_id: kapsoResult.messages?.[0]?.id,
    })

  } catch (error) {
    console.error('[MessagesSend] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}

export const POST = withTiming('/api/messages/send', postHandler)
