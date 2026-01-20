# Phase 1: Database Schema & Inbox Overhaul - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Foundation for ARI + improved inbox experience. Database tables for ARI functionality (contacts matching, conversation state, scoring) plus Kapso metadata caching for instant inbox loading. Real-time message updates and inbox filtering.

</domain>

<decisions>
## Implementation Decisions

### Contact Matching Logic
- Exact match on phone number
- If no match → create new contact automatically
- ARI asks "Have you filled the form?"
- If yes → "What name did you register under?" — use that name in the note
- If no → continue conversation anyway, gather info naturally
- ARI scores the lead and creates note: "Hot lead (85/100) - new number, registered as [name]"
- Human reviews and merges duplicates later

### Filter Behavior
- Active = contacts with unread messages only
- Always start on Active view (no persistence)
- Saved filter presets supported — users can save combinations like "Hot leads with unread"

### Real-time Updates
- Typing indicators shown ("Contact is typing...")
- Unread count in sidebar updates live — "Inbox (5)"
- Visual only — no sounds or browser notifications

### Claude's Discretion
- Phone number normalization approach (strip leading 0, +62 format, etc.)
- Loading state design (skeleton vs spinner)
- New message list behavior (auto-update vs banner)
- Offline/slow connection handling
- Tag filter logic (OR vs AND vs single)
- Chat auto-scroll behavior for new messages
- ARI conversation visibility for humans (live vs after handoff)

</decisions>

<specifics>
## Specific Ideas

- ARI conversational flow for duplicate detection: asks about form, then asks for registered name
- Note format includes score + confidence + self-reported name for human review
- Filter presets as a power-user feature for managing high-volume inboxes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-database-inbox-overhaul*
*Context gathered: 2026-01-20*
