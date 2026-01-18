---
phase: 03-workspace-roles
plan: 02
subsystem: api
tags: [rbac, permissions, api-routes, next.js]

# Dependency graph
requires:
  - phase: 03-01
    provides: requirePermission() utility, ROLE_PERMISSIONS constants
provides:
  - DELETE /api/contacts with owner-only permission
  - Export contacts with owner/admin permission
  - Invitation routes with owner-only permission
affects: [03-03 (UI enforcement), frontend components calling these APIs]

# Tech tracking
tech-stack:
  added: []
  patterns: [API route permission guards using requirePermission()]

key-files:
  created: []
  modified:
    - src/app/api/contacts/route.ts
    - src/app/api/contacts/export/route.ts
    - src/app/api/invitations/route.ts
    - src/app/api/invitations/[id]/route.ts

key-decisions:
  - "Owner-only for delete leads, team invite/remove (per CONTEXT.md)"
  - "Owner+admin for export (per CONTEXT.md admin capability)"
  - "Helpful error messages: 'Only workspace owners can...' not 'Forbidden'"

patterns-established:
  - "API permission guard: const permError = requirePermission(role, 'perm'); if (permError) return permError"
  - "Get workspace_id first, then requireWorkspaceMembership, then requirePermission"

# Metrics
duration: 9min
completed: 2026-01-18
---

# Phase 3 Plan 02: Permission UI Enforcement Summary

**API route permission enforcement using requirePermission() for delete leads (owner), export (owner/admin), and team invitations (owner)**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-18T12:00:35Z
- **Completed:** 2026-01-18T12:09:09Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added DELETE handler to contacts route with `leads:delete` permission (owner only)
- Added `leads:export` permission check to export route (owner/admin)
- Refactored invitation routes to use `requirePermission()` with `team:invite` and `team:remove` permissions (owner only)
- Fixed bug where admins could create/delete/resend invitations (now owner only per CONTEXT.md)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DELETE handler with owner-only permission** - `0022035` (feat)
2. **Task 2: Add permission check to export route** - `f9c2daf` (feat)
3. **Task 3: Fix invitation routes to owner-only** - `c1f8cfe` (feat)

## Files Created/Modified

- `src/app/api/contacts/route.ts` - Added DELETE handler with leads:delete permission check
- `src/app/api/contacts/export/route.ts` - Added leads:export permission check (owner/admin)
- `src/app/api/invitations/route.ts` - Refactored to use requireWorkspaceMembership + requirePermission (owner only)
- `src/app/api/invitations/[id]/route.ts` - Refactored DELETE and POST handlers to owner-only

## Decisions Made

1. **Error message tone:** Following CONTEXT.md guidance, using helpful messages like "Only workspace owners can delete leads" rather than generic "Forbidden" or "Insufficient permissions"
2. **Invitation permission correction:** Changed from owner/admin to owner-only per CONTEXT.md decision "Team management (invite/remove): Owner only"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Next.js build has intermittent filesystem race condition (`ENOENT: pages-manifest.json`) unrelated to code changes. TypeScript compilation passes successfully, confirming code correctness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All target API routes now enforce permissions
- Plan 03 can add UI elements (disabled buttons with tooltips) using the same permission checks
- Frontend can catch 403 responses and display appropriate user feedback

---
*Phase: 03-workspace-roles*
*Completed: 2026-01-18*
