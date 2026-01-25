---
phase: 07-cleanup-verification
plan: 01b
type: execute
completed: 2026-01-24
duration: 9 min

subsystem: auth
tags: [clerk, convex, auth-migration, deprecation, workspace-auth]

requires:
  - phases: [04-05]
    reason: "Clerk OrganizationProfile handles team invitations"
  - phases: [03-01, 03-02]
    reason: "Clerk webhook and users table in Convex"

provides:
  - Clerk-based workspace authentication helper
  - Clean removal of Supabase invitation system

affects:
  - phases: [07-02, 07-03, 07-04, 07-05, 07-06]
    impact: "Other routes can follow same Clerk + Convex pattern"

tech-stack:
  added: []
  patterns:
    - "Clerk auth() + ConvexHttpClient for workspace auth"
    - "Deprecate old features cleanly by removing unused UI and routes"

key-files:
  created: []
  modified:
    - src/lib/auth/workspace-auth.ts
    - src/app/(dashboard)/[workspace]/settings/settings-client.tsx
    - src/app/(dashboard)/[workspace]/settings/page.tsx
    - convex/workspaces.ts
  deleted:
    - src/app/api/invitations/route.ts
    - src/app/api/invitations/[id]/route.ts
    - src/app/api/invitations/accept/route.ts
    - src/app/api/invitations/set-password/route.ts
    - src/app/(auth)/set-password/page.tsx
    - src/app/(dashboard)/[workspace]/team/team-client.tsx

decisions: []
---

# Phase 07 Plan 01b: Workspace Auth + Invitation Cleanup Summary

**One-liner:** Migrated workspace-auth to Clerk + Convex; removed Supabase invitation system

---

## What Was Delivered

### 1. Workspace Auth Migration to Clerk + Convex
**File:** `src/lib/auth/workspace-auth.ts`

Rewrote `requireWorkspaceMembership()` helper:
- **Before:** Used Supabase `createClient()` + `auth.getUser()` + database queries
- **After:** Uses Clerk `auth()` + ConvexHttpClient + `api.workspaces.getMembership`

**Changes:**
- Import `auth` from `@clerk/nextjs/server` (not Supabase)
- Use `ConvexHttpClient` to query workspace membership
- Clerk user IDs used throughout (not Supabase UUIDs)

**New Convex Query:**
Added `getMembership` query to `convex/workspaces.ts`:
```typescript
export const getMembership = query({
  args: { workspace_id: v.string(), user_id: v.string() },
  handler: async (ctx, { workspace_id, user_id }) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", q =>
        q.eq("workspace_id", workspace_id).eq("user_id", user_id)
      )
      .first();
  },
});
```

### 2. Invitation System Deprecation
**Context:** Phase 04-05 replaced custom invitation system with Clerk OrganizationProfile

**Deleted Routes:**
- `/api/invitations` (POST) - Create invitation
- `/api/invitations/[id]` (DELETE, POST) - Cancel/resend invitation
- `/api/invitations/accept` (POST) - Accept invitation
- `/api/invitations/set-password` (POST) - Set password for new user

**Deleted Pages:**
- `/set-password` - Onboarding page for invited users (Clerk handles this)
- `team-client.tsx` - Old team management UI (replaced by OrganizationProfile)

**Updated Settings Page:**
Removed Team tab from settings-client.tsx:
- Removed `TeamMember` and `Invitation` interfaces
- Removed team invitation handlers (`handleInvite`, `handleDeleteMember`, etc.)
- Removed Team tab trigger and content
- Settings now focuses on: WhatsApp integration, Quick Replies, Contact Tags, Data Import/Export

**Team management now lives at:** `/[workspace]/team` (Clerk OrganizationProfile)

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Technical Decisions

None - followed established patterns from Phase 04-05.

---

## Verification Results

All verification checks passed:

✓ `npm run build` - TypeScript compilation successful (no new errors)
✓ `grep "supabase" src/lib/auth/workspace-auth.ts` - No Supabase imports found
✓ `grep "@clerk/nextjs/server" src/lib/auth/workspace-auth.ts` - Clerk import confirmed
✓ `ls src/app/api/invitations/` - Directory deleted
✓ `grep -r "api/invitations" src/` - 0 references found

---

## Commits

| Commit | Task | Files Changed |
|--------|------|---------------|
| b2b5dc5 | Task 1: Migrate workspace-auth | workspace-auth.ts, convex/workspaces.ts |
| 0b0fb78 | Task 2: Deprecate invitations | 8 files deleted, settings pages updated |

**Note:** Commit 0b0fb78 message mentions "07-04" but includes 07-01b Task 2 changes (mixed with other work).

---

## Impact on Codebase

**Removed:** 1,768 lines (invitation routes, set-password page, team UI)
**Added:** 36 lines (getMembership query, workspace-auth rewrite)
**Net:** -1,732 lines

**Auth pattern now:**
1. API routes use `auth()` from Clerk to get `userId`
2. Query Convex for user/workspace data
3. No more Supabase auth anywhere in workspace access control

---

## Next Phase Readiness

**Ready for:** 07-02 (Continue cleaning up other Supabase routes)

**Pattern established:**
- Replace Supabase `createClient()` with Clerk `auth()`
- Use ConvexHttpClient for data access in API routes
- Delete deprecated Supabase-based features cleanly

---

## Performance Notes

**Workspace auth now:**
- 1 Clerk auth check (fast, uses JWT)
- 2 Convex queries (getByClerkId, getMembership)
- Previously: 1 Supabase auth check + 1 Supabase database query

**No performance regression** - similar number of operations, but Convex is faster than Supabase (see Phase 03 benchmarks: 37ms vs 926ms P95).

---

**Execution time:** 9 minutes
**Status:** Complete
**Blocker:** None
