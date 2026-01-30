---
phase: "05"
plan: "01"
subsystem: "inbox"
tags: ["real-time", "handover", "ui", "confirmation", "typing-indicator"]

requires:
  - "04-01-inbox-ui-filtering"
  - "02-01-inbox-page-routing"

provides:
  - "real-time message sync verification"
  - "ai-human toggle with confirmation dialog"
  - "system messages for mode transitions"
  - "typing indicator component"

affects:
  - "05-02-handover-flow" # Next plan will build on toggle UI

tech-stack:
  added:
    - "@radix-ui/react-alert-dialog (via shadcn)"
  patterns:
    - "Convex useQuery subscriptions for real-time updates"
    - "AlertDialog confirmation pattern"
    - "Optimistic UI updates in dev mode"
    - "WhatsApp-style visual feedback (typing indicator, system messages)"

key-files:
  created:
    - "src/components/inbox/typing-indicator.tsx"
    - "src/components/inbox/system-message.tsx"
  modified:
    - "src/components/inbox/message-thread.tsx"
    - "src/lib/mock-data.ts"

decisions:
  - decision: "Confirmation dialog for ALL mode switches"
    rationale: "Prevents accidental mode changes that could disrupt customer conversations"
    alternatives: []
  - decision: "System messages in conversation thread"
    rationale: "Provides clear visual history of mode changes in context"
    alternatives: ["Toast notifications only - rejected (no persistent record)"]
  - decision: "2-second typing indicator simulation in dev mode"
    rationale: "Mimics real AI response delay for realistic UX testing"
    alternatives: []
  - decision: "Mock conversations include 'open' and 'handover' status"
    rationale: "Enables offline testing of both AI and Manual modes"
    alternatives: []

metrics:
  duration: "~4 minutes"
  commits: 2
  files_changed: 8
  completed: "2026-01-27"
---

# Phase 05 Plan 01: Real-time Sync & AI/Human Toggle UI Summary

**One-liner:** Verified Convex real-time subscriptions and completed AI/Human toggle with AlertDialog confirmation, system messages, and WhatsApp-style typing indicator.

## What Was Built

### Real-time Message Sync Verification (Task 1)

Verified that Convex subscriptions are correctly wired for automatic real-time updates:

**Message Thread Subscription:**
```typescript
const convexMessages = useQuery(
  api.messages.listByConversationAsc,
  isDevMode() ? 'skip' : { conversation_id, workspace_id }
)
const messages = isDevMode() ? getMockMessagesForConversation(conversationId) : convexMessages
```

**Conversation List Subscription:**
```typescript
const convexData = useQuery(
  api.conversations.listWithFilters,
  isDevMode() ? 'skip' : { workspace_id, active, statusFilters, tagFilters }
)
const data = isDevMode() ? MOCK_INBOX_DATA : convexData
```

**Key Finding:** Real-time updates work via Convex's built-in subscription system. No manual polling or refresh needed. When database changes, `useQuery` automatically triggers component re-render.

### AI/Human Toggle UI Enhancement (Task 2)

Completed toggle interface with three-layer feedback system:

#### 1. TypingIndicator Component
WhatsApp-style three-dot animation:
- Three bouncing dots with staggered animation delays
- Appears in message bubble format (left-aligned, gray background)
- Shows during AI response processing
- Animation: `animate-bounce` with 0s, 0.2s, 0.4s delays

#### 2. SystemMessage Component
Inline conversation notifications:
- Centered pill-shaped message
- Gray text on muted background
- Appears in conversation thread after mode switches
- Messages:
  - AI → Manual: "You switched to Manual mode. You will handle responses manually."
  - Manual → AI: "You enabled AI mode. AI will respond to new messages."

#### 3. Confirmation Dialog
AlertDialog pattern before mode switch:
- **AI → Manual:** "Switch to Manual mode? AI will stop responding to new messages. You will need to respond manually."
- **Manual → AI:** "Enable AI mode? AI will automatically respond to new messages from this contact."
- Cancel or Confirm actions
- Prevents accidental mode changes

### Toggle Flow

1. **User clicks toggle button** → Confirmation dialog appears
2. **User confirms** → System message added to conversation thread
3. **If switching to AI mode** → Typing indicator shows for 2 seconds (simulates AI processing)
4. **Mode badge updates** → Green "ARI Active" or Orange "Manual"

### Dev Mode Handling

- Toggle updates local state (no API call)
- System messages stored in component state
- Typing indicator simulated with 2-second timeout
- Mock conversations have mixed statuses:
  - `conv-001` (Budi Santoso): `status: 'open'` (AI active)
  - `conv-002` (Siti Rahayu): `status: 'handover'` (Manual mode)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Architecture

### Real-time Pattern
```
Convex Database Change
  ↓
useQuery subscription detects change
  ↓
Component re-renders automatically
  ↓
New messages appear (no manual refresh)
```

### Toggle State Management
```
[Toggle Button Click]
  ↓
[Confirmation Dialog] → Cancel: No change
  ↓ Confirm
[Execute Toggle]
  ├─ Update conversation status
  ├─ Add system message to local state
  └─ Show typing indicator (if AI mode)
```

### Component Structure
```
MessageThread
  ├─ Header (with toggle button)
  ├─ Messages Area
  │   ├─ Message bubbles
  │   ├─ System messages (inline)
  │   └─ Typing indicator
  ├─ Compose Input
  └─ AlertDialog (confirmation)
```

## Testing Evidence

**Server Status:** Running at localhost:3000 without errors

**Compilation:** All TypeScript types resolved correctly

**Components Created:**
- `typing-indicator.tsx` (26 lines) - WhatsApp-style animation
- `system-message.tsx` (15 lines) - Inline notifications

**Components Enhanced:**
- `message-thread.tsx` - Added confirmation dialog, system messages, typing indicator
- `mock-data.ts` - Updated conversation statuses for dev mode testing

**Console:** No errors, warnings, or subscription issues

## Next Phase Readiness

**Phase 5 Plan 2 (Handover Flow):** Ready to proceed
- Toggle UI foundation complete
- System messages pattern established
- Typing indicator available for AI response feedback
- Dev mode supports testing both AI and Manual modes

**Blockers:** None

**Notes:**
- Real-time sync works via Convex subscriptions (no changes needed)
- Toggle confirmation prevents accidental mode switches
- System messages provide clear conversation history of mode changes
- WhatsApp-style visual feedback improves UX clarity

## Key Learnings

1. **Convex Subscriptions:** Already working correctly - no polling needed
2. **Confirmation Pattern:** AlertDialog prevents expensive mistakes (accidental handover)
3. **System Messages:** Better than toast notifications - provides persistent record in conversation
4. **Typing Indicator:** Standard WhatsApp pattern instantly recognizable to users
5. **Dev Mode Toggle:** Optimistic updates work seamlessly without backend

## Files Modified

```
src/components/inbox/typing-indicator.tsx         [NEW, 26 lines]
src/components/inbox/system-message.tsx           [NEW, 15 lines]
src/components/inbox/message-thread.tsx           [+78 lines]
src/lib/mock-data.ts                              [+6 lines]
```

## Commits

1. `c98d520` - docs(05-01): verify real-time message sync via Convex subscriptions
2. `9e629b0` - feat(05-01): complete AI/Human toggle with confirmation and visual feedback

**Total commits:** 2
**Execution time:** ~4 minutes
**Status:** ✓ Complete
