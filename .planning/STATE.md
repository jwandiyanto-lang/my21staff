# Project State

## Project Reference

See: planning/PROJECT.md (updated 2026-01-28)

**Core value:** The system that lets you grow
**Current focus:** v3.5 Production Go-Live

## Current Position

Milestone: v3.5 Production Go-Live
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-01-28 — Milestone v3.5 started

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ██████████ | v3.2 ██████████ | v3.3 ██████████ | v3.4 ██████████ (100%)

## Performance Metrics

**Velocity:**
- Total plans completed: 240 (all v3.3 phases + v3.4 phases 1-6 complete)
- v3.3 execution: 7 phases, ~22 plans, 3 days (2026-01-25 to 2026-01-27)
- v3.4 execution: 6 phases (ALL COMPLETE), 15 plans, ~76 min

**By Milestone:**

| Milestone | Phases | Plans | Days |
|-----------|--------|-------|------|
| v1.0 | 1 | 14 | <1 |
| v2.0 | 3 | 38 | 4 |
| v2.1 | 1 | 30 | 3 |
| v2.2 | 1 | 23 | <1 |
| v3.0 | 1 | 21 | 3 |
| v3.1 | 1 | 23 | 1 |
| v3.2 | 1 | 23 | 2 |
| v3.3 | 6 | 22 | 3 |
| v3.4 | 6 | 15 | <1 |

## Accumulated Context

### Decisions from v3.3

- Phase numbering continues: v3.4 starts at Phase 7 (v3.3 ended at Phase 6)
- Your Intern crashes (P0 blocker identified in research) — Phase 7 first
- Inbox UI replacement uses Kapso as pattern reference, not wholesale npm package swap
- Real-time updates via Convex subscriptions preserved (unchanged architecture)
- Budget model (Haiku) throughout (from config.json)

### Decisions from Phase 1 (Agent Skills Setup)

- User scope for MCP server (git push blocked, project scope would expose API key)
- Progressive disclosure pattern via agent-skills (contextual knowledge loading)

### Decisions from Phase 2 (Your Intern Debug)

**Plan 01:**
- shouldUseMockData() pattern for server components enables fully offline development
- isDevMode() helper for API routes provides consistent dev mode bypass
- Dev mode pattern: check isDevMode() && workspaceId === 'demo' before requireWorkspaceMembership

**Plan 02:**
- react-error-boundary library for tab-level error isolation
- TabErrorBoundary reusable component pattern

**UAT & Fixes:**
- MOCK_CONVEX_WORKSPACE._id must be 'demo' to match API route dev mode checks
- Sidebar navigation includes "Your Intern" link with Bot icon
- Dev mode works identically offline and online (no Supabase, Convex-only stack)

### Decisions from Phase 3 (Your Intern Configuration)

**Plan 01:**
- Global AI toggle placed above tabs as master control
- Auto-save on toggle change with toast notifications
- Status badge shows green when enabled, gray when disabled
- Dev mode bypass only for demo workspace (consistent with GET/PUT)
- AIToggle pattern: useState + useEffect + fetch + toast (matches PersonaTab)

**Plan 02:**
- Gate pattern verified: webhook handler checks ariConfig.enabled before scheduling processARI
- Gate located in handleKapsoWebhook (lines 383-387), not in processARI action
- Uses `continue` statement for efficient loop control
- DEFAULT_CONFIG includes enabled: true for dev mode consistency
- Convex schema has optional boolean enabled field for backward compatibility

### Decisions from Phase 4 (Inbox UI & Filtering)

**Plan 01:**
- Single-selection for status tabs (clicking replaces filter, not multi-select)
- AND logic for tag filters (conversations must have ALL selected tags)
- FilterTabs: WhatsApp-style horizontal tab interface with count badges
- TagFilterDropdown: Popover multi-select with alphabetical sorting
- getConversationCountsByStatus: Efficient contact-based status grouping with parallel fetches

