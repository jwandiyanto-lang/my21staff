---
phase: 04-bot-workflow
plan: 02
subsystem: ai
tags: [convex, grok, qualification, documents]

# Dependency graph
requires:
  - phase: 04-01
    provides: QualificationContext interface and buildGreetingInstructions helper
provides:
  - buildQualifyingInstructions helper for document collection
  - formatCollectedData helper to show collected qualification data
  - Qualifying state support in buildMouthSystemPrompt
affects: [04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [document-collection-flow, one-at-a-time-qualification]

key-files:
  created: []
  modified: [convex/ai/context.ts]

key-decisions:
  - "Documents asked one at a time: passport -> CV -> IELTS/TOEFL -> transcript"
  - "Use null/undefined check for 'not asked yet' state in documents"
  - "Collected data shown in system prompt to maintain context"

patterns-established:
  - "State-specific instructions pattern: switch statement based on conversation state"
  - "Helper functions for each state (buildGreetingInstructions, buildQualifyingInstructions, buildRoutingInstructions)"
  - "formatCollectedData shows bot what info has been gathered"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 04 Plan 02: Qualifying State Awareness Summary

**Document collection flow with one-at-a-time questioning (passport -> CV -> IELTS -> transcript) and collected data context**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T03:20:29Z
- **Completed:** 2026-01-26T03:24:21Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added buildQualifyingInstructions helper that determines next document to ask about
- Added formatCollectedData helper to show bot what qualification data has been collected
- Wired qualifying state into buildMouthSystemPrompt switch statement
- Bot now tracks document collection progress and asks one document at a time

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Add qualifying state support** - `9c7641e` (feat)
   - Added buildQualifyingInstructions helper
   - Added formatCollectedData helper
   - Updated buildMouthSystemPrompt switch statement

## Files Created/Modified
- `convex/ai/context.ts` - Added qualifying state awareness with document collection flow

## Decisions Made

**Document collection order:**
- Fixed sequence: passport -> CV -> IELTS/TOEFL -> transcript
- Ensures consistent experience across conversations
- Bot can track which documents still need to be asked about

**State detection:**
- Use `undefined` or `null` to mean "not asked yet"
- Use `true` to mean "have document"
- Use `false` to mean "don't have document"
- This allows Brain to distinguish between "not asked" and "asked but don't have"

**Context awareness:**
- formatCollectedData shows bot what info has been gathered
- Prevents asking same questions twice
- Enables bot to reference previous answers naturally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Parallel execution with 04-01 and 04-03:**
- Plans 04-01, 04-02, and 04-03 all modified same file (convex/ai/context.ts)
- File was being updated by other plans during execution
- Solution: Re-read file multiple times, added functions alongside existing code
- No conflicts - each plan added different helper functions

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 04-04 (Brain Context Extraction):
- QualificationContext interface defined (from 04-01)
- Document collection flow established
- Collected data formatting ready for context extraction
- Bot knows how to ask about documents one at a time

No blockers.

---
*Phase: 04-bot-workflow*
*Completed: 2026-01-26*
