---
phase: 03-live-bot-integration
plan: 02
status: complete
completed: 2026-01-29
---

# Plan 03-02 Summary: Configure Kapso Webhook to Convex

## Objective

Configure Kapso webhook to production Convex endpoint and verify message delivery works.

## What Was Done

### Manual Configuration

1. **Webhook URL Updated:**
   - Configured Kapso dashboard with Convex HTTP endpoint
   - URL: `https://intent-otter-212.convex.cloud/webhook/kapso`
   - Architecture: Direct to Convex (no Next.js middleware)

2. **GET Verification Successful:**
   - Kapso sent hub.challenge request
   - Convex HTTP action echoed challenge back
   - Webhook verified in Kapso dashboard ✓

3. **POST Delivery Tested:**
   - Sent test WhatsApp message
   - Message appeared in Kapso delivery logs
   - Message saved to Convex database (messages table)
   - Conversation metadata updated

## Technical Details

**Webhook Handler:** `convex/http.ts` lines 35-71
- Receives POST from Kapso
- Parses WhatsApp message payload
- Schedules async processing via `internal.kapso.processWebhook`
- Returns 200 immediately (prevents Kapso retries)

**Architecture Choice:**
- Chose Convex HTTP action over Next.js API route
- Simpler: One less hop, Convex handles everything
- Async processing via scheduler (not waitUntil)

## Verification

- ✅ Kapso webhook URL configured
- ✅ GET challenge verified
- ✅ Test message delivered successfully  
- ✅ Message appears in Convex database
- ✅ Conversation unread count incremented

## Issues Encountered

None - configuration worked on first attempt.

## Next Steps

Wave 3 (Plan 03-03): Test complete bot automation flow - verify ARI responds to real WhatsApp messages with greeting, qualification, scoring, and routing.

---

*Completed: 2026-01-29*
*Duration: 2 minutes (manual configuration)*
