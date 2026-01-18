# Phase 18: Kapso Bot Setup & Verification - Research

**Researched:** 2026-01-16
**Domain:** WhatsApp Bot Verification, Kapso Platform Configuration
**Confidence:** HIGH

## Summary

Phase 18 focuses on verifying and validating the existing Kapso integration rather than building new functionality. The infrastructure is already in place from prior phases:

- **Phase 6:** Webhook handler at `/api/webhook/kapso` receives inbound messages
- **Phase 8:** Sea Lion AI function (`sea-lion-reply`) and workflow (`AI Auto-Reply`) configured in Kapso
- **Phase 13:** AI handover toggle allows pausing/resuming automation per conversation

The goal is systematic verification that all components work end-to-end, along with bot persona refinement if needed.

**Primary recommendation:** Create a verification checklist with test cases, execute end-to-end testing with real WhatsApp messages, and document any persona/behavior adjustments needed.

## Standard Stack

The established integration already uses these components:

### Core (Already Implemented)
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Webhook Handler | `src/app/api/webhook/kapso/route.ts` | Receive inbound WhatsApp messages | Complete |
| Kapso Client | `src/lib/kapso/client.ts` | Send messages, manage handover | Complete |
| Send Message API | `src/app/api/messages/send/route.ts` | Outbound messages via Kapso | Complete |
| Handover API | `src/app/api/conversations/[id]/handover/route.ts` | Toggle AI automation | Complete |

### Kapso-Side (Already Configured)
| Component | Name | Purpose | Status |
|-----------|------|---------|--------|
| Secret | `SEALION_API_KEY` | Sea Lion API authentication | Configured |
| Function | `sea-lion-reply` | AI response generation | Deployed |
| Workflow | `AI Auto-Reply` | Trigger AI on inbound message | Active |

### Kapso Dashboard Access
| Resource | URL |
|----------|-----|
| Project | https://app.kapso.ai/projects/2bdca4dd-e230-4a1a-8639-68f8595defa8 |
| Webhooks | https://app.kapso.ai/projects/2bdca4dd-e230-4a1a-8639-68f8595defa8/webhooks |

## Architecture Patterns

### Current Message Flow (Inbound)
```
Customer WhatsApp Message
        |
        v
    Kapso Platform
        |
   +----+----+
   |         |
   v         v
Webhook    Workflow
(to CRM)   (AI Reply)
   |         |
   v         v
Supabase  Sea Lion AI
Database     |
             v
         WhatsApp Response
```

### Current Message Flow (Outbound from CRM)
```
User sends message in Inbox
        |
        v
POST /api/messages/send
        |
        v
Kapso API (sendMessage)
        |
        v
Customer WhatsApp
```

### AI Handover Pattern
```
Conversation in Inbox
        |
        v
Toggle "AI Aktif" / "AI Nonaktif"
        |
        v
POST /api/conversations/[id]/handover
        |
        v
Kapso API (setHandover)
   - paused=true: status="handoff" (AI stops)
   - paused=false: status="waiting" (AI resumes)
        |
        v
Local conversation.status updated
```

### Anti-Patterns to Avoid
- **Hardcoded phone ID:** Use workspace.kapso_phone_id from database
- **Missing duplicate check:** Always check kapso_message_id before inserting (retries happen)
- **Slow webhook response:** Return `{received: true}` immediately, process async
- **Ignoring handover state:** Check conversation.status before AI processing

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook tunnel for local testing | Custom tunnel | ngrok or Cloudflare Tunnel | Standard, reliable, documented |
| Message deduplication | Custom logic | kapso_message_id unique check | Already implemented |
| AI response generation | Custom LLM wrapper | Kapso Functions + Sea Lion | Already configured |
| Conversation state | Custom state machine | Kapso workflow status | Platform handles complexity |

**Key insight:** This phase is verification, not implementation. Resist adding new features until existing integration is validated.

## Common Pitfalls

### Pitfall 1: Webhook Not Receiving Messages
**What goes wrong:** Messages sent to WhatsApp don't appear in CRM
**Why it happens:**
- Webhook URL not configured in Kapso
- Webhook URL unreachable (firewall, SSL issue)
- kapso_phone_id mismatch between Kapso and database
**How to avoid:**
1. Verify webhook URL in Kapso dashboard
2. Check Vercel logs for incoming requests
3. Confirm workspace.kapso_phone_id matches Kapso phone number ID
**Warning signs:** No logs in Vercel for `/api/webhook/kapso`

