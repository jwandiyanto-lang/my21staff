import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMutation, fetchQuery } from 'convex/server'
import { api } from '@/convex/_generated/api'
import { sendMessage } from '@/lib/kapso/client'
import type { KapsoCredentials } from '@/lib/kapso/client'
import type { Conversation, Contact, Workspace } from '@/types/database'
import { validateBody } from '@/lib/validations'
import { sendMessageSchema } from '@/lib/validations/message'
import { rateLimitByUser } from '@/lib/rate-limit'
import { safeDecrypt } from '@/lib/crypto'

interface WorkspaceSettings {
  kapso_api_key?: string
}

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  try {
    // Validate input with Zod
    const validationResult = await validateBody(request, sendMessageSchema)
    if (validationResult instanceof NextResponse) return validationResult

    const { conversationId, content } = validationResult

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit: 30 messages per minute per user
    const rateLimitResponse = rateLimitByUser(user.id, 'messages/send', { limit: 30, windowMs: 60 * 1000 })
    if (rateLimitResponse) return rateLimitResponse

    // Fetch conversation via Convex
    const conversation = await fetchQuery(
      api.conversations.getByIdInternal,
      { conversation_id: conversationId }
    )

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const workspaceId = conversation.workspace_id

    // Verify workspace membership via Supabase (auth still via Supabase)
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this conversation' },
        { status: 403 }
      )
    }

    // Fetch contact phone via Convex
    const contact = await fetchQuery(
      api.contacts.getByIdInternal,
      { contact_id: conversation.contact_id }
    )

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const contactPhone = contact.phone

    // Fetch workspace for Kapso credentials via Convex
    const workspace = await fetchQuery(
      api.workspaces.getById,
      { workspace_id: workspaceId }
    )

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    let kapsoMessageId: string | null = null

    // Send via Kapso (unless dev mode)
    if (isDevMode()) {
      // Dev mode: skip actual Kapso call, generate mock ID
      kapsoMessageId = `mock-${Date.now()}`
      console.log(`[DEV MODE] Skipping Kapso send. Mock ID: ${kapsoMessageId}`)
    } else {
      // Production: call Kapso API
      const settings = workspace.settings as WorkspaceSettings | null
      const encryptedKey = settings?.kapso_api_key
      const phoneId = workspace.kapso_phone_id

      if (!encryptedKey || !phoneId) {
        return NextResponse.json(
          { error: 'WhatsApp credentials not configured' },
          { status: 500 }
        )
      }

      // Decrypt API key (handles both encrypted and legacy plain-text keys)
      const apiKey = safeDecrypt(encryptedKey)
      const credentials: KapsoCredentials = { apiKey, phoneId }

      try {
        const kapsoResponse = await sendMessage(credentials, contactPhone, content.trim())
        kapsoMessageId = kapsoResponse.messages[0]?.id || null
      } catch (kapsoError) {
        console.error('Kapso send error:', kapsoError)
        return NextResponse.json(
          { error: 'Failed to send WhatsApp message' },
          { status: 500 }
        )
      }
    }

    // Insert message to Convex database
    const message = await fetchMutation(
      api.createMessageInternal,
      {
        conversation_id: conversationId,
        workspace_id: workspaceId,
        content: content.trim(),
        sender_type: 'user',
        sender_id: user.id,
        message_type: 'text',
        media_url: undefined,
        kapso_message_id: kapsoMessageId,
        metadata: undefined,
      }
    )

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
