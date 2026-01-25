# Phase 2: Kapso Integration - Research

**Researched:** 2026-01-25
**Domain:** WhatsApp API integration via Kapso - production webhook and ARI bot workflow
**Confidence:** HIGH

## Summary

Phase 2 focuses on making the existing Kapso integration work in production with Eagle Overseas Education as the first client. The codebase already has a comprehensive Kapso integration from v3.2 with:

1. **Webhook handler** (Convex HTTP action at `/webhook/kapso`) - Receives incoming WhatsApp messages
2. **Message processing** (`convex/kapso.ts`) - Processes webhook payloads, creates contacts/conversations/messages
3. **ARI bot** (embedded in `convex/kapso.ts`) - Automatic AI response for qualifying leads
4. **Outbound sending** (`/api/messages/send` + `src/lib/kapso/client.ts`) - Sends messages via Kapso API
5. **Inbox UI** (`src/app/(dashboard)/[workspace]/inbox/`) - Displays conversations and messages

The challenge is NOT building from scratch - it's verifying the existing implementation works in production, ensuring the bot workflow (ARI) functions correctly, and fixing any issues discovered during testing.

**Primary recommendation:** Verify webhook receives test message in production, trace through ARI processing, confirm inbox displays messages correctly, and fix any issues found.

## Existing Implementation Analysis

### Webhook Flow (Working)

```
WhatsApp Message
      |
      v
Kapso Platform (webhook forwarding)
      |
      v
Convex HTTP Action: /webhook/kapso
      |
      +-- GET: Returns hub.challenge (verification)
      +-- POST: Schedules kapso.processWebhook (async)
            |
            v
      internal.kapso.processWebhook
            |
            +-- Find workspace by kapso_phone_id
            +-- Upsert contact (normalizePhone matching)
            +-- Upsert conversation
            +-- Insert message (dedupe by kapso_message_id)
            +-- Schedule ARI processing (if ariConfig exists)
```

### ARI Bot Flow (Needs Verification)

```
processARI (scheduled mutation)
      |
      +-- Get workspace + credentials (meta_access_token, kapso_phone_id)
      +-- Get ARI config (bot_name, greeting_style, language)
      +-- Get/create ARI conversation (state machine)
      +-- Get recent ARI messages (context)
      +-- Build system prompt
      +-- Generate AI response:
      |     +-- Try Sea-Lion (local Ollama via Tailscale: 100.113.96.25:11434)
      |     +-- Fallback to Grok (api.x.ai)
      |     +-- Final fallback: static message
      +-- Log messages to ariMessages table
      +-- Send via sendKapsoMessage()
      +-- Create outbound message record
```

### Outbound Message Flow (Working)

```
ComposeInput (UI)
      |
      v
/api/messages/send (Next.js API route)
      |
      +-- Authenticate via Clerk
      +-- Get conversation + contact
      +-- Get workspace (kapso_phone_id, meta_access_token)
      +-- Decrypt API key
      +-- Send via Kapso API (sendMessage)
      +-- Store in Convex (createOutboundMessage)
```

### Inbox UI Flow (Working)

```
InboxClient
      |
      +-- useQuery: api.conversations.listWithFilters
      |     +-- Returns conversations with contacts
      |     +-- Filters: active, status, tags
      |
      +-- ConversationList (sidebar)
      |     +-- Shows contact name/phone
      |     +-- Shows unread count badge
      |     +-- Shows last message preview
      |
      +-- MessageThread (main area)
            +-- useQuery: api.messages.listByConversationAsc
            +-- MessageBubble components
            +-- ComposeInput for sending
```

## Standard Stack

### Already Installed (No Changes Needed)

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Convex HTTP Router | `convex/http.ts` | Webhook endpoint | Working |
| Kapso Types | `convex/http/kapso.ts` | Meta webhook types | Working |
| Kapso Processing | `convex/kapso.ts` | Message + ARI logic | Needs verification |
| Kapso Client | `src/lib/kapso/client.ts` | API calls | Working |
| Send Route | `src/app/api/messages/send/route.ts` | Outbound messages | Working |
| Inbox UI | `src/app/(dashboard)/[workspace]/inbox/` | UI components | Working |

### Environment Variables Required

