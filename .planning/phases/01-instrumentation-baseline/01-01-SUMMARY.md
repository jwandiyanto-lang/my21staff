---
phase: 01-instrumentation-baseline
plan: 01
subsystem: instrumentation
tags: [vercel, speed-insights, timing, performance, nextjs]

# Dependency graph
requires: []
provides:
  - Speed Insights instrumentation for route-level performance tracking
  - withTiming HOF for API route execution timing
  - Query logging infrastructure for database performance analysis
affects: [01-instrumentation-baseline/01-02, 01-instrumentation-baseline/01-03, 01-instrumentation-baseline/02-01]

# Tech tracking
tech-stack:
  added: ["@vercel/speed-insights@1.3.1"]
  patterns: ["Higher-order function for API instrumentation", "Per-request metrics tracking"]

key-files:
  created: ["src/lib/instrumentation/with-timing.ts"]
  modified: ["package.json", "src/app/layout.tsx"]

key-decisions:
  - "Used console.log for timing output - appears in Vercel logs, no external dependency"

patterns-established:
  - "API timing pattern: wrap handlers with withTiming(routeName, handler)"
  - "Query tracking: createRequestMetrics() per request, logQuery() per query"

# Metrics
duration: 6min
completed: 2026-01-21
---

# Phase 01 Plan 01: Instrumentation Baseline Summary

**Vercel Speed Insights integration with withTiming HOF for API route execution and query performance tracking**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-21T07:33:30Z
- **Completed:** 2026-01-21T07:39:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Installed @vercel/speed-insights@1.3.1 and integrated into root layout
- Created withTiming higher-order function for API route execution timing
- Established RequestMetrics interface and query logging helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Speed Insights and add to layout** - `6d4db2a` (feat)
2. **Task 2: Create withTiming HOF and query helpers** - `9114e00` (feat)

## Files Created/Modified

- `package.json` - Added @vercel/speed-insights@1.3.1 dependency
- `src/app/layout.tsx` - Added SpeedInsights import and component
- `src/lib/instrumentation/with-timing.ts` - New file with timing infrastructure:
  - `RequestMetrics` interface for per-request tracking
  - `createRequestMetrics()` factory function
  - `logQuery(metrics, table, durationMs)` for query execution logging
  - `withTiming(routeName, handler)` HOF for API route wrapper
  - `logQuerySummary(routeName, metrics)` for aggregated query output

## Decisions Made

- Used console.log for all timing output - appears directly in Vercel logs, no external logging library needed
- Performance API (performance.now()) for high-precision timing measurement
- Error logging includes duration time even when handler throws
- Query summary formatted as "table:XXms" strings for easy log parsing

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None.

## Next Phase Readiness

- Speed Insights component ready (requires Vercel Dashboard enablement in Plan 03)
- withTiming HOF ready for use in API routes (Plan 02)
- Query tracking infrastructure ready for database instrumentation (Plan 02)
- No blockers

---
*Phase: 01-instrumentation-baseline*
*Completed: 2026-01-21*
