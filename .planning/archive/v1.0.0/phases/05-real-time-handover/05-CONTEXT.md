# Phase 5: Real-time & Handover - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable real-time WhatsApp message synchronization in Inbox using Convex subscriptions, and provide per-conversation AI/Human mode toggle. When AI mode is on, new messages trigger ARI processing; when off, messages wait for human response.

Scope:
- Real-time message updates (incoming from Kapso webhook → Convex → Inbox UI)
- Conversation list reordering and unread count updates
- AI/Human toggle in message thread
- Mode transition handling (cancel AI response when switching to Human)
- Visual indicators for mode status

Out of scope (other phases):
- Message sending functionality (already exists)
- ARI configuration (Phase 3)
- Flow logic changes (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Real-time Sync Behavior

**Timing:**
- Messages should appear instantly (< 500ms) after arriving via Kapso webhook
- Target: WhatsApp Web level of responsiveness

**Connection handling:**
- Claude's discretion for offline/connection drop handling
- Suggestion: Silent retry with optional offline indicator

**List reordering:**
- Immediately on new message (any message, incoming or outgoing)
- Conversation with new message moves to top of list

**Unread counts:**
- Update live via Convex subscriptions
- Badge updates immediately as messages arrive, even if viewing different conversation

**Subscription behavior:**
- Claude's discretion for subscription vs polling strategy
- Kapso webhook → Convex → subscription → UI re-render flow
- No manual refresh needed

**Background updates:**
- Claude's discretion for notification/toast when message arrives while viewing different conversation
- Suggestion: Badge update + optional subtle notification

### Mode Transition Handling

**AI to Human switch (toggle OFF):**
- Cancel AI response immediately
- No completion of in-flight responses
- Human takes over instantly

**Human to AI switch (toggle ON):**
- Wait for next customer message before AI responds
- AI does NOT send greeting or catch-up message immediately after toggle
- Silent activation

**Toggle confirmation:**
- Always confirm before switching modes (both directions)
- Modal or inline confirmation: "Switch to Human mode?" / "Enable AI mode?"
- Prevents accidental toggles

**Toggle feedback:**
- Inline message in chat thread after mode switch
- Example: "[You switched to Human mode]" or "[AI mode enabled]"
- System message style (gray, centered, timestamp)

### Status Indicators

**Mode in conversation list:**
- Badge on avatar showing mode (robot icon = AI, person icon = Human)
- Subtle, not intrusive

**AI typing indicator:**
- WhatsApp-style animated three-dot indicator
- Appears in message thread while AI is processing response
- Standard bubble with animation

**Thread header mode display:**
- Claude's discretion for exact header design
- Should include toggle button + clear visual state
- Suggestion: Toggle with label or status pill

**Sync status indicator:**
- Claude's discretion for connection status UI
- Suggestion: Small green/yellow/red dot or status bar only when offline
- Don't clutter UI if connection is good

### Claude's Discretion

Areas where Claude has flexibility:
- Exact offline handling strategy (banner, queue, retry logic)
- Background notification style (toast vs silent badge update)
- Thread header layout (toggle position, label format, styling)
- Sync status indicator design (dot, bar, or error-only)
- Message timing edge cases (race conditions, duplicate detection)
- Subscription reconnection logic
- Error state handling (failed toggle, webhook timeout)

</decisions>

<specifics>
## Specific Ideas

**Real-time flow:**
- Kapso sends message via webhook → API route saves to Convex → Convex subscription triggers Inbox re-render
- Instant sync means < 500ms from webhook arrival to UI update
- Convex subscriptions handle real-time updates (not Kapso WebSocket, since Kapso is webhook-based)

**Mode toggle UX:**
- Always confirm to prevent accidents
- Cancel AI immediately when switching to Human (don't let AI finish)
- Wait for customer message when switching to AI (don't greet proactively)
- Inline system message confirms mode switch

**Visual consistency:**
- Badge on avatar for mode indication (matches existing status badge pattern)
- WhatsApp-style three-dot typing animation (familiar UX)
- Clean, minimal indicators (don't over-design)

</specifics>

<deferred>
## Deferred Ideas

**Kapso MCP integration for testing:**
- User mentioned "we need to connect Kapso and test this feature"
- Testing with Kapso MCP tools is implementation detail, not a requirement
- Planner should include Kapso webhook testing in verification steps

</deferred>

---

*Phase: 05-real-time-handover*
*Context gathered: 2026-01-27*
