---
phase: 04-inbox-send
plan: 01
subsystem: messaging
tags: [kapso, send-message, optimistic-ui, api-route]

# Dependency graph
requires:
  - phase: 03-inbox-core/02
    provides: MessageThread component, MessageInput placeholder, message loading
provides:
  - Kapso client for sending WhatsApp messages
  - POST /api/messages/send API route
  - Functional send button with optimistic UI
  - Error handling with toast notifications
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [Optimistic updates, Dev mode bypass, Type-safe Supabase queries]

key-files:
  created:
    - src/lib/kapso/client.ts
    - src/app/api/messages/send/route.ts
  modified:
    - src/app/(dashboard)/[workspace]/inbox/message-input.tsx
    - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
    - src/app/(dashboard)/[workspace]/inbox/message-thread.tsx
    - src/types/database.ts
    - src/app/(dashboard)/[workspace]/inbox/page.tsx

key-decisions:
  - "Separate Supabase queries instead of joins for better TypeScript inference"
  - "Optimistic messages use metadata.status='sending' for UI feedback"
  - "Dev mode bypasses Kapso API with mock message IDs"
  - "Clock icon + opacity-70 for sending message visual feedback"

patterns-established:
  - "API route auth + workspace membership validation pattern"
  - "Optimistic update with callback-based state management"
  - "isSendingMessage helper for status check in metadata"

issues-created: []

# Metrics
duration: 9min
completed: 2026-01-14
---

# Phase 4 Plan 1: Send Message Integration Summary

**Wire up Send button to Kapso API with optimistic UI for sent messages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-14T13:05:02Z
- **Completed:** 2026-01-14T13:13:56Z
- **Tasks:** 3 + 1 fix
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- Kapso client copied from v1 with sendMessage function
- POST /api/messages/send route with full auth and validation
- MessageInput with optimistic UI (shows message immediately)
- MessageThread shows "Sending..." with clock icon for pending messages
- Error handling with toast notifications
- Dev mode bypass for testing without Kapso credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy Kapso client from v1** - `e99c737` (feat)
2. **Task 2: Create send message API route** - `7aefd57` (feat)
3. **Task 3: Wire send button with optimistic UI** - `d32db62` (feat)
4. **Fix: TypeScript type issues** - `a744d5d` (fix) - Deviation Rule 1

## Files Created/Modified

- `src/lib/kapso/client.ts` - Kapso API client with sendMessage
- `src/app/api/messages/send/route.ts` - Send message API endpoint
- `src/app/(dashboard)/[workspace]/inbox/message-input.tsx` - Functional send form
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Message callbacks and props
- `src/app/(dashboard)/[workspace]/inbox/message-thread.tsx` - Sending status visual
- `src/types/database.ts` - Added Relationships for Supabase types
- `src/app/(dashboard)/[workspace]/inbox/page.tsx` - Type cast fix for relationships

## Decisions Made

- Used separate Supabase queries instead of joins for better TS inference
- Optimistic messages tracked via metadata.status field
- Clock icon + reduced opacity for sending feedback
- Dev mode generates mock-{timestamp} message IDs

## Deviations from Plan

**Rule 1 (Auto-fix bugs):** TypeScript type errors with Supabase required:
- Adding `Relationships: []` to all database table definitions
- Using separate queries instead of joins in API route
- Type casts for relationship queries

## Issues Encountered

- Supabase SSR v2 types require Relationships field in table definitions
- Type narrowing after null checks doesn't work well with Supabase client
- Fixed by using explicit type casts and separate queries

## Verification

- [x] `npm run build` succeeds without errors
- [x] No TypeScript errors
- [x] Dev mode: send message works with mock response
- [x] Input clears after submit
- [x] Sending state shows visual feedback

## Next Steps

Phase 4 complete. Ready for Phase 5: Website Manager.

---
*Phase: 04-inbox-send*
*Completed: 2026-01-14*
