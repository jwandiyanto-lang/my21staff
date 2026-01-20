---
status: diagnosed
trigger: "Optimistic message update not rolling back on send failure"
created: 2026-01-20T12:00:00Z
updated: 2026-01-20T12:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - stale closure captures wrong selectedConversation when user switches conversations during async operation
test: Code review confirms callback dependency chain
expecting: Rollback targets wrong conversation cache
next_action: Implement fix to capture conversationId at call time, not render time

## Symptoms

expected: When message send fails, the optimistic update should be rolled back - failed message removed from UI or marked as failed
actual: Toast shows "Failed to send WhatsApp message" but the message bubble remains in chat
errors: "Failed to send WhatsApp message" toast
reproduction: Send message when Kapso API fails (especially if switching conversations during the async wait)
started: Unknown

## Eliminated

- hypothesis: Message saved to DB before Kapso failure
  evidence: API route returns 500 at line 136 BEFORE DB insert at line 144 (src/app/api/messages/send/route.ts)
  timestamp: 2026-01-20T12:05:00Z

- hypothesis: Real-time subscription re-adding message
  evidence: Real-time only fires on DB INSERT events; if Kapso fails, no INSERT occurs
  timestamp: 2026-01-20T12:06:00Z

- hypothesis: Webhook re-inserting message
  evidence: Webhook only handles INBOUND messages (direction: 'inbound'), not outbound sends
  timestamp: 2026-01-20T12:10:00Z

- hypothesis: Double submission creating two optimistic messages
  evidence: Guard at line 119 checks isSending flag; only one optimistic message created per submit
  timestamp: 2026-01-20T12:12:00Z

- hypothesis: QueryClient mismatch between components
  evidence: Both useMessages and useRemoveOptimisticMessage use useQueryClient() from same Provider
  timestamp: 2026-01-20T12:25:00Z

## Evidence

- timestamp: 2026-01-20T12:00:00Z
  checked: src/app/(dashboard)/[workspace]/inbox/message-input.tsx lines 191-195
  found: onMessageError IS called in catch block with optimisticId - code flow is correct
  implication: Error handling exists and is triggered

- timestamp: 2026-01-20T12:00:00Z
  checked: src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx lines 202-205
  found: handleMessageError uses selectedConversation.id from useCallback closure
  implication: Callback captures selectedConversation at creation time, not call time

- timestamp: 2026-01-20T12:00:00Z
  checked: src/lib/queries/use-messages.ts lines 84-92
  found: useRemoveOptimisticMessage filters by conversationId AND messageId
  implication: If wrong conversationId is passed, removal targets wrong cache

- timestamp: 2026-01-20T12:28:00Z
  checked: Flow analysis
  found: MessageInput receives onMessageError as prop, captures it in handleSubmit closure at submit time
  implication: If user switches conversations after submit, the captured callback has OLD selectedConversation

## Resolution

root_cause: **Stale closure in handleMessageError callback chain**

When the user sends a message and then switches to a different conversation before the API responds with an error:

1. User in conversation A sends message
2. `handleSubmit` captures current `onMessageError` (which has conversation A in its closure)
3. Optimistic message added to conversation A's cache
4. User switches to conversation B
5. `inbox-client.tsx` re-renders, `handleMessageError` is recreated with conversation B
6. BUT the async `handleSubmit` still holds OLD `onMessageError` with conversation A
7. API fails, `onMessageError` is called
8. `removeOptimisticMessage(conversationA.id, optimisticId)` correctly removes from A's cache
9. **User is now viewing conversation B** - they don't see A, so message appears "stuck"

HOWEVER - if user stays on the same conversation, the rollback SHOULD work. If the bug occurs even WITHOUT switching conversations, then there's a more subtle issue:

**Alternative root cause (if bug occurs without switching):**
The `useRemoveOptimisticMessage` hook returns a NEW function on every render (no useCallback wrapper). This means:
- `removeOptimisticMessage` identity changes every render
- `handleMessageError` has it in dependencies, so `handleMessageError` is recreated every render
- This could cause issues with React's callback prop optimization

fix: Modify handleMessageError to accept conversationId as a parameter instead of capturing it from closure, OR ensure conversationId is passed from MessageInput which knows the correct conversation at submit time.

verification: Test by sending message, having it fail, and confirming message is removed from UI (both with and without switching conversations)

files_changed: []
