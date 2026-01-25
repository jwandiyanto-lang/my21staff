# Project State

## Project Reference

See: planning/PROJECT.md (updated 2026-01-25)

**Core value:** The system that lets you grow
**Current focus:** v3.3 Go Live — Phase 3: AI System

## Current Position

Milestone: v3.3 Go Live
Phase: 3 of 7 (AI System)
Plan: 3 of 4 complete
Status: Plan 03-03 complete
Last activity: 2026-01-25 — Completed 03-03 The Brain (Grok analytical AI)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ██████████ | v3.2 ██████████ | v3.3 ██████░░░░ (201 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 201
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
| 3. AI System | Dual-bot (Mouth + Brain) | 4 (AI-01 to 04) | Plan 3/4 complete |
| 4. Bot Workflow | Eagle qualification flow | 6 (BOT-01 to 06) | Not started |
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

**ARI Workspace Linkage (blocks AI responses):**
- Workspace with `kapso_phone_id` has ID `js7b1cwpdpadcgds1cr8dqw7dh7zv3a3`
- `ariConfig` was created for a different workspace ID
- **Fix required:** Update ariConfig.workspace_id in Convex dashboard to match kapso workspace
- See: planning/phases/03-ai-system/03-01-SUMMARY.md for detailed steps

## Accumulated Context

**Key Facts:**
- v3.3 production deployed at my21staff.com
- Convex deployment: https://intent-otter-212.convex.cloud
- Kapso webhook working, messages appear in inbox
- ARI system needs workspace linkage fix (different workspace IDs)

**Recent Decisions:**
- Phase numbering starts at 1 for new milestone
- Dual-AI architecture: "The Mouth" (Sea-Lion) + "The Brain" (Grok)
- Use `undefined` instead of `null` for optional Convex fields
- Use `withIndex` instead of `filter` callbacks in Convex queries
- aiUsage table tracks costs via workspace_id + conversation_id + model + ai_type
- Sea-Lion primary (free, local), Grok fallback (paid API) for The Mouth
- 10-message context window for Mouth (speed), 20 for Brain (analysis)
- Indonesian default language with English support
- Brain uses grok-beta model (~$5 per million tokens)
- JSON extraction handles Grok markdown wrapping via regex
- Cost queries filter by date range in memory after index lookup

**Known Issues for Phase 3:**
- ARI not enabled log: workspace ID mismatch between kapso lookup and ARI config
- Need to verify workspace linkage before AI responses work

## Session Continuity

Last session: 2026-01-25
Stopped at: Completed 03-03-PLAN.md
Resume: Next plan is 03-04 (Integration testing)

**Phase 3 Progress:**
- 03-01 ✓ AI Foundation (aiUsage table, Grok API verified, workspace issue documented)
- 03-02 ✓ The Mouth (Sea-Lion/Grok conversational AI) - convex/ai/context.ts, convex/ai/mouth.ts
- 03-03 ✓ The Brain (Grok analytical AI) - convex/ai/brain.ts, convex/ai/cost-tracker.ts
- 03-04 Pending - Integration testing

**Note:** Workspace linkage must be fixed in Convex dashboard before AI responses work in production.

---
*Last updated: 2026-01-25 — Plan 03-03 complete, Brain ready for integration*
