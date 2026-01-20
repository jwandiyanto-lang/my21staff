# Phase 6: Admin Interface - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CRM settings for ARI configuration — persona, conversation flow, knowledge database, and scoring thresholds. Workspace owners can customize how their "Intern" (ARI) behaves. All settings live under the renamed "Your Intern" section in the admin navigation.

</domain>

<decisions>
## Implementation Decisions

### Persona Settings
- Field label: "Your Intern" (not "Bot Name" or "Assistant Name")
- Tone configuration: Free text description textarea (no preset dropdown)
- Language: Fixed Indonesian — not configurable (ARI language is baked in per deployment)
- Additional field: Greeting template — editable first message for new conversations
- Fields total: Name, Tone description, Greeting template

### Conversation Flow Config
- Fully custom stages — admin defines their own stages from scratch
- Each stage contains: Name + Goal + Sample script + Exit criteria
- Stages are ordered — ARI follows the defined sequence
- This replaces the hardcoded state machine (greeting → qualifying → scoring → booking)

### Knowledge Database
- Custom categories — client/admin creates their own sections (not predefined tabs)
- Simple key-value entries: Title + Content textarea (freeform, no structured fields)
- No bulk import — entries added one by one
- Primary editors: my21staff admins (you), not clients directly

### Scoring Config
- Editable values: Thresholds (hot/warm/cold) + Category weights
- Threshold UI: Sliders on 0-100 scale
- Weight UI: Points allocation (e.g., basic=25pts, qualification=35pts)
- No preview of impact on existing leads

### Claude's Discretion
- Whether to show impact preview when scoring changes (leaning toward no for simplicity)
- Exact slider component and validation
- How to handle stage transitions when flow config changes mid-conversation

</decisions>

<specifics>
## Specific Ideas

- Page renamed from "Knowledge Base" to "Your Intern"
- Tab order: Persona → Flow → Database → Scoring → Slots
- Workspace owners can view and edit their ARI settings (not admin-only)
- "Your Intern" naming reflects the brand positioning — ARI as a team member, not a bot

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-admin-interface*
*Context gathered: 2026-01-20*
