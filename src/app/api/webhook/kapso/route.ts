import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { verifyKapsoSignature } from '@/lib/kapso/verify-signature'
import { normalizePhone } from '@/lib/phone/normalize'
import { processWithARI } from '@/lib/ari/processor'
import { processWithRules } from '@/lib/workflow/rules-engine'
import { sendMessage } from '@/lib/kapso/client'
import { safeDecrypt } from '@/lib/crypto'
import type { Json } from '@/types/database'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// PII masking helper for safe logging
function maskPayload(payload: unknown): string {
  const str = JSON.stringify(payload)
  // Mask phone numbers in the log (10-15 digit numbers)
  return str.replace(/"\d{10,15}"/g, '"***MASKED***"')
    .replace(/"from":\s*"\d+"/g, '"from":"***"')
    .replace(/"wa_id":\s*"\d+"/g, '"wa_id":"***"')
}

// Types for batch processing (aligned with Convex schema where name is optional)
interface Contact {
  _id: string
  phone: string
  phone_normalized?: string
  name?: string
  kapso_name?: string | null
  workspace_id: string
}

interface Conversation {
  _id: string
  contact_id: string
  workspace_id: string
  unread_count: number
}

interface MessageData {
  phone: string
  message: MetaWebhookMessage
  contactInfo?: MetaWebhookContact
  workspaceId: string
  handledByRules?: boolean
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
      // Use waitUntil to keep function alive after returning 200
      // This ensures we return 200 immediately while processing continues in background
      waitUntil(
        processWebhookAsync(rawPayload as MetaWebhookPayload).catch(error => {
          console.error('[Webhook] Async processing error:', error)
        })
      )
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
        const workspace = await convex.query(api.workspaces.getByKapsoPhoneIdWebhook, {
          kapso_phone_id: phoneNumberId
        })

        if (!workspace) {
          console.log(`[Webhook] No workspace for phone_number_id: ${phoneNumberId}`)
          continue
        }

        const workspaceId = workspace._id
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
      await processWorkspaceMessages(workspaceId, messagesData)
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

  // Step 1: Get or create all contacts
  const contactMap = new Map<string, Contact>()
  for (const phone of phoneNumbers) {
    const phoneNormalized = normalizePhone(phone) || phone
    const kapsoName = phoneToName.get(phone) || undefined

    const contact = await convex.mutation(api.mutations.findOrCreateContactWebhook, {
      workspace_id: workspaceId,
      phone,
      phone_normalized: phoneNormalized,
      kapso_name: kapsoName,
    })

    contactMap.set(phone, contact)
  }

  // Step 2: Get or create all conversations and link to contacts
  const conversationMap = new Map<string, Conversation>()
  for (const [phone, contact] of contactMap) {
    const conversation = await convex.mutation(api.mutations.findOrCreateConversationWebhook, {
      workspace_id: workspaceId,
      contact_id: contact._id,
    })

    conversationMap.set(phone, conversation)
  }

  // Step 3: Filter out duplicate messages and insert new ones
  const newMessages: MessageData[] = []
  for (const messageData of messagesData) {
    const exists = await convex.query(api.mutations.messageExistsByKapsoId, {
      kapso_message_id: messageData.message.id
    })

    if (!exists) {
      newMessages.push(messageData)
    }
  }

  if (newMessages.length === 0) {
    console.log(`[Webhook] All ${messagesData.length} messages already exist, skipping`)
    return
  }

  // Step 4: Insert all new messages
  for (const { phone, message } of newMessages) {
    const conversation = conversationMap.get(phone)
    if (!conversation) continue

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

    await convex.mutation(api.mutations.createInboundMessageWebhook, {
      workspace_id: workspaceId,
      conversation_id: conversation._id,
      content: messageContent,
      message_type: messageType,
      kapso_message_id: message.id,
      metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : undefined,
    })
  }

  // Step 5: Update conversation metadata
  // Group by conversation to get correct unread counts
  const conversationUpdates = new Map<string, { phone: string; count: number; lastPreview: string }>()
  for (const { phone, message } of newMessages) {
    const conversation = conversationMap.get(phone)
    if (!conversation) continue

    const existing = conversationUpdates.get(conversation._id) || {
      phone,
      count: 0,
      lastPreview: '',
    }
    existing.count++
    // Use last message as preview
    existing.lastPreview = (message.text?.body || '[media]').substring(0, 100)
    conversationUpdates.set(conversation._id, existing)
  }

  // Update each conversation
  for (const [conversationId, update] of conversationUpdates) {
    await convex.mutation(api.mutations.updateConversationWebhook, {
      conversation_id: conversationId,
      increment_unread: update.count,
      last_message_preview: update.lastPreview,
    })
  }

  console.log(`[Webhook] Saved ${newMessages.length} messages, updated ${conversationUpdates.size} conversations`)

