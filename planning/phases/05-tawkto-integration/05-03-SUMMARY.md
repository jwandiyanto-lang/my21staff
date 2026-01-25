---
phase: 05-central-support-hub
plan: 03
subsystem: api
tags: [nextjs, api-routes, portal, client-facing, tickets]

# Dependency graph
requires:
  - phase: 05-01
    provides: admin_workspace_id column, is_internal column, RLS policies, ADMIN_WORKSPACE_ID constant
provides:
  - Portal tickets list API (GET /api/portal/tickets)
  - Portal ticket create API (POST /api/portal/tickets)
  - Portal ticket detail API (GET /api/portal/tickets/[id])
  - Portal comments list API (GET /api/portal/tickets/[id]/comments)
  - Portal comment create API (POST /api/portal/tickets/[id]/comments)
affects: [05-04, 05-05, client-portal-ui, support-portal-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns: [portal-api-pattern, requester-scoped-access, internal-comment-filtering]

key-files:
  created:
    - src/app/api/portal/tickets/route.ts
    - src/app/api/portal/tickets/[id]/route.ts
    - src/app/api/portal/tickets/[id]/comments/route.ts
  modified: []

key-decisions:
  - "Portal APIs filter by requester_id = auth.uid() for client isolation"
  - "Tickets created via portal automatically routed to ADMIN_WORKSPACE_ID"
  - "Comments filtered with or('is_internal.is.null,is_internal.eq.false') to hide admin notes"
  - "Client comments always created with is_internal = false"
  - "Cannot comment on closed tickets (stage validation)"

patterns-established:
  - "Portal API pattern: Direct auth check without workspace membership (requester-scoped)"
  - "Internal comment filtering: or('is_internal.is.null,is_internal.eq.false')"

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 05 Plan 03: Client Portal API Routes

**Portal APIs for client ticket management with requester-scoped access and internal comment filtering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T07:09:01Z
- **Completed:** 2026-01-19T07:14:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created client portal tickets API (list, create, detail)
- Created client portal comments API (list public, add public)
- Implemented requester-scoped access (clients see only own tickets)
- Implemented internal comment filtering (admin notes hidden from clients)
- Automatic routing of portal tickets to ADMIN_WORKSPACE_ID

## Task Commits

Each task was committed atomically:

1. **Task 1: Create portal tickets list and create API** - `d47ec86` (feat)
2. **Task 2: Create portal ticket detail and comments API** - `eb90b2b` (feat)

## Files Created/Modified

- `src/app/api/portal/tickets/route.ts` - GET lists client's tickets, POST creates routed ticket
- `src/app/api/portal/tickets/[id]/route.ts` - GET ticket detail (limited fields)
- `src/app/api/portal/tickets/[id]/comments/route.ts` - GET public comments, POST add comment

## Decisions Made

1. **Requester-scoped access** - Portal APIs verify requester_id = user.id instead of workspace membership. This ensures clients can only see/modify their own tickets regardless of workspace context.

2. **Automatic admin routing** - POST /api/portal/tickets sets admin_workspace_id = ADMIN_WORKSPACE_ID to route all client tickets to the central support hub.

3. **Internal comment filtering** - GET comments uses `.or('is_internal.is.null,is_internal.eq.false')` to exclude admin-only notes from client view.

4. **Forced public comments** - Client comments always set is_internal = false, preventing clients from accidentally creating internal notes.

5. **Closed ticket protection** - Cannot add comments to tickets with stage = 'closed'.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Portal API routes complete and functional
- Ready for Plan 04: Admin ticket list with client ticket filtering
- Ready for Plan 05: Client portal UI (future)

---
*Phase: 05-central-support-hub*
*Completed: 2026-01-19*
