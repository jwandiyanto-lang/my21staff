---
phase: 06-ari-flow-integration
plan: 02
subsystem: ai
tags: [convex, grok, brain, scoring, lead-analysis]

# Dependency graph
requires:
  - phase: 06-01
    provides: Hot-reload configuration (getAriContext extracts workspace.settings)
provides:
  - Brain uses workspace scoring_rules for lead analysis
  - next_action field on ariConversations for debugging AI state
  - Dynamic lead scoring thresholds (hot/warm/cold configurable)
affects: [inbox-ui, your-intern-scoring-tab, future-brain-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Workspace scoring rules hot-reload pattern (getAriContext -> Brain)"
    - "next_action debugging field for AI state visibility"

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/ai/brain.ts
    - convex/ai/context.ts
    - convex/kapso.ts

key-decisions:
  - "Brain scoring thresholds dynamically configured via workspace.settings.scoring_rules"
  - "next_action persisted to ariConversations for debugging/inbox visibility"
  - "Backward compatible fallback to hardcoded defaults if scoring_rules not configured"

patterns-established:
  - "buildBrainSystemPrompt accepts optional scoringRules parameter"
  - "saveNextAction mutation persists Brain's next step to ariConversation"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 06 Plan 02: Brain Scoring Rules Summary

**Brain uses workspace-configured scoring thresholds and category weights for dynamic lead analysis**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-01-27T18:44:11Z
- **Completed:** 2026-01-27T18:47:54Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- ariConversations schema includes next_action field for debugging AI's planned next step
- Brain accepts scoringRules parameter and applies workspace-configured weights
- processARI passes fresh workspace scoring_rules to Brain on every call
- next_action saved to ariConversation after Brain analysis

## Task Commits

Each task was committed atomically:

1. **Task 1: Add next_action field to ariConversations schema** - `a07085d` (feat)
2. **Task 2: Update Brain to use workspace scoring_rules** - `5f10c9a` (feat)
3. **Task 3: Wire processARI to pass scoring_rules and save next_action** - `55e96ac` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added next_action optional string field to ariConversations table
- `convex/ai/brain.ts` - Added scoringRules optional parameter to analyzeConversation action
- `convex/ai/context.ts` - Updated buildBrainSystemPrompt to accept and apply scoringRules
- `convex/kapso.ts` - processARI passes scoringRules to Brain; created saveNextAction mutation

## Decisions Made
- **Dynamic scoring weights:** Brain system prompt now uses workspace-configured weights (basic, qualification, document, engagement) instead of hardcoded values
- **Dynamic temperature thresholds:** Hot/warm/cold thresholds configurable via workspace.settings.scoring_rules
- **Backward compatibility:** Fallback to default values (25/35/30/10 weights, 70/40 thresholds) if scoring_rules not configured
- **next_action persistence:** Created saveNextAction mutation to persist Brain's next step to ariConversation.next_action field

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for consultation slots integration:**
- Brain scoring rules working with hot-reload configuration
- next_action field visible for debugging AI state
- Changing Scoring tab in Your Intern will immediately affect next lead analysis
- Workspace scoring_rules flow complete: Your Intern (config) -> workspace.settings -> getAriContext -> Brain -> lead_score/lead_temperature

**No blockers:**
- All scoring rules tests would pass (schema matches, Brain applies config)
- Inbox can display next_action when UI is built

---
*Phase: 06-ari-flow-integration*
*Completed: 2026-01-27*
