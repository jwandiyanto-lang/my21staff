/**
 * Types for Kapso/Meta webhook payload
 * Based on WhatsApp Cloud API v24
 */

export interface MetaWebhookMessage {
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
    id: string // The message ID being replied to
  }
}

export interface MetaWebhookContact {
  wa_id: string
  profile: { name: string }
}

export interface MetaWebhookValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: MetaWebhookContact[]
  messages?: MetaWebhookMessage[]
  statuses?: unknown[]
}

export interface MetaWebhookEntry {
  id: string
  changes: {
    field: string
    value: MetaWebhookValue
  }[]
}

export interface MetaWebhookPayload {
  object: string
  entry: MetaWebhookEntry[]
}
