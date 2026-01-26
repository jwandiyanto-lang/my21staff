---
phase: 05-lead-flow
plan: 06
subsystem: database
tags: [convex, lead-status, configuration, workspace-settings]

# Dependency graph
requires:
  - phase: 05-03
    provides: Lead status verification gap identification
provides:
  - Workspace-level lead status configuration storage
  - Brain reads workspace status config for temperature mapping
  - Dynamic status config support in UI lib
  - Default statuses aligned between Brain and UI
affects: [05-07, 05-08, settings-ui, lead-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [workspace-settings-storage, temperature-to-status-mapping]

key-files:
  created: []
  modified:
    - convex/workspaces.ts
    - convex/ai/brain.ts
    - src/lib/lead-status.ts

key-decisions:
  - "Use workspace.settings.lead_statuses for custom status storage (no schema change needed)"
  - "Default statuses: new, cold, warm, hot, client, lost (aligned with temperature)"
  - "Preserve legacy LEAD_STATUS_CONFIG export for backwards compatibility"
  - "Change DEFAULT_LEAD_STATUS from 'prospect' to 'new'"

patterns-established:
  - "Temperature-to-status mapping: Brain fetches workspace config before mapping"
  - "Fallback pattern: Unknown status keys get auto-formatted labels"

# Metrics
duration: 3min
completed: 2026-01-26
---

# Phase 5 Plan 6: Workspace Lead Status Configuration Summary

**Workspace-level lead status configuration enabling customizable sales stages with Brain/UI alignment**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T06:35:33Z
- **Completed:** 2026-01-26T06:38:23Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added `getStatusConfig` query and `updateStatusConfig` mutation to workspaces
- Brain now fetches workspace status config before mapping temperature to status
- UI lib supports dynamic configuration while preserving legacy exports
- Default statuses aligned: new, cold, warm, hot, client, lost

## Task Commits

Each task was committed atomically:

1. **Task 1: Add lead status configuration to workspace settings** - `8c7c4dd` (feat)
2. **Task 2: Update Brain to use workspace status configuration** - `7397ebe` (feat)
3. **Task 3: Update lead-status.ts for dynamic configuration** - `c1582c6` (feat)

## Files Created/Modified
- `convex/workspaces.ts` - Added getStatusConfig query and updateStatusConfig mutation
- `convex/ai/brain.ts` - Added getWorkspaceStatusConfig internal query, updated mapTemperatureToStatus
- `src/lib/lead-status.ts` - Added LeadStatusConfig interface, DEFAULT_LEAD_STATUSES, getStatusConfig helper

## Decisions Made
- **Use v.any() settings field:** Workspace schema already has `settings: v.optional(v.any())` which can store lead_statuses array without schema migration
- **Default status keys:** Changed from old keys (prospect, cold_lead, hot_lead) to new keys (new, cold, warm, hot, client, lost) that align with Brain's temperature output
- **Preserve legacy exports:** LEAD_STATUS_CONFIG and LEAD_STATUSES preserved for backwards compatibility with existing UI code

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema foundation ready for Settings UI (05-07)
- Brain correctly maps temperature to workspace-defined status keys
- UI can now fetch dynamic status labels from workspace config
- Ready for Settings page implementation (05-08)

---
*Phase: 05-lead-flow*
*Completed: 2026-01-26*
