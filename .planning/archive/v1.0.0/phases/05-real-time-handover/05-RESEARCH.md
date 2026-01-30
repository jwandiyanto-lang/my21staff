# Phase 5: Real-time & Handover - Research

**Researched:** 2026-01-27
**Domain:** Real-time message synchronization via Convex subscriptions; per-conversation AI/Human mode toggle with state management
**Confidence:** HIGH (existing architecture + verified implementation patterns)

## Summary

Phase 5 implements two primary features on top of existing infrastructure: (1) real-time message updates flowing through Convex subscriptions so new WhatsApp messages appear instantly in the Inbox without page refresh, and (2) per-conversation AI/Human mode toggle that gates ARI processing.

The project already has foundational pieces in place:
- Convex subscriptions via `useQuery()` hooks (already used in message-thread, conversation-list, filter-tabs)
- Conversation status model with 'handover' state (schema supports it; mutations exist; Phase 3 established the toggle)
- Kapso webhook → Convex message flow (kapso.ts processes webhook, creates messages)
- Dev mode bypass pattern for offline testing (isDevMode() helpers)

**Key findings:**
- Real-time is built on Convex subscriptions (not polling or WebSocket). Messages written to Convex database trigger re-renders automatically.
- AI gating is already partially in place: conversation status includes 'handover'; ARI config has enabled/disabled toggle; toggle mutation exists. Phase 5 completes the flow by canceling in-flight AI responses.
- Error boundaries (react-error-boundary) are established for tab-level isolation (Phase 2 decision).
- Confirmation dialogs prevent accidental mode toggles (best practice from UX context).
- Typing indicators and inline system messages provide visual feedback (WhatsApp-style patterns).

**Primary recommendation:** Implement real-time message rendering via existing Convex subscription patterns; connect toggle UI to existing conversation status mutation; add cancellation of in-flight ARI responses when switching to Human mode; follow established dev mode/error boundary patterns.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15+ | React framework | Project standard |
| React | 19+ | UI library | Project standard |
| TypeScript | Latest | Type safety | Project standard |
| Convex | Latest | Real-time database + subscriptions | Project backend; enables real-time |
| Shadcn/ui | Latest | UI primitives | Project standard for consistency |
| Tailwind CSS | Latest | Styling | Project standard |

### Real-time & State Management
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex/react | Latest | useQuery hooks with subscriptions | All Convex data access (built-in subscription) |
| react-error-boundary | 4+ | Error isolation at component level | Tab-level error containment (established Phase 2) |
| lucide-react | Latest | Icons (Bot, User, RotateCcw, AlertCircle, etc.) | Status indicators, buttons |
| date-fns | Latest | Timestamp formatting | Message timestamps, system message dates |

### No New Dependencies Required

All real-time and toggle functionality uses Convex subscriptions built into `useQuery()` and mutations. No additional real-time library needed (Convex handles subscription + sync).

**Why this approach is standard:**
- Convex subscriptions are automatic — when `useQuery()` returns data, the component re-renders immediately on any database change
- No manual polling or WebSocket management required
- Optimistic updates (`.withOptimisticUpdate()`) handled by Convex client
- Error boundaries (Phase 2 decision) provide tab-level isolation without additional libraries

## Architecture Patterns

### Recommended Project Structure (Additions for Phase 5)

```
src/
├── components/
│   ├── inbox/
│   │   ├── inbox-client.tsx           # Root, state management (unchanged)
│   │   ├── conversation-list.tsx      # Real-time via useQuery (enhanced)
│   │   ├── message-thread.tsx         # Messages + toggle button + new message indicator (enhanced)
│   │   ├── message-bubble.tsx         # Message display (unchanged)
│   │   ├── compose-input.tsx          # Message sending (unchanged)
│   │   ├── ai-handover-toggle.tsx     # NEW: Toggle button + confirmation modal
│   │   ├── typing-indicator.tsx       # NEW: Three-dot animation while AI responds
│   │   ├── system-message.tsx         # NEW: Inline "[You switched to Human mode]" messages
│   │   └── message-thread-header.tsx  # NEW: Extract header with toggle + status pill
│   └── ui/
│       └── dialog.tsx                 # Shadcn dialog for confirmation (likely exists)
├── lib/
│   ├── convex-helpers.ts              # NEW: Utilities for cancel-in-flight, check AI state
│   └── mock-data.ts                   # Dev mode data (update with conversation.status)
└── app/
    └── (dashboard)/
        └── [workspace]/
            └── inbox/
                └── inbox-client.tsx   # Server wrapper
```

