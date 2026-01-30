---
phase: 05-data-migration
plan: 01
subsystem: data-model
tags: [convex, schema, migration]

requires:
  - phases: [04-user-migration-organizations]
    reason: "Builds on Clerk-synced user/org infrastructure"

provides:
  - capability: "Complete Convex schema ready for data migration"
  - artifact: "12 new table definitions: ARI extended + CMS"

affects:
  - phase: 05-02
    impact: "Migration scripts can now execute against complete schema"

tech-stack:
  added: []
  patterns: ["snake_case naming convention", "v.optional(v.any()) for JSONB fields"]

key-files:
  created: []
  modified:
    - path: "convex/schema.ts"
      lines: 219
      reason: "Added 12 new table definitions with indexes"

decisions:
  - what: "Use v.optional(v.any()) for JSONB fields"
    why: "Matches existing pattern for flexible JSON storage (requirements, gateway_response)"
    trade_offs: "Less type safety but preserves Supabase JSONB flexibility"

  - what: "Include supabaseId field for CMS tables"
    why: "Enables migration reference tracking like existing core tables"
    trade_offs: "None - standard migration pattern"

metrics:
  duration: "1.2 minutes"
  completed: "2026-01-23"
---

# Phase 5 Plan 01: Extend Convex Schema Summary

Complete Convex schema with all 12 remaining Supabase tables - ready for data migration.

## What Was Built

Extended `convex/schema.ts` with comprehensive table definitions for ARI extended features and CMS functionality:

**ARI Extended Tables (9):**
- `ariDestinations` - University knowledge base with country/program filtering
- `ariPayments` - Payment tracking (Midtrans integration)
- `ariAppointments` - Consultation scheduling with consultant assignment
- `ariAiComparison` - A/B testing metrics for AI models
- `ariFlowStages` - Custom conversation flow stages
- `ariKnowledgeCategories` - Knowledge base organization
- `ariKnowledgeEntries` - Knowledge base content
- `ariScoringConfig` - Lead scoring threshold configuration
- `consultantSlots` - Booking availability management

**CMS Tables (3):**
- `articles` - Blog/article content management
- `webinars` - Webinar scheduling and management
- `webinarRegistrations` - Webinar registration tracking

**Index Strategy:**
- 28 indexes added across all tables
- Workspace-scoped queries optimized
- Relationship queries indexed (conversation, category, webinar)
- Status/schedule filtering indexed for common queries

## Schema Design Patterns

**Consistent Conventions:**
- Snake_case naming (matches existing Convex schema)
- `created_at` / `updated_at` timestamps (v.number())
- `workspace_id: v.id("workspaces")` for multi-tenancy
- `v.optional(v.any())` for JSONB fields (requirements, gateway_response, metadata)

**Clerk Integration:**
- `consultant_id: v.optional(v.string())` - Clerk user IDs
- Ready for Phase 4 migrated user references

**Migration Support:**
- `supabaseId: v.optional(v.string())` on CMS tables
- Enables data integrity verification during migration

## Verification Results

**Schema Compilation:**
- Deployed successfully via `npx convex dev --once`
- No compilation errors
- 28 indexes created automatically

**Table Coverage:**
All Supabase tables now have Convex definitions:
- Core tables: ✓ (Phase 3)
- User/org tables: ✓ (Phase 4)
- ARI extended: ✓ (This plan)
- CMS tables: ✓ (This plan)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

**JSONB Field Mapping:**
Supabase JSONB columns mapped to `v.optional(v.any())`:
- `ariDestinations.requirements` - ielts_min, gpa_min, budget_min, budget_max, deadline
- `ariPayments.gateway_response` - Full payment gateway response data
- `ariConfig.tone` - Tone configuration object

**Index Design:**
All tables include `by_workspace` index for efficient multi-tenant queries. Additional indexes support:
- Time-based queries (scheduled_at, registered_at)
- Status filtering (payment status, webinar status, article status)
- Relationship navigation (conversation → payment → appointment)

**Default Values:**
Schema doesn't enforce defaults (Convex pattern) - application code handles:
- `currency: 'IDR'`
- `gateway: 'midtrans'`
- `duration_minutes: 60`
- `hot_threshold: 70`, `warm_threshold: 40`

## Next Phase Readiness

**Schema Complete:**
- All 12 remaining tables defined
- Indexes optimized for query patterns
- Ready for migration script execution in 05-02

**Migration Prerequisites:**
- Table definitions deployed
- Indexes available for lookup operations
- Foreign key relationships defined (v.id references)

**No Blockers:**
- Schema compiles cleanly
- No conflicts with existing tables
- Ready for data migration phase

## Files Modified

**convex/schema.ts** (+219 lines)
- Added 9 ARI extended table definitions
- Added 3 CMS table definitions
- All tables include appropriate indexes
- Follows established naming/structure patterns

---

**Status:** Complete
**Duration:** 1.2 minutes
**Commits:** 1 (8298e1d)
