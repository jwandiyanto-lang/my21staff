# Phase 21: Lead Management Polish + Performance - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish lead management features and improve app performance. Fix broken/incomplete UI elements, add inline editing capabilities per lead row, and optimize chat/webhook response times.

</domain>

<decisions>
## Implementation Decisions

### Notes/Activity
- Show dates in activity view
- Auto-update at midnight Indonesia time (WIB, UTC+7)
- This refers to the notes section showing proper date formatting

### Assign Dropdown (Per Lead Row)
- Replace current dash display with dropdown menu
- Dropdown shows all workspace team members
- Default: assign to account owner if none selected
- Auto-populate with new team members as they're added
- Each lead row has its own assign dropdown

### Tags Dropdown (Per Lead Row)
- Add dropdown menu to edit tags per lead
- Allow adding/removing tags inline
- Each lead row has its own tags dropdown

### Info Box
- Fix current display issues (not showing properly)
- Ensure info panel renders correctly

### Performance
- Faster inbox/chat loading
- Faster webhook response times
- Check Vercel performance recommendations

### Claude's Discretion
- Dropdown component styling (use existing Shadcn patterns)
- Exact placement of dropdowns in lead rows
- Performance optimization approach (caching, query optimization, etc.)

</decisions>

<specifics>
## Specific Ideas

- The current "assigned to" shows a dash — needs to be interactive dropdown
- Tags should be editable inline, not just in detail view
- Focus on speed improvements after Vercel upgrade
- Indonesia timezone (WIB) for midnight refresh

</specifics>

<deferred>
## Deferred Ideas

- Direct Form to CRM + Telegram Notifications — moved to Phase 22

</deferred>

---

*Phase: 21-lead-polish-performance*
*Context gathered: 2026-01-17*
