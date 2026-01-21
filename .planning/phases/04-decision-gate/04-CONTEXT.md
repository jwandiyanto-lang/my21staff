# Phase 4: Decision Gate - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

## Phase Boundary

Make data-driven architecture decision between Convex migration vs Supabase enhancement, based on Phase 2 (optimized Supabase: P95 926ms) and Phase 3 (Convex spike: P95 37ms, 25.4x faster) results.

## Implementation Decisions

### Migration rollout strategy
- Big-bang migration — one coordinated migration event, not gradual
- Migrate immediately after Phase 5 completion (no提前 scheduling)
- Target outcome: Switch to Convex and move forward without looking back

### Downtime handling
- Claude's discretion — brief downtime or read-only mode, depending on technical feasibility

### Fallback strategy
- Burn the bridge — no rollback to Supabase data layer after migration
- Convex becomes the new source of truth; proceed forward-only
- Keep Supabase for auth only (per Phase 5 IMPL-06)

## Specific Ideas

None — decision is based on quantitative benchmark data from Phases 2 and 3.

## Deferred Ideas

None — discussion stayed within decision gate scope.

---

*Phase: 04-decision-gate*
*Context gathered: 2026-01-21*
