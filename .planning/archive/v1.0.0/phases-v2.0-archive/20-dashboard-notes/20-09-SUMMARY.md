# Plan 20-09 Summary: Dashboard Task Sorting & Complete Action

**Status:** Complete
**Duration:** ~5 min
**Commits:** 6

## Objective

Add "Mark Complete" action to dashboard tasks and verify sorting is correct (nearest due date first).

## Deliverables

### 1. Database Migration
- **File:** `supabase/migrations/17_notes_completed_at.sql`
- Added `completed_at` column to contact_notes table
- Created partial index for filtering uncompleted tasks efficiently

### 2. Dashboard Query Update
- **File:** `src/app/(dashboard)/[workspace]/page.tsx`
- Added `.is('completed_at', null)` filter to exclude completed tasks
- Sorting confirmed: nearest due date first (`ascending: true`)

### 3. Server Action
- **File:** `src/app/(dashboard)/[workspace]/actions.ts`
- `completeTask(noteId, workspaceSlug)` - marks task complete with timestamp
- Validates user authentication
- Revalidates dashboard path after update

### 4. Client Component
- **File:** `src/components/dashboard/upcoming-tasks.tsx`
- Interactive task list with complete button (circular checkbox style)
- Optimistic UI: task removed from list immediately on click
- Loading state with spinner during server action

### 5. TypeScript Types
- **File:** `src/types/database.ts`
- Added `completed_at: string | null` to Row, Insert, Update types

## UAT Gaps Addressed

- **Gap #3:** Dashboard to-do list sorted by due date (nearest first) - Verified
- **Gap #4:** Dashboard needs "finish follow up" action - Implemented

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/17_notes_completed_at.sql` | New migration |
| `src/app/(dashboard)/[workspace]/page.tsx` | Query filter + component integration |
| `src/app/(dashboard)/[workspace]/actions.ts` | New server action |
| `src/components/dashboard/upcoming-tasks.tsx` | New client component |
| `src/types/database.ts` | Type definitions |

## Next Steps

1. Apply migration to Supabase: `supabase db push` or run SQL in dashboard
2. Deploy to Vercel
3. Test task completion flow in production
