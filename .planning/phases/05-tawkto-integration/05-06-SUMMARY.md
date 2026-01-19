---
phase: 05-central-support-hub
plan: 06
subsystem: ui
tags: [tawk.to, live-chat, portal, client-support]

# Dependency graph
requires:
  - phase: 05-05
    provides: Portal layout and support pages
provides:
  - Tawk.to live chat widget component
  - Widget integration in portal layout
  - Env var documentation for Tawk.to config
affects: [deployment, client-support]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom Tawk.to integration via script injection (React 19 compatible)

key-files:
  created:
    - src/components/tawk-chat.tsx
  modified:
    - src/app/portal/layout.tsx
    - .env.local.example

key-decisions:
  - "Custom Tawk.to implementation instead of tawkto-react (peer dependency incompatible with React 19)"
  - "Widget only in portal layout (not admin dashboard)"
  - "Graceful degradation when env vars not set"

patterns-established:
  - "Script injection pattern for third-party widgets in React 19"

# Metrics
duration: 9min
completed: 2026-01-19
---

# Phase 05 Plan 06: Tawk.to Widget Integration Summary

**Custom Tawk.to live chat widget integrated into client portal with React 19 compatible implementation**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-19T07:18:12Z
- **Completed:** 2026-01-19T07:27:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created TawkChat component with script injection approach (bypassing tawkto-react React 17 dependency)
- Integrated widget into portal layout with user name/email for visitor identification
- Widget gracefully handles missing configuration (returns null)
- Documented Tawk.to env vars in .env.local.example
- Widget only appears on /portal/* routes, not on admin dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Install tawkto-react and create component** - `0202f7f` (feat)
2. **Task 2: Add TawkChat to portal layout** - `c7b9d2f` (feat)

## Files Created/Modified
- `src/components/tawk-chat.tsx` - Custom Tawk.to React component with script injection
- `src/app/portal/layout.tsx` - Portal layout with TawkChat component
- `.env.local.example` - Documented NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID

## Decisions Made
- **Custom implementation over tawkto-react:** The tawkto-react npm package has a peer dependency on React 17, which is incompatible with React 19. Created custom implementation using Tawk.to's JavaScript API and script injection.
- **Script injection with cleanup:** Component injects Tawk.to script on mount and cleans up on unmount to prevent memory leaks.
- **Graceful degradation:** Component returns null if env vars not set, preventing errors on development environments without Tawk.to configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tawkto-react incompatible with React 19**
- **Found during:** Task 1 (npm install tawkto-react)
- **Issue:** Package has peer dependency on React 17, fails to install with React 19
- **Fix:** Created custom implementation using Tawk.to JavaScript API with script injection pattern
- **Files modified:** src/components/tawk-chat.tsx (created from scratch instead of using library)
- **Verification:** Component works correctly with React 19, build passes
- **Committed in:** 0202f7f

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Achieved same functionality with better React 19 compatibility. No scope creep.

## Issues Encountered
None

## User Setup Required

**External services require manual configuration.**

To enable Tawk.to live chat:

1. Create a free Tawk.to account at https://www.tawk.to/
2. Get Property ID and Widget ID from Dashboard -> Administration -> Chat Widget
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_TAWK_PROPERTY_ID=your-property-id
   NEXT_PUBLIC_TAWK_WIDGET_ID=your-widget-id
   ```

Without these env vars, the widget simply won't appear (graceful degradation).

## Next Phase Readiness
- Phase 5 (Central Support Hub) complete
- All client portal features ready: ticket management, image uploads, live chat
- Ready for deployment and client onboarding

---
*Phase: 05-central-support-hub*
*Completed: 2026-01-19*
