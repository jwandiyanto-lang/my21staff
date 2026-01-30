---
phase: 03-users-table-webhook
plan: 01
subsystem: database
tags: [convex, users, clerk, webhook, schema]

# Dependency graph
requires:
  - phase: 02-middleware-provider-auth-ui
    provides: Clerk authentication infrastructure
provides:
  - users table in Convex schema
  - webhookAudit table for debugging
  - User CRUD mutations for Clerk webhook
affects: [03-02 webhook endpoint, user migration, data migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - internalMutation for webhook-only functions
    - Idempotent create operations (check before insert)

key-files:
  created:
    - convex/users.ts
  modified:
    - convex/schema.ts

key-decisions:
  - "Use internalMutation for webhook functions (not publicly accessible)"
  - "Idempotent createUser (handles webhook retries)"
  - "updateUser creates if missing (handles webhook ordering)"

patterns-established:
  - "Internal mutations for webhook handlers: internalMutation vs mutation"
  - "Idempotent webhook operations: check existence before insert"

# Metrics
duration: 2min
completed: 2026-01-23
---

# Phase 03 Plan 01: Users Table and Mutations Summary

**Convex users table with clerk_id index and idempotent CRUD mutations for Clerk webhook sync**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-23T16:49:15Z
- **Completed:** 2026-01-23T16:51:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Users table added to Convex schema with clerk_id and workspace_id fields
- WebhookAudit table for debugging Clerk webhook events
- User CRUD mutations (createUser, updateUser, deleteUser) as internalMutation
- getUserByClerkId query for app to fetch user data
- logWebhookEvent mutation for webhook debugging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add users and webhookAudit tables to schema** - `98de0aa` (feat)
2. **Task 2: Create users.ts with CRUD mutations** - `1216b68` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added users and webhookAudit table definitions with indexes
- `convex/users.ts` - User CRUD mutations and webhook audit logging

## Decisions Made

- **internalMutation for webhook functions:** Mutations called by webhook use internalMutation so they're not exposed in public API. Only getUserByClerkId is a public query.
- **Idempotent createUser:** Checks if user exists before inserting to handle webhook retries gracefully.
- **updateUser creates if missing:** Handles webhook ordering issues where update might arrive before create.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Users table ready for Clerk webhook to populate
- Mutations ready to be called from webhook endpoint (03-02-PLAN.md)
- Schema deployed to Convex dev environment

---
*Phase: 03-users-table-webhook*
*Completed: 2026-01-23*
