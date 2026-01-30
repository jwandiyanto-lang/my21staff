# Quick Task 002: Rename Leads to Database and Fix Pagination

## Goal
1. Rename "Lead Management" to "Database" in the UI
2. Fix pagination bug where only 50 of 246 contacts are shown

## Root Cause Analysis
The pagination issue is in `/api/contacts/route.ts`:
- It calls `listByWorkspaceInternal` without a limit override
- `listByWorkspaceInternal` defaults to `limit = 50`
- So the API only ever fetches 50 contacts from Convex
- Then it paginates those 50, giving the illusion of working pagination

## Tasks

### Task 1: Rename "Lead Management" to "Database" in sidebar
**File:** `src/components/workspace/sidebar.tsx`
**Change:** Line 40: `title: 'Lead Management'` → `title: 'Database'`

### Task 2: Rename header in database-client.tsx
**File:** `src/app/(dashboard)/[workspace]/database/database-client.tsx`
**Change:** Line 312: `<h1 className="text-2xl font-semibold">Lead Management</h1>` → `<h1 className="text-2xl font-semibold">Database</h1>`

### Task 3: Fix API to fetch all contacts before pagination
**File:** `src/app/api/contacts/route.ts`
**Change:** Pass a high limit (or no limit) to `listByWorkspaceInternal` to get all contacts, then paginate in the API layer.

The API already does client-side pagination (lines 59-61), so we just need to remove the 50-contact ceiling by passing a larger limit to Convex.

## Verification
After changes:
- Sidebar should show "Database" instead of "Lead Management"
- Page header should show "Database"
- Total contacts shown should be 246 (not 50)
- Pagination should work across all pages
