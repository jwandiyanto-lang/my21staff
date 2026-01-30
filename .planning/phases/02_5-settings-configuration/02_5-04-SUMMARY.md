---
phase: 02_5-settings-configuration
plan: 04
subsystem: messaging, api
tags: whatsapp, kapso, inbox, typescript, nextjs

# Dependency graph
requires:
  - phase: 02_5-settings-configuration
    provides: workspace settings infrastructure
provides:
  - WhatsApp inbox with conversation list and message view
  - Kapso API integration for WhatsApp Cloud API
  - Template and interactive message dialogs
  - Dev mode support for offline development
affects: []

# Tech tracking
tech-stack:
  added:
    - @kapso/whatsapp-cloud-api (Kapso WhatsApp SDK)
  patterns:
    - Auto-polling for real-time updates (10s conversations, 5s messages)
    - Dev mode fallback to mock data
    - Optimistic message sending with rollback
    - Two-panel inbox layout pattern
    - TypeScript strict typing for message direction

key-files:
  created:
    - src/lib/whatsapp-client.ts
    - src/lib/mock-whatsapp-data.ts
    - src/app/api/whatsapp/conversations/route.ts
    - src/app/api/whatsapp/messages/[id]/route.ts
    - src/components/inbox/conversation-list.tsx
    - src/components/inbox/message-view.tsx
    - src/components/inbox/template-dialog.tsx
    - src/components/inbox/interactive-dialog.tsx
    - src/app/(dashboard)/[workspace]/inbox/page.tsx
    - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
  modified:
    - src/app/globals.css
    - src/components/workspace/sidebar.tsx
    - package.json
    - package-lock.json

key-decisions:
  - Use 10-second polling for conversations and 5-second polling for messages (Kapso doesn't support WebSocket)
  - Dev mode uses mock data with Indonesian contacts for realistic testing
  - my21staff branding (green primary, orange accent) instead of WhatsApp green
  - Geist Mono font for phone numbers, timestamps, and message content
  - Client-side optimistic updates for message sending with rollback on error
  - TypeScript literal types for message direction to ensure type safety

patterns-established:
  - Inbox two-panel layout pattern (conversation list + message view)
  - Auto-polling pattern for real-time data without WebSockets
  - Dev mode mock data pattern with offline indicator
  - API route pattern with dev mode bypass
  - Message bubble styling with my21staff colors

# Metrics
duration: 7min
completed: 2026-01-30
---

# Phase 2.5 Plan 04: WhatsApp Inbox Summary

**WhatsApp inbox integration with Kapso API, auto-polling for real-time updates, template/interactive message support, and dev mode mock data for offline development**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-30T15:19:37Z
- **Completed:** 2026-01-30T15:27:10Z
- **Tasks:** 7
- **Files modified:** 14

## Accomplishments

- Kapso WhatsApp Cloud API SDK installed and client wrapper created
- Next.js API routes for conversations and messages with dev mode support
- 4 inbox components: ConversationList, MessageView, TemplateDialog, InteractiveDialog
- Inbox page route integrated into dashboard sidebar
- my21staff branding (green/orange) with Geist Mono for data fields
- Dev mode indicator and offline mock data with Indonesian contacts
- All components pass TypeScript type checking

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Kapso SDK and create WhatsApp client wrapper** - `9f542f4` (feat)
2. **Tasks 2-3: Create WhatsApp API routes and mock data** - `550a882` (feat)
3. **Task 4: Create inbox components (ConversationList, MessageView, TemplateDialog, InteractiveDialog)** - `b96f281` (feat)
4. **Task 5: Create inbox page and sidebar integration** - `3ca64f7` (feat)
5. **Task 6: Apply my21staff branding (black/white + Geist Mono)** - `c8023d0` (style)
6. **Task 7: Fix type errors and add dev mode indicator** - `ca3a610` (fix)

**Plan metadata:** (To be committed with SUMMARY.md)

_Note: Tasks 2 and 3 were combined into a single commit as they were tightly coupled (API routes need mock data to exist)_

## Files Created/Modified

- `src/lib/whatsapp-client.ts` - Kapso WhatsApp client wrapper with dev mode support
- `src/lib/mock-whatsapp-data.ts` - Mock conversations and messages with Indonesian contacts
- `src/app/api/whatsapp/conversations/route.ts` - GET endpoint for conversation list
- `src/app/api/whatsapp/messages/[id]/route.ts` - GET endpoint for conversation messages
- `src/components/inbox/conversation-list.tsx` - Left panel with searchable conversation list
- `src/components/inbox/message-view.tsx` - Right panel with message bubbles and send input
- `src/components/inbox/template-dialog.tsx` - WhatsApp template message sender
- `src/components/inbox/interactive-dialog.tsx` - Interactive message builder with buttons
- `src/app/(dashboard)/[workspace]/inbox/page.tsx` - Inbox page route
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Client component for interactive state
- `src/app/globals.css` - Added inbox-specific CSS classes for branding
- `src/components/workspace/sidebar.tsx` - Added Inbox to operations navigation
- `package.json`, `package-lock.json` - Added @kapso/whatsapp-cloud-api dependency

## Decisions Made

- **10-second conversation polling / 5-second message polling** - Kapso API doesn't support WebSocket, so polling is required for real-time updates
- **Dev mode mock data with Indonesian names** - Provides realistic testing environment without needing network
- **my21staff green/orange branding** - Maintains brand consistency instead of using WhatsApp green (#25D366)
- **Geist Mono for data fields** - Phone numbers, timestamps, and message content use monospace font for better readability
- **Optimistic message sending** - Messages appear immediately with rollback on error for better UX
- **TypeScript literal types for direction** - Using `'inbound' | 'outbound'` literal types prevents type errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type errors in mock data**

- **Found during:** Task 7 (Type checking)
- **Issue:** Mock data `direction` property was inferred as `string` instead of literal `'inbound' | 'outbound'` type, causing type mismatch with component interfaces
- **Fix:** Changed from `direction: 'inbound' as const` to explicit return type annotation on `getMockMessages()` function, and added type assertion `as Message[]` in component
- **Files modified:** `src/lib/mock-whatsapp-data.ts`, `src/components/inbox/message-view.tsx`
- **Verification:** Ran `npm run type-check` - no inbox-related errors
- **Committed in:** `ca3a610` (Task 7 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type error was necessary fix for correctness. No scope creep.

## Issues Encountered

None - plan executed smoothly. Kapso SDK installed successfully, all components created and integrated.

## User Setup Required

None - no external service configuration required for this plan. Kapso credentials will be configured in future phases when workspace settings are implemented.

## Next Phase Readiness

- Inbox fully functional with dev mode mock data
- API routes ready for Kapso integration when workspace settings table exists
- Template and interactive message dialogs implemented but need production Kapso credentials
- Geist Mono branding applied across all inbox components
- Auto-polling pattern established for real-time updates

**Blockers/Concerns:**
- Production WhatsApp sending not yet functional - requires workspace settings table to store Kapso API credentials
- Template sending endpoint (`/api/whatsapp/send`) referenced in MessageView but not yet created
- Kapso WhatsApp SDK installed but production configuration pending

---
*Phase: 02_5-settings-configuration*
*Completed: 2026-01-30*
