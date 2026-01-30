# Phase 3: Your Intern Configuration - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

User configures bot behavior across 5 tabs (Persona, Flow, Database, Scoring, Slots) with one global AI toggle. The bot itself already works (from v3.3) — this phase delivers the admin UI for controlling personality, conversation flow, data collection, lead scoring, and scheduling.

Configuration changes should immediately affect bot behavior. No restart required.

</domain>

<decisions>
## Implementation Decisions

### Global AI Toggle
- **Placement:** Top of page, above tabs — always visible as master control
- **Toggle behavior:** When OFF, all AI processing stops (processARI skips execution)
- **Tab editing:** Claude's discretion — decide whether tabs should be editable when toggle is OFF
- **Persistence:** Toggle state saves to workspace.settings immediately (no save button needed)

### Lead Handover Notification
- **Notification location:** Dashboard display (in-app only for now)
- **Trigger logic:** Configurable in Flow tab — workflow steps have trigger conditions; if 3 conditions met, mark as "notify admin"
- **Good lead definition:** Not score-based; defined by workflow triggers configured in Flow tab
- **Future scope:** WhatsApp notification to admin is deferred (noted for later phase)

### Claude's Discretion
- Tab layout style (horizontal tabs vs vertical sidebar vs other)
- Whether tabs are editable when AI toggle is OFF
- Form input types (textarea vs rich editor for Persona/Flow)
- Scoring rules UI (JSON editor vs visual builder)
- Slots UI (calendar vs list view)
- Auto-save behavior for individual tab settings

</decisions>

<specifics>
## Specific Ideas

- "The Your Intern looks nice right now" — keep existing visual style/layout pattern
- Dashboard notification system should be simple for now (not over-engineered)
- Flow tab will have workflow step configuration with trigger conditions (if 3 hit → notify)

</specifics>

<deferred>
## Deferred Ideas

- WhatsApp notification to admin when good lead identified — future phase (messaging integration)
- More sophisticated notification routing — note for backlog

</deferred>

---

*Phase: 03-your-intern-configuration*
*Context gathered: 2026-01-27*
