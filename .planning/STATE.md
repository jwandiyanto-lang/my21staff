# Project State

## Project Reference

See: planning/PROJECT.md (updated 2026-01-27)

**Core value:** The system that lets you grow
**Current focus:** v3.4 Kapso Inbox Integration

## Current Position

Milestone: v3.4 Kapso Inbox Integration
Phase: 6 of 6 (ARI Flow Integration)
Plan: 1 of 3 in phase
Status: In progress - Mouth hot-reload configuration complete
Last activity: 2026-01-27 — Completed 06-01-PLAN.md (Mouth hot-reload configuration)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ██████████ | v3.2 ██████████ | v3.3 ██████████ | v3.4 █████████░ (~87%)

## Performance Metrics

**Velocity:**
- Total plans completed: 237 (all v3.3 phases + v3.4 phases 1-5 + 06-01)
- v3.3 execution: 7 phases, ~22 plans, 3 days (2026-01-25 to 2026-01-27)
- v3.4 execution: 6 phases (5 complete), 12 plans, ~65 min

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
| v3.4 | 6 | TBD | — |

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
- **Phase 6:** ARI Flow Integration (06-01, 06-03, 06-04) — In Progress
  - Plan 06-01: Mouth hot-reload configuration — ✓ Complete

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

### Next Phase Readiness

- Phase 5 (Real-time & Handover) COMPLETE (all 3 plans)
- Phase 6 (ARI Flow Integration) Plan 01 COMPLETE
- Hot-reload configuration working end-to-end (workspace.settings → Mouth system prompt)
- Persona changes in Your Intern immediately affect next bot response
- Flow stage changes immediately affect conversation instructions
- Ready for Plan 06-03 (Brain scoring rules integration)
- Ready for Plan 06-04 (Consultation slots routing integration)

## Session Continuity

Last session: 2026-01-27
Stopped at: Phase 6 Plan 01 complete (Mouth hot-reload configuration)
Resume: Ready for Phase 6 Plans 03 and 04 (Brain scoring + consultation slots)

**Files modified in Phase 6 Plan 01:**
- `convex/kapso.ts` — Enhanced getAriContext to extract persona, flowStages, scoringRules, consultationSlots from workspace.settings; Updated processARI to pass workspace config to Mouth
- `convex/ai/context.ts` — Added personaConfig and flowStages optional parameters to buildMouthSystemPrompt; Inject persona into system prompt; Use flow stages for state instructions
- `convex/ai/mouth.ts` — Added persona and flowStages optional args to generateMouthResponse; Pass workspace config to buildMouthSystemPrompt

**Recent commits:**
- `41fac1d` - feat(06-01): wire Mouth to use workspace config from getAriContext
- `ec1c473` - feat(06-01): update buildMouthSystemPrompt to use workspace config
- `a74ff21` - feat(06-01): enhance getAriContext to fetch workspace.settings config
- `90baa48` - fix(05-03): change Manual button color from orange to blue
- `065bdaa` - fix(05-03): wire toggle to parent state for bidirectional switching
- `5d2dcdd` - fix(05-03): make mode badge visible in conversation list

---

*Last updated: 2026-01-27 — Phase 6 Plan 01 complete (Mouth hot-reload configuration)*
