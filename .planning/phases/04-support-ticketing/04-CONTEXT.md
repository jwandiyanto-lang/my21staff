# Phase 4: Support Ticketing Core - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Trust-building feature — 4-stage workflow (Report → Discuss → Outcome → Implementation) for support tickets. Tables, status transitions, and email notifications. Requester can see ticket progress, staff can manage tickets.

</domain>

<decisions>
## Implementation Decisions

### Ticket Stages & Transitions
- 4 stages: Report → Discuss → Outcome → Implementation
- Stages can be skipped/altered by admin WITH approval from requester
- Approval mechanism: In-app only (requester sees pending approval in ticket view)
- Normal stage progression: Only assigned staff can move tickets
- Completion: Auto-close 7 days after reaching Implementation stage
- Requester can reopen if unsatisfied (via email link or in-app)

### Ticket Submission
- Required fields: Title, Description, Category, Priority
- Categories: Bug, Feature, Question (simple 3-way)
- Priority: Low, Medium, High (set by requester)
- Who can submit: Any workspace member
- Attachments: None for initial version (keep it simple)

### Comments & Discussion
- All comments visible to requester (full transparency, no internal notes)
- Who can comment: Any team member in the workspace
- Claude's Discretion: Comment structure (flat vs threaded) and formatting (plain vs markdown)

### Email Notifications
- Not automatic — admin chooses when to notify
- Toggle per action: Checkbox "Notify participants" when changing stage or commenting
- Recipients: All involved (requester + anyone who has commented)
- Auto-close email: Yes, with reopen link for requester

### Claude's Discretion
- Comment structure (recommend flat timeline for simplicity)
- Comment formatting (recommend basic markdown for code blocks)
- RLS policy structure for ticket visibility
- Status history table design
- Approval flow data model

</decisions>

<specifics>
## Specific Ideas

- 4-stage workflow is intentional: Report (what happened) → Discuss (clarify) → Outcome (decision) → Implementation (fix/ship)
- Trust-building focus — this is for Eagle as first paying client
- Transparency: requester sees all comments, no hidden internal notes
- Approval workflow for stage skipping adds accountability

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-support-ticketing*
*Context gathered: 2026-01-18*
