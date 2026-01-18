---
phase: 06-kapso-live
plan: 01
subsystem: messaging
tags: [kapso, webhook, inbound-messages, api-route]

# Dependency graph
requires:
  - phase: 04-inbox-send
    provides: Kapso client, message schema, conversation metadata pattern
provides:
  - POST /api/webhook/kapso for inbound message handling
  - GET /api/webhook/kapso for webhook verification
  - Contact/conversation upsert on inbound messages
  - Message deduplication by kapso_message_id
affects: [production-deployment, kapso-live-connection]

# Tech tracking
tech-stack:
  added: []
  patterns: [Webhook immediate response, Admin client for RLS bypass, Upsert pattern]

key-files:
  created:
    - src/app/api/webhook/kapso/route.ts
    - src/app/webinars/[workspace]/[slug]/registration-section.tsx
  modified:
    - src/app/webinars/[workspace]/[slug]/page.tsx

key-decisions:
  - "Respond immediately with {received:true} to prevent Kapso retries"
  - "Use createAdminClient to bypass RLS for webhook processing"
  - "Deduplicate by kapso_message_id before insert"

patterns-established:
  - "Webhook handler pattern: immediate response, async processing"
  - "Contact/conversation upsert on inbound message"

issues-created: []

# Metrics
duration: 12min
completed: 2026-01-14
---

# Phase 6 Plan 1: Kapso Webhook Handler Summary

**POST/GET webhook endpoint for receiving inbound WhatsApp messages via Kapso with contact/conversation upsert**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-14T14:30:00Z
- **Completed:** 2026-01-14T14:42:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Webhook endpoint at /api/webhook/kapso for inbound messages
- GET handler returns hub.challenge for Kapso verification
- POST handler processes Kapso payload: contact upsert, conversation upsert, message insert
- Message deduplication by kapso_message_id prevents duplicates on retry
- Conversation metadata updated (last_message_at, preview, unread_count)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Kapso webhook handler** - `cef0e5c` (feat)
2. **Fix: Hydration mismatch in webinar page** - `9478744` (fix) - Deviation Rule 1

**Plan metadata:** (pending)

## Files Created/Modified

- `src/app/api/webhook/kapso/route.ts` - Webhook handler for inbound messages
- `src/app/webinars/[workspace]/[slug]/registration-section.tsx` - Client component for time-sensitive UI
- `src/app/webinars/[workspace]/[slug]/page.tsx` - Updated to use client component

## Decisions Made

- Respond immediately with `{received: true}` to prevent Kapso retry loops
- Use `createAdminClient()` to bypass RLS for server-side webhook processing
- Check for existing message by kapso_message_id before insert to handle retries

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed hydration mismatch in webinar registration section**
- **Found during:** Dev server testing
- **Issue:** `new Date()` comparison in server component caused SSR/client mismatch
- **Fix:** Moved time-sensitive isPast check to client component with useEffect
- **Files modified:** registration-section.tsx (created), page.tsx (modified)
- **Verification:** Build passes, no hydration errors
- **Commit:** `9478744`

---

**Total deviations:** 1 auto-fixed (bug)
**Impact on plan:** Bug fix unrelated to webhook, discovered during testing. No scope creep.

## Issues Encountered

None - webhook handler implemented as planned.

## Next Phase Readiness

Webhook endpoint ready for production. To complete real Kapso integration:
- Need workspace with kapso_phone_id in database
- Need to disable dev mode mock data
- Consider adding conversation sync from Kapso API (new phase)

---
*Phase: 06-kapso-live*
*Completed: 2026-01-14*
