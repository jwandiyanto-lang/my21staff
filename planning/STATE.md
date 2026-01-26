# Project State

## Project Reference

See: planning/PROJECT.md (updated 2026-01-25)

**Core value:** The system that lets you grow
**Current focus:** v3.3 Go Live — Phase 3 Complete, ready for Phase 4: Bot Workflow

## Current Position

Milestone: v3.3 Go Live
Phase: 4 (Bot Workflow) — IN PROGRESS
Plan: 04-01-PLAN.md executed (1 of 6 complete)
Status: Greeting state awareness added to Mouth system prompt
Last activity: 2026-01-26 — Completed 04-01-PLAN.md

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ██████████ | v3.2 ██████████ | v3.3 █████████░ (207 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 207
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
| v3.3 | 7 | In progress |

## v3.3 Roadmap Summary

**7 Phases, 30 Requirements:**

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 1. Deployment | Fresh Vercel + production env | 4 (DEPLOY-01 to 04) | ✓ Complete |
| 2. Kapso Integration | WhatsApp webhook + messaging | 4 (KAPSO-01 to 04) | ✓ Complete |
| 2.1 UI Documentation | Document UI/buttons | N/A (inserted) | ✓ Complete |
| 3. AI System | Dual-bot (Mouth + Brain) | 4 (AI-01 to 04) | ✓ Complete (E2E verified) |
| 3.1 Inbox Enhancement | Profile, handover, merge | N/A (gap closure) | ✓ Complete |
| 4. Bot Workflow | Eagle qualification flow | 6 (BOT-01 to 06) | In progress (1/6 complete) |
| 5. Lead Flow | n8n → Convex sync | 3 (LEAD-01 to 03) | Not started |
| 6. Pricing Page | $497/$97/$297 plans | 4 (PRICE-01 to 04) | Not started |
| 7. UI Verification | E2E testing | 5 (UI-01 to 05) | Not started |

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
- Convex deployment: https://intent-otter-212.convex.cloud
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

**Phase 3 Issues (All Resolved):**
- ✓ Workspace ID mismatch - actually correct, ariConfig linked to Eagle workspace
- ✓ processARI was mutation - refactored to internalAction
- ✓ GROK_API_KEY invalid - updated with valid key
- ✓ grok-beta deprecated - migrated to grok-3
- ✓ Sea-Lion timeout - disabled for Convex cloud (uses Grok directly)
- ✓ Brain not running - fixed scheduler call with await + error handling

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 04-01-PLAN.md (Greeting state awareness)
Resume: Continue Phase 4 with 04-02-PLAN.md (Document collection state)

**Phase 4 Progress (IN PROGRESS — 1/6 complete):**
- 04-01 ✓ Greeting State Awareness
  - Added QualificationContext interface (collected, documents, routing)
  - Added buildGreetingInstructions helper function
  - Enhanced buildMouthSystemPrompt with state and context parameters
  - SUMMARY: planning/phases/04-bot-workflow/04-01-SUMMARY.md

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

---
*Last updated: 2026-01-26 — Phase 4 in progress (1/6 complete)*