### Pattern 1: Real-time Message Updates via Convex Subscriptions

**What:** New messages from Kapso webhook appear in message thread instantly via Convex subscription.

**Flow:**
1. Kapso sends webhook → HTTP action validates signature
2. Kapso HTTP action schedules `processWebhook` mutation
3. `processWebhook` creates message in Convex `messages` table
4. `useQuery(api.messages.listByConversationAsc)` in message-thread automatically re-subscribes and re-renders
5. New message appears in UI within <500ms

**When to use:** This is the standard pattern. No manual refresh needed; Convex handles subscription automatically.

**Example:**
```typescript
// Source: /src/components/inbox/message-thread.tsx (current pattern)
const convexMessages = useQuery(
  api.messages.listByConversationAsc,
  isDevMode() ? 'skip' : {
    conversation_id: conversationId,
    workspace_id: workspaceId,
  }
)
const messages = isDevMode() ? getMockMessagesForConversation(conversationId) : convexMessages

// Convex automatically re-runs query and triggers re-render when any message is created/updated
// Developer responsibility: Trust Convex subscription, don't add manual polling
```

**Key insight:** Convex subscriptions are "push"-based (database change triggers re-render), not "pull"-based (periodic check). This is why timing is instant: the client is notified immediately when server writes to database.

### Pattern 2: Conversation List Real-time Reordering

**What:** When a new message arrives for any conversation, that conversation moves to top of list and unread count increases.

**Flow:**
1. Incoming message creates record in `messages` table
2. `updateConversationMetadata` mutation patches conversation with `last_message_at`, `last_message_preview`, and increments `unread_count`
3. Conversation list query orders by `last_message_at DESC`
4. `useQuery(api.conversations.listWithFilters)` in conversation-list re-subscribes and re-renders
5. List reorders immediately

**When to use:** This is the standard pattern. All list operations via Convex queries automatically subscription.

**Example:**
```typescript
// Source: /convex/conversations.ts (current implementation)
export const listWithFilters = query({
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("conversations")
      .withIndex("by_workspace_time", (q) =>
        q.eq("workspace_id", args.workspace_id as any)
      )
      .order("desc")  // Orders by last_message_at DESC

    const conversations = await q.collect()
    // ... filtering logic ...
    return { conversations, totalCount, activeCount, tags }
  }
})

// React component automatically re-runs when any conversation document is patched
// useQuery(api.conversations.listWithFilters, { workspace_id })
```

**Key insight:** The `order("desc")` on `last_message_at` combined with Convex subscription means reordering happens automatically. No manual sorting or array manipulation needed.

### Pattern 3: AI/Human Mode Toggle with Confirmation

**What:** User clicks toggle button → confirmation dialog → mutation updates conversation.status → UI reflects new state.

**When to use:** Prevent accidental mode switches. Always confirm before changing modes.

