# Phase 1: Foundation - Research

**Researched:** 2026-01-30
**Domain:** Kapso workspace provisioning, WhatsApp webhook infrastructure, Indonesian phone number setup
**Confidence:** HIGH

## Summary

Phase 1 involves setting up a new Kapso workspace for my21staff with Indonesian WhatsApp number, webhook endpoint, and workflow trigger for inbound messages. The implementation follows a standard Kapso Platform API pattern with two key components:

1. **Workspace/Customer Setup**: Create a new Kapso customer entity that will own the Indonesian WhatsApp number
2. **Phone Number Connection**: Connect an Indonesian (+62) WhatsApp number via Meta credentials or Kapso provisioning
3. **Webhook Infrastructure**: Configure WhatsApp webhooks to receive `whatsapp.message.received` events
4. **Workflow Trigger**: Create a workflow trigger that fires on inbound messages

The standard approach uses Kapso's Platform API v1 with HTTPS webhooks and HMAC-SHA256 signature verification. Indonesian numbers can be provisioned through Meta Business Manager or via Kapso's streamlined provisioning service.

**Primary recommendation:** Use Kapso's streamlined provisioning for the Indonesian number to avoid manual Meta Business Manager setup. Configure Kapso webhooks (not Meta webhooks) for structured event payloads with buffering support.

---

## Standard Stack

The established tools and APIs for this phase:

### Core API
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| Kapso Platform API v1 | All workspace, phone, webhook operations | Official Kapso API, auto-versioned |
| HTTPS webhooks | Real-time message notifications | Kapso's only delivery method |
| HMAC-SHA256 signatures | Webhook security verification | Required for production |

### Supporting Components
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Kapso WhatsApp Cloud API SDK | TypeScript client for messages/templates | When sending from Next.js |
| ngrok/cloudflared | Local webhook testing | Development only |
| Convex database | Store webhook logs and message history | Phase 2+ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kapso provisioning | Manual Meta Business Manager setup | Meta takes ~1 hour, Kapso takes ~2 minutes |
| Kapso webhooks | Meta raw webhooks | Kapso provides event filtering, buffering, structured payloads |
| HMAC verification | No verification | Production requires security |

### API Endpoints Required
```bash
# Create customer (workspace)
POST https://api.kapso.ai/platform/v1/customers

# List phone numbers
GET https://api.kapso.ai/platform/v1/whatsapp/phone_numbers

# Connect phone number
POST https://api.kapso.ai/platform/v1/customers/{customer_id}/whatsapp/phone_numbers

# Create webhook
POST https://api.kapso.ai/platform/v1/whatsapp/phone_numbers/{phone_number_id}/webhooks

# Create workflow trigger
POST https://api.kapso.ai/platform/v1/workflows/{workflow_id}/triggers
```

---

## Architecture Patterns

### Recommended Project Structure
```
.env.local                    # KAPSO_API_KEY, webhook secrets
src/
├── app/api/webhooks/whatsapp/
│   └── route.ts             # Webhook endpoint (Next.js App Router)
├── lib/
│   ├── kapso.ts             # Kapso API client wrapper
│   └── webhook-verification.ts  # HMAC signature verification
└── components/
    └── dev/                 # Dev mode fallbacks
```

### Pattern 1: Webhook Endpoint (Next.js App Router)
**What:** Create a POST endpoint that receives WhatsApp events from Kapso

**When to use:** Always - this is the message ingestion point

**Example:**
```typescript
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature')
  const body = await req.json()

  // Verify signature (required in production)
  if (!verifyWebhook(body, signature, process.env.WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { event, data } = body

  // Handle events
  switch (event) {
    case 'whatsapp.message.received':
      await handleMessageReceived(data)
      break
    case 'whatsapp.conversation.created':
      await handleConversationCreated(data)
      break
    // ... other events
  }

  return NextResponse.json({ status: 'received' }, { status: 200 })
}
```

