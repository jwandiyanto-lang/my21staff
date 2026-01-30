import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/webhook-verification'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { normalizePhone } from '@/lib/phone/normalize'
import { processWithRules } from '@/lib/workflow/rules-engine'
import { sendMessage } from '@/lib/kapso/client'
import { safeDecrypt } from '@/lib/crypto'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Track processed idempotency keys (in-memory for dev, use Redis/database in prod)
const processedKeys = new Set<string>()

// Event type definitions (Kapso custom format)
interface WebhookEvent {
  event: string
  data: {
    message?: {
      id: string
      timestamp: string
      type: string
      kapso?: {
        direction: string
        status: string
        content: string
      }
    }
    conversation?: {
      id: string
      phone_number: string
      phone_number_id: string
      status: string
    }
    is_new_conversation?: boolean
    phone_number_id: string
  }
  timestamp: string
}

// PII masking helper for safe logging
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2')
}

/**
 * WhatsApp Webhook Endpoint (Kapso Format)
 *
 * Handles incoming events from Kapso WhatsApp integration.
 * - GET: Webhook verification challenge (for Meta/Kapso setup)
 * - POST: Message and conversation events with rules engine processing
 */
export async function GET(req: NextRequest) {
  // Handle webhook verification challenge from Meta/Kapso
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhooks/WhatsApp] Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Invalid verification token', { status: 403 })
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature')
  const idempotencyKey = req.headers.get('x-idempotency-key')

  // Check idempotency key (prevent duplicate processing)
  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    console.log('[Webhooks/WhatsApp] Duplicate event detected:', idempotencyKey)
    return NextResponse.json({ status: 'already processed' }, { status: 200 })
  }

  try {
    const body = await req.json()

    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        process.env.WEBHOOK_SECRET || ''
      )
      if (!isValid) {
        console.error('[Webhooks/WhatsApp] Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const webhook = body as WebhookEvent

    // Log received event
    console.log('[Webhooks/WhatsApp] Event received:', {
      event: webhook.event,
      phone_number_id: webhook.data?.phone_number_id,
      timestamp: webhook.timestamp,
    })

    // Handle message received event with rules engine
    if (webhook.event === 'whatsapp.message.received') {
      await processMessageWithRules(webhook)
    }

    // Mark idempotency key as processed
    if (idempotencyKey) {
      processedKeys.add(idempotencyKey)
    }

    // Acknowledge immediately (within 10 seconds)
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    console.error('[Webhooks/WhatsApp] Error processing:', error)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}

/**
 * Process incoming message with rules engine
 */
async function processMessageWithRules(webhook: WebhookEvent): Promise<void> {
  const phoneNumber = webhook.data?.conversation?.phone_number
  const phoneNumberId = webhook.data?.phone_number_id
  const messageContent = webhook.data?.message?.kapso?.content
  const messageId = webhook.data?.message?.id

  if (!phoneNumber || !messageContent || !phoneNumberId) {
    console.log('[Webhooks/WhatsApp] Missing required fields, skipping')
    return
  }

  console.log('[Webhooks/WhatsApp] Processing message from:', maskPhone(phoneNumber))

  try {
    // Find workspace by phone_number_id
    const workspace = await convex.query(api.workspaces.getByKapsoPhoneIdWebhook, {
      kapso_phone_id: phoneNumberId
    })

    if (!workspace) {
      console.log(`[Webhooks/WhatsApp] No workspace for phone_number_id: ${phoneNumberId}`)
      return
    }

    const workspaceId = workspace._id

    // Get or create contact
    const phoneNormalized = normalizePhone(phoneNumber) || phoneNumber
    const contact = await convex.mutation(api.mutations.findOrCreateContactWebhook, {
      workspace_id: workspaceId,
      phone: phoneNumber,
      phone_normalized: phoneNormalized,
      kapso_name: undefined,
    })

    // Get or create conversation
    const conversation = await convex.mutation(api.mutations.findOrCreateConversationWebhook, {
      workspace_id: workspaceId,
      contact_id: contact._id,
    })

    // Store message in Convex
    await convex.mutation(api.mutations.createInboundMessageWebhook, {
      workspace_id: workspaceId,
      conversation_id: conversation._id,
      content: messageContent,
      message_type: webhook.data?.message?.type || 'text',
      kapso_message_id: messageId,
      metadata: undefined,
    })

    // === RULES ENGINE PROCESSING ===
    console.log('[Webhooks/WhatsApp] Processing with rules engine...')

    const rulesStartTime = Date.now()

    const rulesResult = await processWithRules({
      workspaceId,
      contactId: contact._id,
      contactPhone: phoneNumber,
      message: messageContent,
    })

    const rulesProcessingTime = Date.now() - rulesStartTime

    // Log execution for analytics
    await convex.mutation(api.workflows.logExecution, {
      workspace_id: workspaceId as any,
      contact_id: contact._id as any,
      conversation_id: conversation._id as any,
      message_content: messageContent.substring(0, 500),
      rule_matched: rulesResult.matched_rule,
      action_taken: rulesResult.handled ? rulesResult.action : 'ai_fallback',
      lead_type: rulesResult.lead_type,
      response_sent: rulesResult.response?.substring(0, 500),
      processing_time_ms: rulesProcessingTime,
    })

    console.log(`[Webhooks/WhatsApp] Rules engine result:`, {
      matched: rulesResult.matched_rule,
      handled: rulesResult.handled,
      action: rulesResult.action,
      leadType: rulesResult.lead_type,
    })

    // If rules handled it, send response
    if (rulesResult.handled && rulesResult.response) {
      const credentials = await convex.query(api.workspaces.getKapsoCredentials, {
        workspace_id: workspaceId,
      })

      if (credentials?.meta_access_token && credentials?.kapso_phone_id) {
        const apiKey = safeDecrypt(credentials.meta_access_token)
        await sendMessage(
          { apiKey, phoneId: credentials.kapso_phone_id },
          phoneNumber,
          rulesResult.response
        )
        console.log(`[Webhooks/WhatsApp] Response sent: ${rulesResult.action}`)

        // Log execution for manager bot trigger (observable placeholder)
        if (rulesResult.should_trigger_manager) {
          const placeholderResponse = '[Manager Bot] Summary feature coming in Phase 5! Your request has been logged.'
          await sendMessage(
            { apiKey, phoneId: credentials.kapso_phone_id },
            phoneNumber,
            placeholderResponse
          )
          console.log(`[Webhooks/WhatsApp] Manager bot placeholder response sent`)
        }
      }
    } else {
      console.log('[Webhooks/WhatsApp] Rules passed to AI fallback (ARI will handle)')
    }

  } catch (error) {
    console.error('[Webhooks/WhatsApp] Error processing with rules:', error)
  }
}
