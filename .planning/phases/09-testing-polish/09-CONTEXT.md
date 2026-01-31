# Phase 9: Testing & Polish - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end verification that all systems connect and work together in production. Focus on connection verification and integration testing — not heavy research or new features. The goal is: Kapso connected, inbox chat working bidirectionally, Brain generating notes, Sarah v2 qualifying leads.

</domain>

<decisions>
## Implementation Decisions

### Kapso Connection Checks
- Verify BOTH Kapso message logs AND workflow execution history
- Test from Jonathan's personal WhatsApp to +62 813-1859-025
- Critical failures stop testing; minor issues logged and continued
- No formal test documentation — just fix issues as found

### Inbox Send/Receive Flow
- Full conversation flow required: start conversation, exchange multiple messages, see history
- Inbox must function like Kapso's native messaging — bidirectional, real-time, conversation continuity
- The CRM is the primary interface, not just a message viewer
- Must send messages via Kapso API (not read-only)
- Message latency target: under 5 seconds
- Verify during testing: is inbox using Convex real-time or Kapso polling?

### Brain/Grok Activation
- Focus on core functionality: summarize chats and create notes
- Notes display in lead detail panel (slide-out sheet)
- Both auto-generation and manual trigger available
- Auto-generate when conversation ends/pauses, plus manual refresh button
- Silent retry on Grok API failures (no user-facing errors unless persistent)

### Sarah v2 Handoff Flow
- End-to-end conversation test: new lead → Sarah qualifies → handoff
- Full handoff verification: dashboard notification + WhatsApp to Jonathan + Convex status change
- Test with both simulated leads (Jonathan pretends) and real incoming leads
- If Sarah responses need adjustment, edit the Kapso workflow prompt directly

### Claude's Discretion
- Determine severity threshold for stopping vs logging issues
- Choose test sequence order
- Decide on specific retry logic for API failures
- Performance optimization approaches

</decisions>

<specifics>
## Specific Ideas

- "I want the CRM works and can send message from it and it will work back and forth like Kapso messages"
- Inbox should feel native — not a secondary viewer, but the primary messaging interface
- Brain is about practical note-taking from conversations, not full analytics suite
- Sarah v2 should complete the full qualification journey without manual intervention

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-testing-polish*
*Context gathered: 2026-01-31*