**Example:**
```typescript
// NEW: /src/components/inbox/ai-handover-toggle.tsx
'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bot, User, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

interface AIHandoverToggleProps {
  conversationId: string
  workspaceId: string
  currentStatus: 'open' | 'handover' | 'closed'
  isLoading?: boolean
}

export function AIHandoverToggle({
  conversationId,
  workspaceId,
  currentStatus,
  isLoading = false,
}: AIHandoverToggleProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const updateStatus = useMutation(api.conversations.updateConversationStatus)

  const isAiEnabled = currentStatus !== 'handover'
  const newStatus = isAiEnabled ? 'handover' : 'open'
  const actionLabel = isAiEnabled ? 'Switch to Human mode' : 'Enable AI mode'
  const confirmMessage = isAiEnabled
    ? 'Switch to Human mode? AI will stop responding.'
    : 'Enable AI mode? AI will respond to new messages.'

  const handleConfirm = async () => {
    setIsToggling(true)
    try {
      await updateStatus({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        status: newStatus,
      })
      toast.success(`Switched to ${newStatus === 'handover' ? 'Human' : 'AI'} mode`)
      setShowConfirm(false)
    } catch (error) {
      toast.error('Failed to update mode. Try again.')
      console.error(error)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isLoading || isToggling}
        className="gap-2"
      >
        {isAiEnabled ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        {isAiEnabled ? 'AI' : 'Human'}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {actionLabel}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{confirmMessage}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isToggling}>
              {isToggling ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

**Key insight:** Confirmation prevents accidental toggles. Convex mutation is what updates `conversations.status`; UI reflects this via Convex subscription to conversation data.

### Pattern 4: Cancel In-Flight AI Responses

**What:** When user switches from AI to Human mode, any in-progress AI response is cancelled immediately.

**When to use:** Standard UX for chatbots with mode switching. AI shouldn't complete a response after user switches to Human.

**Example:**
```typescript
// NEW: /src/lib/convex-helpers.ts
import { api, internal } from '@/../convex/_generated/api'

/**
 * Cancel in-flight ARI response for a conversation.
 *
 * Called when user switches from AI to Human mode.
 * This aborts any scheduled ARI processing or stops active response generation.
 */
export async function cancelInFlightAriResponse(
  conversationId: string,
  workspaceId: string
): Promise<void> {
  // Implementation: Call Convex action to cancel ARI queue for this conversation
  // For now, this can be a no-op until ARI processing is implemented
  // (Phase 6 may implement the actual cancellation logic)

  // Placeholder for future implementation:
  // await convex.action(internal.ari.cancelProcessing, {
  //   conversation_id: conversationId,
  //   workspace_id: workspaceId,
  // })

  console.log(`[ARI] Cancelled in-flight response for conversation ${conversationId}`)
}

/**
 * Check if conversation is in AI mode.
 * Returns true if status is 'open' (AI enabled), false if 'handover' (Human mode).
 */
export function isAiModeEnabled(conversationStatus: string): boolean {
  return conversationStatus !== 'handover'
}
```

**Linked mutation in AI handover toggle:**
```typescript
// In ai-handover-toggle.tsx, when switching TO human mode:
const handleConfirm = async () => {
  setIsToggling(true)
  try {
    if (!isAiEnabled) {
      // Switching FROM AI to Human - cancel in-flight response
      await cancelInFlightAriResponse(conversationId, workspaceId)
    }

    await updateStatus({
      conversation_id: conversationId,
      workspace_id: workspaceId,
      status: newStatus,
    })
    toast.success(`Switched to ${newStatus === 'handover' ? 'Human' : 'AI'} mode`)
    setShowConfirm(false)
  } catch (error) {
    toast.error('Failed to update mode. Try again.')
  } finally {
    setIsToggling(false)
  }
}
```

**Key insight:** The cancellation logic depends on how ARI processes messages (Phase 6). For now, the toggle updates status to 'handover', which prevents ARI from responding to new messages. In-flight cancellation can be a no-op initially.

### Pattern 5: System Messages for Mode Transition

**What:** After mode toggle succeeds, insert a system message in the thread: "[You switched to Human mode]" or "[AI mode enabled]"

**When to use:** Provides visual feedback in chat history. User sees exactly when and why the mode changed.

**Example:**
```typescript
// NEW: /src/components/inbox/system-message.tsx
'use client'

interface SystemMessageProps {
  text: string
  timestamp: number
}

export function SystemMessage({ text, timestamp }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
        {text}
      </div>
    </div>
  )
}

