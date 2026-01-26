---
phase: 04-bot-workflow
plan: 03
subsystem: ai
tags: [grok, ai-prompts, bot-persona, routing, faq]

# Dependency graph
requires:
  - phase: 03-ai-system
    provides: AI foundation with Mouth and Brain dual-bot architecture
provides:
  - Routing state handler offering Community vs Consultation paths
  - Eagle FAQ knowledge embedded in bot prompts
  - buildRoutingInstructions helper for next-step guidance
  - buildEagleFAQ helper with Eagle service knowledge
affects: [04-04-wire-brain, 04-05-handoff, 04-06-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State-specific prompt instructions via switch statement"
    - "FAQ knowledge embedded in system prompts"
    - "Routing logic with community link injection"

key-files:
  created: []
  modified:
    - convex/ai/context.ts

key-decisions:
  - "FAQ embedded directly in prompts rather than separate knowledge base"
  - "Routing instructions include examples in Indonesian for natural responses"
  - "Pricing questions deflected to human team (no specific numbers)"

patterns-established:
  - "Helper functions for state-specific instructions (buildRoutingInstructions, buildEagleFAQ)"
  - "FAQ section included in all Mouth prompts for consistent knowledge"
  - "Community link passed as optional parameter from ariConfig"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 04 Plan 03: Routing & FAQ Context Summary

**Bot can now offer Community vs Consultation paths and answer common Eagle questions via embedded FAQ knowledge**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T03:20:29Z
- **Completed:** 2026-01-26T03:22:47Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Routing state handler with Community/Consultation choice logic
- Eagle FAQ knowledge (services, destinations, visa success rate)
- Pricing deflection strategy (refer to team)
- Indonesian and English FAQ versions with natural examples

## Task Commits

Each task was committed atomically:

1. **Task 1: Add buildRoutingInstructions helper** - `b8f6c1a` (feat)
2. **Task 2: Add Eagle FAQ knowledge to system prompt** - `a62b679` (feat)

_Note: Plan 04-01 added QualificationContext interface and buildGreetingInstructions in parallel (commits 0ec3a68, 54986e1)_

## Files Created/Modified
- `convex/ai/context.ts` - Added buildRoutingInstructions and buildEagleFAQ helpers, updated buildMouthSystemPrompt to include FAQ section and routing state

## Decisions Made

**1. FAQ embedded in prompts**
- Rationale: Simpler than separate knowledge base, ensures consistent availability
- Alternative considered: External FAQ document with RAG retrieval
- Decision: Direct embedding for MVP, can migrate to RAG if FAQ grows large

**2. Routing examples in Indonesian**
- Rationale: Natural language examples improve bot responses in target language
- Includes both customer choices (community/consultation) with appropriate responses

**3. Pricing deflection to team**
- Rationale: Pricing may vary by customer, safer to have humans discuss
- Bot instructed to never give specific numbers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Plan 04-01 added QualificationContext interface in parallel, which this plan references. Both plans worked together without conflicts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- 04-04: Wire Brain to update conversation state based on analysis
- 04-05: Handoff logic when Brain recommends human intervention
- 04-06: End-to-end verification of complete bot workflow

**Context for next plans:**
- buildMouthSystemPrompt now accepts: `state`, `context`, `communityLink` parameters
- State values: "greeting", "routing" (more to be added by 04-02)
- FAQ knowledge available to bot for answering common questions
- Community link comes from `ariConfig.community_link` field

---
*Phase: 04-bot-workflow*
*Completed: 2026-01-26*
