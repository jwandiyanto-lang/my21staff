---
phase: 08-performance-optimization
plan: 02
subsystem: api
tags: [tanstack-query, react-query, caching, optimistic-updates, real-time]

# Dependency graph
requires:
  - phase: 08-01
    provides: TanStack Query provider and infrastructure
provides:
  - useMessages hook with real-time cache updates
  - useContacts hook with pagination and mutations
  - Stale-while-revalidate pattern for core pages
affects: [future-features, inbox-enhancements, database-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns: [useQuery for data fetching, useMutation with optimistic updates, queryClient cache manipulation]

key-files:
  created:
    - src/lib/queries/use-messages.ts
    - src/lib/queries/use-contacts.ts
  modified:
    - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
    - src/app/(dashboard)/[workspace]/database/database-client.tsx

key-decisions:
  - "Messages stale time: 10 seconds (real-time critical, but cache briefly for conversation switching)"
  - "Contacts stale time: 2 minutes (leads change less frequently, longer cache)"
  - "Real-time subscription in useMessages hook (not component) for separation of concerns"
  - "Optimistic mutations for all contact updates (status, assignee, tags, delete)"
  - "PlaceholderData for pagination (keep previous page while loading next)"

patterns-established:
  - "Query hooks in src/lib/queries/ directory"
  - "useQuery for data fetching with staleTime configuration"
  - "useMutation with onMutate for optimistic updates, context for rollback"
  - "queryClient.setQueryData for direct cache manipulation"
  - "Real-time subscriptions integrated with query cache"

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 8 Plan 2: Data Fetching Migration Summary

**Migrated Inbox and Database pages to TanStack Query with stale-while-revalidate caching and optimistic updates**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T16:12:36Z
- **Completed:** 2026-01-19T16:17:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created useMessages hook with 10-second stale time and integrated real-time subscription
- Created useContacts hook with 2-minute stale time and pagination support
- Migrated inbox-client.tsx from manual state management to TanStack Query
- Migrated database-client.tsx from manual fetch calls to TanStack Query mutations
- All contact mutations (status, assignee, tags, delete) now optimistic with rollback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useMessages hook and migrate inbox** - `32ea108` (feat)
2. **Task 2: Create useContacts hook and migrate database** - `40a93d9` (feat)

## Files Created/Modified

- `src/lib/queries/use-messages.ts` - Messages hook with real-time cache updates
- `src/lib/queries/use-contacts.ts` - Contacts hook with pagination and mutations
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Migrated to useMessages
- `src/app/(dashboard)/[workspace]/database/database-client.tsx` - Migrated to useContacts

## Decisions Made

1. **Stale times differentiated by use case:** Messages at 10s (real-time critical), contacts at 2min (less volatile)
2. **Real-time in hook:** Subscription logic moved inside useMessages hook for cleaner component code
3. **Optimistic helper pattern:** Created reusable helpers (addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage) for cache manipulation
4. **PlaceholderData for pagination:** Keeps previous page visible while loading next page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Core data-fetching pages (Inbox, Database) now use TanStack Query
- Caching provides instant navigation feel when revisiting pages
- Ready for Plan 3 (Loading States) which will add skeleton loaders
- Pattern established for migrating other pages in future

---
*Phase: 08-performance-optimization*
*Completed: 2026-01-19*
