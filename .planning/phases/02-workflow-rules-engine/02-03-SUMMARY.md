---
phase: 02-workflow-rules-engine
plan: 03
subsystem: workflow
tags: [kapso-workflows, grok-ai, rules-engine, inbound-trigger]

# Dependency graph
requires:
  - phase: 02-workflow-rules-engine
    plans: [01, 02]
provides:
  - Kapso workflow with AI-powered rules engine
  - Inbound message trigger for WhatsApp
  - Grok-powered intent classification and responses
affects: [03-sarah-chat-bot, 05-grok-manager-bot]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Kapso native workflows (not custom code)
    - AI decide node for intent classification
    - Agent node for AI fallback responses
    - Mirror-only architecture (Kapso is source of truth)

key-files:
  created:
    - .kapso-project.env - Kapso project credentials
  modified:
    - (None - Kapso workflows are external)

key-decisions:
  - "Use Kapso native workflows instead of custom code"
  - "Kapso is the source of truth, Convex is for mirroring only"
  - "Grok 4.1-fast for AI decisions and responses"

patterns-established:
  - "Pattern: Kapso Workflows as primary automation layer"
  - "Pattern: AI decide node for keyword/intent classification"
  - "Pattern: Mirror data to Convex for dashboard (Phase 4+)"

# Metrics
duration: 45min
completed: 2026-01-30
---

# Phase 2 Plan 3: Kapso Workflow Rules Engine Summary

**AI-powered rules engine using Kapso native workflows with Grok for intent classification and responses**

## Performance

- **Duration:** 45 min
- **Started:** 2026-01-30T09:30:00Z
- **Completed:** 2026-01-30T09:45:00Z
- **Tasks:** 3

## Accomplishments

- Kapso workflow "Rules Engine - Keyword Triggers" created and activated
- AI decide node using Grok 4.1-fast for intent classification
- Inbound message trigger configured for +62 813-1859-025
- Five response paths: handoff, manager bot, FAQ pricing, FAQ services, AI agent
- Successfully tested - all triggers working

## Task Details

1. **Task 1: Setup Kapso API access**
   - Found correct API endpoint: `/platform/v1/workflows`
   - API key: `da99e74e320048a32cc3ff818615bed93a53f39bb62ce073ef8cffa85e778cc6`
   - Project ID: `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`

2. **Task 2: Create workflow with AI decide**
   - Workflow ID: `6cae069e-7d5c-4fbb-834d-79e1f66e4672`
   - Model: x-ai/grok-4.1-fast (ID: `882b9077-896e-473c-9fc0-d7af9ae0b093`)
   - 5 intent conditions: handoff, manager, faq_pricing, faq_services, ai_fallback

3. **Task 3: Configure trigger and test**
   - Trigger ID: `bdf48a18-4c39-453a-8a81-e7d14a18fe35`
   - Phone Number ID: `957104384162113`
   - Successfully tested all keyword triggers

## Kapso Details

**Project:** my21staff
- Project ID: `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`
- API Key: `da99e74e320048a32cc3ff818615bed93a53f39bb62ce073ef8cffa85e778cc6`

**Workflow:** Rules Engine - Keyword Triggers
- Workflow ID: `6cae069e-7d5c-4fbb-834d-79e1f66e4672`
- Status: Active
- Model: x-ai/grok-4.1-fast

**Phone Configuration:**
- Phone Number ID: `957104384162113`
- Config ID: `827ce387-4f0a-4ca7-9e5a-0a3af01c9320`
- Phone Number: +62 813-1859-025
- Customer ID: `d448fb7f-50cb-4451-892f-024122afb060`

**Trigger:**
- Trigger ID: `bdf48a18-4c39-453a-8a81-e7d14a18fe35`
- Type: inbound_message
- Status: Active

## Response Paths

| Intent | Trigger | Response |
|--------|---------|----------|
| handoff | "human", "speak to agent", "operator" | "Maaf, saya tidak bisa membantu..." |
| manager | "!summary" | "[Manager Bot] Summary feature coming in Phase 5!" |
| faq_pricing | "harga", "price", "biaya", "berapa" | "Untuk informasi harga..." |
| faq_services | "layanan", "services", "apa saja" | "Kami menyediakan layanan..." |
| ai_fallback | (no match) | Sarah (Grok) responds |

## Architecture Change

**Original Plan:** Custom code rules engine in webhook → Convex → responses
**Actual Implementation:** Kapso native workflows → Grok AI → direct WhatsApp responses

**Key Decision:** Kapso is the **source of truth** for automation. Convex will **mirror** data for dashboard (Phase 4+), but not control workflow logic.

## Files Created

- `.kapso-project.env` - Kapso credentials and configuration IDs

## Deviations from Plan

Plans 02-01 and 02-02 built a custom code rules engine. However, the user wanted to use Kapso's native workflow system instead. Plan 02-03 pivoted to:
- Delete custom rules engine code (no longer needed)
- Create workflows in Kapso using API
- Use Grok for AI decisions instead of custom logic

## Issues Encountered

1. **Wrong API endpoint** - Initially tried `/automation/projects` but correct endpoint is `/workflows`
2. **API key format** - Had to find working API key from Vercel env
3. **Missing provider_model** - AI decide node requires model ID, found in provider_models list

## User Setup Required

None - workflow is live and active.

## Test Results

✅ Handoff: "I want to speak to a human" → Correct Indonesian response
✅ Manager: "!summary" → "[Manager Bot] placeholder"
✅ FAQ Pricing: "Berapa harga?" → Pricing info
✅ FAQ Services: "Apa saja layanan?" → Services list
✅ AI Fallback: "Halo saya tertarik" → Grok responds conversationally

## Next Phase Readiness

- Phase 3 (Sarah Chat Bot) - Kapso already handles this via agent node
- Phase 4 (Lead Database) - Need to set up mirroring from Kapso to Convex
- Phase 5 (Grok Manager Bot) - Already have !summary trigger ready
- Phase 2.5 (Settings UI) - Will need API integration to read/modify Kapso workflows

## Important Notes

**DO NOT build custom workflow logic in code.** Use Kapso workflows for all automation. Convex is a **read mirror** for dashboard display only.

---
*Phase: 02-workflow-rules-engine*
*Completed: 2026-01-30*
