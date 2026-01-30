---
phase: 08-performance-optimization
plan: 05
subsystem: ui
tags: [react, optimistic-updates, tanstack-query, messaging]

# Dependency graph
requires:
  - phase: 08-04
    provides: TanStack Query message caching and optimistic update helpers
provides:
  - Correct optimistic rollback regardless of conversation context switching
affects: [inbox, messaging]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pass context IDs as parameters to async callbacks, not via closures"
    - "Capture context at action time, not at handler time"

key-files:
  created: []
  modified:
    - "src/app/(dashboard)/[workspace]/inbox/message-input.tsx"

key-decisions:
  - "Pass conversationId explicitly to onMessageError instead of relying on closure"

patterns-established:
  - "Async callback parameters: Capture IDs at action initiation, not in handler closures"

# Metrics
duration: 9min
completed: 2026-01-20
---

# Phase 8 Plan 5: Optimistic Rollback Fix Summary

**Fix optimistic message rollback to target correct conversation regardless of user navigation during API call**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-20T02:48:26Z
- **Completed:** 2026-01-20T02:57:25Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed UAT gap 3: Failed message sends now correctly rolled back from UI
- Updated onMessageError callback signature to accept conversationId parameter
- Ensured rollback targets the conversation where message was sent, not currently selected
- Removed closure dependency on selectedConversation in error handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Update onMessageError signature and implementation** - `e9537e4` (fix)

## Files Created/Modified
- `src/app/(dashboard)/[workspace]/inbox/message-input.tsx` - Updated onMessageError interface and call site to pass conversationId

## Decisions Made
- Pass conversationId explicitly from MessageInput at send time rather than relying on closure - this ensures the error handler always has the correct conversation context regardless of what conversation the user navigates to during the API call

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Build initially failed due to a pre-existing TypeScript error in inbox page.tsx (missing required props for InboxClient), but this was automatically resolved by a linter that had already made changes to refactor InboxClient to use TanStack Query hooks internally. The inbox-client.tsx handleMessageError function was already updated in a prior commit (08-04) to accept the new signature.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 UAT gap closure plans (08-03, 08-04, 08-05) complete
- Phase 8 Performance Optimization fully verified
- Ready for Phase 9 (Kapso Bot Setup)

---
*Phase: 08-performance-optimization*
*Completed: 2026-01-20*
