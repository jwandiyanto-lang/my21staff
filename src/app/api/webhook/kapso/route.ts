import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { verifyKapsoSignature } from '@/lib/kapso/verify-signature'
import { normalizePhone } from '@/lib/phone/normalize'
import type { Json } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// PII masking helper for safe logging
function maskPayload(payload: unknown): string {
  const str = JSON.stringify(payload)
  // Mask phone numbers in the log (10-15 digit numbers)
  return str.replace(/"\d{10,15}"/g, '"***MASKED***"')
    .replace(/"from":\s*"\d+"/g, '"from":"***"')
    .replace(/"wa_id":\s*"\d+"/g, '"wa_id":"***"')
}

// Types for batch processing
interface Contact {
  id: string
  phone: string
  phone_normalized?: string
  name: string | null
  kapso_name?: string | null
  workspace_id: string
}

interface Conversation {
  id: string
  contact_id: string
  workspace_id: string
  unread_count: number
}

interface MessageData {
  phone: string
  message: MetaWebhookMessage
  contactInfo?: MetaWebhookContact
  workspaceId: string
}

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

export async function POST(request: NextRequest) {
  // Respond immediately to prevent Kapso retries
  const successResponse = NextResponse.json({ received: true })

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-kapso-signature')
    const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET

    // Verify signature if webhook secret is configured
    if (webhookSecret) {
      if (!verifyKapsoSignature(rawBody, signature, webhookSecret)) {
        console.error('[Webhook] Invalid signature - rejecting request')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      console.log('[Webhook] Signature verified')
    } else {
      console.log('[Webhook] Warning: KAPSO_WEBHOOK_SECRET not set - skipping signature verification')
    }

    // Parse body after verification
    const rawPayload = JSON.parse(rawBody)

    // Always log incoming webhook for debugging (masked for privacy)
    console.log('[Webhook] Received payload (masked):', maskPayload(rawPayload).substring(0, 500))

    // Check if this is Meta/WhatsApp format (has entry array)
    if (rawPayload.entry && Array.isArray(rawPayload.entry)) {
      // Process asynchronously - don't await
      // This ensures we return 200 immediately while processing continues
      processWebhookAsync(rawPayload as MetaWebhookPayload).catch(error => {
        console.error('[Webhook] Async processing error:', error)
      })
    } else {
      // Legacy format or unknown - log for debugging
      console.log('[Webhook] Unknown payload format - not Meta format')
    }

  } catch (error) {
    console.error('[Webhook] Error processing:', error)
  }

  return successResponse
}

