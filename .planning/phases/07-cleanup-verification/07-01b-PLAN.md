---
phase: 07-cleanup-verification
plan: 01b
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/auth/workspace-auth.ts
  - src/app/api/invitations/route.ts
  - src/app/api/invitations/accept/route.ts
  - src/app/api/invitations/set-password/route.ts
  - src/app/api/invitations/[id]/route.ts
  - convex/workspaces.ts
autonomous: true

must_haves:
  truths:
    - "workspace-auth helper uses Clerk + Convex instead of Supabase"
    - "Invitation routes deleted or redirecting to Clerk"
  artifacts:
    - path: "src/lib/auth/workspace-auth.ts"
      provides: "Clerk-based workspace auth helper"
      contains: "auth()"
    - path: "src/app/api/invitations/"
      status: "deleted or redirects"
  key_links:
    - from: "src/lib/auth/workspace-auth.ts"
      to: "@clerk/nextjs/server"
      via: "auth() import"
      pattern: "from '@clerk/nextjs/server'"
---

<objective>
Migrate workspace-auth helper to Clerk and deprecate invitation routes.

Purpose: workspace-auth must use Clerk + Convex; invitations now handled by Clerk OrganizationProfile.
Output: workspace-auth migrated, invitation routes removed
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-user-migration-organizations/04-05-SUMMARY.md
@convex/workspaces.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migrate workspace-auth helper to Clerk</name>
  <files>
    src/lib/auth/workspace-auth.ts
    convex/workspaces.ts
  </files>
  <action>
First, check if getMembership query exists in convex/workspaces.ts:
```bash
grep -n "getMembership" convex/workspaces.ts || echo "NOT FOUND"
```

If NOT FOUND, add it to convex/workspaces.ts:
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

Then rewrite workspace-auth.ts to use Clerk + Convex:

```typescript
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { NextResponse } from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export interface AuthResult {
  user: { id: string; email: string }
  workspaceId: string
  role: WorkspaceRole
}

export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<AuthResult | NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from Convex
  const user = await convex.query(api.users.getByClerkId, { clerkId: userId })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Check workspace membership via Convex
  const member = await convex.query(api.workspaces.getMembership, {
    workspace_id: workspaceId,
    user_id: userId,
  })

  if (!member) {
    return NextResponse.json(
      { error: 'Not authorized to access this workspace' },
      { status: 403 }
    )
  }

  return {
    user: { id: userId, email: user.email || '' },
    workspaceId,
    role: member.role as WorkspaceRole
  }
}
```
  </action>
  <verify>
- `npm run build` passes
- `grep "supabase" src/lib/auth/workspace-auth.ts` returns nothing
- `grep "@clerk/nextjs/server" src/lib/auth/workspace-auth.ts` returns match
  </verify>
  <done>
workspace-auth.ts uses Clerk auth() + Convex queries, no Supabase
  </done>
</task>

<task type="auto">
  <name>Task 2: Deprecate invitation routes</name>
  <files>
    src/app/api/invitations/route.ts
    src/app/api/invitations/accept/route.ts
    src/app/api/invitations/set-password/route.ts
    src/app/api/invitations/[id]/route.ts
  </files>
  <action>
The invitation system was for Supabase auth. Clerk handles invitations via OrganizationProfile (implemented in 04-05).

1. Check for references to invitation routes:
```bash
grep -r "api/invitations" src/ --include="*.ts" --include="*.tsx" | grep -v "route.ts"
```

2. Based on grep results:

**If NO references found:**
Delete all invitation files and directory:
```bash
rm -rf src/app/api/invitations/
```

Also delete set-password page if exists:
```bash
rm -rf src/app/\(auth\)/set-password/ 2>/dev/null || true
```

**If references found:**
Update referencing files to remove/redirect invitation calls, then delete the routes.

3. Verify deletion:
```bash
ls src/app/api/invitations/ 2>/dev/null && echo "STILL EXISTS" || echo "Deleted"
```
  </action>
  <verify>
Verify actual outcome (deletion or reference cleanup):
- `ls src/app/api/invitations/ 2>/dev/null || echo "Directory deleted"` - expect "Directory deleted"
- `grep -r "api/invitations" src/ --include="*.ts" --include="*.tsx" | wc -l` - expect 0
- `npm run build` passes
  </verify>
  <done>
Invitation routes deleted, team invitations work via Clerk OrganizationProfile
  </done>
</task>

</tasks>

<verification>
Run full build to verify no broken imports:
```bash
npm run build
```

Check no Supabase imports in workspace-auth:
```bash
grep -r "supabase" src/lib/auth/workspace-auth.ts 2>/dev/null || echo "Clean"
```

Check invitation routes removed:
```bash
ls src/app/api/invitations/ 2>/dev/null || echo "Invitations removed"
```
</verification>

<success_criteria>
1. workspace-auth.ts uses Clerk + Convex
2. Invitation routes deleted
3. No references to /api/invitations remain
4. `npm run build` passes
</success_criteria>

<output>
After completion, create `.planning/phases/07-cleanup-verification/07-01b-SUMMARY.md`
</output>
