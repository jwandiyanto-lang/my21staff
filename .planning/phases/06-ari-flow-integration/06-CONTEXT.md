# Phase 6: ARI Flow Integration - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end AI automation workflow — new WhatsApp leads trigger automatic greeting, progress through qualification questions, get scored at checkpoints, and routed to consultation (with human alert) or community (auto-join). Configuration changes in Your Intern (Persona, Flow, Database, Scoring, Slots) immediately affect live bot behavior without restart.

The Inbox UI (Phase 4) and AI/Human toggle (Phase 5) are already complete. This phase wires Your Intern configuration to the live ARI bot behavior.

</domain>

<decisions>
## Implementation Decisions

### New lead trigger behavior
- **Detection:** First message ever from phone number = new lead (contact doesn't exist in database)
- **Response timing:** 2-5 second delay before greeting (simulate typing, feels human)
- **Returning users:** Continue from where they left off in flow (resume at last checkpoint)
- **Handover context:** If conversation was in Manual mode (human responded), bot stays silent even when toggled back to AI mode until human explicitly switches it back to AI

### Config hot-reload mechanism
- **Reload timing:** Immediately on save — next bot response uses new config
- **Validation:** Strict validation before config goes live (e.g., flow must have ≥1 stage, scoring rules must be complete, required fields can't be blank)
- **In-progress conversations:** Finish current flow step with old config, then switch to new config for next step (prevents jarring mid-conversation personality shift)

### Flow state progression
- **State tracking:** Checkpoint notes at every stage — bot writes notes to conversation.notes field
- **Storage location:** Per-conversation notes field (persistent across conversation lifetime)
- **Off-script handling:** Answer user's off-topic question fully, then continue flow without re-asking previous question
- **Bot leading behavior:** Gentle steering — bot answers questions but always ends with next flow step ("By the way, to help you better, could you tell me...?")
- **Core principle:** Bot should lead conversation toward end goal (1-2 answers to user questions, then bot takes control and drives toward routing decision)

### Scoring and routing logic
- **Scoring cadence:** Only at flow checkpoints (not after every message) — discrete evaluation points
- **Scoring method:** Progressive scoring based on questionnaire answers + checkpoint benchmarks (multi-checkpoint accumulation)
- **Routing decision:** User decides (bot presents options: consultation vs community)
- **Routing execution:**
  - User chooses consultation → bot alerts human (handover notification)
  - User chooses community (or doesn't want to pay) → bot automatically routes to WhatsApp community
- **Post-routing:** Conversation closes automatically (status changes, bot stops responding)

### Claude's Discretion
- Admin feedback mechanism for config changes (toast notification, timestamp, or version number)
- Exact checkpoint note format and structure
- Specific wording for gentle steering transitions
- Error handling for failed routing actions

</decisions>

<specifics>
## Specific Ideas

- "Bot should lead, not just spend time answering questions" — 1-2 responses to user, then bot drives toward goal
- Checkpoint notes serve as audit trail for flow progression (visible in conversation.notes)
- Strict validation prevents broken configs from going live (e.g., incomplete scoring rules)
- User agency in final decision (consultation vs community), but bot executes routing automatically

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-ari-flow-integration*
*Context gathered: 2026-01-27*
