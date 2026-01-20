---
phase: 06-admin-interface
plan: 02
subsystem: ui
tags: [flow-stages, conversation-flow, crud, react, supabase]

# Dependency graph
requires:
  - phase: 06-01
    provides: Your Intern page with tabbed interface, PersonaTab component
provides:
  - ari_flow_stages database table for custom conversation stages
  - FlowStage TypeScript types and DEFAULT_FLOW_STAGES
  - CRUD API for flow stages with reorder support
  - FlowTab UI component with expandable cards
affects: [07-ai-models, ari-processor]

# Tech tracking
tech-stack:
  added: []
  patterns: [expandable-card-list, optimistic-reorder, default-stage-fallback]

key-files:
  created:
    - supabase/migrations/40_flow_stages.sql
    - src/app/api/workspaces/[id]/flow-stages/route.ts
    - src/components/knowledge-base/flow-tab.tsx
  modified:
    - src/lib/ari/types.ts
    - src/app/(dashboard)/[workspace]/knowledge-base/knowledge-base-client.tsx
    - src/types/database.ts

key-decisions:
  - "Default stages returned from API (not saved to DB) until admin customizes"
  - "Batch reorder via PUT with stages array, clears to negative values to avoid unique constraint"
  - "Up/down arrow buttons instead of drag-drop for simplicity"

patterns-established:
  - "Default data pattern: API returns defaults when no DB rows exist, without saving"
  - "Expandable card pattern: collapsed shows summary, expanded shows full form"

# Metrics
duration: 12min
completed: 2026-01-20
---

# Phase 06 Plan 02: Flow Configuration Summary

**Custom conversation flow stages with CRUD UI for admin-configurable ARI behavior**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-20T17:01:24Z
- **Completed:** 2026-01-20T17:13:XX
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Database table for storing custom conversation flow stages
- Full CRUD API with batch reorder support
- FlowTab UI with expandable cards, add dialog, delete confirmation
- Default stages (Greeting, Qualifying, Scoring, Booking, Scheduling, Handoff) shown when no custom stages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Flow Stages Database Migration** - `21ba77d` (feat)
2. **Task 2: Create Flow Stages API Route** - `88e42af` (feat)
3. **Task 3: Create FlowTab Component** - `286d285` (feat)

**Fix:** `27e1c73` (fix: database types regeneration)

## Files Created/Modified
- `supabase/migrations/40_flow_stages.sql` - ari_flow_stages table with RLS
- `src/app/api/workspaces/[id]/flow-stages/route.ts` - GET/POST/PUT/DELETE endpoints
- `src/components/knowledge-base/flow-tab.tsx` - FlowTab component with stage CRUD UI
- `src/lib/ari/types.ts` - FlowStage type and DEFAULT_FLOW_STAGES constant
- `src/app/(dashboard)/[workspace]/knowledge-base/knowledge-base-client.tsx` - Enable Flow tab
- `src/types/database.ts` - Regenerated with ari_flow_stages

## Decisions Made
- Default stages are returned dynamically (not saved to DB) to allow clean slate customization
- Reorder uses temporary negative values to avoid unique constraint violations during batch update
- Up/down arrows chosen over drag-drop for simpler implementation (dnd-kit adds complexity)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Database types regeneration overwrote custom types causing pre-existing errors in other files (unrelated to this plan)
- Linter auto-added `as any` casts to work around type generation timing

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Flow stages UI complete and integrated into Your Intern page
- Future work: Integration with ARI processor to use custom stages instead of hardcoded STATE_TRANSITIONS (Phase 7+)
- Database tab and Scoring tab still disabled (Plans 03, 04)

---
*Phase: 06-admin-interface*
*Completed: 2026-01-20*