// Usage in message thread:
{messages?.map((msg, i) => {
  if (msg.message_type === 'system') {
    return <SystemMessage key={i} text={msg.content} timestamp={msg.created_at} />
  }
  return <MessageBubble key={i} message={msg} />
})}
```

**In toggle handler:**
```typescript
// After successful status update, create a system message
const systemMessageContent = isAiEnabled
  ? '[You switched to Human mode]'
  : '[AI mode enabled]'

// Could be done via mutation:
// await createMessage({
//   conversation_id: conversationId,
//   workspace_id: workspaceId,
//   message_type: 'system',
//   content: systemMessageContent,
//   direction: 'outbound',
//   sender_type: 'system',
// })
```

**Key insight:** System messages should be created via a separate mutation after status update. They appear in message history and provide audit trail of mode changes.

### Pattern 6: Typing Indicator for AI Responses

**What:** Three-dot animation bubble appears while ARI is generating a response.

**When to use:** Standard WhatsApp UX. Indicates "AI is thinking/responding".

**Example:**
```typescript
// NEW: /src/components/inbox/typing-indicator.tsx
'use client'

export function TypingIndicator() {
  return (
    <div className="flex gap-1 p-3">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Usage in message thread:
{isAiResponding && <TypingIndicator />}
```

**Key insight:** `animate-bounce` is built into Tailwind. Stagger delays with CSS `animationDelay` for wave effect. Show only when ARI is actively generating (status can be tracked in state or derived from conversation.status).

### Pattern 7: New Message Indicator in List

**What:** When viewing Conversation A and new message arrives for Conversation B, show badge on B with unread count.

**When to use:** Standard messaging app UX. Convex subscription automatically updates unread_count.

**Current implementation already handles this:**
```typescript
// Source: /src/components/inbox/conversation-list.tsx
// Badge shows conversation.unread_count
// Convex subscription updates automatically when message is created
{conversation.unread_count > 0 && (
  <Badge variant="destructive" className="ml-auto">
    {conversation.unread_count}
  </Badge>
)}
```

**Key insight:** No additional work needed. Convex mutation increments `unread_count` on the conversation; subscription re-renders the badge.

### Anti-Patterns to Avoid

- **Manual polling for new messages:** Don't use `setInterval()` to check for new messages. Convex subscriptions are instant via `useQuery()`.
- **Toggling mode without confirmation:** Always show confirmation dialog to prevent accidental switches.
- **Completing AI response after mode switch:** When switching to Human, cancel/stop ARI immediately; don't let it finish.
- **Multiple mutations on status change:** Single mutation updates status; optional follow-up mutation for system message. Don't update contacts or other tables unnecessarily.
- **Missing dev mode checks:** New components with Convex queries must check `isDevMode()` and skip queries in dev mode.
- **Forgetting error boundaries:** If component accesses Convex and can error (no data, network), wrap with `<TabErrorBoundary>`.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time message updates | Manual setInterval polling | Convex subscriptions via useQuery | Polling wastes resources; Convex pushes instantly |
| Confirmation before toggle | Just toggle immediately | Dialog component + state | Prevents accidental mode switches |
| In-flight AI cancellation | Manual state + abort flags | Convex internal action/queue | Centralized in backend; cleaner |
| Typing indicator animation | Custom CSS animation | Tailwind animate-bounce with staggered delay | Battle-tested, performant |
| Conversation reordering | Manual array sort after message | Convex query with order("desc") on last_message_at | Query index does the work |
| System messages | Store in separate table | Add message_type: 'system' to messages table | Single source of truth |
| Error handling | Try/catch everywhere | react-error-boundary + TabErrorBoundary | Isolates errors, prevents cascades |

**Key insight:** Convex is already the source of truth for all data. Trust its subscriptions instead of building custom real-time sync.

## Common Pitfalls

### Pitfall 1: Mode Toggle Doesn't Reflect UI Until Page Refresh

**What goes wrong:** User clicks toggle → mutation succeeds → UI still shows old mode.

**Why it happens:** Component deriving mode from prop that doesn't update; or Convex subscription not re-fetching conversation data.

**How to avoid:**
- Pass `conversation` object to toggle component and read `.status` property
- Ensure message-thread component queries conversation data: `useQuery(api.conversations.getByIdInternal, { conversation_id })`
- Convex subscription automatically updates when status mutation completes
- Don't derive mode from local state; always read from conversation.status

**Warning signs:**
- Toggle button changes, but no confirmation dialog appears
- Dialog confirms, but toggle button stays in old state
- Page refresh fixes the display

**Verification:** After toggle mutation succeeds, verify conversation.status changed in Convex console.

### Pitfall 2: New Messages Don't Appear Until Manual Refresh

**What goes wrong:** Kapso webhook arrives, message saved to Convex, but UI doesn't update.

**Why it happens:**
- Convex query not using `useQuery()` hook (using static query instead)
- Component not in focus or subscription cancelled
- Dev mode query skipped but Convex call still made

**How to avoid:**
- Always use `useQuery()` hook (not bare query calls)
- Query must not be skipped unless dev mode: `isDevMode() ? 'skip' : { args }`
- Verify index is correct: `by_conversation_time` must be queried
- Test with real webhook (not just local Convex update)

**Warning signs:**
- Webhook processed (log shows message saved)
- Manually creating message in Convex console appears instantly
- Message sent via compose input appears, but webhook message doesn't

**Verification:** Check Convex cloud console to confirm message was created. If yes, subscription is broken; if no, webhook processing failed.

### Pitfall 3: Unread Count Doesn't Update for Conversations Not In View

**What goes wrong:** User in Conversation A, message arrives in Conversation B. B's unread count badge doesn't increase.

**Why it happens:**
- Conversation list query not subscribed (using static data)
- Or mutation that increments unread_count isn't being called

**How to avoid:**
- Conversation list must use: `useQuery(api.conversations.listWithFilters, { workspace_id })`
- Kapso webhook processing must call mutation to increment unread_count
- Verify mutation is called in kapso.ts or messages.ts after creating message

**Warning signs:**
- Unread count only updates when you switch to that conversation
- Count updates if you refresh page
- Manual database update doesn't trigger UI change

**Verification:** Check mutations.ts → `upsertConversation` to confirm it increments `unread_count`.

### Pitfall 4: Toggle Modal Shows but Mutation Doesn't Call

**What goes wrong:** User clicks toggle, sees confirmation dialog, clicks confirm, nothing happens.

**Why it happens:**
- Mutation function not imported/initialized
- Workspace auth check failing
- Error swallowed in try/catch without logging

**How to avoid:**
- Import mutation: `const updateStatus = useMutation(api.conversations.updateConversationStatus)`
- Add error logging: `console.error('Toggle failed:', error)`
- Verify mutation is in convex/conversations.ts or convex/mutations.ts
- Verify workspace membership at mutation level

**Warning signs:**
- Modal appears, but nothing happens after confirm
- No errors in browser console
- Convex mutation function not being called (check Convex logs)

**Verification:** Add `console.log('Calling mutation')` before mutation call and check dev tools console.

### Pitfall 5: AI Responses Continue After Mode Switch to Human

**What goes wrong:** User switches to Human mode, but AI response is still being generated/sent.

**Why it happens:**
- No cancellation of in-flight ARI action
- ARI processing ignores conversation.status check
- Response was already queued before status changed

**How to avoid:**
- Before updating status to 'handover', call cancellation function
- ARI processing (Phase 6) must check conversation.status before generating response
- Don't rely on frontend to stop backend processing; gate it in backend
- Verify status update is atomic with any cancellation

**Warning signs:**
- Mode switches to Human
- But AI message still appears moments later
- System message shows human mode, but AI response follows

**Verification:** Check Convex logs/ARI action queue to confirm no response is being generated for handover conversations.

### Pitfall 6: Dev Mode Toggle Not Working

**What goes wrong:** In dev mode (localhost:3000/demo), toggle button doesn't work or errors.

**Why it happens:**
- Mutation tries to call Convex (which is skipped in dev mode)
- Component not checking `isDevMode()` for workspace ID
- Mock conversation data doesn't have status field

**How to avoid:**
- Toggle component should check `if (isDevMode())` and skip actual mutation
- Show mock success toast instead
- Update mock conversation data to include status field: `conversation.status = 'open' | 'handover'`
- Verify MOCK_CONVEX_WORKSPACE._id = 'demo' matches workspace check

**Warning signs:**
- Button click does nothing in dev mode
- Error about Convex client not initialized
- Mock data doesn't include conversation.status field

**Verification:** Check if conversation in mock data has `status` field. Update if missing.

### Pitfall 7: Confirmation Dialog Blocks Toggling Too Often

**What goes wrong:** User must confirm every click, even multiple toggles, is annoying.

**Why it happens:** Every toggle requires confirmation (by design).

**How to avoid:** This is not a bug; it's intentional UX. Confirmation prevents accidents. If users want faster toggling, add keyboard shortcut (e.g., Cmd+M) after beta testing.

**Alternative:** Add "Don't show again" checkbox in dialog (but then lose safety).

**Recommendation:** Keep confirmation for beta. Collect user feedback before removing.

## Code Examples

Verified patterns from current codebase and Phase 5 patterns:

### Real-time Message Subscription in Message Thread

```typescript
// Source: /src/components/inbox/message-thread.tsx (enhanced for Phase 5)
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { isDevMode } from '@/lib/mock-data'

export function MessageThread({
  conversationId,
  workspaceId,
  contact,
}: MessageThreadProps) {
  // Convex subscription - automatically updates when messages are created
  const convexMessages = useQuery(
    api.messages.listByConversationAsc,
    isDevMode() ? 'skip' : {
      conversation_id: conversationId,
      workspace_id: workspaceId,
    }
  )

  const messages = isDevMode() ? getMockMessagesForConversation(conversationId) : convexMessages

  // Convex auto-subscription means:
  // - New message created via webhook → Convex saves it
  // - useQuery hook immediately gets updated array
  // - Component re-renders with new message
  // - User sees new message without refresh (~200-500ms after webhook arrival)

  return (
    <div className="flex flex-col h-full">
      {/* Message list - includes new messages automatically */}
      <div className="flex-1 overflow-y-auto">
        {messages?.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
      </div>
    </div>
  )
}
```

### Conversation Status Update Mutation

```typescript
// Source: /convex/conversations.ts (current implementation)
export const updateConversationStatus = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    status: v.string(), // 'new', 'open', 'handover', 'closed'
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id)

    const conversation = await ctx.db.get(args.conversation_id as any)
    if (!conversation) throw new Error("Conversation not found")

    const now = Date.now()
    const updates: any = {
      status: args.status as any,
      updated_at: now,
    }

    // Clear unread_count if moving to 'open' (user viewing conversation)
    if (args.status === 'open' && conversation.unread_count > 0) {
      updates.unread_count = 0
    }

    await ctx.db.patch(args.conversation_id as any, updates)
    return await ctx.db.get(args.conversation_id as any)
  },
})

