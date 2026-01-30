import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/webhook-verification'

// Track processed idempotency keys (in-memory for dev, use Redis/database in prod)
const processedKeys = new Set<string>()

// Event type definitions
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

/**
 * WhatsApp Webhook Endpoint
 *
 * Handles incoming events from Kapso WhatsApp integration.
 * - GET: Webhook verification challenge (for Meta/Kapso setup)
 * - POST: Message and conversation events
 */
export async function GET(req: NextRequest) {
  // Handle webhook verification challenge from Meta/Kapso
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Invalid verification token', { status: 403 })
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature')
  const idempotencyKey = req.headers.get('x-idempotency-key')

  // Check idempotency key (prevent duplicate processing)
  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    console.log('Duplicate event detected:', idempotencyKey)
    return NextResponse.json({ status: 'already processed' }, { status: 200 })
  }

  const body = await req.json()

  // Verify signature in production
  if (process.env.NODE_ENV === 'production') {
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.WEBHOOK_SECRET || ''
    )
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const webhook = body as WebhookEvent

  // Log received event
  console.log('Webhook received:', {
    event: webhook.event,
    phone_number_id: webhook.data?.phone_number_id,
    timestamp: webhook.timestamp,
  })

  // Handle different event types
  switch (webhook.event) {
    case 'whatsapp.message.received':
      console.log('New message received:', {
        from: webhook.data?.conversation?.phone_number,
        content: webhook.data?.message?.kapso?.content,
        message_id: webhook.data?.message?.id,
      })
      // TODO: Phase 2 - Store to Convex, trigger workflow
      break

    case 'whatsapp.message.sent':
      console.log('Message sent:', webhook.data?.message?.id)
      break

    case 'whatsapp.conversation.created':
      console.log('New conversation:', webhook.data?.conversation?.id)
      break

    case 'whatsapp.conversation.inactive':
      console.log('Conversation ended:', webhook.data?.conversation?.id)
      break

    default:
      console.log('Unknown event type:', webhook.event)
  }

  // Mark idempotency key as processed
  if (idempotencyKey) {
    processedKeys.add(idempotencyKey)
  }

  // Acknowledge immediately (within 10 seconds)
  return NextResponse.json({ received: true }, { status: 200 })
}
