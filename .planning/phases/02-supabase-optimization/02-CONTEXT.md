# Phase 2: Supabase Optimization - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply known optimization patterns to achieve significant latency reduction on existing Supabase hot paths. No new features — optimize what exists.

**Scope:**
- Refactor `/api/contacts/by-phone` and `/api/conversations` for parallel queries
- Add composite indexes on hot query paths
- Replace `select('*')` with explicit column selection
- Optimize RLS policies for caching

**Out of scope:** New features, schema changes (only indexes added)

</domain>

<decisions>
## Implementation Decisions

### Primary objective
- Speed is the only goal. Optimize aggressively within safety bounds.

### Target outcomes (non-negotiable)
- `/api/contacts/by-phone` P95 < 1 second
- `/api/conversations` P95 < 1 second
- Query count per request reduced by at least 50%

### Claude's Discretion
- **Query parallelization**: Use `Promise.all()` wherever queries are independent. If sequential dependency exists, batch where possible.
- **Index selection**: Create all composite indexes specified in requirements. Add additional indexes if EXPLAIN ANALYZE shows benefit.
- **Column selection**: Replace all `select('*')` with explicit column lists in hot paths. Keep non-hot paths as-is unless they're also slow.
- **RLS optimization**: Wrap `auth.uid()` in SELECT subquery for policy caching. Add `SECURITY DEFINER` helper functions if beneficial.
- **Testing approach**: Deploy to preview environment first, verify improvements via Vercel logs, then promote to production.
- **Rollback plan**: Keep original query patterns commented for quick revert if issues arise.

</decisions>

<specifics>
## Specific Ideas

- "Focus on speed of Supabase, do whatever you need"
- Original baseline: 2-6 second response times (sometimes 9+ seconds)
- Target: Sub-500ms P95 ultimate goal, Phase 2 interim target is <1 second

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-supabase-optimization*
*Context gathered: 2026-01-21*
