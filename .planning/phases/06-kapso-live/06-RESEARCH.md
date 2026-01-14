# Phase 6: Kapso Live - Research

**Researched:** 2026-01-14
**Domain:** WhatsApp API integration (Kapso) — completing the connection
**Confidence:** HIGH

<research_summary>
## Summary

Phase 6 is about connecting the existing inbox UI to real Kapso API. The UI and database schema are already built (Phase 3/4). The key missing pieces are:

1. **Webhook handler** — Receive incoming messages from Kapso and save to database
2. **Initial conversation sync** — Optional: fetch existing conversations from Kapso on first run

This is NOT a complex ecosystem problem — it's straightforward REST API integration with a reference implementation in v1 to follow.

**Primary recommendation:** Port v1's webhook handler to v2, update the dev mode bypass to call real Kapso API. Conversation sync is optional — webhooks will keep things fresh going forward.
</research_summary>

<standard_stack>
## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.90.1 | Database client | Already configured |
| fetch (built-in) | - | HTTP requests | Simple, no deps needed |

### Optional (Not Required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @kapso/whatsapp-cloud-api | 1.x | SDK with typed methods | If you want typed API calls |

### Not Needed for MVP
| Instead of | Skip Because |
|------------|--------------|
| Kapso SDK for queries | Messages stored in Supabase via webhook |
| WebSocket client | Webhooks handle real-time |
| Queue libraries | Direct DB insert is fine for v2 scale |

**Installation:** No new dependencies required.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### v1 Reference Structure
```
src/app/api/webhook/kapso/
└── route.ts           # Webhook handler (already in v1)
```

### Pattern 1: Webhook Handler
**What:** Public endpoint that receives Kapso webhook events
**When to use:** All inbound message handling
**Example from v1:**
```typescript
// POST /api/webhook/kapso
export async function POST(request: NextRequest) {
  const payload = await request.json()

  // Extract message data
  const { message, conversation: kapsoConv, phone_number_id } = payload

  // Find workspace by phone_number_id (matches kapso_phone_id column)
  const workspace = await findWorkspaceByPhoneId(phone_number_id)

  // Get or create contact
  const contact = await upsertContact(workspace.id, kapsoConv.phone_number, kapsoConv.contact_name)

  // Get or create conversation
  const conversation = await upsertConversation(workspace.id, contact.id)

  // Insert message
  await insertMessage({
    conversation_id: conversation.id,
    workspace_id: workspace.id,
    direction: 'inbound',
    sender_type: 'contact',
    content: message.text?.body || message.kapso?.content,
    message_type: message.type,
    kapso_message_id: message.id
  })

  // Update conversation metadata
  await updateConversationActivity(conversation.id)

  return NextResponse.json({ success: true })
}
```

### Pattern 2: Webhook Verification (GET)
**What:** Kapso verifies webhook URL before sending events
**When to use:** On webhook registration
**Example:**
```typescript
// GET /api/webhook/kapso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  const verifyToken = searchParams.get('hub.verify_token')

  if (verifyToken === process.env.KAPSO_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}
```

### Pattern 3: Dev Mode Toggle (Already in v2)
**What:** Skip real API calls when developing locally
**When to use:** NEXT_PUBLIC_DEV_MODE=true
**Example from v2:**
```typescript
// In send route
if (isDevMode()) {
  kapsoMessageId = `mock-${Date.now()}`
} else {
  const response = await sendMessage(credentials, phone, content)
  kapsoMessageId = response.messages[0]?.id
}
```

### Anti-Patterns to Avoid
- **Polling Kapso API for new messages:** Use webhooks, they push to you
- **Complex message queuing:** Direct DB insert is fast enough for v2 scale
- **Storing duplicate data:** Don't cache Kapso data separately from Supabase
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook handler | Custom event system | Simple POST route | Just need to save to DB |
| Message deduplication | Complex logic | kapso_message_id unique constraint | DB handles it |
| Contact matching | Fuzzy phone matching | Exact match + workspace_id | Already have unique constraint |
| Conversation lookup | Custom caching | Supabase upsert | Built-in conflict handling |

**Key insight:** This is standard REST webhook → database flow. v1 solved it. Just port and adapt.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Missing Workspace Lookup Index
**What goes wrong:** Webhook handler slow on workspace lookup
**Why it happens:** No index on kapso_phone_id
**How to avoid:** Already have `idx_workspaces_kapso_phone_id` in schema
**Warning signs:** Slow webhook responses in logs

### Pitfall 2: Duplicate Messages on Retry
**What goes wrong:** Same message inserted multiple times
**Why it happens:** Kapso retries if webhook returns error
**How to avoid:** Use kapso_message_id as unique key, handle conflict gracefully
**Warning signs:** Multiple identical messages in thread