**Post-plan refinements:**
- Converted status filter from horizontal tabs to dropdown menu for cleaner UI
- Optimized layout: Search at top, status dropdown below, Active/All + Tags in one row
- Reverted 2-column grid layout attempt (04-04, 04-05) - keeping original flex layout per user decision

### Decisions from Phase 5 (Real-time & Handover)

**Plan 01:**
- Confirmation dialog for ALL mode switches (prevents accidental handover)
- System messages in conversation thread (persistent record of mode changes)
- 2-second typing indicator simulation in dev mode (realistic UX testing)
- Mock conversations include mixed statuses ('open' for AI, 'handover' for Manual)
- Real-time sync via Convex subscriptions verified working (no changes needed)

**Plan 02:**
- Per-conversation handover mode gates ARI processing at webhook handler level
- Two-level gating: Global AI toggle (ariConfig.enabled) + per-conversation toggle (conversation.status)
- Gate order: Check global toggle first, then per-conversation status (performance optimization)
- Early exit pattern with `continue` matches existing gate from Phase 03-02
- Status values: 'open' = AI active, 'handover' = Human mode, 'closed' = Archived

**Plan 03:**
- Visual mode indicators: Badge with icon + text beside status tag in conversation list
- Mode indicator in message thread header next to contact name
- Consistent color scheme: Green for AI mode, Blue for Human mode
- Button color matches badge color (green "ARI Active" / blue "Manual")
- Parent state management: conversationStatusOverrides for toggle persistence in dev mode
- Toggle works bidirectionally with proper state flow from parent to child components

### v3.4 Phase Structure

- **Phase 1:** Agent Skills Setup (01-01) — ✓ Complete (Kapso skills + MCP server)
- **Phase 2:** Your Intern Debug (02-01, 02-02) — ✓ Complete (page routing + API dev mode + error boundaries)
- **Phase 3:** Your Intern Configuration (03-01 to 03-07) — ✓ Complete
  - Plan 03-01: Global AI Toggle Component — ✓ Complete
  - Plan 03-02: Wire toggle to processARI gate — ✓ Complete
- **Phase 4:** Inbox UI & Filtering (04-01 to 04-03) — ✓ Complete
  - Plan 04-01: Filter UI components — ✓ Complete
  - Plan 04-02: Message bubbles and auto-scroll — ✓ Complete
  - Plan 04-03: Integrate filters into inbox-client — ✓ Complete
  - Post-plan: Converted tabs to dropdown + optimized layout — ✓ Complete
- **Phase 5:** Real-time & Handover (05-01, 05-02, 05-03) — ✓ Complete
  - Plan 05-01: Real-time sync verification + AI/Human toggle UI — ✓ Complete
  - Plan 05-02: Wire AI/Human toggle to processARI gate — ✓ Complete
  - Plan 05-03: Visual mode indicators + end-to-end verification — ✓ Complete
- **Phase 6:** ARI Flow Integration (06-01, 06-02, 06-03, 06-04) — ✓ COMPLETE
  - Plan 06-01: Mouth hot-reload configuration — ✓ Complete
  - Plan 06-02: Brain scoring rules integration — ✓ Complete
  - Plan 06-03: Consultation slots routing — ✓ Complete
  - Plan 06-04: End-to-end verification — ✓ Complete

### Coverage Status

- v3.4 requirements: 17 total (6 INBOX, 7 INTERN, 4 ARI)
- Mapped to phases: 17/17 (100%)
- No orphans, no duplicates

### Active Blockers

**None** — All v3.3 blockers resolved:
- ✓ Settings page SSR auth crash fixed (Phase 06-03)
- ✓ Database dropdown re-render fixed (Phase 06-04)
- ✓ Mock data schema parity achieved (Phase 06-05)

**v3.4 research highlights:**
- Your Intern debugging is CRITICAL first phase (P0 blocker mentioned in research)
- Kapso integration uses wrapper pattern (not wholesale replacement)
- ARI behavior feeds from Your Intern config (tight coupling)

### Decisions from Phase 6 (ARI Flow Integration)

