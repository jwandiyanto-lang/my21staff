---
phase: 01-database-inbox-overhaul
plan: 05
subsystem: ui
tags: [typing-indicator, supabase-broadcast, real-time, inbox, websocket]

# Dependency graph
requires:
  - phase: 01-04
    provides: Inbox filters and real-time conversation subscription
provides:
  - useTypingIndicator hook with Supabase Broadcast
  - Typing indicator display in conversation list and message thread
  - Idempotent real-time updates preventing chat disappearance (INBOX-07)
  - Server-side broadcastTypingFromServer for webhook integration
affects: [02-ari-core, kapso-webhook]

# Tech tracking
tech-stack:
  added: []
  patterns: [Supabase Broadcast for ephemeral state, Idempotent cache updates with ID deduplication]

key-files:
  created:
    - src/lib/queries/use-typing-indicator.ts
  modified:
    - src/app/(dashboard)/[workspace]/inbox/conversation-list.tsx
    - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
    - src/app/(dashboard)/[workspace]/inbox/message-thread.tsx

key-decisions:
  - "Use Supabase Broadcast for typing indicators (ephemeral, no database storage)"
  - "5-second auto-clear timeout for stale typing state"
  - "Idempotent INSERT/UPDATE/DELETE handlers to prevent chat disappearance"
  - "Show typing indicator in both conversation list and message thread header"

patterns-established:
  - "Supabase Broadcast channel naming: typing:{workspaceId}"
  - "Typing event payload: { phone, isTyping }"
  - "Idempotent INSERT: Check if ID already exists before adding to state"

# Metrics
duration: 4min
completed: 2026-01-20
---

# Phase 01 Plan 05: Typing Indicators & Real-time Sync Summary

**Supabase Broadcast-based typing indicators with animated dots, plus idempotent real-time updates preventing chat disappearance (INBOX-07)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-20T08:37:50Z
- **Completed:** 2026-01-20T08:41:19Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Created useTypingIndicator hook using Supabase Broadcast for ephemeral typing state
- Added animated typing indicator (bouncing dots + "typing...") to conversation list
- Added typing indicator display in message thread header
- Implemented idempotent INSERT handling with ID deduplication to prevent duplicates
- Added DELETE event handler for proper conversation removal
- Created server-side broadcastTypingFromServer for future webhook integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create typing indicator hook** - `9fde429` (feat)
2. **Task 2: Add typing indicator to conversation list** - `d0aeb88` (feat)
3. **Task 3: Integrate typing indicators and improve real-time sync** - `97a70da` (feat)

## Files Created/Modified
- `src/lib/queries/use-typing-indicator.ts` - Hook with Supabase Broadcast subscription, 5-second auto-clear, isContactTyping helper
- `src/app/(dashboard)/[workspace]/inbox/conversation-list.tsx` - Accept typingContacts prop, show animated typing indicator
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Use typing hook, pass to components, idempotent real-time handlers
- `src/app/(dashboard)/[workspace]/inbox/message-thread.tsx` - Accept isContactTyping prop, show in header

## Decisions Made
- Used Supabase Broadcast (not database) for typing indicators - ephemeral state doesn't need persistence
- 5-second timeout matches WhatsApp-like UX where typing clears after brief inactivity
- Inline CSS animation delays for bouncing dots (0ms, 150ms, 300ms) - simpler than global CSS
- Added DELETE handler to properly handle conversation removal events

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no database migrations or external service configuration required.

## Next Phase Readiness
- Typing indicators ready for integration with Kapso webhook (broadcastTypingFromServer available)
- Real-time sync is now more robust with idempotent updates
- Phase 01 (Database Schema & Inbox Overhaul) is now complete
- Ready for Phase 02 (ARI Core) which will add AI conversation functionality

---
*Phase: 01-database-inbox-overhaul*
*Completed: 2026-01-20*