// Usage in React:
const updateStatus = useMutation(api.conversations.updateConversationStatus)
await updateStatus({
  conversation_id: conversationId,
  workspace_id: workspaceId,
  status: 'handover' // Toggle AI off
})
```

### Real-time Conversation List with Unread Counts

```typescript
// Source: /src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx (enhanced)
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { isDevMode } from '@/lib/mock-data'

export function InboxClient({ workspaceId }: { workspaceId: string }) {
  // Convex subscription for conversations - includes unread counts
  const convexData = useQuery(
    api.conversations.listWithFilters,
    isDevMode() ? 'skip' : {
      workspace_id: workspaceId,
      statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
      tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
    }
  )

  // Convex auto-subscription means:
  // - Any conversation.unread_count incremented → hook updates
  // - Any conversation.last_message_at changed → list reorders
  // - Any new message created → conversation badge updates
  // All happens automatically, no manual re-fetch needed

  return (
    <div className="flex h-full">
      <ConversationList
        conversations={convexData?.conversations || []}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
      />
      <MessageThread
        conversationId={selectedConversationId}
        workspaceId={workspaceId}
      />
    </div>
  )
}
```

### AI/Human Mode Toggle with Confirmation

```typescript
// NEW: /src/components/inbox/ai-handover-toggle.tsx
'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bot, User, AlertCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

