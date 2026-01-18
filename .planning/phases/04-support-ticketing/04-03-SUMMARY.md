---
phase: 04-support-ticketing
plan: 03
subsystem: api
tags: [typescript, next.js, api-routes, tickets, state-machine, hmac]

# Dependency graph
requires:
  - phase: 04-01
    provides: Database schema for tickets, comments, history tables
  - phase: 04-02
    provides: TypeScript types and transition/token utilities
provides:
  - Complete CRUD API for tickets (/api/tickets)
  - Ticket detail and comments endpoints (/api/tickets/[id])
  - Stage transition with skip approval flow
  - Token-based and authenticated reopen endpoints
affects: [04-support-ticketing, UI components, email notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ticket API routes following contacts/workspace patterns"
    - "Permission-guarded assignment with tickets:assign"
    - "State machine transition validation at API layer"
    - "Dual-mode reopen (token-based or authenticated)"

key-files:
  created:
    - src/app/api/tickets/route.ts
    - src/app/api/tickets/[id]/route.ts
    - src/app/api/tickets/[id]/comments/route.ts
    - src/app/api/tickets/[id]/transition/route.ts
    - src/app/api/tickets/[id]/approval/route.ts
    - src/app/api/tickets/[id]/reopen/route.ts
  modified:
    - src/types/database.ts

key-decisions:
  - "Database types extended to include tickets, ticket_comments, ticket_status_history, users tables"
  - "Skip transitions set pending_approval flag for requester approval"
  - "Closing generates reopen token, reopening clears it (one-time use)"
  - "Bilingual status history reasons in Indonesian"

patterns-established:
  - "Ticket workspace auth: fetch ticket first, then verify membership via workspace_id"
  - "Status history entry on every stage change"
  - "System comments with is_stage_change=true for stage transitions"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 04 Plan 03: Ticket API Routes Summary

**Complete REST API for ticket CRUD, comments, stage transitions with approval flow, and dual-mode reopen**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18T13:46:43Z
- **Completed:** 2026-01-18T13:51:56Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Created ticket list/create endpoints with workspace auth and validation
- Implemented ticket detail, assignment (tickets:assign), and flat comments timeline
- Built stage transition API with skip approval workflow
- Added requester-only approval/reject for stage skips
- Implemented dual-mode reopen (HMAC token for email links, authenticated for logged-in)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ticket list and create routes** - `8c7b79a` (feat)
2. **Task 2: Create ticket detail and comment routes** - `50b7a46` (feat)
3. **Task 3: Create transition, approval, and reopen routes** - `16adf63` (feat)

## Files Created/Modified

- `src/app/api/tickets/route.ts` - GET list, POST create with validation
- `src/app/api/tickets/[id]/route.ts` - GET detail, PATCH assignment
- `src/app/api/tickets/[id]/comments/route.ts` - GET list, POST add comment
- `src/app/api/tickets/[id]/transition/route.ts` - POST with skip detection
- `src/app/api/tickets/[id]/approval/route.ts` - POST approve/reject skip
- `src/app/api/tickets/[id]/reopen/route.ts` - POST token or auth-based
- `src/types/database.ts` - Added tickets, ticket_comments, ticket_status_history, users tables

## Decisions Made

1. **Extended database types** - Added all ticket-related tables plus users table to Database interface for full type safety
2. **Dual-mode reopen** - Token verification first, then fallback to authenticated requester check
3. **Skip approval workflow** - Sets pending_approval=true, pending_stage, requester-only approval
4. **Indonesian UI strings** - Status history reasons in Indonesian ("Tiket dibuat", "Tiket dibuka kembali")
5. **One-time reopen tokens** - Token cleared after successful reopen to prevent reuse

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added database types for ticket tables**
- **Found during:** Task 1 (ticket list/create routes)
- **Issue:** Supabase client couldn't recognize 'tickets' table - TypeScript compilation error
- **Fix:** Extended src/types/database.ts with tickets, ticket_comments, ticket_status_history, and users table definitions
- **Files modified:** src/types/database.ts
- **Verification:** Build passes, all routes compile
- **Committed in:** 8c7b79a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Database types required for Supabase TypeScript support. Essential for compilation.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete API layer ready for UI integration in Plan 04
- All CRUD operations functional with proper auth
- State machine transitions validated
- Approval flow ready for requester interaction
- Reopen tokens generated on close, verified on reopen

---
*Phase: 04-support-ticketing*
*Completed: 2026-01-18*
