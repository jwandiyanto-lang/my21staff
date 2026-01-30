# Phase 2: Your Intern Debug - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix production errors preventing Your Intern configuration page from loading and functioning properly. This phase removes the P0 blocker — making the page load without crashes so admins can configure bot behavior. NOT building new features, just fixing what breaks.

</domain>

<decisions>
## Implementation Decisions

### Error prioritization
- Batch by type: Group similar errors together (all SSR issues, all useQuery issues, all component boundary issues)
- Fix order determined by Claude based on error dependencies and impact
- Verification depth per error type decided by Claude (console clean for simple fixes, full workflow for complex ones)

### Console cleanup
- Debug logs during fix process: Claude adds if needed for diagnosis
- Post-fix cleanup: Claude removes temporary debug code, keeps useful error logging
- Production logging: Claude adds appropriate structured error logging where useful
- Developer vs user errors: Claude balances console.error for developers vs UI feedback for users
- Existing warnings: Claude cleans up obvious issues in Your Intern components, ignores unrelated warnings

### Claude's Discretion
- Specific debugging approach (DevTools, temporary logs, or both)
- When to add error boundaries vs fixing root causes
- Testing scope (dev mode only vs production verification)
- Exact verification steps per error type

</decisions>

<specifics>
## Specific Ideas

- Research notes mention SSR auth crashes and useQuery patterns as likely culprits
- Page must load at `/demo/your-intern` without JS errors
- Tabs should be clickable without page reload required
- This is critical path work (P0 blocker) — Phase 3 can't start until this completes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (debugging existing functionality, not adding features)

</deferred>

---

*Phase: 02-your-intern-debug*
*Context gathered: 2026-01-27*
