---
phase: 03-workspace-roles
plan: 01
subsystem: auth
tags: [rbac, permissions, rls, typescript, supabase]

# Dependency graph
requires:
  - phase: 02-email-system
    provides: workspace authentication via requireWorkspaceMembership()
provides:
  - Permission types (WorkspaceRole, Permission)
  - ROLE_PERMISSIONS mapping (owner/admin/member capabilities)
  - hasPermission() utility for permission checks
  - requirePermission() API guard returning 403
  - Extended requireWorkspaceMembership() returning role
  - RLS policy migration for member lead visibility
affects: [03-02 (UI enforcement), 03-03 (team management), all API routes needing permission checks]

# Tech tracking
tech-stack:
  added: []
  patterns: [role-based permission checks, SECURITY DEFINER RLS functions]

key-files:
  created:
    - src/lib/permissions/types.ts
    - src/lib/permissions/constants.ts
    - src/lib/permissions/check.ts
    - src/lib/permissions/index.ts
    - supabase/migrations/25_member_lead_visibility.sql
  modified:
    - src/lib/auth/workspace-auth.ts

key-decisions:
  - "Permission utilities in src/lib/permissions/ (not inline)"
  - "SECURITY DEFINER function in private schema for RLS performance"
  - "requirePermission returns NextResponse|null for API route guards"

patterns-established:
  - "Permission check pattern: hasPermission(role, 'permission:action')"
  - "API guard pattern: const err = requirePermission(role, perm); if (err) return err"
  - "Auth result pattern: { user, workspaceId, role }"

# Metrics
duration: 12min
completed: 2026-01-18
---

# Phase 3 Plan 01: Permission Infrastructure Summary

**Permission types, hasPermission() utility, extended requireWorkspaceMembership() with role, and RLS policy for member lead visibility**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-18T11:53:40Z
- **Completed:** 2026-01-18T12:05:28Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Created permission type system (WorkspaceRole, Permission types)
- Built ROLE_PERMISSIONS mapping per CONTEXT.md decisions (owner=all, admin=view_all+export, member=none)
- Implemented hasPermission() and requirePermission() utilities for API route guards
- Extended requireWorkspaceMembership() to return user role alongside membership
- Created RLS policy migration for member-only lead visibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create permission types and constants** - `04ee67d` (feat)
2. **Task 2: Create hasPermission and requirePermission utilities** - `9cb7f05` (feat)
3. **Task 3: Extend requireWorkspaceMembership to return role** - `ea7c773` (feat)
4. **Task 4: Create RLS policy for member lead visibility** - `52fde8f` (feat)

## Files Created/Modified

- `src/lib/permissions/types.ts` - WorkspaceRole and Permission type definitions
- `src/lib/permissions/constants.ts` - ROLE_PERMISSIONS mapping (owner/admin/member capabilities)
- `src/lib/permissions/check.ts` - hasPermission() and requirePermission() utilities
- `src/lib/permissions/index.ts` - Barrel exports for permissions module
- `src/lib/auth/workspace-auth.ts` - Extended AuthResult with role field
- `supabase/migrations/25_member_lead_visibility.sql` - RLS policy for member lead filtering

## Decisions Made

1. **Permission module structure:** Created dedicated `src/lib/permissions/` directory with types, constants, check utilities, and barrel export for clean imports
2. **SECURITY DEFINER for RLS:** Used private schema function with SECURITY DEFINER to avoid RLS recursion and improve query performance (per Supabase best practices)
3. **requirePermission returns NextResponse|null:** Enables clean API route guards with `const err = requirePermission(...); if (err) return err`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Supabase CLI `db push` attempted to run all migrations (including already-applied ones) - migrations in this project are applied directly via Supabase dashboard SQL editor rather than CLI

## User Setup Required

**RLS migration requires manual application.** Apply via Supabase dashboard SQL editor:

1. Go to Supabase Dashboard > SQL Editor
2. Paste contents of `supabase/migrations/25_member_lead_visibility.sql`
3. Run the migration
4. Verify with test users: owner/admin should see all contacts, member should only see assigned contacts

## Next Phase Readiness

- Permission infrastructure complete and ready for use
- Plan 02 can implement UI enforcement (disabled buttons with tooltips)
- Plan 03 can add team management UI using requirePermission() guards
- All API routes can now use `const { role } = authResult` and `requirePermission(role, 'permission')` pattern

---
*Phase: 03-workspace-roles*
*Completed: 2026-01-18*