### Pitfall 2: AI Not Responding
**What goes wrong:** Inbound messages received, but AI doesn't reply
**Why it happens:**
- Workflow not active in Kapso
- Sea Lion API key expired/invalid
- Function error not visible
**How to avoid:**
1. Check Kapso dashboard for workflow status
2. Test function directly with sample input
3. Check function logs in Kapso
**Warning signs:** Messages appear in CRM but no AI response on WhatsApp

### Pitfall 3: Duplicate Messages
**What goes wrong:** Same message appears multiple times in conversation
**Why it happens:**
- Webhook handler failing mid-process (Kapso retries)
- kapso_message_id deduplication not working
**How to avoid:**
- Webhook returns 200 immediately
- Check existing message by kapso_message_id before insert
**Warning signs:** Messages duplicated 2-4 times

### Pitfall 4: Handover Not Working
**What goes wrong:** Toggle AI doesn't actually stop AI responses
**Why it happens:**
- Kapso API call failing silently
- Workflow not checking handover status
**How to avoid:**
1. Check API response in handover route
2. Verify workflow has handover logic
**Warning signs:** AI keeps responding after "AI Nonaktif"

### Pitfall 5: Kapso Sandbox vs Production Confusion
**What goes wrong:** Testing in sandbox but webhook points to production (or vice versa)
**Why it happens:** Different phone number IDs for sandbox vs production
**How to avoid:**
- Use consistent environment
- Document phone ID for each environment
**Warning signs:** Tests work locally but not in production

## Code Examples

### Webhook Verification Test (curl)
```bash
# Test GET (hub.challenge verification)
curl "https://your-domain.vercel.app/api/webhook/kapso?hub.challenge=test123"
# Expected: test123

# Test POST (simulate inbound message)
curl -X POST https://your-domain.vercel.app/api/webhook/kapso \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WABA_ID",
      "changes": [{
        "field": "messages",
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "628569354xxxx",
            "phone_number_id": "647015955153740"
          },
          "contacts": [{
            "wa_id": "628123456789",
            "profile": { "name": "Test User" }
          }],
          "messages": [{
            "id": "wamid.test123",
            "from": "628123456789",
            "type": "text",
            "text": { "body": "Test message" },
            "timestamp": "1705000000"
          }]
        }
      }]
    }]
  }'
# Expected: {"received":true}
```

### Kapso Sandbox Setup
```bash
# Navigate to: WhatsApp > Sandbox in Kapso dashboard
# Add your test phone number
# Send activation code via WhatsApp
# Configure "Sandbox WhatsApp" to route to your webhook
```

### Checking Vercel Logs
```bash
# Via Vercel CLI
vercel logs --follow

# Or in dashboard:
# https://vercel.com/[team]/[project]/logs
# Filter: "webhook/kapso"
```

### Testing Sea Lion Function (Kapso dashboard)
```json
// Test input for sea-lion-reply function
{
  "message": "Halo, apa itu my21staff?"
}

// Expected output
{
  "reply": "Halo! my21staff adalah platform CRM WhatsApp untuk UMKM Indonesia..."
}
```

## Verification Checklist

### 1. Webhook Receiving (Production)
- [ ] Send test WhatsApp message to production number
- [ ] Check Vercel logs for incoming webhook POST
- [ ] Verify message appears in CRM inbox
- [ ] Check contact was created/updated
- [ ] Check conversation was created/updated

### 2. AI Response (End-to-End)
- [ ] Send test message from personal WhatsApp
- [ ] Verify AI response received on WhatsApp (within 10s)
- [ ] Check response is in Bahasa Indonesia
- [ ] Check response follows persona guidelines
- [ ] Verify response logged in CRM

### 3. Outbound Messages (CRM to WhatsApp)
- [ ] Open conversation in CRM inbox
- [ ] Send message via message input
- [ ] Verify message delivered on WhatsApp
- [ ] Check message appears in CRM with "sent" status

