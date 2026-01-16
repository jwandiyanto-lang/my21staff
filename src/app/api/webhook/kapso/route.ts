import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'

// Meta/WhatsApp Business API webhook payload types
interface MetaWebhookMessage {
  id: string
  from: string
  type: string
  text?: { body: string }
  image?: { id: string; caption?: string }
  audio?: { id: string }
  video?: { id: string; caption?: string }
  document?: { id: string; filename?: string; caption?: string }
  timestamp: string
  // Reply context - when user replies to a specific message
  context?: {
    from: string
    id: string  // The message ID being replied to
  }
}

interface MetaWebhookContact {
  wa_id: string
  profile: { name: string }
}

interface MetaWebhookValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: MetaWebhookContact[]
  messages?: MetaWebhookMessage[]
  statuses?: unknown[]
}

interface MetaWebhookEntry {
  id: string
  changes: {
    field: string
    value: MetaWebhookValue
  }[]
}

interface MetaWebhookPayload {
  object: string
  entry: MetaWebhookEntry[]
}

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  // Respond immediately to prevent Kapso retries
  const successResponse = NextResponse.json({ received: true })

  try {
    const rawPayload = await request.json()

    // Always log incoming webhook for debugging
    console.log('[Webhook] Received payload:', JSON.stringify(rawPayload).substring(0, 1000))

    // Check if this is Meta/WhatsApp format (has entry array)
    if (rawPayload.entry && Array.isArray(rawPayload.entry)) {
      await handleMetaFormat(rawPayload as MetaWebhookPayload)
    } else {
      // Legacy format or unknown - log for debugging
      console.log('[Webhook] Unknown payload format - not Meta format')
    }

  } catch (error) {
    console.error('[Webhook] Error processing:', error)
  }

  return successResponse
}

async function handleMetaFormat(payload: MetaWebhookPayload) {
  const supabase = createApiAdminClient()

  console.log('[Webhook] Processing Meta format, entries:', payload.entry.length)

  for (const entry of payload.entry) {
    console.log('[Webhook] Entry ID:', entry.id, 'Changes:', entry.changes.length)

    for (const change of entry.changes) {
      console.log('[Webhook] Change field:', change.field)

      if (change.field !== 'messages') {
        console.log('[Webhook] Skipping non-messages field')
        continue
      }

      const value = change.value
      const phoneNumberId = value.metadata?.phone_number_id

      console.log('[Webhook] Metadata:', JSON.stringify(value.metadata))
      console.log('[Webhook] Phone number ID from webhook:', phoneNumberId)

      if (!phoneNumberId) {
        console.log('[Webhook] No phone_number_id in metadata')
        continue
      }

      // Find workspace by kapso_phone_id
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, kapso_phone_id')
        .eq('kapso_phone_id', phoneNumberId)
        .single()

      console.log('[Webhook] Workspace lookup result:', { data: workspaceData, error: workspaceError?.message })

      if (workspaceError || !workspaceData) {
        // Also log all workspaces to debug
        const { data: allWorkspaces } = await supabase
          .from('workspaces')
          .select('id, name, kapso_phone_id')
        console.log('[Webhook] All workspaces:', JSON.stringify(allWorkspaces))
        console.log(`[Webhook] No workspace found for phone_number_id: ${phoneNumberId}`)
        continue
      }

      const workspaceId = workspaceData.id
      const contacts = value.contacts || []
      const messages = value.messages || []

      // Skip if no messages (might be status update)
      if (messages.length === 0) {
        console.log('[Webhook] No messages in payload (might be status update)')
        continue
      }

      for (const message of messages) {
        // Find matching contact info
        const contactInfo = contacts.find(c => c.wa_id === message.from)
        const senderPhone = message.from
        const senderName = contactInfo?.profile?.name || null

        // Extract message content based on type
        let messageContent = ''
        const messageType = message.type || 'text'

        switch (messageType) {
          case 'text':
            messageContent = message.text?.body || ''
            break
          case 'image':
            messageContent = message.image?.caption || '[Image]'
            break
          case 'audio':
            messageContent = '[Audio message]'
            break
          case 'video':
            messageContent = message.video?.caption || '[Video]'
            break
          case 'document':
            messageContent = message.document?.caption || `[Document: ${message.document?.filename || 'file'}]`
            break
          default:
            messageContent = `[${messageType}]`
        }

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
          continue
        }

        // Build metadata with reply context if present
        const messageMetadata: Record<string, unknown> = {}
        if (message.context) {
          messageMetadata.reply_to_kapso_id = message.context.id
          messageMetadata.reply_to_from = message.context.from
          console.log(`[Webhook] Message is a reply to: ${message.context.id}`)
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
            metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : null,
          })

        if (messageError) {
          console.error('[Webhook] Message insert error:', messageError)
          continue
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
      }
    }
  }
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
  supabase: ReturnType<typeof createApiAdminClient>,
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
  supabase: ReturnType<typeof createApiAdminClient>,
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
