---
phase: 02_5-settings-configuration
plan: 01
subsystem: ui
tags: next.js, react, tabs, navigation, routing

# Dependency graph
requires:
  - phase: 02-workflow-rules-engine
    provides: Kapso workflow infrastructure for team bot configuration
provides:
  - Your Team navigation with Intern (Sarah) and Brain (Grok) tabs
  - Foundation for bot configuration UI (Persona, Flow, Database, Slots)
  - Backwards-compatible redirect from old knowledge-base route
affects:
  - 02_5-02 (Kapso Workflow API Integration)
  - 02_5-03 (Bot Configuration UI)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - URL-based tab state management with ?tab=intern|brain
    - Nested tab navigation (main tabs + sub-tabs)
    - Server/client component separation for dev mode compatibility

key-files:
  created:
    - src/app/(dashboard)/[workspace]/your-team/page.tsx
    - src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx
  modified:
    - src/components/workspace/sidebar.tsx
    - src/app/(dashboard)/[workspace]/knowledge-base/page.tsx

key-decisions:
  - "Used Users icon instead of Bot icon for 'Your Team' navigation to represent team concept"
  - "Implemented redirect from /knowledge-base to /your-team for backwards compatibility"
  - "Preserved existing knowledge-base tabs (Persona, Flow, Database, Slots) under Intern tab"
  - "Brain tab shows placeholder with Grok Manager Bot feature list"

patterns-established:
  - "Pattern: URL-based tab state with router.push for shareable links"
  - "Pattern: Dev mode check in server components for offline development"
  - "Pattern: Nested tabs using separate tab state components"

# Metrics
duration: 4min
completed: 2026-01-30
---

# Phase 2.5 Plan 1: Your Team Navigation & Layout Summary

**Navigation restructure from "Your Intern" to "Your Team" with dual-tab interface for Sarah (Intern) and Grok (Brain) AI bots**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-30T13:20:55Z
- **Completed:** 2026-01-30T13:25:02Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Restructured sidebar navigation from single "Your Intern" to "Your Team" with dual-bot approach
- Created new /your-team route with URL-based tab state (?tab=intern|brain)
- Preserved existing knowledge-base functionality (Persona, Flow, Database, Slots) under Intern tab
- Added Brain tab placeholder for Grok Manager Bot configuration
- Implemented backwards-compatible redirect from /knowledge-base route

## Task Commits

Each task was committed atomically:

1. **Task 1: Update sidebar navigation** - `2a57902` (feat)
2. **Task 2: Create Your Team page structure** - `5fdd3c7` (feat)
3. **Task 3: Redirect old knowledge-base route** - `a9b0df9` (feat)
4. **Task 4: Verify dev mode functionality** - (testing only, no commit)

**Plan metadata:** (to be committed)

## Files Created/Modified
- `src/components/workspace/sidebar.tsx` - Changed "Your Intern" to "Your Team", updated href and icon
- `src/app/(dashboard)/[workspace]/your-team/page.tsx` - Server component with dev mode support
- `src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx` - Client component with Intern/Brain tabs
- `src/app/(dashboard)/[workspace]/knowledge-base/page.tsx` - Simplified to redirect only

## Decisions Made

1. **Users icon for "Your Team"** - Changed from Bot to Users icon to represent team concept rather than single bot
2. **URL-based tab state** - Used `?tab=intern|brain` query params for shareable links and browser history
3. **Preserved existing tabs** - Intern tab contains existing Persona/Flow/Database/Slots sub-tabs unchanged
4. **Brain placeholder content** - Shows Grok Manager Bot feature list (summary generation, lead scoring, analysis triggers)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without errors. Dev mode testing passed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase (02_5-02: Kapso Workflow API Integration):**
- Navigation structure established for bot configuration
- Intern tab provides entry point for Sarah chat bot configuration
- Brain tab provides entry point for Grok manager bot configuration
- No blockers or concerns

---
*Phase: 02_5-settings-configuration*
*Completed: 2026-01-30*
