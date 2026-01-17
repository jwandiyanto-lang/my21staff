import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Fetch conversation to get workspace_id and contact_id
    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .select('id, workspace_id, contact_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversation = conversationData as Pick<Conversation, 'id' | 'workspace_id' | 'contact_id'>

    // Check user has access to this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', conversation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this conversation' },
        { status: 403 }
      )
    }

    // Fetch contact phone
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('phone')
      .eq('id', conversation.contact_id)
      .single()

    if (contactError || !contactData) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const contact = contactData as Pick<Contact, 'phone'>

    // Fetch workspace for Kapso credentials
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspaces')
      .select('kapso_phone_id, settings')
      .eq('id', conversation.workspace_id)
      .single()

    if (wsError || !workspaceData) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const workspace = workspaceData as Pick<Workspace, 'kapso_phone_id' | 'settings'>

    const contactPhone = contact.phone
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

    // Insert message to database
    const now = new Date().toISOString()
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        workspace_id: conversation.workspace_id,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: user.id,
        content: content.trim(),
        message_type: 'text',
        kapso_message_id: kapsoMessageId,
        created_at: now,
      })
      .select()
      .single()

    if (insertError || !message) {
      console.error('Message insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Update conversation last_message_at and preview
    const preview = content.trim().substring(0, 100)
    await supabase
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: preview,
        updated_at: now,
      })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