### Pitfall 3: Forgetting to Update Conversation Metadata
**What goes wrong:** Conversation list shows stale preview/timestamp
**Why it happens:** Only inserted message, didn't update conversation
**How to avoid:** Always update last_message_at and last_message_preview
**Warning signs:** Conversations not sorted by recent activity

### Pitfall 4: Webhook Endpoint Not Public
**What goes wrong:** 401 errors in Kapso dashboard
**Why it happens:** Middleware blocking webhook route
**How to avoid:** Add /api/webhook to publicRoutes in middleware (already done in v2)
**Warning signs:** Kapso dashboard shows webhook failures
</common_pitfalls>

<code_examples>
## Code Examples

### Kapso Webhook Payload Structure
```typescript
// Source: v1 implementation, verified against Kapso docs
interface KapsoWebhookPayload {
  message: {
    id: string
    from: string  // Phone number
    type: 'text' | 'image' | 'document' | 'audio' | 'video'
    text?: { body: string }
    image?: { id: string; mime_type: string; sha256: string }
    kapso?: { direction: string; content: string }  // Kapso-specific
    timestamp: string
  }
  conversation: {
    id: string
    contact_name: string
    phone_number: string
  }
  phone_number_id: string  // Your Kapso phone number
  is_new_conversation: boolean
}
```

### Upsert Contact Pattern
```typescript
// Source: Supabase upsert pattern
const { data: contact } = await supabase
  .from('contacts')
  .upsert({
    workspace_id: workspaceId,
    phone: phoneNumber,
    name: contactName || null,
    lead_status: 'new'  // Default for new contacts
  }, {
    onConflict: 'workspace_id,phone',
    ignoreDuplicates: false
  })
  .select()
  .single()
```

### Update Conversation Activity
```typescript
// Source: v2 send route pattern
await supabase
  .from('conversations')
  .update({
    last_message_at: new Date().toISOString(),
    last_message_preview: message.content?.substring(0, 100) || '[media]',
    unread_count: supabase.raw('unread_count + 1')  // Increment for inbound
  })
  .eq('id', conversationId)
```
</code_examples>

<kapso_api_reference>
## Kapso API Reference

### Send Message (Already Working in v2)
```
POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages
Headers: X-API-Key: {api_key}, Content-Type: application/json
Body: { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: 'message' } }
```

### Webhook Events (To Implement)
```
POST /api/webhook/kapso
- Receives inbound messages
- Receives status updates (sent, delivered, read)
- Receives conversation events
```

### Optional: List Conversations (If Sync Needed)
```
GET https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/conversations
Headers: X-API-Key: {api_key}
Query: limit, after (cursor)
Response: { data: [...conversations], paging: { next: cursor } }
```

### Optional: List Messages (If Sync Needed)
```
GET https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages
Headers: X-API-Key: {api_key}
Query: conversation_id, direction, since, limit
```
</kapso_api_reference>

<v1_files_to_port>
## V1 Files to Port

| v1 File | v2 Target | Changes Needed |
|---------|-----------|----------------|
| src/app/api/webhook/kapso/route.ts | Same path | Update imports, use v2 schema |
| src/lib/kapso/client.ts | Already exists | Already ported |

### Key Differences
- v1 has admin notifications on webhook — skip for v2
- v1 has more complex contact matching — simplify for v2
- v2 already has dev mode pattern — apply to webhook too
</v1_files_to_port>

<open_questions>
## Open Questions

1. **Should we sync historical conversations?**
   - What we know: Kapso has GET /conversations endpoint
   - What's unclear: Is historical data needed, or start fresh?
   - Recommendation: Skip for MVP. New messages via webhook are enough.

2. **Message status webhooks (delivered, read)?**
   - What we know: Kapso sends status updates via webhook
   - What's unclear: Do we need to show read receipts?
   - Recommendation: Skip for MVP. Just track sent via optimistic UI.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- v1 codebase: `/home/jfransisco/Desktop/21/my21staff/src/app/api/webhook/kapso/route.ts`
- Phase 3 research: `.planning/phases/03-inbox-core/03-RESEARCH.md`
- Kapso docs: https://docs.kapso.ai

### Secondary (MEDIUM confidence)
- WebSearch verification of Kapso API endpoints (2026-01-14)

### Tertiary
- None needed — well-documented integration
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: REST webhook handling, Supabase upserts
- Ecosystem: Already defined in Phase 3
- Patterns: Webhook → DB flow, idempotency, upserts
- Pitfalls: Deduplication, metadata updates, auth exclusions

**Confidence breakdown:**
- Standard stack: HIGH - No new deps
- Architecture: HIGH - Port from v1
- Pitfalls: HIGH - Common webhook patterns
- Code examples: HIGH - From v1 and Kapso docs

**Research date:** 2026-01-14
**Valid until:** 2026-02-14 (30 days - stable REST APIs)
</metadata>

---

*Phase: 06-kapso-live*
*Research completed: 2026-01-14*
*Ready for planning: yes*
