# Phase 8: Performance Optimization - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

First impression polish for Eagle — bundle optimization, caching, connection efficiency. Make the dashboard feel snappy. No new features, just speed.

</domain>

<decisions>
## Implementation Decisions

### Bundle targets
- Main concern: Dashboard heavy (all pages feel sluggish after login)
- Affected areas: Inbox, leads list, support tickets — general sluggishness
- Analyze first: Run bundle analyzer to reveal actual culprits before optimizing

### Claude's Discretion (Bundle)
- Splitting strategy (aggressive vs route-based) — decide based on analysis
- Which third-party libs to target — let analyzer reveal

### Caching strategy
- Pain points: Leads list, inbox messages, dashboard stats all feel slow/stale
- Inbox messages: Critical real-time feel — messages should appear within seconds
- Leads and dashboard: Background refresh — show cached data instantly, update silently
- TanStack Query scope: Claude decides where to apply based on benefit

### Loading experience
- Current state: White/blank screen until data arrives
- Error handling: Friendly message + retry button
- Consistency: Uniform loading pattern everywhere

### Claude's Discretion (Loading)
- Loading pattern choice (skeletons, spinners, progressive reveal)

### Measurement
- Success criteria: "Feel it" — app should feel snappier subjectively
- Target devices: iPhone, Desktop Chrome
- Network conditions: Claude decides representative conditions
- Bundle report: Only if savings are significant

</decisions>

<specifics>
## Specific Ideas

- Eagle is first paying client — performance is part of VIP treatment
- Indonesian/UAE mobile users matter, but primary test on iPhone + Desktop Chrome
- Don't need detailed metrics — subjective improvement is the goal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-performance-optimization*
*Context gathered: 2026-01-19*
