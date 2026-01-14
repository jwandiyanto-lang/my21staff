import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Kapso webhook payload types
interface KapsoMessage {
  id: string
  from: string
  type: string
  text?: { body: string }
  timestamp: string
  kapso?: {
    direction: string
    content: string
  }
}

interface KapsoConversation {
  id: string
  contact_name: string
  phone_number: string
}

interface KapsoWebhookPayload {
  message: KapsoMessage
  conversation: KapsoConversation
  phone_number_id: string
  is_new_conversation: boolean
}

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  // Respond immediately to prevent Kapso retries
  const successResponse = NextResponse.json({ received: true })

  try {
    const payload: KapsoWebhookPayload = await request.json()

    if (isDevMode()) {
      console.log('[DEV MODE] Kapso webhook received:', JSON.stringify(payload, null, 2))
    }

    const supabase = createAdminClient()

    // Extract data from payload
    const phoneNumberId = payload.phone_number_id
    const message = payload.message
    const conversation = payload.conversation

    if (!phoneNumberId || !message) {
      console.log('[Webhook] Missing phone_number_id or message')
      return successResponse
    }

    // Find workspace by kapso_phone_id
    const { data: workspaceData, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('kapso_phone_id', phoneNumberId)
      .single()

    if (workspaceError || !workspaceData) {
      console.log(`[Webhook] No workspace found for phone_number_id: ${phoneNumberId}`)
      return successResponse
    }

    const workspaceId = workspaceData.id
    const senderPhone = message.from || conversation.phone_number
    const senderName = conversation.contact_name
    const messageContent = message.text?.body || message.kapso?.content || ''
    const messageType = message.type || 'text'

    // Get or create contact
    const contact = await getOrCreateContact(supabase, workspaceId, senderPhone, senderName)

    // Get or create conversation
    const conversationRecord = await getOrCreateConversation(supabase, workspaceId, contact.id)

    // Check for duplicate message (Kapso may retry)
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('kapso_message_id', message.id)
      .single()

    if (existingMessage) {
      console.log(`[Webhook] Duplicate message ignored: ${message.id}`)
      return successResponse
    }

    // Insert message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationRecord.id,
        workspace_id: workspaceId,
        direction: 'inbound',
        sender_type: 'contact',
        content: messageContent,
        message_type: messageType,
        kapso_message_id: message.id,
      })

    if (messageError) {
      console.error('[Webhook] Message insert error:', messageError)
      return successResponse
    }

    // Update conversation metadata
    const preview = messageContent.substring(0, 100) || '[media]'
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        unread_count: (conversationRecord.unread_count || 0) + 1,
      })
      .eq('id', conversationRecord.id)

    console.log(`[Webhook] Message saved for workspace ${workspaceId}, conversation ${conversationRecord.id}`)

  } catch (error) {
    console.error('[Webhook] Error processing:', error)
  }

  return successResponse
}

// GET for webhook verification (Kapso sends hub.challenge)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge')

  if (challenge) {
    // Return plain text challenge for webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ status: 'Webhook endpoint ready' })
}

// Helper: Get or create contact
async function getOrCreateContact(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  phone: string,
  name: string | null
) {
  // Try to find existing contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('phone', phone)
    .single()

  if (existingContact) {
    // Update name if we have a new one and contact doesn't have one
    if (name && !existingContact.name) {
      await supabase
        .from('contacts')
        .update({ name })
        .eq('id', existingContact.id)
    }
    return existingContact
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      workspace_id: workspaceId,
      phone,
      name,
      lead_status: 'new',
      lead_score: 0,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create contact: ${error.message}`)
  }

  return newContact
}

// Helper: Get or create conversation
async function getOrCreateConversation(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  contactId: string
) {
  // Try to find existing conversation
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', contactId)
    .single()

  if (existingConversation) {
    return existingConversation
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from('conversations')
    .insert({
      workspace_id: workspaceId,
      contact_id: contactId,
      status: 'open',
      unread_count: 0,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`)
  }

  return newConversation
}
