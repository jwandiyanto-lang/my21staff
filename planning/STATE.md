# Project State

## Project Reference

See: planning/PROJECT.md (updated 2026-01-25)

**Core value:** The system that lets you grow
**Current focus:** v3.3 Go Live — Phase 5 complete, Phase 6 ready

## Current Position

Milestone: v3.3 Go Live
Phase: 6 (UI Polish) — IN PROGRESS
Plan: 5 of 5+ complete (06-01 to 06-05)
Status: Gap closure complete, ready for verification
Last activity: 2026-01-27 — Completed 06-05 Dev/Prod Environment Parity

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ██████████ | v3.2 ██████████ | v3.3 █████████░ (220 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 220
- Milestones shipped: 7 (v1.0, v2.0, v2.1, v2.2, v3.0, v3.1, v3.2)

**By Milestone:**

| Milestone | Plans | Days |
|-----------|-------|------|
| v1.0 | 14 | <1 |
| v2.0 | 38 | 4 |
| v2.1 | 30 | 3 |
| v2.2 | 23 | <1 |
| v3.0 | 21 | 3 |
| v3.1 | 23 | 1 |
| v3.2 | 23 | 2 |
| v3.3 | 16 | In progress |

## v3.3 Roadmap Summary

**7 Phases, 30 Requirements:**

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1. Deployment | Fresh Vercel + production env | 4 (DEPLOY-01 to 04) | ✓ Complete |
| 2. Kapso Integration | WhatsApp webhook + messaging | 4 (KAPSO-01 to 04) | ✓ Complete |
| 2.1 UI Documentation | Document UI/buttons | N/A (inserted) | ✓ Complete |
| 3. AI System | Dual-bot (Mouth + Brain) | 4 (AI-01 to 04) | ✓ Complete (E2E verified) |
| 3.1 Inbox Enhancement | Profile, handover, merge | N/A (gap closure) | ✓ Complete |
| 4. Bot Workflow | Eagle qualification flow | 6 (BOT-01 to 06) | ✓ Complete |
| 5. Lead Flow | n8n → Convex sync | 3 (LEAD-01 to 03) | ✓ Complete |
| 6. Pricing Page | $497/$97/$297 plans | 4 (PRICE-01 to 04) | SKIPPED |
| 6. UI Polish | Smooth localhost | Derived from testing | In progress (5/5+ gap closure) |

**Coverage:** 30/30 requirements mapped (100%)

## v3.3 Milestone Context

**First Client:** Eagle Overseas Education
- Clerk org: `org_38fXP0PN0rgNQ2coi1KsqozLJYb`
- Ari persona already configured
- n8n webhook integration ready

**Bot Flow:**
1. Greet → Ask destination, documents, English level
2. Answer FAQs
3. Offer: Free Community (link) OR 1-on-1 Consultation (human handoff)

**Pricing (from economics doc):**
- Startup: $497 one-time
- Digital Receptionist: $97/mo
- Digital Pro: $297/mo

## Blocking Issues

**None** — All Phase 3 blockers resolved:

- ✓ GROK_API_KEY updated with valid key (2026-01-25)
- ✓ Workspace linkage correct (verified via admin:listAriConfigs)
- ✓ grok-beta → grok-3 migration complete
- ✓ processARI refactored to internalAction (can now call Mouth action)
- ✓ E2E flow verified with real AI responses

## Accumulated Context

**Key Facts:**
- v3.3 production deployed at my21staff.com
- Convex deployment: https://intent-otter-212.convex.cloud (HTTP endpoints use .convex.site)
- Kapso webhook working, messages appear in inbox
- ARI system fully operational with Grok-3 (Mouth + Brain)

**Recent Decisions:**
- Phase numbering starts at 1 for new milestone
- Dual-AI architecture: "The Mouth" (Grok-3) + "The Brain" (Grok-3)
- Use `undefined` instead of `null` for optional Convex fields
- Use `withIndex` instead of `filter` callbacks in Convex queries
- aiUsage table tracks costs via workspace_id + conversation_id + model + ai_type
- Grok-3 as primary model (grok-beta deprecated 2025-09-15)
- Sea-Lion disabled (not accessible from Convex cloud) — TODO: re-enable for local deployment
- 10-message context window for Mouth (speed), 20 for Brain (analysis)
- Indonesian default language with English support
- JSON extraction handles Grok markdown wrapping via regex
- Cost queries filter by date range in memory after index lookup
- processARI is internalAction (not mutation) so it can call other actions
- Helper mutations pattern: getAriContext, saveAriResponse, logOutboundMessage
- QualificationContext documents structure without runtime validation (uses v.any())
- State-specific instructions appended to base prompt for adaptive behavior
- Greeting instructions ask ONE thing at a time for natural conversation flow
- FAQ knowledge embedded directly in prompts rather than separate knowledge base
- Routing offers Community (free) or Consultation (1-on-1 with human) based on readiness
- Document collection: passport → CV → english_test → transcript (one at a time)
- updateAriContext uses deep merge for nested objects (collected, documents, routing)
- handleConsultationRequest sets minimum lead score 70 for hot consultation requests
- flagForHuman sets unread_count: 1 to ensure inbox visibility
- Brain changed from scheduler to direct call to enable next_action checks
- State/context passed through processARI → Mouth for adaptive responses
- Convex HTTP endpoints use .convex.site domain (not .convex.cloud)
- n8n webhook returns 'exists' status for duplicate phone (idempotent, not error)
- Lead status config stored in workspace.settings.lead_statuses (no schema migration needed)
- Default status keys: new, cold, warm, hot, client, lost (aligned with Brain temperature output)
- Brain fetches workspace status config before mapping temperature to status key
- Radix UI components with portals need unique key={contactId} props to force React instance recreation
- Server components should fetch only public data (no auth required)
- Client components fetch auth-protected data via useQuery with Clerk context
- Settings page AI config now fetched client-side to avoid SSR auth crashes
- Mock data supports dual type systems: Supabase (legacy) for MOCK_CONTACTS/WORKSPACE, Convex for MOCK_CONVEX_WORKSPACE
- Mock timestamps kept as strings (Supabase format) for type compatibility, not numbers (Convex format)
- lead_statuses in MOCK_CONVEX_WORKSPACE.settings enables Settings page functionality in dev mode

**Phase 3 Issues (All Resolved):**
- ✓ Workspace ID mismatch - actually correct, ariConfig linked to Eagle workspace
- ✓ processARI was mutation - refactored to internalAction
- ✓ GROK_API_KEY invalid - updated with valid key
- ✓ grok-beta deprecated - migrated to grok-3
- ✓ Sea-Lion timeout - disabled for Convex cloud (uses Grok directly)
- ✓ Brain not running - fixed scheduler call with await + error handling

## Session Continuity

Last session: 2026-01-27
Stopped at: Completed 06-05-PLAN.md (Dev/Prod Environment Parity)
Resume: Phase 6 gap closure complete, ready for human verification

**Phase 6 Progress (IN PROGRESS — 5/5+ gap closure complete):**
- 06-01 ✓ Settings Page Crash Fix - Moved AI config fetch from server to client component (fix SSR auth crash)
- 06-02 ✓ Database Dropdown Bug Fix - Added key={contactId} to DropdownMenu components (Status, Tags, Assignee)
- 06-03 ✓ Settings Page SSR Fix - Moved AI config fetch from server to client component
- 06-04 ✓ Contact Edit Form Fix - Fixed form state and API integration for contact updates
- 06-05 ✓ Dev/Prod Environment Parity - Added lead_statuses, kapso_name, workspace_id/user_id to mock data

**Gap Resolution (06-01 to 06-05):**
- Settings page no longer crashes on load (SSR auth fix)
- Database dropdowns properly re-render on contact switch (React key fix)
- Contact editing form functional (state management fix)
- Mock data enriched with Convex schema fields for dev mode testing
- Settings > Lead Stages tab now works in dev mode

**Phase 5 Progress (COMPLETE — 8/8):**
- 05-01 ✓ n8n Webhook Verification - Endpoint tested, duplicate detection verified, 228 leads confirmed
- 05-02 ✓ Lead Data Verification - Phone normalization verified for Indonesian formats, all test contacts visible
- 05-03 ✓ Lead Status Verification - Backend works, UI status mismatch found (gap noted)
- 05-04 ✓ Gap Closure (Status Mismatch) - API endpoint created for contact updates
- 05-05 ✓ Contact CRUD Operations - DELETE and PATCH endpoints implemented
- 05-06 ✓ Workspace Status Config - Brain reads workspace config, UI lib updated
- 05-07 ✓ Lead Stages Settings UI - Simplified UI with on/off toggle, inline editing
- 05-08 ✓ Human Verification - All functionality verified, user approved

**Gap Resolution (05-07/05-08):**
- Lead Stages tab added to Settings page
- Simplified UI: on/off toggle, inline editing, auto gradient colors
- Contact CRUD (edit/delete) verified working in dev mode
- statusConfig fallback chain handles unknown statuses gracefully

**Phase 4 Progress (COMPLETE — 6/6):**
- 04-01 ✓ Greeting State Awareness
- 04-02 ✓ Document Collection State
- 04-03 ✓ Routing & FAQ Context
- 04-04 ✓ Wire State/Context to Mouth + Brain next_action
- 04-05 ✓ Consultation Request Handling
- 04-06 ✓ E2E Verification

**Phase 3.1 Progress (COMPLETE):**
- 03.1-01 ✓ Inbox Enhancement - Profile sidebar, handover toggle, merge button
  - Added InfoSidebar to inbox-client.tsx (3-column layout)
  - Added AI/Human toggle button in message-thread.tsx
  - Added merge button in info-sidebar.tsx
  - Added updateConversationStatus mutation in conversations.ts

**Phase 3 Progress (COMPLETE):**
- 03-01 ✓ AI Foundation (aiUsage table, Grok API verified)
- 03-02 ✓ The Mouth (Grok-3 conversational AI) - convex/ai/context.ts, convex/ai/mouth.ts
- 03-03 ✓ The Brain (Grok-3 analytical AI) - convex/ai/brain.ts, convex/ai/costTracker.ts
- 03-04 ✓ Wire Orchestration - E2E verified
  - Refactored processARI from internalMutation to internalAction
  - Created helper mutations: getAriContext, saveAriResponse, logOutboundMessage
  - Created admin utilities: testAriProcessing, testBrainAnalysis, checkRecentActivity
  - E2E flow verified: webhook → processARI → Mouth → save → Kapso → log → Brain
  - Lead scoring working: contacts.lead_score updates from Brain analysis

**E2E Verification Results:**
- Mouth calls: 6 (grok-3)
- Brain calls: 2 (grok-3)
- Lead score updated: 0 → 25
- Lead temperature: cold
- Response time: < 3 seconds

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 002 | Rename Leads to Database and fix pagination | 2026-01-26 | e8b5603 | [002-rename-leads-to-database-and-fix-paginat](./quick/002-rename-leads-to-database-and-fix-paginat/) |
| 003 | Remove merge button, clear default tags | 2026-01-26 | 8d7954b | [003-database-ux-fixes](./quick/003-database-ux-fixes/) |

---
*Last updated: 2026-01-27 — 06-01 Settings Page Crash Fix complete*
