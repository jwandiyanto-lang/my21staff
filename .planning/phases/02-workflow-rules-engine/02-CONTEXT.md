# Phase 2: Workflow Rules Engine - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure Kapso's native workflow system to handle rule-based automation before AI processes messages. This phase establishes the workflow structure and routing logic — no hardcoded values, all configurable via Settings UI (Phase 2.5).

**Scope:**
- Keyword trigger workflow structure
- Lead routing logic (new vs returning)
- FAQ template response structure
- Conditional routing (rules → AI fallback)

**Out of scope:**
- Specific keyword values (configured in Settings UI)
- Detailed message templates (configured in Settings UI)
- Complex conditional logic (configured in Settings UI)

</domain>

<decisions>
## Implementation Decisions

### Workflow Configuration Philosophy
- All workflows use placeholder/dummy values
- Every parameter is configurable via Settings UI
- No hardcoded keywords, templates, or routing logic
- Build the ecosystem structure first, tune later

### Keyword Trigger Structure
- Workflows accept keyword lists as variables (not hardcoded)
- Case sensitivity and matching mode configurable per trigger
- Multiple keywords per workflow supported
- Specific keywords set in Phase 2.5 Settings UI

### Lead Routing Logic
- Detection method: Thread-based + 24h time window
- New leads: Brief greeting with context resume
- Returning leads: Context-aware resume from previous thread
- Detailed routing rules configurable in Settings UI

### Fallback Behavior
- Claude's discretion for initial implementation
- Default: Pass unmatched messages to AI webhook
- Template responses for common cases (pricing, hours, services)
- All fallback rules configurable in Settings UI

### Testing Approach
- Live WhatsApp testing from real device
- Send test messages and observe workflow triggers
- Verify logs show correct routing decisions
- Settings UI test panel available for verification (Phase 2.5)

### Claude's Discretion
- Exact workflow graph structure in Kapso
- Variable naming conventions
- Default placeholder values
- Error handling and retry logic
- Specific FAQ template wording

</decisions>

<specifics>
## Specific Ideas

- "Build the ecosystem first, configure details later"
- All CRM parameters settable through Settings UI
- Dummy answers/templates that can be changed easily
- When full picture is ready, adjust and apply via Settings

</specifics>

<deferred>
## Deferred Ideas

- Specific keyword values (human, agent, !summary) — Phase 2.5
- FAQ template content (pricing, services, hours) — Phase 2.5
- Detailed routing rules and conditions — Phase 2.5
- Conversation context persistence details — Phase 4 (Database)

</deferred>

---

*Phase: 02-workflow-rules-engine*
*Context gathered: 2026-01-30*
