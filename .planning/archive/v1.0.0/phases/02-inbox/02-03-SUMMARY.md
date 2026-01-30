---
phase: 02-inbox
plan: 03
subsystem: ui
tags: [react, clerk, convex, kapso, whatsapp, textarea-autosize]

# Dependency graph
requires:
  - phase: 02-01
    provides: Conversation list component and infrastructure
  - phase: 02-02
    provides: Message thread with auto-scroll and message bubbles
provides:
  - ComposeInput component with auto-expanding textarea
  - Message send API route with Kapso integration
  - Full inbox send/receive functionality
affects: [Phase 3 (future inbox features)]

# Tech tracking
tech-stack:
  added: [react-textarea-autosize]
  patterns: [Clerk auth in API routes, Kapso API integration, encrypted credentials]

key-files:
  created:
    - src/components/inbox/compose-input.tsx
  modified:
    - src/app/api/messages/send/route.ts
    - src/components/inbox/message-thread.tsx
    - convex/workspaces.ts

key-decisions:
  - "Clerk auth replaced CRM_API_KEY for message send authentication"
  - "Decrypt Kapso credentials from workspace.meta_access_token for API calls"
  - "Auto-expanding textarea with Enter to send, Shift+Enter for new line"

patterns-established:
  - "Pattern 1: Clerk auth() in API routes for user authentication"
  - "Pattern 2: decrypt() from crypto.ts for sensitive credentials"
  - "Pattern 3: getByIdInternal queries for API route access without auth checks"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 02 Plan 03: Message Send Summary

**Auto-expanding compose input with Kapso WhatsApp message delivery and Convex real-time sync**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-24T13:28:50Z
- **Completed:** 2026-01-24T13:31:08Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- ComposeInput component with auto-expanding textarea and keyboard shortcuts
- Message send API route fully integrated with Kapso WhatsApp API
- Clerk authentication and encrypted credential management
- Real-time message delivery with Convex subscription updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Create compose input component** - `26924eb` (feat)
2. **Task 2: Complete send message API route with Kapso** - `7a42530` (feat)
3. **Task 3: Wire compose input into message thread** - `5fa008f` (feat)

## Files Created/Modified

- `src/components/inbox/compose-input.tsx` - Auto-expanding message input with send button and loading states
- `src/app/api/messages/send/route.ts` - API route that authenticates via Clerk, sends via Kapso, stores in Convex
- `src/components/inbox/message-thread.tsx` - Integrated ComposeInput component
- `convex/workspaces.ts` - Added getByIdInternal query for API route access to workspace credentials
- `package.json` - Added react-textarea-autosize dependency

## Decisions Made

1. **Clerk auth in API routes:** Replaced old CRM_API_KEY pattern with Clerk `auth()` for user authentication
2. **Encrypted credential decryption:** Used `decrypt()` from `crypto.ts` to decrypt `workspace.meta_access_token` for Kapso API key
3. **getByIdInternal pattern:** Added query to workspaces.ts following existing pattern in conversations.ts and contacts.ts
4. **Auto-expand textarea:** Used react-textarea-autosize for better UX (grows as user types, up to 5 rows)
5. **Keyboard shortcuts:** Enter sends message, Shift+Enter adds new line (standard messaging pattern)
6. **Indonesian error messages:** Toast error uses "Gagal mengirim pesan" for consistency with app language

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Inbox core functionality complete (list, thread, send). Ready for:
- Media message support (images, documents)
- Message search and filtering
- Typing indicators
- Read receipts enhancement
- Contact quick actions

---
*Phase: 02-inbox*
*Completed: 2026-01-24*
