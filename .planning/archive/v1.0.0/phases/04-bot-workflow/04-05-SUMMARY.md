---
phase: 04-bot-workflow
plan: 05
subsystem: ai
tags: [convex, mutations, helpers, consultation, handoff]

# Dependency graph
requires:
  - phase: 03-ai-system
    provides: AI foundation with updateConversationState mutation
  - phase: 04-01
    provides: QualificationContext interface structure
provides:
  - handleConsultationRequest helper function for consultation flow
  - updateAriContext mutation for context merging
  - flagForHuman and findConversationByContact supporting mutations
affects: [04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Helper functions called by actions pattern
    - Deep merge pattern for nested context objects
    - Internal query/mutation pattern for action-to-database operations

key-files:
  created: []
  modified:
    - convex/kapso.ts

key-decisions:
  - "updateAriContext uses deep merge for nested objects (collected, documents, routing)"
  - "flagForHuman sets unread_count: 1 to ensure visibility"
  - "handleConsultationRequest sets minimum lead score 70 for hot consultation requests"

patterns-established:
  - "Helper functions called via ctx.runMutation/runQuery from internalAction"
  - "Deep merge pattern preserves existing context while adding new fields"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 04 Plan 05: Consultation Request Handling Summary

**handleConsultationRequest helper with updateAriContext, flagForHuman, and findConversationByContact mutations enable Brain to trigger human handoff when users request consultation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T03:26:30Z
- **Completed:** 2026-01-26T03:28:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- updateAriContext mutation merges new data with existing context using deep merge for nested objects
- handleConsultationRequest helper updates state, context, and flags conversation for human attention
- flagForHuman mutation marks conversation as open with unread_count: 1
- findConversationByContact query locates conversation by contact_id for status updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add updateAriContext mutation** - `5b1524f` (feat)
2. **Task 2: Add handleConsultationRequest helper and supporting mutations** - `26d9dca` (feat)

## Files Created/Modified
- `convex/kapso.ts` - Added internalQuery import, updateAriContext mutation, handleConsultationRequest helper function, flagForHuman mutation, findConversationByContact query

## Decisions Made
- updateAriContext uses deep merge for collected/documents/routing nested objects to preserve existing data while adding new fields
- flagForHuman sets unread_count to 1 (not increment) to ensure conversation appears in inbox even if already read
- handleConsultationRequest sets lead score to minimum 70 (hot lead) when consultation requested
- consultation_requested_at timestamp added to routing context for tracking when handoff occurred

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 04-04 (Wire Brain next_action):
- handleConsultationRequest helper exists and is callable
- updateAriContext mutation ready to be called by processARI
- flagForHuman mutation ready for conversation status updates
- findConversationByContact query enables conversation lookup

Plan 04-04 Task 4 will wire Brain's next_action to call handleConsultationRequest when next_action is "offer_consultation" or "handoff_human".

---
*Phase: 04-bot-workflow*
*Completed: 2026-01-26*
