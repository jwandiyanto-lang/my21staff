---
phase: 05-scheduling-handoff
plan: 01
subsystem: scheduling
tags: [database, api, typescript, supabase]
dependency_graph:
  requires: [03-04-PLAN]
  provides: [consultant_slots table, CRUD API, ConsultantSlot types]
  affects: [05-02-PLAN, 05-03-PLAN, 05-04-PLAN]
tech_stack:
  added: []
  patterns: [weekly recurring slots, workspace-scoped RLS]
key_files:
  created:
    - supabase/migrations/37_consultant_slots.sql
    - src/app/api/workspaces/[id]/slots/route.ts
    - src/app/api/workspaces/[id]/slots/[slotId]/route.ts
  modified:
    - src/lib/ari/types.ts
decisions:
  - gen_random_uuid() for UUID generation (PostgreSQL 13+ native)
  - requireWorkspaceMembership() helper for API auth
  - Partial update pattern for PATCH (only provided fields)
metrics:
  duration: 10m
  completed: 2026-01-20
---

# Phase 5 Plan 1: Slot Schema & API Summary

Consultant slots table with weekly patterns, TypeScript types, and CRUD API for scheduling infrastructure.

## What Was Built

### 1. Database Schema (Task 1)
Created `consultant_slots` table in `supabase/migrations/37_consultant_slots.sql`:

- **Weekly pattern fields**: `day_of_week` (0=Sunday through 6=Saturday), `start_time`, `end_time`
- **Configuration**: `duration_minutes`, `booking_window_days`, `max_bookings_per_slot`
- **Status**: `is_active` for soft-disable without deletion
- **Nullable consultant_id**: Allows workspace-wide slots (any consultant can take)
- **Constraints**: Valid time range (end > start), unique slot per day/time
- **RLS policies**: Same pattern as ari_config (workspace membership check)
- **Indexes**: workspace, consultant, active status, day lookup

### 2. TypeScript Types (Task 2)
Added to `src/lib/ari/types.ts`:

```typescript
interface ConsultantSlot {
  id: string;
  workspace_id: string;
  consultant_id: string | null;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;  // HH:MM:SS format
  end_time: string;
  duration_minutes: number;
  booking_window_days: number;
  max_bookings_per_slot: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AvailableSlot {
  date: string;         // YYYY-MM-DD
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  consultant_id: string | null;
  slot_id: string;      // Reference to ConsultantSlot
  booked: boolean;
}
```

### 3. CRUD API Routes (Task 3)
Created API endpoints for slot management:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workspaces/[id]/slots` | GET | List all slots for workspace |
| `/api/workspaces/[id]/slots` | POST | Create new slot |
| `/api/workspaces/[id]/slots/[slotId]` | PATCH | Update slot fields |
| `/api/workspaces/[id]/slots/[slotId]` | DELETE | Delete slot |

**Features:**
- Workspace membership verification via `requireWorkspaceMembership()`
- Validation for required fields (day_of_week, start_time, end_time)
- Day of week range validation (0-6)
- Constraint violation handling (unique, time range)
- Partial updates (only update provided fields)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration function not available**
- **Found during:** Task 1
- **Issue:** `uuid_generate_v4()` not available (uuid-ossp extension not loaded in PostgreSQL 17)
- **Fix:** Changed to `gen_random_uuid()` which is native to PostgreSQL 13+
- **Files modified:** supabase/migrations/37_consultant_slots.sql
- **Commit:** f24002b

**2. [Rule 3 - Blocking] Migration history out of sync**
- **Found during:** Task 1
- **Issue:** Migrations 33-36 were applied to database but not recorded in migration history
- **Fix:** Used `supabase migration repair` to mark them as applied
- **Files modified:** None (database metadata only)
- **Commit:** N/A (pre-commit fix)

**3. [Rule 3 - Blocking] SlotManager component missing**
- **Found during:** Task 2
- **Issue:** TypeScript compilation failed due to missing `@/components/knowledge-base/slot-manager` import
- **Fix:** Created stub component (later replaced by full implementation from 05-02)
- **Files modified:** src/components/knowledge-base/slot-manager.tsx
- **Commit:** 6fb566c

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f24002b | feat | Create consultant_slots table for scheduling |
| 6fb566c | feat | Add ConsultantSlot and AvailableSlot types |
| 5ebd010 | refactor | Improve slot ID API auth pattern (05-02 overlap) |

## Verification Results

- [x] Migration 37 applied successfully
- [x] TypeScript compiles cleanly
- [x] API routes registered in Next.js build
- [x] RLS policies created for workspace isolation
- [x] Performance indexes created

## Next Phase Readiness

Ready for:
- **05-02-PLAN**: Slot Manager UI (already started - components exist)
- **05-03-PLAN**: Booking flow logic (API ready)
- **05-04-PLAN**: Handoff context generation

No blockers identified.

---

*Completed: 2026-01-20*
*Duration: ~10 minutes*
