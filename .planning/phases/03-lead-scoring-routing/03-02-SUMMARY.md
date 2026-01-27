---
phase: 03-lead-scoring-routing
plan: 02
subsystem: ai
tags: [routing, lead-scoring, state-machine, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: calculateLeadScore, getLeadTemperature, ScoreBreakdown
provides:
  - determineRouting function with routing logic
  - temperatureToLeadStatus for CRM mapping
  - Score integration in processor.ts
  - Score syncing to contacts table
affects: [03-03 routing-ui, lead-detail-view, inbox-filters]

# Tech tracking
tech-stack:
  added: []
  patterns: [routing decision pattern, score persistence, CRM sync]

key-files:
  created:
    - src/lib/ari/routing.ts
  modified:
    - src/lib/ari/processor.ts
    - src/lib/ari/index.ts
    - src/lib/ari/context-builder.ts

key-decisions:
  - "Routing only triggers after qualification complete (all fields + all documents)"
  - "Hot leads: handoff to human for consultation offer"
  - "Warm leads: ARI continues nurturing"
  - "Cold leads: send community link then handoff with 30-day follow-up note"
  - "Score synced to contacts.lead_score for CRM visibility"
  - "Lead status maps: hot -> hot_lead, warm -> prospect, cold -> cold_lead"

patterns-established:
  - "Routing: use determineRouting(score, temp, formAnswers, docs, communityLink)"
  - "Score sync: update both ari_conversations and contacts tables"
  - "AI context: scoring state shows score breakdown and instructions"

# Metrics
duration: 6min
completed: 2026-01-20
---

# Phase 03 Plan 02: Routing Logic Summary

**Routing decision module integrated with processor to calculate scores during conversation and route leads based on temperature (hot/warm/cold) with CRM sync**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-20T13:37:00Z
- **Completed:** 2026-01-20T13:43:29Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- determineRouting returns appropriate routing action based on score/temperature
- Score calculated during message processing via processor.ts
- Score persisted to ari_conversations with breakdown and reasons
- Score synced to contacts.lead_score for CRM visibility
- Lead status auto-updates: hot_lead, prospect, cold_lead
- AI receives scoring context and instructions in system prompt

## Task Commits

Each task was committed atomically:

1. **Task 1: Create routing decision module** - `e052f15` (feat)
2. **Task 2: Integrate scoring and routing into processor** - `cb47e51` (feat)
3. **Task 3: Export routing and add scoring context to prompts** - `66d98d5` (feat)

## Files Created/Modified
- `src/lib/ari/routing.ts` - Routing decision logic with determineRouting and temperatureToLeadStatus
- `src/lib/ari/processor.ts` - Score calculation, persistence, CRM sync, routing integration
- `src/lib/ari/index.ts` - Export routing functions and types
- `src/lib/ari/context-builder.ts` - Scoring state context for AI prompts

## Decisions Made
- Routing only triggers after all required fields AND all documents are asked
- Hot leads get immediate handoff with "Ready for consultation offer" note
- Warm leads continue nurturing with ARI
- Cold leads receive community link (if configured) and 30-day follow-up note
- Score breakdown stored in ari_conversations.context.score_breakdown
- Lead status mapping aligns with existing CRM status values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Next.js build had filesystem temp file issues (unrelated to code changes)
- Verified with TypeScript compilation instead
- ScoreBreakdown type needed any cast for JSONB compatibility

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Routing logic ready for UI integration (03-03)
- Score visible in contacts table for lead list views
- AI prompts include score context for intelligent handoff

---
*Phase: 03-lead-scoring-routing*
*Completed: 2026-01-20*
