---
phase: 04-user-migration-organizations
plan: 04
subsystem: database, api
tags: [clerk, convex, organizations, webhooks, membership]

# Dependency graph
requires:
  - phase: 04-02
    provides: Organizations migrated to Clerk with public_metadata.convexWorkspaceId
  - phase: 04-03
    provides: Core tables ready with Clerk user IDs
  - phase: 04-03b
    provides: Ticket tables ready with Clerk user IDs
  - phase: 03-02
    provides: Clerk webhook handler with svix verification
provides:
  - Organization webhook handlers (create/update/delete)
  - Organization membership sync via webhooks
  - Organizations and organizationMembers Convex tables
affects: [04-05, 04-06, production-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clerk organization webhooks for membership sync"
    - "Idempotent mutations for webhook retry handling"
    - "Organization-workspace linking via public_metadata"

key-files:
  created:
    - convex/organizations.ts
  modified:
    - convex/schema.ts
    - convex/http.ts

key-decisions:
  - "Deferred Clerk Dashboard webhook config to end of phase"
  - "Organizations table links to workspaces via optional workspace_id"
  - "Member role stored as string to match Clerk format (org:admin, org:member)"

patterns-established:
  - "Organization mutations create on update if missing (handles webhook ordering)"
  - "Delete organization cascades to delete all members first"

# Metrics
duration: ~8min
completed: 2026-01-23
---

# Phase 4 Plan 4: Organization Webhooks Summary

**Clerk organization webhook handlers syncing organizations and memberships to Convex tables**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-01-23
- **Completed:** 2026-01-23
- **Tasks:** 2/3 (Task 3 deferred)
- **Files modified:** 3

## Accomplishments

- Added organizations and organizationMembers tables to Convex schema
- Created idempotent CRUD mutations for organization webhook handling
- Extended Clerk webhook handler for 6 organization events

## Task Commits

Each task was committed atomically:

1. **Task 1: Add organization table and mutations** - `890957f` (feat)
2. **Task 2: Extend webhook handler for organization events** - `4f40afc` (feat)
3. **Task 3: Configure organization webhooks in Clerk** - DEFERRED (Dashboard config pending)

**Plan metadata:** (this commit)

## Files Created/Modified

- `convex/organizations.ts` - Organization CRUD mutations (createOrganization, updateOrganization, deleteOrganization, addMember, updateMemberRole, removeMember)
- `convex/schema.ts` - Added organizations and organizationMembers tables with indexes
- `convex/http.ts` - Extended webhook handler for organization.*, organizationMembership.* events

## Decisions Made

1. **Deferred webhook configuration** - User decision to configure Clerk Dashboard webhooks at end of phase rather than blocking now
2. **Optional workspace_id** - Organizations may exist without workspace link (for new orgs created in Clerk directly)
3. **String role format** - Store Clerk's role format directly (org:admin, org:member) rather than normalizing

## Deviations from Plan

None - plan executed exactly as written (Task 3 deferred per user request).

## Issues Encountered

None

## User Setup Required

**Deferred to end of phase.** The following Clerk Dashboard configuration is pending:

1. Go to Clerk Dashboard -> Webhooks
2. Edit existing webhook (pleasant-antelope-109.convex.site/webhook/clerk)
3. Add organization events:
   - organization.created
   - organization.updated
   - organization.deleted
   - organizationMembership.created
   - organizationMembership.updated
   - organizationMembership.deleted
4. Save changes

**Verification after config:** Add a test member to an organization in Clerk, check Convex webhookAudit table for the event.

## Next Phase Readiness

- Organization webhook handlers ready and deployed
- Pending: Clerk Dashboard webhook configuration (deferred)
- Can proceed to 04-05 (Data Migration) - organization sync will work once webhooks configured
- Full organization feature testing should wait until webhook config complete

---
*Phase: 04-user-migration-organizations*
*Completed: 2026-01-23*
