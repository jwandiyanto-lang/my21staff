---
phase: 05-implementation
plan: 01
subsystem: database
tags: [convex, schema, typescript, indexes, crm]

# Dependency graph
requires:
  - phase: 03-convex-spike
    provides: Convex project setup and baseline schema
provides:
  - Complete Convex data model matching Supabase tables
  - Indexes for hot path queries (phone lookup, assignment filtering, conversation time)
  - TypeScript types for type-safe database operations
  - Schema support for ARI lead scoring metadata
affects: [05-02-crud-mutations, 05-inbox, 05-contacts]

# Tech tracking
tech-stack:
  added: []
  patterns: [Convex v.any() for flexible metadata, composite indexes for query optimization]

key-files:
  created: []
  modified: [convex/schema.ts]

key-decisions:
  - "Use v.optional(v.any()) for metadata fields to support flexible ARI scoring and reply context"
  - "Phone normalization stored in dedicated phone_normalized field for efficient queries"
  - "Index by_assigned for filtering contacts by assignment"

patterns-established:
  - "Convex field naming: snake_case (matches Supabase) for consistency during migration"
  - "v.any() for flexible metadata (ARI scores, reply context, user preferences)"

# Metrics
duration: 8min
completed: 2026-01-21
---

# Phase 5 Plan 1: Convex Schema Complete Summary

**Convex schema extended with all Supabase fields, ARI metadata support, and optimized indexes for <500ms query targets**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-21T15:51:45Z
- **Completed:** 2026-01-21T15:59:21Z
- **Tasks:** 4
- **Files modified:** 1

## Accomplishments

- Added 5 missing Supabase fields to contacts table (phone_normalized, kapso_name, assigned_to, source, cache_updated_at)
- Documented reply context support in messages metadata field
- Added settings field to workspaceMembers for filter presets
- Created by_assigned index for contact assignment filtering

## Task Commits

Each task was committed atomically:

1. **Task 1: Update contacts schema with missing Supabase fields** - `655ebbd` (feat)
2. **Task 2: Update messages schema with reply context fields** - `d1bfe6f` (docs)
3. **Task 3: Add workspace members settings field for filter presets** - `7e91b9d` (feat)
4. **Task 4: Regenerate Convex types from updated schema** - (n/a - types auto-generated from schema)

## Files Created/Modified

- `convex/schema.ts` - Extended with contacts fields (phone_normalized, kapso_name, assigned_to, source, cache_updated_at), workspaceMembers settings, and metadata documentation

## Schema Updates

### Contacts Table

| Field | Type | Purpose |
|-------|------|---------|
| phone_normalized | string (optional) | Normalized phone for matching (+628...) |
| kapso_name | string (optional) | WhatsApp profile name from Kapso |
| assigned_to | string (optional) | Supabase user UUID of assigned member |
| source | string (optional) | Lead source (webinar, referral, website...) |
| cache_updated_at | number (optional) | Timestamp of last cache refresh |

**Indexes added:**
- `by_assigned` - ["workspace_id", "assigned_to"] for assignment filtering

### WorkspaceMembers Table

| Field | Type | Purpose |
|-------|------|---------|
| settings | any (optional) | User preferences including filterPresets |

### Messages Table

**Metadata documented to support:**
- `reply_to_kapso_id` - Original message reference
- `reply_to_from` - Original sender info

## Decisions Made

- **v.any() for metadata**: Chose flexible JSON field over typed fields for reply context, ARI scores, and user settings. Enables schema evolution without migrations.
- **Snake_case naming**: Maintained Supabase field naming convention to simplify migration and reduce bugs during data sync.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Authentication Gates

None - no external authentication required for schema updates.

## Next Phase Readiness

- Convex schema complete with all Supabase fields
- Hot path indexes defined (by_workspace_phone, by_assigned, by_conversation_time)
- TypeScript types auto-generated and ready for CRUD mutations
- Ready for Plan 02: CRUD mutations implementation

---
*Phase: 05-implementation*
*Completed: 2026-01-21*
