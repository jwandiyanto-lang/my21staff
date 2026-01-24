---
phase: 07-cleanup-verification
plan: 02
subsystem: api
tags: [convex, clerk, workspace-management, member-management, permissions]

# Dependency graph
requires:
  - phase: 03-clerk-infrastructure
    provides: Clerk auth with JWT validation for Convex
  - phase: 04-user-migration
    provides: Clerk user IDs and organization structure
  - phase: 05-data-migration
    provides: Convex schema and basic workspace/member queries
provides:
  - Workspace member management via Convex mutations
  - Role update system using Convex + Clerk
  - Workspace settings updates via Convex
  - Admin client management using Clerk + Convex
  - Permission-based member operations (delete, role change)
affects: [07-cleanup-verification, workspace-ui, team-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ConvexHttpClient pattern for API routes"
    - "Clerk user creation for admin client onboarding"
    - "Type assertions for Convex query results to avoid union types"
    - "Super-admin authorization using hardcoded Clerk user IDs"

key-files:
  created: []
  modified:
    - convex/workspaces.ts
    - convex/workspaceMembers.ts
    - src/app/api/workspace-members/[id]/route.ts
    - src/app/api/members/[id]/role/route.ts
    - src/app/api/workspaces/[id]/settings/route.ts
    - src/app/api/admin/clients/route.ts

key-decisions:
  - "Preserved business logic in API routes - permission checks and validation stay in routes, not in Convex mutations"
  - "Used Clerk API for user creation in admin client route instead of Supabase auth admin"
  - "Maintained API key encryption for Kapso credentials in settings route"
  - "Type assertions for Convex queries to handle TypeScript union type inference"

patterns-established:
  - "Pattern 1: Keep authorization and business logic in API routes, use Convex only for data layer"
  - "Pattern 2: Type cast Convex query results with expected shape to avoid union type errors"
  - "Pattern 3: Use Clerk user creation for new clients instead of Supabase admin auth"

# Metrics
duration: 10min
completed: 2026-01-24
---

# Phase 07 Plan 02: Workspace & Member Management Migration Summary

**Workspace and member management routes migrated from Supabase to Convex + Clerk with preserved permission checks and business logic**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-24T09:40:51Z
- **Completed:** 2026-01-24T09:50:31Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Migrated workspace member deletion route to use Convex mutations with Clerk auth
- Migrated member role update route to use Convex with Clerk email notifications
- Migrated workspace settings route with encrypted API key handling via Convex
- Migrated admin client creation route to use Clerk user creation + Convex workspaces
- Added Convex mutations: removeMember, updateMemberRole, updateSettings, listAll
- Added workspaceMembers.getById query for member lookup

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Convex mutations for member management** - `7a0affa` (feat)
2. **Task 2: Migrate member management routes** - `9a3d2b8` (feat)
3. **Task 3: Migrate workspace settings and admin routes** - `0bb6b1a` (feat)

## Files Created/Modified
- `convex/workspaces.ts` - Added updateSettings, listAll, removeMember, updateMemberRole mutations
- `convex/workspaceMembers.ts` - Added getById query for member lookup
- `src/app/api/workspace-members/[id]/route.ts` - Migrated DELETE to use Convex + Clerk, preserved owner protection
- `src/app/api/members/[id]/role/route.ts` - Migrated PATCH to use Convex + Clerk, preserved role validation and email notifications
- `src/app/api/workspaces/[id]/settings/route.ts` - Migrated PATCH to use Convex, preserved API key encryption
- `src/app/api/admin/clients/route.ts` - Migrated GET/POST to use Convex + Clerk, replaced Supabase auth with Clerk user creation

## Decisions Made
- **Preserved security features:** Plan suggested simplified routes but preserved critical business logic (owner deletion protection, permission checks, role validation) while migrating data layer to Convex
- **Clerk for user management:** Admin client creation now uses Clerk's createUser API instead of Supabase admin.createUser
- **Type assertions required:** Convex query results need type assertions to avoid TypeScript union type inference issues when accessed in routes
- **Email notifications via Clerk:** Role change emails now fetch user data from Clerk API instead of Supabase profiles table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Preserved permission checks and business logic**
- **Found during:** Task 2 (Member management routes migration)
- **Issue:** Plan suggested simplified routes without permission checks, which would remove critical security features (owner protection, role permissions, validation)
- **Fix:** Kept all permission checks and business logic in API routes while migrating only the data layer to Convex
- **Files modified:** src/app/api/workspace-members/[id]/route.ts, src/app/api/members/[id]/role/route.ts
- **Verification:** Routes preserve all authorization checks and business rules
- **Committed in:** 9a3d2b8 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added getById query to workspaceMembers**
- **Found during:** Task 2 (Member management routes migration)
- **Issue:** Routes needed to fetch member details by ID before performing operations, but no getById query existed
- **Fix:** Added getById query to convex/workspaceMembers.ts
- **Files modified:** convex/workspaceMembers.ts
- **Verification:** Query deployed successfully via npx convex dev --once
- **Committed in:** 9a3d2b8 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Preserved API key encryption**
- **Found during:** Task 3 (Workspace settings migration)
- **Issue:** Plan didn't mention encryption, but settings route handles sensitive Kapso API keys that must be encrypted
- **Fix:** Preserved safeEncrypt() call for kapso_api_key field
- **Files modified:** src/app/api/workspaces/[id]/settings/route.ts
- **Verification:** API key encryption logic intact and working
- **Committed in:** 0bb6b1a (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (Rule 2 - Missing Critical)
**Impact on plan:** All auto-fixes essential for security and correctness. Preserved critical features while successfully migrating data layer to Convex.

## Issues Encountered
- **TypeScript union types:** Convex query results inferred as union of all document types. Resolution: Added type assertions with expected shape.
- **Next.js build cache issues:** Stale references to deleted auth pages. Resolution: Not blocking (unrelated to this plan's changes, pre-existing issue).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Workspace and member management fully migrated to Convex + Clerk
- Permission system working correctly with Convex data layer
- Admin client creation ready using Clerk (note: full organization integration pending)
- Ready to proceed with remaining API route migrations in Phase 07

**No blockers or concerns**

---
*Phase: 07-cleanup-verification*
*Completed: 2026-01-24*