```bash
# Kapso credentials (per-workspace in DB)
# Stored in workspaces table:
#   - kapso_phone_id: The WhatsApp phone ID from Kapso
#   - meta_access_token: Encrypted API key

# Webhook secret (if signature verification enabled)
KAPSO_WEBHOOK_SECRET=optional-for-hmac-verification

# AI models
SEALION_URL=http://100.113.96.25:11434  # Tailscale Ollama
GROK_API_KEY=xai-api-key  # Fallback

# Encryption (for API key storage)
ENCRYPTION_KEY=32-byte-hex-key
```

## Architecture Patterns

### Pattern 1: Async Webhook Processing

**What:** Respond 200 OK immediately, process payload asynchronously
**Why:** Prevents Kapso retries, keeps webhook fast
**Implementation:**
```typescript
// convex/http.ts
handler: httpAction(async (ctx, request) => {
  const payload = JSON.parse(await request.text());

  // Schedule processing - returns immediately
  await ctx.scheduler.runAfter(0, internal.kapso.processWebhook, {
    payload,
    receivedAt: Date.now(),
  });

  return new Response(JSON.stringify({ received: true }), { status: 200 });
})
```

### Pattern 2: Workspace Lookup by Phone ID

**What:** Find workspace using Kapso's `phone_number_id` from webhook metadata
**Index:** `by_kapso_phone` on workspaces table
**Implementation:**
```typescript
const workspace = await ctx.db
  .query("workspaces")
  .withIndex("by_kapso_phone", (q) =>
    q.eq("kapso_phone_id", phoneNumberId)
  )
  .first();
```

### Pattern 3: Message Deduplication

**What:** Prevent duplicate messages when Kapso retries webhook
**Method:** Check existing messages by `kapso_message_id`
**Implementation:**
```typescript
const existingMessages = await ctx.db
  .query("messages")
  .filter((q) => q.has("kapso_message_id"))
  .collect();

const existingIds = new Set(existingMessages.map(m => m.kapso_message_id));
const newMessages = allMessages.filter(m => !existingIds.has(m.message.id));
```

### Pattern 4: ARI Conditional Processing

**What:** Only invoke AI for text messages when ARI is configured
**Checks:**
1. `ariConfig` exists for workspace
2. `meta_access_token` exists (can send responses)
3. Message type is `text`
**Implementation:**
```typescript
const ariConfig = await ctx.db
  .query("ariConfig")
  .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
  .first();

if (!ariConfig || !workspace.meta_access_token || message.type !== "text") {
  continue; // Skip ARI processing
}
```

## Don't Hand-Roll

| Problem | Existing Solution | Location |
|---------|-------------------|----------|
| Webhook signature verification | HMAC-SHA256 with `x-kapso-signature` | `convex/_internal/webhook.js` (has code, currently optional) |
| Phone number normalization | `normalizePhone()` helper | `convex/kapso.ts`, `convex/mutations.ts` |
| Message deduplication | `kapso_message_id` check | `processWorkspaceMessages()` |
| Contact name fallback | `contact.name || contact.kapso_name || phone` | Various UI components |
| AI fallback chain | Sea-Lion -> Grok -> Static | `generateAIResponse()` |

**Key insight:** All these patterns are already implemented. The work is verification and bug-fixing, not implementation.

## Common Pitfalls

### Pitfall 1: Missing Workspace Kapso Credentials
**What goes wrong:** Webhook receives message but no responses sent
**Why it happens:** Workspace missing `kapso_phone_id` or `meta_access_token`
**How to detect:** Check logs: "[Kapso] No workspace for phone_number_id: X"
**How to fix:** Ensure Eagle workspace has both fields populated

### Pitfall 2: ARI Config Not Created
**What goes wrong:** Messages arrive but no ARI responses
**Why it happens:** No `ariConfig` record for workspace
**How to detect:** Check logs: "[Kapso] ARI not enabled for workspace X"
**How to fix:** Create ARI config for Eagle workspace (via UI or direct DB insert)

### Pitfall 3: Sea-Lion Not Accessible
**What goes wrong:** AI responses slow or fallback to static message
**Why it happens:** Ollama server not running on Tailscale network
**How to detect:** Check logs: "[ARI] Sea-Lion error, falling back to Grok"
**How to fix:** Ensure Ollama running, or rely on Grok fallback

### Pitfall 4: Encrypted Token Decryption Failure
**What goes wrong:** Outbound messages fail with "Kapso not configured"
**Why it happens:** `ENCRYPTION_KEY` missing or wrong in production
**How to detect:** API route logs or network errors
**How to fix:** Verify `ENCRYPTION_KEY` matches what was used to encrypt tokens

