# Settings Page Crash Investigation

**Date:** 2026-01-27
**Issue:** Settings page crashes with server-side exception (Digest: 2181255606)
**Status:** INVESTIGATING

## Timeline

- **Previous fixes:** Commits 40fb338, da5d85c supposedly fixed Database & Settings crashes
- **Current state:** User reports Settings page STILL crashes in production

## Investigation Log

### Step 1: Identify Settings Page Route

**File:** `src/app/(dashboard)/[workspace]/settings/page.tsx`

**Server-side code (lines 38-50):**
```typescript
// Production: fetch real workspace from Convex
const workspace = await fetchQuery(api.workspaces.getBySlug, {
  slug: workspaceSlug,
})

if (!workspace) {
  notFound()
}

// Get ARI config to check if AI is enabled
const ariConfig = await fetchQuery(api.ari.getAriConfig, {
  workspace_id: workspace._id,
})
```

### Step 2: Check Convex Query Auth Requirements

**File:** `convex/ari.ts` (lines 21-35)

```typescript
export const getAriConfig = query({
  args: {
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);  // ← AUTH CHECK

    const config = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .first();

    return config;
  },
});
```

**File:** `convex/lib/auth.ts` (lines 40-61)

```typescript
export async function requireWorkspaceMembership(
  ctx: QueryCtx | MutationContext,
  workspaceId: string
): Promise<{ userId: string; membership: any }> {
  const userId = await getAuthUserId(ctx);  // ← REQUIRES CLERK AUTH
  if (!userId) {
    throw new Error("Unauthorized");       // ← THROWS ERROR
  }

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_workspace", (q: any) =>
      q.eq("user_id", userId).eq("workspace_id", workspaceId)
    )
    .first();

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  return { userId, membership };
}
```

### Step 3: ROOT CAUSE IDENTIFIED

**Problem:** Settings page is a **SERVER COMPONENT** that calls Convex queries during server-side rendering (SSR).

**The Issue:**
1. Page is rendered on the server (Next.js SSR)
2. Server calls `fetchQuery(api.ari.getAriConfig)`
3. `getAriConfig` calls `requireWorkspaceMembership(ctx, workspace_id)`
4. `requireWorkspaceMembership` calls `getAuthUserId(ctx)` from `@convex-dev/auth/server`
5. **In SSR context, there is NO Clerk auth context available**
6. `getAuthUserId` returns `null` or `undefined`
7. Auth check throws `Error("Unauthorized")`
8. **Server-side exception crashes the page**

**Why Database page doesn't crash:**
- Database page likely doesn't call auth-protected Convex queries during SSR
- Or it has dev mode checks that skip Convex calls

**Why previous fixes didn't work:**
- Commit 40fb338 fixed CLIENT-SIDE Clerk hooks (useAuth, useOrganization)
- But this is a SERVER-SIDE auth issue in Convex queries
- The Settings page server component has no access to Clerk session during SSR

### Step 4: Evidence Summary

**Direct evidence:**
1. Settings page is async server component (line 19)
2. Calls `fetchQuery(api.ari.getAriConfig)` during SSR (line 48)
3. `getAriConfig` requires auth via `requireWorkspaceMembership` (line 26)
4. Auth helper requires Clerk session via `getAuthUserId` (line 44)
5. **SSR context has no Clerk session → throws Unauthorized**

**Supporting evidence:**
1. Error is "server-side exception" (from screenshot)
2. Happens on page load, not on interaction
3. Database page works (different query pattern)
4. Dev mode works (bypasses Convex entirely)

**Confirmation - Database page comparison:**
- Database page ONLY calls `api.workspaces.getBySlug` (line 29-31)
- `getBySlug` has NO auth check (convex/workspaces.ts:55-66)
- Settings page calls BOTH `getBySlug` AND `getAriConfig`
- `getAriConfig` HAS auth check → crashes in SSR

## ROOT CAUSE CONFIRMED

**The bug:** Settings page server component calls `fetchQuery(api.ari.getAriConfig)` which requires Clerk authentication, but Clerk auth is not available in Next.js SSR context.

**Files involved:**
1. `src/app/(dashboard)/[workspace]/settings/page.tsx:48` - calls auth-protected query in SSR
2. `convex/ari.ts:26` - `getAriConfig` requires workspace membership auth
3. `convex/lib/auth.ts:44` - auth helper requires Clerk session (unavailable in SSR)

## Fix Direction

**Option 1:** Move `getAriConfig` call to client component
- Create client wrapper that fetches AI status after page load
- Settings page server component only fetches workspace (no auth required)
- Client component uses `useQuery` with Clerk auth context

**Option 2:** Make `getAriConfig` query public (no auth)
- Remove `requireWorkspaceMembership` from `getAriConfig`
- Safe because it only returns boolean `enabled` status
- Still requires valid workspace_id (public info after workspace lookup)

**Option 3:** Use Clerk's server-side auth in Settings page
- Import `auth()` from `@clerk/nextjs/server`
- Pass user context to Convex somehow
- More complex, may not be compatible with `@convex-dev/auth`

**Recommended:** Option 1 (move to client) - cleanest separation of concerns.