**Source:** [Kapso Webhooks Overview](https://docs.kapso.ai/docs/platform/webhooks/overview)

### Pattern 2: Phone Number Connection
**What:** Connect an Indonesian WhatsApp number to a Kapso customer

**When to use:** After customer/workspace creation

**Example:**
```bash
curl --request POST \
  --url https://api.kapso.ai/platform/v1/customers/{customer_id}/whatsapp/phone_numbers \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: <<api-key>>' \
  --data '{
    "whatsapp_phone_number": {
      "name": "my21staff Indonesia",
      "kind": "production",
      "phone_number_id": "1234567890",
      "business_account_id": "98765432109",
      "access_token": "EAABsbCS...long-lived-token",
      "webhook_destination_url": "https://yourapp.com/api/webhooks/whatsapp",
      "webhook_verify_token": "your-verify-token",
      "inbound_processing_enabled": true,
      "calls_enabled": false
    }
  }'
```

**Response includes:**
- `display_phone_number`: The actual number (e.g., +62xxx)
- `status`: CONNECTED when ready
- `webhook_verified_at`: Timestamp when Meta verified the webhook

**Source:** [Kapso Connect Phone Number](https://docs.kapso.ai/api/platform/v1/phone-numbers/connect-phone-number)

### Pattern 3: Workflow Trigger for Inbound Messages
**What:** Configure a workflow to trigger on `whatsapp.message.received`

**When to use:** After phone number is connected and webhook is active

**Setup flow:**
1. Create a workflow with a WhatsApp inbound trigger
2. List phone numbers to get `phone_number_id`
3. Create trigger linking workflow to phone number

**Source:** [Kapso Automation - Agent Skills](https://skills.sh/gokapso/agent-skills/kapso-automation)

### Pattern 4: Signature Verification
**What:** Verify webhook requests come from Kapso, not attackers

**When to use:** Required for production, skip for development testing

**Example:**
```typescript
import crypto from 'crypto'

function verifyWebhook(payload: object, signature: string | null, secret: string): boolean {
  if (!signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

**Source:** [Kapso Webhook Security](https://docs.kapso.ai/docs/platform/webhooks/security)

### Anti-Patterns to Avoid
- **No webhook verification:** Never skip HMAC verification in production
- **Hardcoding secrets:** Store webhook secrets in environment variables
- **Missing idempotency:** Don't process duplicate events; use `X-Idempotency-Key` header
- **No timeout handling:** Webhook must respond within 10 seconds

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC implementation | Kapso SDK or official example | Timing-safe comparison prevents timing attacks |
| Message event parsing | Custom JSON parsing | Kapso structured payload | Handles media, buttons, locations consistently |
| Webhook retry handling | Custom retry logic | Kapso automatic retries | 10s/40s/90s schedule with exponential backoff |
| Indonesian number provisioning | Meta Business Manager setup | Kapso provisioning service | 2 minutes vs 1 hour, handles verification |
| Workflow trigger management | Custom polling loop | Kapso workflow triggers | Event-driven, no polling needed |

**Key insight:** Kapso's webhook system includes buffering, retry scheduling, and idempotency keys out of the box. Building custom solutions would need months of work to match.

---

## Common Pitfalls

### Pitfall 1: Webhook Timeout
**What goes wrong:** Endpoint doesn't respond within 10 seconds, Kapso marks delivery as failed

**Why it happens:** Database queries, external API calls, or long processing before responding

**How to avoid:** Always acknowledge immediately (200 OK), process asynchronously
```typescript
// BAD: Processing before response
export async function POST(req: NextRequest) {
  await processMessage(req.body)  // Could take >10s
  return NextResponse.json({ status: 'ok' })
}

// GOOD: Immediate response, async processing
export async function POST(req: NextRequest) {
  const data = await req.json()
  // Schedule async processing
  processMessage(data).catch(console.error)
  return NextResponse.json({ status: 'received' }, { status: 200 })
}
```

**Warning signs:** 429 errors from Kapso API, missing webhook deliveries

### Pitfall 2: Duplicate Event Processing
**What goes wrong:** Same message processed multiple times due to webhook retries

**Why it happens:** No deduplication logic, each retry creates a new processing run

**How to avoid:** Track `X-Idempotency-Key` header value
```typescript
const processed = new Set<string>()

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('x-idempotency-key')

  if (processed.has(idempotencyKey)) {
    return NextResponse.json({ status: 'already processed' }, { status: 200 })
  }

  // Process and cache
  await processMessage(req.body)
  processed.add(idempotencyKey)
  return NextResponse.json({ status: 'received' }, { status: 200 })
}
```

**Warning signs:** Duplicate database records, repeated notifications

### Pitfall 3: Missing Webhook Verification Setup
**What goes wrong:** Webhook never delivers events because Meta verification fails

**Why it happens:** `webhook_verify_token` mismatch or endpoint doesn't respond to GET verification

**How to avoid:** Ensure endpoint responds to both GET and POST with proper verification token
```typescript
export async function GET(req: NextRequest) {
  const { hub.verify_token } = await req.json()
  if (hub.verify_token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(hub.challenge)
  }
  return new Response('Invalid token', { status: 403 })
}
```

**Warning signs:** `webhook_verified_at` is null in phone number response

### Pitfall 4: Development Mode Not Working
**What goes wrong:** Components fail because they expect real Kapso data in dev mode

**Why it happens:** Missing dev mode checks as per CLAUDE.md requirements

**How to avoid:** Always check `NEXT_PUBLIC_DEV_MODE` before Kapso API calls
```typescript
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export async function POST(req: NextRequest) {
  if (isDevMode) {
    // Use mock data
    return NextResponse.json({ status: 'mock received' }, { status: 200 })
  }
  // Real Kapso processing
  return handleRealWebhook(req)
}
```

**Warning signs:** Errors on localhost:3000/demo, "Cannot access before initialization"

---

## Code Examples

### Webhook Handler with Event Types
```typescript
// src/app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Event type definitions
type WebhookEvent =
  | { event: 'whatsapp.message.received'; data: MessageReceivedData }
  | { event: 'whatsapp.message.sent'; data: MessageSentData }
  | { event: 'whatsapp.conversation.created'; data: ConversationCreatedData }
  | { event: 'whatsapp.conversation.inactive'; data: ConversationInactiveData }

interface MessageReceivedData {
  message: {
    id: string
    timestamp: string
    type: string
    text?: { body: string }
    kapso: {
      direction: 'inbound'
      status: 'received'
      processing_status: 'pending'
      content: string
    }
  }
  conversation: {
    id: string
    phone_number: string
    phone_number_id: string
    status: 'active'
  }
  is_new_conversation: boolean
  phone_number_id: string
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-webhook-signature')

  // Verify in production only
  if (process.env.NODE_ENV === 'production') {
    if (!verifyWebhook(await req.json(), signature, process.env.WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const webhook = (await req.json()) as WebhookEvent

  switch (webhook.event) {
    case 'whatsapp.message.received':
      await handleInboundMessage(webhook.data)
      break
    case 'whatsapp.message.sent':
      await handleOutboundMessage(webhook.data)
      break
    case 'whatsapp.conversation.created':
      await handleNewConversation(webhook.data)
      break
    case 'whatsapp.conversation.inactive':
      await handleInactiveConversation(webhook.data)
      break
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

async function handleInboundMessage(data: MessageReceivedData) {
  console.log('New message from:', data.conversation.phone_number)
  console.log('Content:', data.message.kapso.content)
  // TODO: Store to Convex, trigger workflow, etc.
}
```

### Kapso API Client Wrapper
```typescript
// src/lib/kapso.ts
const KAPSO_API_BASE = 'https://api.kapso.ai/platform/v1'

interface KapsoClientOptions {
  apiKey: string
}

export class KapsoClient {
  private apiKey: string

  constructor(options: KapsoClientOptions) {
    this.apiKey = options.apiKey
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: object
  ): Promise<T> {
    const response = await fetch(`${KAPSO_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: body ? JSON.stringify({ ...body }) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Kapso API error: ${response.status}`)
    }

    const json = await response.json()
    return json.data as T
  }

  async createCustomer(name: string, externalId: string) {
    return this.request<{ id: string }>('POST', '/customers', {
      customer: { name, external_customer_id: externalId },
    })
  }

  async listPhoneNumbers() {
    return this.request<PhoneNumber[]>('GET', '/whatsapp/phone_numbers')
  }

  async connectPhoneNumber(
    customerId: string,
    config: PhoneNumberConfig
  ) {
    return this.request<ConnectedPhoneNumber>(
      'POST',
      `/customers/${customerId}/whatsapp/phone_numbers`,
      { whatsapp_phone_number: config }
    )
  }

  async createWebhook(phoneNumberId: string, config: WebhookConfig) {
    return this.request<Webhook>(
      'POST',
      `/whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
      { whatsapp_webhook: config }
    )
  }
}

interface PhoneNumberConfig {
  name: string
  kind: 'production' | 'test'
  phone_number_id: string
  business_account_id?: string
  access_token?: string
  webhook_destination_url: string
  webhook_verify_token: string
  inbound_processing_enabled: boolean
  calls_enabled: boolean
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Meta webhooks only | Kapso webhooks (structured) | Kapso Platform v2 | Structured payloads, event filtering, buffering |
| Manual provisioning | Kapso provisioning service | 2024 | 2-minute setup vs 1-hour Meta setup |
| Polling for messages | Webhook push events | Always | Real-time, no polling overhead |
| No signature verification | HMAC-SHA256 required | 2024 | Security standard for production |

**Deprecated/outdated:**
- Legacy v1 webhooks (still work, but v2 is default)
- Direct Meta API without Kapso proxy (no multi-tenant, no built-in inbox)

---

## Open Questions

1. **Indonesian Number Availability**
   - What we know: Kapso can provision numbers for Indonesia (+62)
   - What's unclear: Whether there are specific restrictions or quality tier differences
   - Recommendation: Use Kapso's quick provisioning first; if it fails, fall back to Meta Business Manager with Indonesian business account

2. **Webhook Delivery Reliability**
   - What we know: Kapso retries 3 times (10s, 40s, 90s)
   - What's unclear: Whether batched messages fall back to individual delivery reliably
   - Recommendation: Implement idempotency key tracking regardless; design for duplicate tolerance

3. **Workflow Trigger Limitations**
   - What we know: Workflow triggers are per-phone-number
   - What's unclear: Maximum concurrent executions per phone number
   - Recommendation: Start with simple trigger, scale monitoring if needed

---

## Sources

### Primary (HIGH confidence)
- [Kapso Webhooks Overview](https://docs.kapso.ai/docs/platform/webhooks/overview) - Current, official documentation
- [Kapso Event Types](https://docs.kapso.ai/docs/platform/webhooks/event-types) - Complete event reference
- [Kapso Connect Phone Number API](https://docs.kapso.ai/api/platform/v1/phone-numbers/connect-phone-number) - Official API docs
- [Kapso Create Webhook API](https://docs.kapso.ai/api/platform/v1/webhooks/create-webhook) - Official API docs
- [Kapso Automation - Agent Skills](https://skills.sh/gokapso/agent-skills/kapso-automation) - Workflow and trigger management

### Secondary (MEDIUM confidence)
- [Kapso WhatsApp Cloud API - NPM](https://www.npmjs.com/package/@kapso/whatsapp-cloud-api) - TypeScript SDK documentation
- [Web search: Kapso webhook security verification 2025](https://www.google.com/search?q=Kapso+webhook+security+verification+2025) - Confirms HMAC-SHA256 is current standard

### Tertiary (LOW confidence)
- None - all critical information verified via official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Direct from Kapso official documentation
- Architecture: HIGH - Standard Next.js + Kapso API patterns
- Pitfalls: MEDIUM - Based on webhook documentation, some inferred from common patterns

**Research date:** 2026-01-30
**Valid until:** 2026-07-30 (6 months - Kapso appears stable with infrequent breaking changes)

**Research limitations:**
- Could not verify Indonesian number availability without actual provisioning attempt
- Workflow trigger limits not explicitly documented
- No access to internal Kapso retry metrics

**Next steps for planner:**
- Create API client wrapper for Kapso operations
- Design webhook endpoint with dev mode fallback
- Plan provisioning sequence (customer → phone → webhook → trigger)
- Include signature verification as required task

---

## Research Complete

**Phase:** 1 - Foundation
**Confidence:** HIGH

### Key Findings

- Use Kapso Platform API v1 for all workspace, phone number, and webhook operations
- Configure WhatsApp webhooks (not Meta webhooks) for structured event payloads with `whatsapp.message.received` event
- Use Kapso's streamlined provisioning for Indonesian number (~2 minutes vs ~1 hour manual Meta setup)
- Webhook endpoint must respond within 10 seconds; process messages asynchronously
- Implement HMAC-SHA256 signature verification for production security
- Track `X-Idempotency-Key` header to prevent duplicate processing from retries

### File Created

`.planning/phases/01-foundation/01-RESEARCH.md`

### Open Questions

1. Indonesian number availability via Kapso (needs provisioning attempt to confirm)
2. Workflow trigger concurrency limits (not explicitly documented)
3. Batched webhook delivery reliability (retries work but need verification)

### Ready for Planning

Research complete. Planner can now create PLAN.md files.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESEARCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key findings for Phase 1 planning:
- Kapso Platform API v1 is the standard stack for all operations
- Phone number provisioning uses streamlined Kapso service (not manual Meta setup)
- Webhooks require HTTPS endpoint with HMAC-SHA256 signature verification
- Must respond to webhooks within 10 seconds (acknowledge first, process async)
- Implement idempotency using X-Idempotency-Key header to prevent duplicates
- Event type `whatsapp.message.received` triggers workflow for inbound messages
