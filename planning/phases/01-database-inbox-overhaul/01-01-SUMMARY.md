---
phase: 01-database-inbox-overhaul
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, ari, ai-bot, midtrans, scheduling]

# Dependency graph
requires: []
provides:
  - ARI database tables for bot configuration, knowledge base, conversation tracking
  - Payment schema with Midtrans integration
  - Appointment scheduling schema
  - AI model comparison metrics table
affects: [02-ari-core, 03-scoring-algorithm, 04-payment-flow, 05-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SELECT wrapper pattern for RLS: (SELECT auth.uid())"
    - "Workspace-scoped tables with ON DELETE CASCADE"
    - "JSONB for flexible context storage"
    - "Partial indexes for hot paths (is_promoted, pending payments)"

key-files:
  created:
    - supabase/migrations/34_ari_tables.sql
  modified: []

key-decisions:
  - "One ARI config per workspace (UNIQUE constraint)"
  - "One ARI conversation per contact per workspace"
  - "conversation_id FK nullable - allows ARI conversations before inbox link"
  - "Payment amount stored as INTEGER (smallest currency unit)"
  - "AI comparison periods tracked for A/B testing isolation"

patterns-established:
  - "RLS with SELECT wrapper: workspace_id IN (SELECT ... WHERE user_id = (SELECT auth.uid()))"
  - "ARI state machine: greeting -> qualifying -> scoring -> booking -> payment -> scheduling -> handoff -> completed"
  - "Flexible JSONB context for conversation data"

# Metrics
duration: 2min
completed: 2026-01-20
---

# Phase 01 Plan 01: ARI Database Tables Summary

**7 ARI tables with RLS policies, triggers, and 20 performance indexes for bot configuration, conversation tracking, payments, and appointments**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-20T08:25:45Z
- **Completed:** 2026-01-20T08:27:17Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created 7 ARI tables: ari_config, ari_destinations, ari_conversations, ari_messages, ari_payments, ari_appointments, ari_ai_comparison
- Applied optimized RLS policies using SELECT wrapper pattern for all tables
- Added 20 performance indexes including partial indexes for hot paths
- Set up updated_at triggers for 6 tables (all except ari_messages which is append-only)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ARI tables migration** - `337a86f` (feat)
2. **Task 2: Add performance indexes** - included in Task 1 commit (indexes at bottom of migration file as specified)

## Files Created/Modified

- `supabase/migrations/34_ari_tables.sql` - 434 lines: 7 tables, RLS policies, triggers, indexes

## Decisions Made

1. **Combined Task 1 and Task 2 into single migration** - Both tasks specify the same file (34_ari_tables.sql), so indexes were added at the bottom as the plan specified. This follows SQL migration best practices (one atomic migration per feature).

2. **JSONB for flexible context** - Using JSONB for `ari_conversations.context` and `ari_destinations.requirements` allows schema flexibility as ARI's data needs evolve.

3. **Nullable conversation_id on ari_conversations** - Allows ARI to track conversations even before they're linked to the main inbox system (ON DELETE SET NULL).

4. **Integer amount for payments** - Following Midtrans convention of storing amounts as smallest currency unit (IDR doesn't have cents, so just the integer value).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database migration must be applied to Supabase.** Run in Supabase SQL Editor:

```sql
-- Paste contents of supabase/migrations/34_ari_tables.sql
```

Or via Supabase CLI if configured:
```bash
supabase db push
```

**Verification after applying:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'ari_%'
ORDER BY table_name;
-- Should return 7 tables

-- Check indexes exist
SELECT count(*) FROM pg_indexes WHERE tablename LIKE 'ari_%';
-- Should return 20
```

## Next Phase Readiness

- ARI database schema ready for core implementation (Phase 02)
- Payment table ready for Midtrans integration (Phase 04)
- Appointment table ready for scheduling features (Phase 05)
- AI comparison table ready for A/B testing metrics

---
*Phase: 01-database-inbox-overhaul*
*Completed: 2026-01-20*