// Async processor - runs after 200 response is sent
async function processWebhookAsync(payload: MetaWebhookPayload): Promise<void> {
  const startTime = Date.now()
  const supabase = createApiAdminClient()

  try {
    // Collect all messages grouped by workspace
    const workspaceMessages = new Map<string, MessageData[]>()

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue

        const value = change.value
        const phoneNumberId = value.metadata?.phone_number_id
        if (!phoneNumberId) continue

        // Find workspace by kapso_phone_id
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('id, kapso_phone_id')
          .eq('kapso_phone_id', phoneNumberId)
          .single()

        if (!workspaceData) {
          console.log(`[Webhook] No workspace for phone_number_id: ${phoneNumberId}`)
          continue
        }

        const workspaceId = workspaceData.id
        const contacts = value.contacts || []
        const messages = value.messages || []

        if (messages.length === 0) continue

        // Collect messages for this workspace
        if (!workspaceMessages.has(workspaceId)) {
          workspaceMessages.set(workspaceId, [])
        }

        for (const message of messages) {
          const contactInfo = contacts.find(c => c.wa_id === message.from)
          workspaceMessages.get(workspaceId)!.push({
            phone: message.from,
            message,
            contactInfo,
            workspaceId,
          })
        }
      }
    }

    // Process each workspace's messages with batching
    let totalMessages = 0
    for (const [workspaceId, messagesData] of workspaceMessages) {
      await processWorkspaceMessages(supabase, workspaceId, messagesData)
      totalMessages += messagesData.length
    }

    const duration = Date.now() - startTime
    console.log(`[Webhook] Processed ${totalMessages} messages in ${duration}ms`)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Webhook] Processing failed after ${duration}ms:`, error)
    throw error
  }
}

// Process all messages for a single workspace with batched operations
async function processWorkspaceMessages(
  supabase: SupabaseClient,
  workspaceId: string,
  messagesData: MessageData[]
): Promise<void> {
  if (messagesData.length === 0) return

  // Collect unique phone numbers
  const phoneNumbers = [...new Set(messagesData.map(m => m.phone))]
  const phoneToName = new Map<string, string | null>()
  for (const m of messagesData) {
    if (m.contactInfo?.profile?.name && !phoneToName.has(m.phone)) {
      phoneToName.set(m.phone, m.contactInfo.profile.name)
    }
  }

  console.log(`[Webhook] Processing ${messagesData.length} messages for workspace ${workspaceId}, phones: ${phoneNumbers.length}`)

  // Batch 1: Get or create all contacts
  const contactMap = await getOrCreateContactsBatch(supabase, workspaceId, phoneNumbers, phoneToName)

  // Batch 2: Get or create all conversations
  const conversationMap = await getOrCreateConversationsBatch(supabase, workspaceId, contactMap)

  // Filter out duplicate messages
  const kapsoMessageIds = messagesData.map(m => m.message.id)
  const { data: existingMessages } = await supabase
    .from('messages')
    .select('kapso_message_id')
    .in('kapso_message_id', kapsoMessageIds)

  const existingIds = new Set((existingMessages || []).map(m => m.kapso_message_id))
  const newMessages = messagesData.filter(m => !existingIds.has(m.message.id))

  if (newMessages.length === 0) {
    console.log(`[Webhook] All ${messagesData.length} messages already exist, skipping`)
    return
  }

  // Batch 3: Insert all new messages at once
  const messageInserts = newMessages.map(({ phone, message }) => {
    const conversation = conversationMap.get(phone)
    if (!conversation) return null

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

    // Build metadata with reply context if present
    const messageMetadata: { [key: string]: Json } = {}
    if (message.context) {
      messageMetadata.reply_to_kapso_id = message.context.id
      messageMetadata.reply_to_from = message.context.from
    }

    return {
      conversation_id: conversation.id,
      workspace_id: workspaceId,
      direction: 'inbound' as const,
      sender_type: 'contact' as const,
      content: messageContent,
      message_type: messageType,
      kapso_message_id: message.id,
      ...(Object.keys(messageMetadata).length > 0 ? { metadata: messageMetadata } : {}),
    }
  }).filter((m): m is NonNullable<typeof m> => m !== null)

  if (messageInserts.length > 0) {
    const { error: insertError } = await supabase
      .from('messages')
      .insert(messageInserts)

    if (insertError) {
      console.error('[Webhook] Batch message insert error:', insertError)
    }
  }

  // Batch 4: Update conversation metadata
  // Group by conversation to get correct unread counts
  const conversationUpdates = new Map<string, { phone: string; count: number; lastPreview: string }>()
  for (const { phone, message } of newMessages) {
    const conversation = conversationMap.get(phone)
    if (!conversation) continue

    const existing = conversationUpdates.get(conversation.id) || {
      phone,
      count: 0,
      lastPreview: '',
    }
    existing.count++
    // Use last message as preview
    existing.lastPreview = (message.text?.body || '[media]').substring(0, 100)
    conversationUpdates.set(conversation.id, existing)
  }

  // Update each conversation (can't batch these easily due to different values)
  for (const [conversationId, update] of conversationUpdates) {
    const conversation = conversationMap.get(update.phone)
    const currentUnread = conversation?.unread_count || 0

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: update.lastPreview,
        unread_count: currentUnread + update.count,
      })
      .eq('id', conversationId)
  }

  console.log(`[Webhook] Saved ${messageInserts.length} messages, updated ${conversationUpdates.size} conversations`)
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

// Batch helper: Get or create contacts for multiple phone numbers
async function getOrCreateContactsBatch(
  supabase: SupabaseClient,
  workspaceId: string,
  phones: string[],
  phoneToName: Map<string, string | null>
): Promise<Map<string, Contact>> {
  const contactMap = new Map<string, Contact>()

  // Normalize all phone numbers for matching
  const normalizedPhones = phones.map(p => normalizePhone(p) || p)
  const phoneToNormalized = new Map<string, string>()
  phones.forEach((p, i) => phoneToNormalized.set(p, normalizedPhones[i]))

  // Get unique normalized phones for query
  const uniqueNormalizedPhones = [...new Set(normalizedPhones)]

  // Get existing contacts by normalized phone
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id, phone, phone_normalized, name, kapso_name, workspace_id')
    .eq('workspace_id', workspaceId)
    .in('phone_normalized', uniqueNormalizedPhones)

  for (const contact of existingContacts || []) {
    // Map back to original phone for lookup
    const originalPhone = phones.find(p =>
      (normalizePhone(p) || p) === contact.phone_normalized
    )
    if (originalPhone) {
      contactMap.set(originalPhone, contact as Contact)
    }

    // Update kapso_name and cache_updated_at if we have new data
    const kapsoName = phoneToName.get(originalPhone || '')
    if (kapsoName && kapsoName !== contact.kapso_name) {
      await supabase
        .from('contacts')
        .update({
          kapso_name: kapsoName,
          cache_updated_at: new Date().toISOString(),
          // Also update name if contact doesn't have one set
          ...(contact.name ? {} : { name: kapsoName })
        })
        .eq('id', contact.id)
    }
  }

  // Create missing contacts with normalized phone
  const missingPhones = phones.filter(p => !contactMap.has(p))
  if (missingPhones.length > 0) {
    const newContacts = missingPhones.map(phone => {
      const normalized = normalizePhone(phone) || phone
      const kapsoName = phoneToName.get(phone) || null
      return {
        workspace_id: workspaceId,
        phone,
        phone_normalized: normalized,
        name: kapsoName, // Use Kapso name as initial name
        kapso_name: kapsoName,
        cache_updated_at: new Date().toISOString(),
        lead_status: 'new',
        lead_score: 0,
      }
    })

    const { data: createdContacts, error } = await supabase
      .from('contacts')
      .insert(newContacts)
      .select('id, phone, phone_normalized, name, kapso_name, workspace_id')

    if (error) {
      console.error('[Webhook] Batch contact create error:', error)
    }

    for (const contact of createdContacts || []) {
      contactMap.set(contact.phone, contact as Contact)
    }
  }

  return contactMap
}

// Batch helper: Get or create conversations for multiple contacts
async function getOrCreateConversationsBatch(
  supabase: SupabaseClient,
  workspaceId: string,
  contactMap: Map<string, Contact>
): Promise<Map<string, Conversation>> {
  const conversationMap = new Map<string, Conversation>()
  const contactIds = Array.from(contactMap.values()).map(c => c.id)

  // Get existing conversations in one query
  const { data: existingConversations } = await supabase
    .from('conversations')
    .select('id, contact_id, workspace_id, unread_count')
    .eq('workspace_id', workspaceId)
    .in('contact_id', contactIds)

  // Map contact_id back to phone for lookup
  const contactIdToPhone = new Map<string, string>()
  for (const [phone, contact] of contactMap) {
    contactIdToPhone.set(contact.id, phone)
  }

  for (const conv of existingConversations || []) {
    const phone = contactIdToPhone.get(conv.contact_id)
    if (phone) {
      conversationMap.set(phone, conv as Conversation)
    }
  }

  // Create missing conversations in batch
  const missingContacts = Array.from(contactMap.entries())
    .filter(([phone]) => !conversationMap.has(phone))

  if (missingContacts.length > 0) {
    const newConversations = missingContacts.map(([, contact]) => ({
      workspace_id: workspaceId,
      contact_id: contact.id,
      status: 'open',
      unread_count: 0,
    }))

    const { data: createdConversations, error } = await supabase
      .from('conversations')
      .insert(newConversations)
      .select('id, contact_id, workspace_id, unread_count')

    if (error) {
      console.error('[Webhook] Batch conversation create error:', error)
    }

    for (const conv of createdConversations || []) {
      const phone = contactIdToPhone.get(conv.contact_id)
      if (phone) {
        conversationMap.set(phone, conv as Conversation)
      }
    }
  }

  return conversationMap
}
