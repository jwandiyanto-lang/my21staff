---
phase: 11-smart-lead-automation
plan: 01
subsystem: database
tags: [convex, phone-normalization, deduplication, webhook, kapso]

# Dependency graph
requires:
  - phase: 04-lead-database
    provides: Contact schema and mutations
  - phase: 07-inbox-integration
    provides: Kapso webhook infrastructure
provides:
  - Phone normalization index for deduplication
  - Activity timestamp tracking on every inbound message
  - Contact-to-conversation linking via kapso_conversation_id
affects: [12-sarah-template-system, 13-production-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Database-first deduplication using normalized phone index"
    - "Activity tracking on every webhook message"
    - "Bidirectional contact-conversation linking"

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/mutations.ts
    - src/app/api/webhook/kapso/route.ts

key-decisions:
  - "Query by phone_normalized field instead of raw phone to prevent duplicate leads"
  - "Update lastActivityAt on every inbound message for follow-up prioritization"
  - "Link contacts to conversations for 'Open in Inbox' navigation"
  - "Preserve manual CRM name edits (only update if empty)"

patterns-established:
  - "Phone normalization prevents duplicates when same number arrives in different formats (+62813, 0813, 62813)"
  - "Webhook idempotency via kapso_message_id provides first layer of duplicate protection"
  - "Database deduplication via phone_normalized provides second layer"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 11 Plan 01: Smart Lead Automation Summary

**Phone normalization deduplication with activity tracking and conversation linking for automatic lead creation without duplicates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T19:20:56Z
- **Completed:** 2026-02-01T19:24:53Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- Fixed phone number deduplication bug using normalized phone index
- Activity timestamp updates on every inbound WhatsApp message
- Bidirectional contact-conversation linking enables inbox navigation
- Webhook retries protected by dual-layer idempotency (kapso_message_id + phone_normalized)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add phone_normalized index to contacts table** - `f483c2a` (feat)
2. **Task 2: Fix findOrCreateContactWebhook to use normalized phone lookup and link conversations** - `0e7cd68` (feat)
3. **Task 3: Verify deduplication and conversation linking** - `cbdda00` (test)
4. **Task 4: Wire webhook to pass kapso_conversation_id to mutation** - `9f34f88` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added by_workspace_phone_normalized index for efficient deduplication queries
- `convex/mutations.ts` - Fixed findOrCreateContactWebhook to query by normalized phone, update lastActivityAt, and accept kapso_conversation_id
- `src/app/api/webhook/kapso/route.ts` - Wire webhook to link contacts with conversations after creation

## Decisions Made

**1. Query by phone_normalized instead of raw phone**
- **Rationale:** Same number can arrive in different formats (+62813, 0813, 62813) causing duplicate leads
- **Implementation:** Added index and changed query in findOrCreateContactWebhook mutation
- **Benefit:** Prevents duplicates at database level

**2. Update lastActivityAt on every inbound message**
- **Rationale:** Enables follow-up prioritization by recency
- **Implementation:** Set timestamp in both existing contact patch and new contact insert
- **Benefit:** Dashboard can sort leads by most recent activity

**3. Link contacts to conversations via kapso_conversation_id**
- **Rationale:** Enables "Open in Inbox" navigation from Database view
- **Implementation:** Added optional field to mutation, wire webhook to pass it after conversation creation
- **Benefit:** Seamless navigation between Database and Inbox features

**4. Preserve manual CRM name edits**
- **Rationale:** User-entered names should not be overwritten by WhatsApp profile name changes
- **Implementation:** Only update name field if empty, always update kapso_name for reference
- **Benefit:** Respects manual data entry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added kapso_conversation_id to Contact interface**
- **Found during:** Task 4 (Wire webhook)
- **Issue:** TypeScript error - Contact type missing kapso_conversation_id field
- **Fix:** Added optional kapso_conversation_id field to Contact interface in webhook route
- **Files modified:** src/app/api/webhook/kapso/route.ts
- **Verification:** TypeScript error resolved
- **Committed in:** 9f34f88 (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** TypeScript fix necessary for compilation. No scope creep.

## Issues Encountered

None - all tasks executed as planned with one blocking TypeScript fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for production validation:**
- Phone deduplication working (dual-layer protection)
- Activity tracking enabled for follow-up workflows
- Conversation linking ready for inbox navigation
- Webhook idempotency verified (messageExistsByKapsoId exists)

**What to test in Phase 13:**
1. Send messages from same number in different formats (verify single lead created)
2. Verify lastActivityAt updates on each message
3. Check that kapso_conversation_id is populated on new contacts
4. Test "Open in Inbox" navigation from Database view

---
*Phase: 11-smart-lead-automation*
*Completed: 2026-02-01*
