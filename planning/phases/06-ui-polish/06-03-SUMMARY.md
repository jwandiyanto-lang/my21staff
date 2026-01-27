---
phase: 06-ui-polish
plan: 03
subsystem: ui
tags: [convex, clerk, react, ssr, authentication]

# Dependency graph
requires:
  - phase: 05-lead-flow
    provides: Database and Settings page structure with ARI config
provides:
  - Settings page that loads without SSR auth crashes
  - Client-side AI config fetch with proper Clerk authentication
  - Separation of public (workspace) and auth-protected (AI config) queries
affects: [07-lead-stages, future-dashboard-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server components fetch only public data (no auth required)"
    - "Client components fetch auth-protected data via useQuery with Clerk context"
    - "Dev mode checks for offline testing without Convex/Clerk"

key-files:
  created: []
  modified:
    - src/app/(dashboard)/[workspace]/settings/page.tsx
    - src/app/(dashboard)/[workspace]/settings/settings-client.tsx

key-decisions:
  - "Moved AI config query from server to client component to fix auth context availability"
  - "Server component only fetches workspace data (no auth check required)"
  - "Client component fetches AI config with Clerk auth context via ClerkProvider"

patterns-established:
  - "SSR components should avoid auth-protected Convex queries"
  - "Client components are the proper place for queries requiring getAuthUserId"

# Metrics
duration: 2min
completed: 2026-01-27
---

# Phase 06 Plan 03: Settings Page SSR Fix Summary

**Separated auth-protected AI config fetch to client-side, eliminating Settings page SSR crashes caused by missing Clerk context**

## Performance

- **Duration:** 2 minutes 9 seconds
- **Started:** 2026-01-27T06:30:15Z
- **Completed:** 2026-01-27T06:32:24Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed Settings page SSR crash caused by auth-protected query without Clerk context
- Moved AI config fetch from server component (SSR) to client component (browser)
- Settings page now loads successfully in both localhost and production
- All settings sections (General, Lead Stages, ARI) display correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Move AI config fetch from server to client component** - `628f6c8` (fix)

## Files Created/Modified
- `src/app/(dashboard)/[workspace]/settings/page.tsx` - Server component now only fetches workspace data (no auth required)
- `src/app/(dashboard)/[workspace]/settings/settings-client.tsx` - Client component fetches AI config with Clerk auth context

## Decisions Made

**1. Server vs Client Query Separation**
- Rationale: Server components execute during SSR without Clerk auth context. Auth-protected Convex queries (using `getAuthUserId`) fail during SSR.
- Decision: Server component fetches only public workspace data. Client component fetches auth-protected AI config where ClerkProvider is available.
- Impact: Settings page loads successfully without SSR exceptions.

**2. Import Path Correction**
- Issue: Initial implementation used `@/convex/_generated/api` which failed to resolve.
- Fix: Corrected to `convex/_generated/api` following project convention.
- Verification: Dev server compiled successfully, page loaded.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Import path resolution**
- Problem: First attempt used incorrect import alias `@/convex/_generated/api`
- Solution: Corrected to `convex/_generated/api` (without alias)
- Time cost: 30 seconds to identify and fix

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Settings page crash fixed, ready for Phase 06 continuation
- Lead stages feature can now be safely implemented without SSR auth concerns
- Pattern established for future pages: server components fetch public data, client components fetch auth-protected data

---
*Phase: 06-ui-polish*
*Completed: 2026-01-27*
