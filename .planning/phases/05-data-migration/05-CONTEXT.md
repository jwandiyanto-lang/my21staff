# Phase 5: Data Migration - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all remaining Supabase tables to Convex. ARI tables, support tickets, CMS content, and utility tables. Update all API routes to use Convex instead of Supabase.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- One-time bulk migration (not incremental sync)
- Run migration scripts once, verify, then cutover
- Brief read-only period acceptable (~30 min maintenance window)
- Show maintenance mode or read-only indicator during migration

### Claude's Discretion
- Rollback approach (likely: keep Supabase data intact until verified)
- API route cutover strategy (likely: all at once given one-time bulk approach)
- Table migration order based on dependencies
- Data transformation and field mapping details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for bulk data migration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-data-migration*
*Context gathered: 2026-01-23*