  // === RULES ENGINE PROCESSING ===
  // Process with rules engine BEFORE AI (for keyword triggers, FAQs)
  for (const messageData of newMessages) {
    const contact = contactMap.get(messageData.phone)
    if (!contact) continue

    // Get message content
    const messageContent = messageData.message.text?.body || ''
    if (!messageContent) continue // Skip non-text for rules engine

    const rulesStartTime = Date.now()

    try {
      const rulesResult = await processWithRules({
        workspaceId,
        contactId: contact._id,
        contactPhone: messageData.phone,
        message: messageContent,
      })

      const rulesProcessingTime = Date.now() - rulesStartTime

      // Log execution for analytics
      const conversation = conversationMap.get(messageData.phone)
      await convex.mutation(api.workflows.logExecution, {
        workspace_id: workspaceId as any,
        contact_id: contact._id as any,
        conversation_id: conversation?._id as any,
        message_content: messageContent.substring(0, 500), // Truncate for storage
        rule_matched: rulesResult.matched_rule,
        action_taken: rulesResult.handled
          ? rulesResult.action
          : 'ai_fallback',
        lead_type: rulesResult.lead_type,
        response_sent: rulesResult.response?.substring(0, 500),
        processing_time_ms: rulesProcessingTime,
      })

      // If rules handled it, send response and skip AI
      if (rulesResult.handled && rulesResult.response) {
        // Get Kapso credentials for sending
        const credentials = await convex.query(api.workspaces.getKapsoCredentials, {
          workspace_id: workspaceId,
        })

        if (credentials?.meta_access_token && credentials?.kapso_phone_id) {
          const apiKey = safeDecrypt(credentials.meta_access_token)
          await sendMessage(
            { apiKey, phoneId: credentials.kapso_phone_id },
            messageData.phone,
            rulesResult.response
          )
          console.log(`[Webhook] Rules engine sent response: ${rulesResult.action}`)
        }

        // If handoff triggered, update conversation status
        if (rulesResult.should_handoff) {
          console.log(`[Webhook] Handoff triggered for ${messageData.phone}`)
          // TODO: Implement handoff flow (Phase 7)
        }

        // If manager bot triggered, send placeholder response (observable for testing)
        // TODO: Implement Grok manager (Phase 5)
        if (rulesResult.should_trigger_manager) {
          console.log(`[Webhook] Manager bot triggered for ${messageData.phone}`)

          // Send observable placeholder response so tests can verify trigger
          const credentials = await convex.query(api.workspaces.getKapsoCredentials, {
            workspace_id: workspaceId,
          })

          if (credentials?.meta_access_token && credentials?.kapso_phone_id) {
            const apiKey = safeDecrypt(credentials.meta_access_token)
            const placeholderResponse = '[Manager Bot] Summary feature coming in Phase 5! Your request has been logged.'
            await sendMessage(
              { apiKey, phoneId: credentials.kapso_phone_id },
              messageData.phone,
              placeholderResponse
            )
            console.log(`[Webhook] Manager bot placeholder response sent`)
          }
        }

        // Mark this message as handled by rules (skip ARI later)
        messageData.handledByRules = true
        continue
      }

      // Rules didn't handle - will pass to AI below
      console.log(`[Webhook] Rules engine: pass to AI for ${messageData.phone}`)

    } catch (rulesError) {
      console.error('[Webhook] Rules engine error:', rulesError)
      // On error, continue to AI processing
    }
  }

  // === ARI PROCESSING ===
  // Process with ARI for each new text message
  // Collect promises to await them all (required for waitUntil to work)
  const ariPromises: Promise<void>[] = []

  for (const messageData of newMessages) {
    // Skip messages already handled by rules engine
    if (messageData.handledByRules) {
      console.log(`[Webhook] Skipping ARI for message already handled by rules`)
      continue
    }

    const contact = contactMap.get(messageData.phone)
    if (!contact) continue

    // Check if workspace has ARI enabled (has ari_config)
    const hasAri = await convex.query(api.ari.hasAriConfig, {
      workspace_id: workspaceId
    })

    if (!hasAri) continue // No ARI for this workspace

    // Get Kapso credentials
    const credentials = await convex.query(api.workspaces.getKapsoCredentials, {
      workspace_id: workspaceId
    })

    if (!credentials || !credentials.meta_access_token || !credentials.kapso_phone_id) continue

    // Get message content - only process text messages
    const messageContent = messageData.message.text?.body || ''
    if (!messageContent) continue // Skip non-text messages for now

    // Decrypt API key (safeDecrypt handles unencrypted values gracefully)
    const apiKey = safeDecrypt(credentials.meta_access_token)

    // Process with ARI - collect promise to await later
    const ariPromise = processWithARI({
      workspaceId,
      contactId: contact._id,
      contactPhone: messageData.phone,
      userMessage: messageContent,
      kapsoCredentials: {
        apiKey,
        phoneId: credentials.kapso_phone_id,
      },
    }).catch(err => {
      console.error('[Webhook] ARI processing error:', err)
    })

    ariPromises.push(ariPromise as Promise<void>)
  }

  // Wait for all ARI processing to complete
  // This ensures waitUntil keeps the function alive long enough
  if (ariPromises.length > 0) {
    await Promise.all(ariPromises)
    console.log(`[Webhook] ARI processing complete for ${ariPromises.length} messages`)
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
