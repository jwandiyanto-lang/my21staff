# Phase 3: Dashboard - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Workspace overview showing stats, activity feed, and quick actions. Users see a summary of their CRM at a glance.

**In scope:** Stats cards, activity feed, quick actions, empty/loading states
**Out of scope:** Todo section with notes (Phase 3.1), customizable actions (future), AI metrics (future)

</domain>

<decisions>
## Implementation Decisions

### Stats Layout
- Show available data only: total contacts, total conversations, status breakdown
- Simple cards — number + label, clean and minimal
- Time filter: weekly / monthly / all time toggle
- Card layout: Claude's discretion based on content

### Activity Feed
- Events to show: form fills, chat summaries (daily), notes added by users
- Per-contact activity aggregated into workspace feed
- Full history retained, displayed as infinite scroll
- Click behavior depends on type:
  - Form fill → open contact detail dialog
  - Chat summary → open conversation in inbox
  - Note → open contact detail dialog

### Quick Actions
- Fixed set for v3.2 (customization deferred)
- Include: Add Contact + navigation shortcuts (Inbox, Database)
- Position: Claude's discretion based on layout

### Empty/Loading States
- Loading: Claude decides (skeleton or spinner)
- Empty workspace: Show onboarding checklist
- Checklist content: Claude designs appropriate steps
- Checklist behavior: Auto-hide when all steps complete (not manually dismissable)

### Claude's Discretion
- Stats card layout arrangement
- Loading state implementation
- Quick action positioning
- Onboarding checklist specific steps
- Default quick actions selection

</decisions>

<specifics>
## Specific Ideas

- User mentioned wanting adjustable stats in the future (weekly/monthly/all time filter included now)
- Quick actions should be adjustable in future — noted for later phase
- Full AI metrics vision: total leads, chats handled by AI, leads qualified, spam texts, time saved by bot — deferred until ARI data available

</specifics>

<deferred>
## Deferred Ideas

### Phase 3.1: Todo Section
- Todo area on dashboard connected to contact notes
- Notes with due dates become todos
- Add new todos directly from dashboard
- View: history (completed) and upcoming (by due date)
- This is a meaningful feature requiring its own phase

### Future Phases
- Customizable quick actions (user selects which actions to show)
- Customizable stats cards (user picks which metrics)
- AI metrics: chats handled by bot, leads qualified, spam filtered, time saved
- Settings integration for dashboard personalization

</deferred>

---

*Phase: 03-dashboard*
*Context gathered: 2026-01-24*