### Pitfall 5: Inbox Shows No Messages
**What goes wrong:** Messages exist in DB but inbox is empty
**Why it happens:** `workspace_id` mismatch or query index issue
**How to detect:** Check Convex dashboard for message records
**How to fix:** Verify workspace ID matches in conversation list query

## Code Examples

### Verify Webhook is Working
```bash
# Test webhook verification (GET)
curl "https://intent-otter-212.convex.site/webhook/kapso?hub.challenge=test123"
# Should return: test123

# Check webhook logs in Convex dashboard
# Look for: "[Kapso Webhook] Received payload"
```

### Check ARI Config for Eagle
```typescript
// In Convex dashboard or via query
const ariConfig = await ctx.db
  .query("ariConfig")
  .withIndex("by_workspace", (q) => q.eq("workspace_id", eagleWorkspaceId))
  .first();

// If null, create one:
// bot_name: "ARI"
// greeting_style: "professional"
// language: "id"
```

### Send Test Message via Kapso
```typescript
// Direct API test
const response = await fetch(
  `https://api.kapso.ai/meta/whatsapp/v24.0/${kapsoPhoneId}/messages`,
  {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: "6281234567890",
      type: "text",
      text: { body: "Test message from my21staff" },
    }),
  }
);
```

## Testing Checklist

### Webhook Verification
- [ ] GET `/webhook/kapso?hub.challenge=X` returns X
- [ ] POST `/webhook/kapso` returns 200 and logs payload
- [ ] Convex logs show "Queued for async processing"

### Message Processing
- [ ] Inbound message creates/updates contact
- [ ] Inbound message creates conversation (if new)
- [ ] Inbound message appears in messages table
- [ ] Duplicate messages are filtered (same `kapso_message_id`)

### ARI Bot Response
- [ ] ARI config exists for Eagle workspace
- [ ] Text message triggers `processARI`
- [ ] AI response generated (Sea-Lion or Grok)
- [ ] Response sent via Kapso API
- [ ] Outbound message recorded in DB

### Inbox Display
- [ ] Conversation list shows conversations
- [ ] Selecting conversation loads messages
- [ ] Messages display in correct order (oldest first)
- [ ] Unread count updates correctly
- [ ] Compose input sends messages

### End-to-End Flow
- [ ] Send WhatsApp message to Eagle's number
- [ ] Message appears in Convex
- [ ] ARI responds (if configured)
- [ ] Response appears in inbox UI
- [ ] Can reply from inbox UI
- [ ] Reply appears in WhatsApp

## Open Questions

### 1. Webhook Signature Verification
**What we know:** Code exists in `convex/_internal/webhook.js` but not used in `convex/http.ts`
**What's unclear:** Is signature verification required by Kapso?
**Recommendation:** Start without it (current code), add if Kapso enforces

### 2. Sea-Lion Server Status
**What we know:** URL is `http://100.113.96.25:11434` (Tailscale)
**What's unclear:** Is Ollama running? Is sea-lion model loaded?
**Recommendation:** Test connectivity, document fallback to Grok if unavailable

### 3. Kapso Workflow Execution Integration
**What we know:** Client has methods for workflow execution control
**What's unclear:** Is this needed for basic bot functionality?
**Recommendation:** Focus on basic message flow first, workflow control is for advanced handoff

## Issues to Check During Implementation

Based on code review, these areas need validation:

1. **Schema field mismatches** - Multiple `@ts-nocheck` comments suggest type issues
2. **Index availability** - `by_kapso_id` on messages table for deduplication
3. **ARI conversation state machine** - Uses `ariConversations` table with states
4. **Workspace credential storage** - `meta_access_token` should be encrypted

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `/home/jfransisco/Desktop/21/my21staff/convex/`
- Phase 1 Summary: `planning/phases/01-deployment/01-01-SUMMARY.md`
- v3.3 Roadmap: `planning/ROADMAP.md`

### Secondary (MEDIUM confidence)
- Previous Kapso research: `planning/phases-v2.0-archive/06-kapso-live/06-RESEARCH.md`

## Metadata

**Confidence breakdown:**
- Existing code: HIGH - Detailed codebase review completed
- Architecture: HIGH - Well-documented patterns
- Pitfalls: HIGH - Based on code inspection
- Testing: HIGH - Clear verification steps

**Research date:** 2026-01-25
**Valid until:** 2026-02-10 (15 days - production verification needed)

---

*Phase: 02-kapso-integration*
*Research completed: 2026-01-25*
*Ready for planning: yes*
