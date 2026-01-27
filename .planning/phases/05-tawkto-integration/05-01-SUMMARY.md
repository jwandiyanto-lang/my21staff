---
phase: 05-central-support-hub
plan: 01
subsystem: database, api
tags: [supabase, rls, typescript, cross-workspace, ticketing]

# Dependency graph
requires:
  - phase: 04-support-ticketing
    provides: tickets table, RLS policies, TicketComment, TicketStatusHistory
provides:
  - admin_workspace_id column on tickets table
  - is_internal column on ticket_comments table
  - RLS policies for cross-workspace ticket access
  - TypeScript types for cross-workspace ticketing
  - ADMIN_WORKSPACE_ID constant and helper functions
affects: [05-02, 05-03, 05-04, 05-05, client-ticket-routing, admin-support-dashboard]

# Tech tracking
tech-stack:
  added: [dotenv]
  patterns: [cross-workspace-rls, admin-hub-routing]

key-files:
  created:
    - supabase/migrations/28_central_support_hub.sql
    - src/lib/config/support.ts
  modified:
    - src/lib/tickets/types.ts

key-decisions:
  - "RLS policies ADD access for admin workspace - don't replace existing workspace member policies"
  - "admin_workspace_id nullable - allows tickets to be workspace-internal OR routed to admin"
  - "is_internal on comments for admin notes hidden from clients"
  - "Default ADMIN_WORKSPACE_ID hardcoded with env override option"
  - "Migration repair used to sync migration history before push"

patterns-established:
  - "Cross-workspace RLS: Check private.get_user_role_in_workspace(admin_workspace_id) IN ('owner', 'admin')"
  - "Support config module: Centralized constants for support hub configuration"

# Metrics
duration: 25min
completed: 2026-01-19
---

# Phase 05 Plan 01: Schema & Types for Central Support Hub

**Cross-workspace ticketing schema with admin_workspace_id routing, is_internal comments, and TypeScript support config module**

## Performance

- **Duration:** 25 min
- **Started:** 2026-01-19T10:15:00Z
- **Completed:** 2026-01-19T10:40:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added admin_workspace_id column to tickets for routing to central hub
- Added is_internal column to ticket_comments for admin-only notes
- Created RLS policies allowing admin workspace to view/manage client tickets
- Updated TypeScript types with new fields
- Created src/lib/config/support.ts with ADMIN_WORKSPACE_ID constant and helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration for cross-workspace support** - `e66b07e` (feat)
2. **Task 2: Update TypeScript types and add support config** - `9af6ee7` (feat)

## Files Created/Modified

- `supabase/migrations/28_central_support_hub.sql` - Cross-workspace ticketing schema with RLS
- `src/lib/tickets/types.ts` - Added admin_workspace_id, source_workspace, is_internal
- `src/lib/config/support.ts` - ADMIN_WORKSPACE_ID constant and helper functions

## Decisions Made

1. **RLS policies ADD access** - New policies for admin workspace don't replace existing workspace member policies. Both coexist, allowing workspace members AND admin workspace members appropriate access.

2. **admin_workspace_id nullable** - Tickets without admin_workspace_id remain workspace-internal. Setting it routes the ticket to the admin workspace for centralized support.

3. **is_internal for admin notes** - Admin team can add internal comments not visible to clients (future implementation).

4. **Hardcoded default with env override** - ADMIN_WORKSPACE_ID defaults to my21staff workspace ID but can be overridden via NEXT_PUBLIC_ADMIN_WORKSPACE_ID environment variable.

5. **Migration repair workflow** - Used `supabase migration repair` to mark existing migrations as applied before pushing new migration. This fixed migration history sync issues.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration history sync required repair**
- **Found during:** Task 1
- **Issue:** `supabase db push` tried to re-apply all migrations because supabase_migrations.schema_migrations table was empty (migrations were previously applied via SQL Editor)
- **Fix:** Used `supabase migration repair` to mark migrations 05-29 as applied, then pushed migration 28 with `--include-all` flag
- **Verification:** `supabase migration list` shows 28 as applied, columns exist in database
- **Committed in:** e66b07e (part of Task 1)

**2. [Rule 3 - Blocking] Installed dotenv for migration verification**
- **Found during:** Task 1 verification
- **Issue:** Needed to verify columns existed after migration, required dotenv for env loading
- **Fix:** `npm install dotenv`
- **Files modified:** package.json, package-lock.json
- **Verification:** Column check script ran successfully
- **Note:** dotenv is useful for development scripts

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to complete migration. No scope creep.

## Issues Encountered

None beyond the auto-fixed blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema ready for cross-workspace ticketing
- TypeScript types ready for client ticket routing
- ADMIN_WORKSPACE_ID available for routing logic
- Ready for Plan 02: Image attachment support

---
*Phase: 05-central-support-hub*
*Completed: 2026-01-19*
