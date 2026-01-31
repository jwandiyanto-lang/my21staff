---
phase: 06-dashboard
plan: 01
subsystem: ui
tags: [react, tanstack-table, convex, typescript, shadcn-ui, date-fns]

# Dependency graph
requires:
  - phase: 04-lead-database
    provides: Convex leads schema and query functions (getLeadsByStatus)
  - phase: 05-grok-manager-bot
    provides: Lead temperature and scoring data
provides:
  - Lead List UI with TanStack Table
  - Temperature-based stage badges (hot/warm/lukewarm/cold/new/converted)
  - Sortable columns (Name, Stage, Score, Business Type, Last Active, Actions)
  - Mock lead data for offline development
  - Leads navigation in sidebar
affects: [06-02-filters, 06-03-lead-detail, 06-dashboard-analytics]

# Tech tracking
tech-stack:
  added: [@tanstack/react-table, date-fns]
  patterns:
    - TanStack Table with sortable columns
    - Temperature-based badge system with icons
    - Dev mode with MOCK_LEADS for offline testing
    - Relative time display with formatDistanceToNow

key-files:
  created:
    - src/app/(dashboard)/[workspace]/leads/page.tsx
    - src/app/(dashboard)/[workspace]/leads/leads-client.tsx
    - src/components/leads/lead-table.tsx
    - src/components/leads/lead-columns.tsx
    - src/components/leads/stage-badge.tsx
  modified:
    - src/lib/mock-data.ts
    - src/components/workspace/sidebar.tsx

key-decisions:
  - "Use TanStack Table for sortable, extensible lead list"
  - "Temperature-based stages (hot/warm/lukewarm/cold) with color coding"
  - "Sort by lastActivityAt descending by default (most recent first)"
  - "Geist Mono font for phone numbers and data fields"
  - "Icon + text labels for accessibility in stage badges"

patterns-established:
  - "Lead list pattern: Convex query → dev mode check → MOCK_LEADS fallback"
  - "Column definitions in separate file for reusability"
  - "Empty state with friendly message for zero leads"
  - "Loading skeleton matching component structure"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 6 Plan 01: Lead List UI Summary

**TanStack Table displaying leads from Convex with temperature-based stage badges, sortable columns, and real-time updates**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-31T07:22:15Z (commit 997341b)
- **Completed:** 2026-01-31T07:25:21Z (commit bb1575d)
- **Tasks:** 3 (route setup, table components, mock data)
- **Files modified:** 7

## Accomplishments
- Created functional /[workspace]/leads page with server + client components
- Built TanStack Table with 6 columns (Name, Stage, Score, Business Type, Last Active, Actions)
- Implemented temperature-based stage badges with icons (Flame, Sun, Snowflake, CheckCircle)
- Added 15 mock Indonesian business leads for offline testing
- Integrated leads navigation into sidebar (Operations section)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Lead Page Route and Client Component** - `997341b` (feat)
   - page.tsx server component with dev mode support
   - leads-client.tsx with Convex query integration
   - Loading skeleton and header layout

2. **Task 2: Create TanStack Table Components** - `1b9e1ff` (feat)
   - StageBadge with temperature-based colors and icons
   - lead-columns.tsx with sortable column definitions
   - LeadTable with sorting and empty state

3. **Task 3: Add Mock Lead Data and Wire Up Page** - `bb1575d` (feat - bundled with 06-02)
   - 15 MOCK_LEADS with Indonesian names and business types
   - Import MOCK_LEADS into leads-client.tsx
   - Add Leads link to sidebar navigation
   - Fix isDevMode export order

**Note:** Task 3 was bundled into commit bb1575d which is labeled as 06-02 but includes the final wiring for 06-01.

## Files Created/Modified

### Created
- `src/app/(dashboard)/[workspace]/leads/page.tsx` - Server component wrapper with dev mode support
- `src/app/(dashboard)/[workspace]/leads/leads-client.tsx` - Client component with Convex query and table rendering
- `src/components/leads/lead-table.tsx` - TanStack Table with sorting and empty state (92 LOC)
- `src/components/leads/lead-columns.tsx` - Column definitions with sortable headers (145 LOC)
- `src/components/leads/stage-badge.tsx` - Temperature-based badge component with icons (57 LOC)

### Modified
- `src/lib/mock-data.ts` - Added MOCK_LEADS array with 15 sample leads, moved isDevMode function earlier
- `src/components/workspace/sidebar.tsx` - Added Leads navigation link with UserCircle icon

## Decisions Made

**Temperature-based stages:**
- Aligned with Grok's scoring system from Phase 5
- Colors: hot (red), warm (orange), lukewarm (yellow), cold (blue), new (blue), converted (green)
- Icons for accessibility: Flame, Sun, Snowflake, CheckCircle

**Default sorting:**
- Sort by lastActivityAt descending (most recent first)
- Enables users to see newest activity immediately

**Dev mode pattern:**
- MOCK_LEADS provides 15 realistic Indonesian business leads
- Fully offline operation at localhost:3000/demo/leads
- Uses same Lead type as Convex for consistency

**Geist Mono font:**
- Applied to phone numbers and scores for clarity
- Matches project design system (black/white minimalist)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**isDevMode export order lint error:**
- Issue: isDevMode() used before definition in shouldUseMockData (line 109)
- Fix: Moved isDevMode function definition before shouldUseMockData
- Removed duplicate isDevMode definition later in file
- Resolved in Task 3 commit

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 06-02 (Filters & Search):**
- Lead list renders successfully
- TanStack Table supports column filtering
- MOCK_LEADS provides test data with variety of stages
- Filter bar placeholder already in leads-client.tsx

**Ready for Plan 06-03 (Lead Detail View):**
- Lead table has Actions column with View button
- Row data available for detail sheet integration
- StageBadge component reusable in detail view

**No blockers:** All foundation components working, ready for enhancement.

---
*Phase: 06-dashboard*
*Completed: 2026-01-31*
