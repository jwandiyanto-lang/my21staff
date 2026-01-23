---
phase: 04-user-migration-organizations
plan: 05
subsystem: ui
tags: [clerk, organizations, team-management, react]

# Dependency graph
requires:
  - phase: 04-04
    provides: Organization webhooks syncing Clerk to Convex
provides:
  - Team page with Clerk OrganizationProfile
  - Organization hooks for React components
  - Invitation flow via Clerk UI
affects: [05-data-migration, 07-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - OrganizationProfile component for team management
    - useOrganization hook with TanStack Query wrapper

key-files:
  created:
    - src/lib/queries/use-organization.ts
  modified:
    - src/app/(dashboard)/[workspace]/team/page.tsx

key-decisions:
  - "Replace custom team management UI with Clerk OrganizationProfile"
  - "Hash-based routing for OrganizationProfile navigation"
  - "Hide Clerk navbar since app has its own navigation"

patterns-established:
  - "Clerk OrganizationProfile with customized appearance for embedded use"
  - "useOrganizationMembers with TanStack Query for caching"

# Metrics
duration: ~8min
completed: 2026-01-23
---

# Phase 4 Plan 5: Team Management UI Summary

**Clerk OrganizationProfile replaces custom team management with built-in invitations, role management, and member list**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-01-23
- **Completed:** 2026-01-23
- **Tasks:** 2/2 code tasks complete (Task 3 verification deferred)
- **Files modified:** 2

## Accomplishments
- Created organization hooks wrapping Clerk with TanStack Query caching
- Replaced custom team page with Clerk's OrganizationProfile component
- Indonesian UI labels ("Manajemen Tim", "Anggota Tim", "Undang anggota baru")
- Graceful handling for workspaces without Clerk organization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create organization hook** - `8664595` (feat)
2. **Task 2: Update team page with Clerk OrganizationProfile** - `4fa5fc3` (feat)
3. **Task 3: Verify team management flow** - DEFERRED (will test at end of phase)

Additional fix during session:
- **Fix Kapso webhook reference** - `400b58e` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/lib/queries/use-organization.ts` - Organization hooks with TanStack Query
- `src/app/(dashboard)/[workspace]/team/page.tsx` - Team page with Clerk OrganizationProfile

## Decisions Made
- **Clerk OrganizationProfile over custom UI:** Provides invitations, role management, pending invitations out-of-the-box
- **Hash-based routing:** Uses `routing="hash"` for OrganizationProfile internal navigation
- **Hidden Clerk navbar:** App has its own navigation, Clerk's navbar hidden via appearance API
- **Graceful no-org state:** Shows helpful message when workspace isn't connected to Clerk org

## Deviations from Plan

None - plan executed as specified. Task 3 deferred per user instruction.

## Issues Encountered

None - implementation was straightforward.

## User Setup Required

**Pending verification (deferred):**
- Task 3 manual verification will be done at end of Phase 4 along with webhook configuration testing

## Next Phase Readiness

**Phase 4 code complete:**
- All 5 plans have code implementation done
- Pending: Manual verification of team page + webhook configuration in Clerk Dashboard
- Ready for verification pass before proceeding to Phase 5

**To verify Phase 4:**
1. Start dev server: `npm run dev`
2. Test team page at `/[workspace]/team`
3. Configure organization webhooks in Clerk Dashboard (see STATE.md)
4. Test webhook events flow

---
*Phase: 04-user-migration-organizations*
*Completed: 2026-01-23*