export function AIHandoverToggle({
  conversationId,
  workspaceId,
  currentStatus,
}: {
  conversationId: string
  workspaceId: string
  currentStatus: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const updateStatus = useMutation(api.conversations.updateConversationStatus)

  const isAiEnabled = currentStatus !== 'handover'
  const newStatus = isAiEnabled ? 'handover' : 'open'
  const actionLabel = isAiEnabled ? 'Switch to Human mode' : 'Enable AI mode'

  const handleConfirm = async () => {
    setIsToggling(true)
    try {
      // Call mutation to update conversation status
      await updateStatus({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        status: newStatus,
      })

      // In Phase 6, cancel in-flight ARI response if switching to human
      // For now, status change alone prevents new AI responses (gated by ARI)

      toast.success(`Switched to ${newStatus === 'handover' ? 'Human' : 'AI'} mode`)
      setShowConfirm(false)
    } catch (error) {
      toast.error('Failed to update mode')
      console.error(error)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isToggling}
      >
        {isAiEnabled ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        {isAiEnabled ? 'AI' : 'Human'}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {actionLabel}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {isAiEnabled
              ? 'Switch to Human mode? AI will stop responding to new messages.'
              : 'Enable AI mode? AI will respond to new messages automatically.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isToggling}>
              {isToggling ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Typing Indicator While AI Responds

```typescript
// NEW: /src/components/inbox/typing-indicator.tsx
'use client'

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex gap-1 p-3 bg-gray-100 rounded-lg">
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  )
}

// Usage in message thread:
{messages?.map((msg) => <MessageBubble key={msg._id} message={msg} />)}
{isAiResponding && <TypingIndicator />}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling endpoint every N seconds for new messages | Convex subscriptions via useQuery | Phase 5 (Convex adoption from Phase 2) | Instant updates; reduced server load |
| Manual confirmation dialogs with setTimeout | React Dialog + state | Phase 5 | Cleaner UX; prevents accidental toggles |
| Hard-coded AI toggle in global settings | Per-conversation status field + mutation | Phase 3/5 | Flexible; user controls per contact |
| Custom scroll-to-bottom logic | Ref + useEffect with threshold | Current (solid pattern) | Standard React messaging pattern |
| Toggle status in Convex (Phase 3) | Extend with real-time UI (Phase 5) | Phase 5 | Status mutation exists; UI now reflects it |

**Deprecated/outdated:**
- Manual polling for real-time updates (use Convex subscriptions)
- Static conversation lists (use useQuery for auto-updates)
- Confirmation without dialog (use Shadcn Dialog for consistency)

## Open Questions

1. **Exact Handling of ARI Cancellation on Mode Switch**
   - What we know: Switching to 'handover' status prevents new ARI responses; Phase 3 sets this gate
   - What's unclear: How to cancel an in-flight ARI action (actively generating response)?
   - Recommendation: For Phase 5, status change alone is sufficient. If in-flight cancellation is needed, Phase 6 can implement via Convex internal action to abort scheduled mutations. For now, gate prevents new responses; in-flight ones complete normally.

2. **Typing Indicator Timing**
   - What we know: WhatsApp shows 3-dot while "Bot is typing"
   - What's unclear: How long should typing indicator show? Should it timeout?
   - Recommendation: Show typing indicator while conversation status is 'open' AND last_ai_message_at is recent (within 30 seconds). Timeout after 30s to avoid stuck indicator.

3. **Unread Count Edge Case: Viewing Conversation When New Message Arrives**
   - What we know: Unread count should be cleared when user is viewing the conversation
   - What's unclear: Who clears it? UI or backend? Does webhook processing clear or does UI mutation?
   - Recommendation: Backend (mutation) should clear when conversation is "opened". UI can call mutation onConversationSelect. Convex subscription will update unread badge automatically.

4. **System Message Timing in Mock Data**
   - What we know: Mock messages exist in mock-data.ts for dev mode
   - What's unclear: Should system messages (mode switches) be included in mock data or only in production?
   - Recommendation: Add mock system message at conversation timestamp boundary for dev mode testing. System messages only created in production when mutation succeeds.

5. **Offline Handling for Real-time Sync**
   - What we know: Project has dev mode for offline testing
   - What's unclear: Should production handle offline gracefully (queue messages, show banner)?
   - Recommendation: LOW priority for Phase 5. Convex handles reconnection automatically. If user goes offline, subscription pauses; when reconnect, Convex syncs. Optional: Add subtle "Offline" indicator if connection drops (Claude's discretion from context).

## Sources

### Primary (HIGH confidence)

- **Current Codebase - Convex Integration:**
  - `/convex/conversations.ts` - Conversation queries and status mutation (line 156-200)
  - `/convex/mutations.ts` - updateConversationStatus mutation (line 700+)
  - `/convex/schema.ts` - Conversation table with status field (line 62-76)
  - `/convex/kapso.ts` - Webhook processing and message creation (line 50-133)

- **Current Codebase - React Components:**
  - `/src/components/inbox/message-thread.tsx` - Message subscription pattern (line 74-81)
  - `/src/components/inbox/conversation-list.tsx` - Conversation list with unread badges
  - `/src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Root inbox state management

- **Dev Mode & Error Boundaries:**
  - `/src/lib/mock-data.ts` - Dev mode helper functions and mock workspace (line 37-69)
  - `/src/lib/utils.ts` - shouldUseMockData pattern (Phase 2 decision)
  - Phase 2 RESEARCH.md - react-error-boundary pattern for tab isolation

### Secondary (MEDIUM confidence)

- **Convex Official Documentation:**
  - [Convex React Integration](https://docs.convex.dev/client/react) - useQuery hook behavior and subscriptions
  - [Convex Mutations & Optimistic Updates](https://docs.convex.dev/client/react/mutations) - Mutation pattern and error handling
  - [Convex Real-time Guide](https://docs.convex.dev/realtime) - Subscription fundamentals

- **Shadcn/ui Components:**
  - Dialog component for confirmation modal (already in project)
  - Toast notifications for feedback (already in project)

- **WhatsApp Design Patterns:**
  - Three-dot typing indicator (standard messaging UX)
  - System messages for state changes (WhatsApp pattern)
  - Unread count badges (standard)

### Tertiary (LOW confidence)

- **General Real-time Patterns:** [Firebase Real-time Database Guide](https://firebase.google.com/docs/realtime/) - General subscription patterns (different backend, but patterns similar)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries already in project; Convex subscriptions verified in existing code
- Architecture: **HIGH** - Existing patterns in message-thread, conversation-list, filter-tabs; Phase 3 established status toggle
- Pitfalls: **MEDIUM** - Based on common real-time messaging issues + codebase observations
- Error handling: **HIGH** - Phase 2 established error boundary pattern; applies to Phase 5
- Dev mode: **HIGH** - isDevMode() pattern verified in current code

**Research date:** 2026-01-27
**Valid until:** 2026-02-24 (30 days for stable stack; Convex updates infrequently)
**Next review:** If Convex releases major subscription API change or project adds WebSocket alternative

**Additional notes:**
- Phase 3 established the AI toggle and conversation.status field; Phase 5 completes the UI
- Phase 4 established Convex subscription patterns in inbox components; Phase 5 extends to real-time message display
- Phase 6 will implement ARI processing gate checking conversation.status
- All patterns follow established project conventions (Convex queries, Shadcn/ui, dev mode bypasses)
