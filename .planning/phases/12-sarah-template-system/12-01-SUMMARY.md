---
phase: 12-sarah-template-system
plan: 01
subsystem: database
tags: [convex, configuration, sarah, bot-settings]

# Dependency graph
requires:
provides:
  - sarahConfigs table with by_workspace index for workspace-specific config queries
  - getConfig, updateConfig, getConfigByPhone Convex functions
  - Default config values (bot_name: "Your Intern", language: "id", pronoun: "Kamu", trial_link: https://my21staff.com/trial)
affects: [sarah-ui, sarah-kapso-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [upsert-pattern, by-kapso-phone-lookup, default-fallback-pattern]

key-files:
  created: [convex/sarah/config.ts]
  modified: [convex/schema.ts]

key-decisions:
  - "Used v.string() for string fields instead of union literals - validation in application layer"

patterns-established:
  - "Upsert pattern for updateConfig: check exists, patch if yes, insert if no"
  - "getConfigByPhone: workspace lookup via by_kapso_phone, then config via by_workspace"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 12: Sarah Template System - Plan 1 Summary

**Convex backend for Sarah configuration storage with workspace-specific bot customization (bot name, language, pronoun, trial link)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T16:09:24Z
- **Completed:** 2026-02-01T16:11:24Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- sarahConfigs table added to Convex schema with by_workspace index
- Three Convex functions deployed: getConfig, updateConfig, getConfigByPhone
- Input validation for bot_name (1-50 chars), language (id/en), pronoun (Kamu/Anda), trial_link (https://)
- Kapso integration support via phone_id lookup without workspace_id

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sarahConfigs table to Convex schema** - `8a00784` (feat)
2. **Task 2: Create Convex query and mutation for Sarah config** - `f1f5172` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added sarahConfigs table definition with workspace_id index
- `convex/sarah/config.ts` - Created getConfig, updateConfig, getConfigByPhone functions

## Decisions Made

- Used v.string() for string fields instead of union literals (language, pronoun) - validation handled in application layer with clear error messages
- Default pronoun "Kamu" (informal) chosen as default for Indonesian market

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- sarahConfigs table ready for customer editing UI (Phase 12-02)
- getConfigByPhone ready for Kapso function node integration
- No blockers for next plan
