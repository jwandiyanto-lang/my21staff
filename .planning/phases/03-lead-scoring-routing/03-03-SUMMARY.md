---
phase: 03-lead-scoring-routing
plan: 03
subsystem: ui
tags: [react, typescript, shadcn, lead-scoring, display]

# Dependency graph
requires:
  - phase: 03-01
    provides: calculateLeadScore, ScoreBreakdown type, getScoreReasons
provides:
  - ScoreBreakdown UI component with temperature badges
  - InfoSidebar integration with ARI score display
  - Inbox client fetches and displays ARI conversation scores
affects: [lead-detail-view, contact-profile]

# Tech tracking
tech-stack:
  added: []
  patterns: [conditional rendering for ARI vs manual scoring]

key-files:
  created:
    - src/components/contact/score-breakdown.tsx
  modified:
    - src/components/contact/info-sidebar.tsx
    - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx

key-decisions:
  - "ScoreBreakdown shows temperature badge (Hot >= 70, Warm >= 40, Cold < 40)"
  - "Expandable details show breakdown bars for each scoring category"
  - "Falls back to manual slider when no ARI data available"
  - "ARI score fetched on conversation selection from ari_conversations table"

patterns-established:
  - "Score display: use ScoreBreakdown component with score, breakdown, reasons props"
  - "ARI data fetch: query ari_conversations by contact_id and workspace_id"

# Metrics
duration: 15min
completed: 2026-01-20
---

# Phase 03 Plan 03: Score Display UI Summary

**ScoreBreakdown component with temperature badges (Hot/Warm/Cold) and expandable breakdown showing category scores, integrated into inbox info sidebar with ARI conversation data fetch**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-20T14:15:00Z
- **Completed:** 2026-01-20T14:30:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- ScoreBreakdown component with Hot/Warm/Cold temperature badges
- Expandable section showing category breakdown (basic, qualification, documents, engagement)
- Progress bars for each category with max values (25, 35, 30, 10)
- Reasons list displayed in Indonesian
- InfoSidebar shows ARI score or falls back to manual slider
- Inbox client fetches ARI conversation score on selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create score breakdown component** - `9643c56` (feat)
2. **Task 2: Update info sidebar with ARI score section** - `8e4e49c` (feat)
3. **Task 3: Wire ARI score data in inbox client** - `6768223` (feat)

## Files Created/Modified
- `src/components/contact/score-breakdown.tsx` - New component displaying score with temperature badge and expandable breakdown
- `src/components/contact/info-sidebar.tsx` - Updated to accept ariScoreData prop and render ScoreBreakdown
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` - Fetches ARI conversation data and passes to InfoSidebar

## Decisions Made
- Color coding: Red (#DC2626) for hot, Amber (#F59E0B) for warm, Blue (#3B82F6) for cold
- Category labels in Indonesian: Data Dasar, Kualifikasi, Dokumen, Engagement
- Expand/collapse text in Indonesian: "Lihat detail skor" / "Sembunyikan detail"
- Falls back to manual score slider when no ARI data (for manually scored leads)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Score display ready for production use
- Scoring visible in inbox when ARI conversation exists
- Manual scoring still works for non-ARI contacts
- Ready for 03-04 (Payment Integration) phase

---
*Phase: 03-lead-scoring-routing*
*Completed: 2026-01-20*
