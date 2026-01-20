---
phase: 03-lead-scoring-routing
plan: 01
subsystem: ai
tags: [scoring, lead-qualification, typescript, jest]

# Dependency graph
requires:
  - phase: 02-ari-core-conversation
    provides: ARI types, qualification module with DocumentStatus
provides:
  - calculateLeadScore function with 0-100 scoring
  - ScoreBreakdown type with category breakdown
  - getLeadTemperature for hot/warm/cold classification
  - getScoreReasons for Indonesian explanations
affects: [03-02 routing, lead-list-view, lead-detail-view]

# Tech tracking
tech-stack:
  added: [jest, ts-jest, @types/jest]
  patterns: [weighted scoring algorithm, category-based breakdown]

key-files:
  created:
    - src/lib/ari/scoring.ts
    - src/lib/ari/__tests__/scoring.test.ts
    - jest.config.js
  modified:
    - src/lib/ari/types.ts
    - src/lib/ari/index.ts
    - package.json

key-decisions:
  - "Scoring weights: basic 25pts, qualification 35pts, documents 30pts, engagement 10pts"
  - "Timeline penalty: -10 points for 2+ year timelines"
  - "IELTS 6.5+ bonus: +3 points"
  - "Document scoring: 7.5 points each (passport, cv, english_test, transcript)"
  - "Temperature thresholds: hot >= 70, warm >= 40, cold < 40"

patterns-established:
  - "Lead scoring: use calculateLeadScore(formAnswers, documents, engagement)"
  - "Score display: show breakdown with getScoreReasons() Indonesian text"

# Metrics
duration: 12min
completed: 2026-01-20
---

# Phase 03 Plan 01: Scoring Engine Summary

**Lead scoring engine with 0-100 scores based on form data (25pts), qualification (35pts), documents (30pts), and engagement (10pts) with timeline penalty and IELTS bonus**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-20T13:28:34Z
- **Completed:** 2026-01-20T13:40:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- calculateLeadScore returns 0-100 with detailed breakdown
- Timeline penalty (-10) for 2+ year timelines
- IELTS 6.5+ bonus (+3) for high English scores
- Document readiness tracking (7.5 pts each)
- getLeadTemperature for hot/warm/cold classification
- Jest test infrastructure with 16 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scoring calculation module** - `8ea6d14` (feat)
2. **Task 2: Update types and export scoring module** - `4e3ec00` (feat)
3. **Task 3: Add unit tests for scoring** - `9ad165e` (test)

## Files Created/Modified
- `src/lib/ari/scoring.ts` - Lead scoring calculation with breakdown and reasons
- `src/lib/ari/types.ts` - Updated ScoreBreakdown interface
- `src/lib/ari/index.ts` - Export scoring functions
- `src/lib/ari/__tests__/scoring.test.ts` - 16 unit tests
- `jest.config.js` - Jest configuration for TypeScript
- `package.json` - Added test script and Jest dependencies

## Decisions Made
- Scoring weights total 100: basic (25), qualification (35), documents (30), engagement (10)
- Timeline penalty applied for "2 tahun", "3 tahun", or year mentions 2+ years from now
- IELTS bonus for 6.5+ scores or "mahir"/"fluent"/"advanced" keywords
- Engagement defaults to 5 if not provided (neutral)
- Score clamped to 0-100 range

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Jest 30 uses --testPathPatterns (plural) instead of --testPathPattern - adjusted command

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Scoring engine ready for integration with routing logic (03-02)
- ScoreBreakdown type available for UI display
- getScoreReasons provides Indonesian text for lead detail view

---
*Phase: 03-lead-scoring-routing*
*Completed: 2026-01-20*