### 4. AI Handover Toggle
- [ ] Open conversation with AI active
- [ ] Click "AI Nonaktif" toggle
- [ ] Send message from WhatsApp
- [ ] Verify NO AI response (human mode)
- [ ] Click "AI Aktif" toggle
- [ ] Send another message
- [ ] Verify AI responds again

### 5. Edge Cases
- [ ] Send image message (should show [Image] in CRM)
- [ ] Send voice note (should show [Audio message] in CRM)
- [ ] Rapid messages (no duplicates, all received)
- [ ] Long message (handled correctly)

## Bot Persona Configuration

### Current Persona (Phase 8)
The Sea Lion function currently uses a generic my21staff persona:
```javascript
content: `Kamu adalah asisten AI untuk my21staff, platform CRM WhatsApp untuk UMKM Indonesia.
Panduan:
- Jawab dalam Bahasa Indonesia yang ramah dan profesional
- Bantu pelanggan dengan pertanyaan tentang produk/layanan
- Jika tidak yakin, minta maaf dan sarankan menghubungi tim support
- Jaga jawaban tetap singkat dan jelas (max 2-3 paragraf)
- Gunakan bahasa yang mudah dipahami UMKM`
```

### Alternative: Client-Specific Persona
A more detailed persona exists for Eagle Overseas (in `PERSONA-kia-eagle-overseas.md`):
- Name: Kia
- Role: Intern
- Style: Casual, no emojis, short responses
- Data collection: Structured lead qualification

**Recommendation:** Keep current generic persona for Phase 18 verification. Client-specific personas can be a future enhancement (per-workspace persona configuration).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Meta webhook direct | Kapso webhook (structured) | Already in use | Cleaner payloads, better retry handling |
| Generic LLM | Sea Lion (Indonesian-focused) | Phase 8 | Better Bahasa Indonesia quality |
| No handover | Workflow execution status API | Phase 13 | Human can take over from AI |

**Deprecated/outdated:**
- Kapso v1 webhook format: Use Meta-format webhooks (`entry[].changes[].value.messages[]`)
- Direct Meta API calls: Use Kapso as proxy for simplified authentication

## Open Questions

### 1. Webhook Signature Verification
- **What we know:** Kapso supports HMAC-SHA256 signature in `X-Webhook-Signature` header
- **What's unclear:** Is this configured for production webhook?
- **Recommendation:** Verify webhook security settings in Kapso dashboard. Consider adding signature verification if not present (security enhancement, not blocking for Phase 18).

### 2. Message History Sync
- **What we know:** Webhook only captures new messages after webhook configured
- **What's unclear:** How to backfill historical messages?
- **Recommendation:** Out of scope for Phase 18. Consider future phase if needed.

### 3. Multi-Workspace Support
- **What we know:** kapso_phone_id stored per workspace
- **What's unclear:** Can multiple workspaces use same Kapso account?
- **Recommendation:** Test with production workspace first. Multi-tenant Kapso config is future scope.

## Sources

### Primary (HIGH confidence)
- `src/app/api/webhook/kapso/route.ts` - Existing webhook implementation
- `src/lib/kapso/client.ts` - Existing Kapso client
- `.planning/phases/06-kapso-live/06-01-SUMMARY.md` - Phase 6 completion details
- `.planning/phases/08-sealion-kapso/08-01-SUMMARY.md` - Phase 8 completion details
- https://docs.kapso.ai/docs/platform/webhooks/overview - Webhook setup and security

### Secondary (MEDIUM confidence)
- https://docs.kapso.ai/docs/flows/step-types/agent-node - Agent node configuration
- https://docs.kapso.ai/docs/how-to/whatsapp/use-sandbox-for-testing - Sandbox testing guide

### Tertiary (LOW confidence)
- General WhatsApp Business API patterns (from training data)

## Metadata

**Confidence breakdown:**
- Webhook verification: HIGH - Existing implementation documented
- AI workflow: HIGH - Configured in Phase 8
- Handover: MEDIUM - API exists but untested end-to-end
- Persona config: HIGH - Documentation exists in codebase

**Research date:** 2026-01-16
**Valid until:** 2026-02-16 (stable - verification phase, no external API changes expected)
