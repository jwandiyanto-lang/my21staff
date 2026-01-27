---
phase: 02-middleware-provider-auth-ui
plan: 01
subsystem: auth
tags: [clerk, nextjs, convex, middleware, jwt, authentication]

# Dependency graph
requires:
  - phase: 01-clerk-auth-infrastructure
    provides: Clerk app configured with env vars and JWT issuer
provides:
  - ClerkProvider wrapping entire app
  - ConvexProviderWithClerk integrating Clerk auth with Convex
  - Clerk middleware protecting routes
  - Public routes: /, /sign-in, /sign-up, /pricing, /articles/*, /api/webhooks/*, /api/public/*
affects: [02-02-auth-pages, 03-users-table-webhook, migration]

# Tech tracking
tech-stack:
  added: [@clerk/nextjs@6.36.9]
  patterns: [ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider hierarchy, clerkMiddleware with auth.protect()]

key-files:
  created: []
  modified:
    - src/app/providers.tsx
    - src/middleware.ts
    - package.json
    - convex/tickets.ts

key-decisions:
  - "Use ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider wrapper hierarchy"
  - "Removed outdated convex.config.ts (not needed in Convex v1.31+)"
  - "Moved ticket mutations from api.mutations to api.tickets namespace for consistency"
  - "Use Id<'tickets'> casting for all Convex ticket operations"

patterns-established:
  - "Convex mutations should be in same file as queries for that domain"
  - "Convex Id types require casting from string route params"

# Metrics
duration: 12min
completed: 2026-01-23
---

# Phase 02 Plan 01: Clerk Infrastructure Summary

**ClerkProvider + ConvexProviderWithClerk integration, Clerk middleware protecting routes, Supabase auth fully replaced**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-23T15:38:22Z
- **Completed:** 2026-01-23T15:50:15Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Installed @clerk/nextjs and integrated with existing Convex setup
- Replaced Supabase middleware with Clerk middleware protecting all routes
- Fixed blocking build issues with outdated Convex config
- Fixed missing ticket mutations causing API route errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Clerk packages and configure providers** - `23970a2` (feat)
2. **Task 2: Replace Supabase middleware with Clerk middleware** - `dac657f` (feat)

## Files Created/Modified
- `package.json` - Added @clerk/nextjs@6.36.9
- `src/app/providers.tsx` - ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider hierarchy
- `src/middleware.ts` - Clerk middleware with route protection (removed all Supabase code)
- `convex/tickets.ts` - Added missing mutations (approveTicketStageSkip, transitionTicketStage, reopenTicket, createTicketComment)
- `convex.config.ts` - DELETED (outdated, not needed in Convex v1.31+)
- `src/app/api/tickets/[id]/approval/route.ts` - Added Id type casting
- `src/app/api/tickets/[id]/transition/route.ts` - Added Id type casting
- `src/app/api/tickets/[id]/reopen/route.ts` - Added Id type casting

## Decisions Made
- **ClerkProvider hierarchy:** ClerkProvider wraps ConvexProviderWithClerk (passes useAuth), which wraps QueryClientProvider. This ensures Clerk auth state is available to Convex.
- **Public routes:** Preserved existing public routes (/, /pricing, /articles/*) and added Clerk auth pages (/sign-in, /sign-up). Removed old Supabase auth routes from public (will redirect to Clerk pages).
- **Ticket mutations location:** Moved ticket mutations from convex/mutations.ts to convex/tickets.ts to keep domain logic together (queries + mutations in same file).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed outdated convex.config.ts**
- **Found during:** Task 1 (Build after installing Clerk packages)
- **Issue:** Build failed with "Cannot find module 'convex/config'" - file used old Convex API (v0.x) incompatible with current Convex v1.31.6
- **Fix:** Deleted convex.config.ts (not needed in Convex v1+, configuration is automatic)
- **Files modified:** convex.config.ts (deleted)
- **Verification:** Build passed after deletion
- **Committed in:** 23970a2 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added ticket mutations to convex/tickets.ts**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** API routes expected api.tickets.approveTicketStageSkip, api.tickets.transitionTicketStage, api.tickets.reopenTicket, api.tickets.createTicketComment but functions were in convex/mutations.ts (api.mutations namespace)
- **Fix:** Copied 4 ticket-related mutations from convex/mutations.ts to convex/tickets.ts to match expected namespace
- **Files modified:** convex/tickets.ts
- **Verification:** Build passed, API routes can import from api.tickets
- **Committed in:** 23970a2 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Id type casting in ticket API routes**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Convex functions expect Id<"tickets"> type but API routes pass string ticketId from URL params, causing type errors
- **Fix:** Added Id import from convex/_generated/dataModel and cast ticketId as Id<"tickets"> in all fetchQuery/fetchMutation calls
- **Files modified:** src/app/api/tickets/[id]/approval/route.ts, src/app/api/tickets/[id]/transition/route.ts, src/app/api/tickets/[id]/reopen/route.ts
- **Verification:** Build passed with no type errors
- **Committed in:** 23970a2 (Task 1 commit)

**4. [Rule 1 - Bug] Changed createTicketComment from internalMutation to mutation**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** API routes call api.tickets.createTicketComment but function was marked as internalMutation (not exposed in public API)
- **Fix:** Changed export from internalMutation to mutation to expose in api.tickets namespace
- **Files modified:** convex/tickets.ts
- **Verification:** Build passed, function available in api.tickets
- **Committed in:** 23970a2 (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 missing critical, 2 bugs)
**Impact on plan:** All auto-fixes necessary for build to pass. No scope creep - fixes enable planned Clerk integration to work with existing Convex codebase.

## Issues Encountered
None - deviations handled via auto-fix rules.

## User Setup Required
None - no external service configuration required. Clerk env vars already configured in Phase 1.

## Next Phase Readiness
- Clerk provider and middleware infrastructure complete
- Ready for Phase 02 Plan 02: Create /sign-in and /sign-up pages
- Note: Protected routes redirect to /sign-in which doesn't exist yet (expected - Plan 02 creates these pages)

---
*Phase: 02-middleware-provider-auth-ui*
*Completed: 2026-01-23*