**Plan 01:**
- Hot-reload configuration: getAriContext fetches workspace.settings on every call (no caching)
- Persona config precedence: workspace.settings.persona overrides ariConfig.bot_name
- Flow stages fallback: Use hardcoded instructions if workspace flow stages not configured
- Workspace config flow: getAriContext → processARI → Mouth → buildMouthSystemPrompt
- Optional config parameters pattern with backward-compatible fallback values

**Plan 02:**
- Brain scoring thresholds dynamically configured via workspace.settings.scoring_rules
- Dynamic scoring weights (basic, qualification, document, engagement) from workspace config
- Dynamic temperature thresholds (hot/warm/cold) configurable per workspace
- next_action field persisted to ariConversations for debugging AI's planned next step
- buildBrainSystemPrompt accepts optional scoringRules parameter with fallback to defaults
- saveNextAction mutation persists Brain's next step after analysis
- Changing Scoring tab in Your Intern immediately affects next lead_score calculation

**Plan 03:**
- getAvailableSlotsFromConfig filters workspace slots to available: true only
- formatAvailableSlots provides graceful degradation message when no slots
- Consultation slots injected into routing and scheduling state prompts
- Complete data flow: workspace.settings → getAriContext → processARI → Mouth → buildMouthSystemPrompt
- Bot offers only workspace-configured available times

**Plan 04:**
- Mock ARI conversations demonstrate realistic flow progression (greeting → qualifying → routing)
- next_action field visible for debugging AI's planned steps
- Toast notifications already present in all Your Intern tabs (no changes needed)
- Human verification confirms code integration but notes dev mode limitations
- Production testing required for full hot-reload verification with live Kapso webhooks

### Next Phase Readiness

**v3.4 MILESTONE COMPLETE (100%)**

All 6 phases complete:
- ✓ Phase 1: Agent Skills Setup (Kapso MCP server)
- ✓ Phase 2: Your Intern Debug (dev mode + error boundaries)
- ✓ Phase 3: Your Intern Configuration (AI toggle + persona + flow + scoring + slots)
- ✓ Phase 4: Inbox UI & Filtering (status + tags + message bubbles)
- ✓ Phase 5: Real-time & Handover (AI/Human toggle + mode indicators)
- ✓ Phase 6: ARI Flow Integration (hot-reload config for Mouth + Brain + routing)

**Complete integration chain:**
- workspace.settings → getAriContext → processARI → Mouth/Brain → bot response
- Persona, flow stages, scoring rules, consultation slots all wired
- Config changes in Your Intern tabs immediately affect next bot response (no restart)
- Toast notifications confirm every save operation
- Mock data supports demo mode testing

**Production readiness:**
- Code integration verified and working
- Dev mode testing complete (within limitations)
- Production testing pending: Live Kapso webhooks, persistent config, full hot-reload verification
- Ready for deployment and user acceptance testing

## Session Continuity

Last session: 2026-01-28
Stopped at: Phase 6 complete (v3.4 milestone 100%)
Resume: v3.4 milestone complete - ready for next milestone planning

**Files modified in Phase 6 Plan 04:**
- `src/lib/mock-data.ts` — Added MOCK_ARI_CONVERSATIONS with flow progression examples
- `src/app/(dashboard)/[workspace]/knowledge-base/knowledge-base-client.tsx` — Documented toast notification pattern

**Recent commits:**
- `55e96ac` - feat(06-02): wire processARI to pass scoring_rules and save next_action
- `5f10c9a` - feat(06-02): update Brain to use workspace scoring_rules
- `a07085d` - feat(06-02): add next_action field to ariConversations schema
- `41fac1d` - feat(06-01): wire Mouth to use workspace config from getAriContext
- `ec1c473` - feat(06-01): update buildMouthSystemPrompt to use workspace config
- `a74ff21` - feat(06-01): enhance getAriContext to fetch workspace.settings config

---

*Last updated: 2026-01-28 — v3.4 Kapso Inbox Integration COMPLETE (100%)*
