---
phase: 04-lead-database
plan: 06
subsystem: database
tags: [convex, background-sync, cron, monitoring]

# Dependency graph
requires:
  - phase: 04-01
    provides: Contacts schema with leadStatus and notes timeline
  - phase: 04-02
    provides: Kapso webhook sync with lastActivityAt tracking
provides:
  - Background sync reconciliation service for stale contact detection
  - Hourly cron job for automated sync health monitoring
  - syncHealth table for sync run history tracking
affects: [05-grok-manager, 06-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cron-based background reconciliation for webhook failure recovery"
    - "Stale contact detection with 24-hour flag cooldown"
    - "Batch processing with 50-contact limit for performance"

key-files:
  created:
    - convex/backgroundSync.ts
    - convex/crons.ts
  modified:
    - convex/schema.ts

key-decisions:
  - "1-hour stale threshold for active contacts (excluding archived/converted)"
  - "24-hour cooldown prevents duplicate flags on same contact"
  - "50-contact batch limit per workspace to prevent overload"
  - "Notes-based flagging (not re-fetching from Kapso) to minimize API calls"

patterns-established:
  - "Background reconciliation via notes timeline with bot attribution (background-sync)"
  - "Sync health logging tracks contacts_checked, stale_found, flagged per run"
  - "Non-blocking workspace iteration - failures don't stop other workspaces"

# Metrics
duration: 2min
completed: 2026-01-30
---

# Phase 4 Plan 6: Background Sync Service Summary

**Hourly cron-based reconciliation flags stale contacts (>1hr no activity) with 24-hour cooldown to catch missed webhooks**

## Performance

- **Duration:** 1m 59s
- **Started:** 2026-01-30T19:51:26Z
- **Completed:** 2026-01-30T19:53:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Background sync service identifies stale contacts across all workspaces
- Hourly cron job runs automatically via Convex scheduler
- syncHealth table tracks run history for monitoring and debugging
- Flags prevent duplicate notifications with 24-hour cooldown

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backgroundSync.ts with reconciliation logic** - `04c63cc` (feat)
2. **Task 2: Create crons.ts for scheduled background sync** - `34a883e` (feat)

## Files Created/Modified
- `convex/backgroundSync.ts` - Reconciliation service with stale contact detection and flagging
- `convex/crons.ts` - Hourly cron scheduler for background sync
- `convex/schema.ts` - Added syncHealth table for monitoring

## Decisions Made

**Stale threshold: 1 hour**
- Rationale: Balances between catching issues quickly and avoiding false positives
- Only flags contacts with leadStatus not archived/converted

**Flag cooldown: 24 hours**
- Rationale: Prevents duplicate flags on same contact, reduces noise
- Allows manual follow-up time before re-flagging

**Batch limit: 50 contacts per workspace**
- Rationale: Prevents overload during high-volume sync runs
- Processes most critical stale contacts first

**Notes-based flagging (not Kapso re-fetch)**
- Rationale: Minimizes external API calls, reduces sync overhead
- Flags serve as attention markers for manual review

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Background sync service ready for production use
- syncHealth query available for monitoring dashboards (Phase 6)
- Stale contact flags visible in notes timeline for manual review
- No blockers for Phase 5 (Grok Manager Bot) or Phase 6 (Dashboard)

---
*Phase: 04-lead-database*
*Completed: 2026-01-30*
