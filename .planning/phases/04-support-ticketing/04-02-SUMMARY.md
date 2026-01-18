---
phase: 04-support-ticketing
plan: 02
subsystem: api
tags: [typescript, types, state-machine, hmac, permissions]

# Dependency graph
requires:
  - phase: 04-01
    provides: Database schema design for tickets, comments, history tables
provides:
  - TypeScript types for Ticket, TicketComment, TicketStatusHistory
  - Stage transition validation (canTransition, getNextStage, isSkipTransition)
  - HMAC token generation/verification for reopen links
  - Ticket permissions integrated into permission system
affects: [04-support-ticketing, API routes, UI components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State machine transitions with admin skip support"
    - "HMAC-SHA256 tokens with base64url encoding and expiry"
    - "Bilingual label config (English/Indonesian)"

key-files:
  created:
    - src/lib/tickets/types.ts
    - src/lib/tickets/constants.ts
    - src/lib/tickets/transitions.ts
    - src/lib/tickets/tokens.ts
    - src/lib/tickets/index.ts
  modified:
    - src/lib/permissions/types.ts
    - src/lib/permissions/constants.ts

key-decisions:
  - "Reuse ENCRYPTION_KEY for HMAC tokens (fallback from TICKET_TOKEN_SECRET)"
  - "7-day expiry for reopen tokens"
  - "Admin skip requires approval flag at API layer"

patterns-established:
  - "Ticket stage progression: report -> discuss -> outcome -> implementation -> closed"
  - "VALID_TRANSITIONS constant for state machine validation"
  - "Bilingual config pattern with label/labelId"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 04 Plan 02: Ticket TypeScript Utilities Summary

**Type-safe ticketing foundation with stage transitions, HMAC reopen tokens, and permission integration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T13:42:48Z
- **Completed:** 2026-01-18T13:44:19Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Created complete TypeScript types matching database schema (Ticket, TicketComment, TicketStatusHistory)
- Implemented stage transition state machine with admin skip support
- Built HMAC-SHA256 token system for secure reopen links with 7-day expiry
- Extended permission system with tickets:assign, tickets:transition, tickets:skip_stage

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ticket types and constants** - `9b30765` (feat)
2. **Task 2: Create transition validation and token utilities** - `8649a51` (feat)
3. **Task 3: Add ticket permissions to permission system** - `4d39a03` (feat)

## Files Created/Modified

- `src/lib/tickets/types.ts` - TicketStage, TicketCategory, TicketPriority types and interfaces
- `src/lib/tickets/constants.ts` - STAGE_CONFIG, CATEGORY_CONFIG, PRIORITY_CONFIG, VALID_TRANSITIONS
- `src/lib/tickets/transitions.ts` - canTransition(), getNextStage(), isSkipTransition(), getValidTargetStages()
- `src/lib/tickets/tokens.ts` - generateReopenToken(), verifyReopenToken() with HMAC-SHA256
- `src/lib/tickets/index.ts` - Barrel export for all utilities
- `src/lib/permissions/types.ts` - Added ticket permission types
- `src/lib/permissions/constants.ts` - Added ticket permissions to owner/admin roles

## Decisions Made

1. **HMAC secret fallback** - Uses ENCRYPTION_KEY if TICKET_TOKEN_SECRET not set (reuses existing secret)
2. **7-day token expiry** - Balances security with user convenience for reopen links
3. **Admin skip flag** - Transition validation accepts isAdminSkip boolean, approval logic handled at API layer
4. **Bilingual labels** - All configs include both English (label) and Indonesian (labelId) strings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TypeScript utilities ready for API routes in Plan 03
- Types match database schema from Plan 01
- Permission system extended for ticket management checks
- Token utilities ready for reopen link generation

---
*Phase: 04-support-ticketing*
*Completed: 2026-01-18*
