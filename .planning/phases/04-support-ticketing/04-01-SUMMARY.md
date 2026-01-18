---
phase: 04-support-ticketing
plan: 01
subsystem: database
tags: [postgresql, rls, tickets, supabase, migrations]

# Dependency graph
requires:
  - phase: 03-workspace-roles
    provides: private.get_user_role_in_workspace() function for RLS
provides:
  - tickets table with 4-stage workflow schema
  - ticket_comments table for discussions
  - ticket_status_history table for audit trail
  - RLS policies using workspace membership
  - Performance indexes for common queries
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subquery pattern for RLS on joined tables"
    - "CHECK constraints for enum-like columns"

key-files:
  created:
    - supabase/migrations/26_tickets.sql

key-decisions:
  - "Used CHECK constraints instead of PostgreSQL ENUM types for flexibility"
  - "Created update_updated_at_column() function (CREATE OR REPLACE) for reusability"
  - "Added pending_stage CHECK constraint for data integrity"

patterns-established:
  - "Subquery in RLS policy for joined tables: ticket_id IN (SELECT id FROM tickets WHERE ...)"

# Metrics
duration: 1min 24sec
completed: 2026-01-18
---

# Phase 04 Plan 01: Database Schema Summary

**PostgreSQL schema for support ticketing with 3 tables, 6 RLS policies, 8 indexes, and 4-stage workflow constraints**

## Performance

- **Duration:** 1 min 24 sec
- **Started:** 2026-01-18T13:42:48Z
- **Completed:** 2026-01-18T13:44:12Z
- **Tasks:** 3
- **Files created:** 1

## Accomplishments

- Created tickets table with workspace scope, category/priority/stage constraints, and approval flow columns
- Created ticket_comments table for flat timeline discussions
- Created ticket_status_history table for audit trail of stage transitions
- Implemented RLS policies using existing `private.get_user_role_in_workspace()` function
- Added 8 performance indexes covering workspace, requester, assigned, stage, and composite queries
- Added updated_at trigger for automatic timestamp management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tickets migration file** - `92c9589` (feat)
2. **Task 2: Add RLS policies using existing function** - `413d58b` (feat)
3. **Task 3: Add indexes for performance** - `f12fa24` (feat)

## Files Created/Modified

- `supabase/migrations/26_tickets.sql` - Complete database schema for ticketing system

## Decisions Made

1. **CHECK constraints over ENUM types** - Used CHECK constraints for category, priority, and stage columns instead of PostgreSQL ENUM types. More flexible for future changes without requiring migrations to add new values.

2. **CREATE OR REPLACE for trigger function** - The `update_updated_at_column()` function uses CREATE OR REPLACE to be safely reusable if already defined by another migration.

3. **Subquery pattern for joined table RLS** - For ticket_comments and ticket_status_history, used `ticket_id IN (SELECT id FROM tickets WHERE ...)` pattern to verify workspace access through the tickets table, following the approach recommended in 04-RESEARCH.md.

4. **Additional CHECK on pending_stage** - Added constraint to ensure pending_stage can only contain valid stage values (or be NULL), preventing invalid approval requests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Manual step required:** Run the migration on Supabase.

Option 1 - Via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Paste contents of `supabase/migrations/26_tickets.sql`
3. Click "Run"

Option 2 - Via Supabase CLI:
```bash
supabase db push
```

## Next Phase Readiness

- Schema ready for API endpoints (04-02-PLAN.md)
- RLS policies in place for workspace-based access control
- Tables ready for TypeScript types generation

---
*Phase: 04-support-ticketing*
*Completed: 2026-01-18*
