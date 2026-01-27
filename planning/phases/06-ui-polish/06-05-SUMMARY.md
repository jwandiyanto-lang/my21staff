---
phase: 06-ui-polish
plan: 05
subsystem: database
tags: [mock-data, convex, dev-mode, schema-parity]

# Dependency graph
requires:
  - phase: 05-lead-flow
    provides: lead_statuses configuration in workspace.settings
provides:
  - Mock data structure aligned with production Convex schema
  - Dev mode Settings page fully functional with Lead Stages tab
  - Mock notes include workspace_id and user_id fields
affects: [06-ui-polish, testing, local-development]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mock data extends production schema fields where type-compatible
    - Supabase types preserved for existing mock data
    - Added Convex-specific fields (lead_statuses, kapso_name, workspace_id/user_id for notes)

key-files:
  created: []
  modified:
    - src/lib/mock-data.ts
    - src/components/contact/info-sidebar.tsx

key-decisions:
  - "Keep timestamps as strings (Supabase format) instead of numbers (Convex format) for type compatibility"
  - "Omit supabaseId from mock data (not present in current Supabase types)"
  - "Keep source in metadata only (not top-level field due to type constraints)"
  - "Add lead_statuses to MOCK_CONVEX_WORKSPACE.settings for Settings page functionality"

patterns-established:
  - "Pragmatic schema alignment: match production where types allow, maintain compatibility elsewhere"
  - "Mock data serves two type systems: Supabase (legacy) and Convex (current)"

# Metrics
duration: 10min
completed: 2026-01-27
---

# Phase 06 Plan 05: Dev/Prod Environment Parity Summary

**Mock data enriched with Convex schema fields (lead_statuses, kapso_name, workspace/user IDs) while maintaining Supabase type compatibility**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-27T06:30:16Z
- **Completed:** 2026-01-27T06:40:23Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Added lead_statuses configuration to MOCK_CONVEX_WORKSPACE.settings, enabling Settings > Lead Stages tab in dev mode
- Added kapso_name field to MOCK_CONTACTS for WhatsApp profile name display
- Extended MOCK_NOTES with workspace_id and user_id fields to match Convex contactNotes schema
- Maintained type compatibility with existing Supabase-based types throughout

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit schema vs mock data and identify structural differences** - `a477665` (feat)

**Plan metadata:** Not yet committed (will be done in final commit)

## Files Created/Modified
- `src/lib/mock-data.ts` - Added lead_statuses to settings, kapso_name to contacts, workspace_id/user_id to notes
- `src/components/contact/info-sidebar.tsx` - No functional changes (DisplayNote type already compatible)

## Decisions Made

**1. Timestamp format: strings vs numbers**
- **Decision:** Keep timestamps as strings (ISO 8601 format)
- **Rationale:** MOCK_CONTACTS/MOCK_CONVERSATIONS/MOCK_MESSAGES use Supabase Contact/Conversation/Message types which expect string timestamps. Converting to numbers would break type compatibility.
- **Impact:** Dev mode timestamps remain strings; production Convex uses numbers. This is acceptable since TypeScript date utilities handle both formats.

**2. Field additions: selective vs complete**
- **Decision:** Add fields only where type-compatible (kapso_name ✓, supabaseId ✗, source top-level ✗)
- **Rationale:** Supabase types don't include supabaseId or top-level source fields. Adding them would cause TypeScript errors without modifying the type definitions.
- **Impact:** Partial parity achieved. Most important field (lead_statuses for Settings page) successfully added.

**3. Type system coexistence**
- **Decision:** Support both Supabase (MOCK_WORKSPACE, MOCK_CONTACTS) and Convex (MOCK_CONVEX_WORKSPACE) types simultaneously
- **Rationale:** Different components consume different type systems. Full migration to Convex types would require extensive refactoring.
- **Impact:** Mock data serves dual purpose. Future: migrate all components to Convex types.

## Deviations from Plan

**Auto-fixed Issues**

**1. [Rule 3 - Blocking] DisplayNote type mismatch**
- **Found during:** Build verification after timestamp conversion attempt
- **Issue:** Initially tried converting timestamps to numbers (Convex format), which broke DisplayNote interface expecting strings
- **Fix:** Reverted timestamp conversions, kept strings for Supabase type compatibility
- **Files modified:** src/lib/mock-data.ts (reverted), src/components/contact/info-sidebar.tsx (type comment updated)
- **Verification:** `npm run build` passed without TypeScript errors
- **Committed in:** a477665 (part of Task 1 commit)

**2. [Rule 3 - Blocking] Type compatibility for Contact fields**
- **Found during:** Build verification of new fields
- **Issue:** Attempted to add supabaseId and top-level source fields, but Supabase Contact type doesn't include them
- **Fix:** Removed supabaseId and top-level source from mock data, kept source in metadata only
- **Files modified:** src/lib/mock-data.ts
- **Verification:** TypeScript compilation successful
- **Committed in:** a477665 (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking type compatibility issues)
**Impact on plan:** All auto-fixes were necessary to maintain TypeScript type safety while achieving maximum practical schema alignment. No scope creep - deviations were constraint-driven, not feature additions.

## Issues Encountered

**Type system impedance mismatch:**
- **Problem:** Convex schema uses numbers for timestamps and includes supabaseId/source fields; Supabase types use strings and don't include those fields
- **Resolution:** Pragmatic compromise - added fields where possible (lead_statuses ✓, kapso_name ✓), kept existing format where types constrained (timestamps as strings, no supabaseId)
- **Lesson:** Full schema parity requires migrating from Supabase types to Convex types project-wide. This plan achieved maximum alignment within current type constraints.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next plans:**
- Settings page Lead Stages tab now functional in dev mode
- Mock data structure closer to production, improving localhost testing reliability
- Database page contacts display with all available fields

**Considerations for future work:**
- Full migration from Supabase types to Convex types would enable complete schema parity
- Consider generating Convex-compatible TypeScript types from convex/schema.ts
- Mock data timestamp format (strings) differs from production (numbers) - acceptable but worth documenting

---
*Phase: 06-ui-polish*
*Completed: 2026-01-27*
