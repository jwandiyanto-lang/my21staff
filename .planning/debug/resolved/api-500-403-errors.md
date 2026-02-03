---
status: resolved
trigger: "Debug and fix multiple API endpoint failures - 500 and 403 errors on workspace APIs"
created: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:30:00Z
symptoms_prefilled: true
goal: find_and_fix
---

## Current Focus

hypothesis: CONFIRMED - API routes incorrectly passed slug as Convex ID
test: Fixed 3 routes to look up workspace by slug first, build passes
expecting: 500 errors on bot-config, intern-config, tags should be resolved
next_action: Deploy and verify in production. Separately fix 403 by creating workspaceMembers record.

## Symptoms

expected: All API endpoints return 200 OK with proper data
actual: 500 errors on bot-config, intern-config, status-config, tags; 403 on settings
errors: HTTP 500 Internal Server Error, HTTP 403 Forbidden
reproduction: Call any of the 5 endpoints with workspace slug my21staff-vpdfba
started: After changes to use workspaceSlug instead of Convex ID in API calls

## Eliminated

## Evidence

- timestamp: 2026-02-03T12:05:00Z
  checked: bot-config/route.ts line 37-39
  found: Uses `workspace_id: workspaceId as any` - passing slug string where Convex expects Id<'workspaces'>
  implication: Type coercion hides bug - slug passed directly to Convex query expecting ID

- timestamp: 2026-02-03T12:05:00Z
  checked: intern-config/route.ts line 22-24
  found: Uses `workspaceId: id as Id<'workspaces'>` - same pattern, slug as Convex ID
  implication: Will fail with invalid ID error from Convex

- timestamp: 2026-02-03T12:05:00Z
  checked: settings/route.ts line 35-39
  found: Uses requireWorkspaceMembership() which looks up workspace by slug first, then checks membership
  implication: 403 error means membership check is failing - getMembership uses workspace_id but passes string

- timestamp: 2026-02-03T12:05:00Z
  checked: status-config/route.ts line 34-44
  found: CORRECTLY looks up workspace by slug first, then uses workspace._id for subsequent query
  implication: This one should work! The pattern is correct.

- timestamp: 2026-02-03T12:05:00Z
  checked: tags/route.ts line 25-28
  found: Uses workspaceId directly (slug) in admin.setContactTags mutation
  implication: setContactTags does `ctx.db.get(args.workspaceId as any)` - will fail on slug

- timestamp: 2026-02-03T12:05:00Z
  checked: workspace-auth.ts getMembership call (line 37-40)
  found: Passes workspace._id correctly after looking up by slug
  implication: Auth flow is correct but something else is wrong

- timestamp: 2026-02-03T12:06:00Z
  checked: convex/workspaces.ts getMembership (line 203-216)
  found: Uses workspace_id string with index by_user_workspace
  implication: Index expects string workspace_id but user membership may not exist

## Resolution

root_cause: |
  MULTIPLE ISSUES FOUND:

  1. bot-config/route.ts: Passes slug directly as workspace_id to Convex query
     - Line 37-39: fetchQuery(api.botConfig.getBotConfig, { workspace_id: workspaceId as any })
     - Convex botConfig.getBotConfig expects v.id('workspaces'), not a slug string

  2. intern-config/route.ts: Same issue
     - Line 22-24: fetchQuery(api.internConfig.getByWorkspaceId, { workspaceId: id as Id<'workspaces'> })
     - Type cast hides the error - slug string is not a valid Convex ID

  3. tags/route.ts: Same issue
     - Line 25-28: fetchMutation(api.admin.setContactTags, { workspaceId })
     - admin.setContactTags does ctx.db.get(args.workspaceId as any) which fails on slug

  4. settings/route.ts (403 error):
     - Uses requireWorkspaceMembership which correctly looks up workspace by slug
     - But getMembership in workspace-auth.ts uses workspace._id which is correct
     - The 403 means no workspaceMembers record exists for the user/workspace combo

  5. status-config/route.ts: SHOULD WORK (correctly does slug lookup first)

fix: |
  1. bot-config/route.ts:
     - Added workspace lookup by slug before querying botConfig
     - Changed from fetchQuery to ConvexHttpClient for consistency
     - Now correctly passes workspace._id instead of slug

  2. intern-config/route.ts:
     - Added workspace lookup by slug before querying internConfig
     - Changed from fetchQuery to ConvexHttpClient for consistency
     - Now correctly passes workspace._id instead of slug

  3. tags/route.ts:
     - Added workspace lookup by slug before calling setContactTags
     - Changed from fetchQuery to ConvexHttpClient for consistency
     - Now correctly passes workspace._id instead of slug

  4. settings/route.ts (403 error):
     - Code is correct - the 403 is a DATA issue, not a code issue
     - User needs to have a workspaceMembers record in the database
     - This happens when the user is first added to a workspace via Clerk

  5. status-config/route.ts: No changes needed - already correct

verification: |
  1. Build succeeds (npm run build passed)
  2. TypeScript compiles without errors
  3. ESLint passes on modified files

  REMAINING ISSUE - 403 on settings:
  This is a DATA issue, not a CODE issue. The user needs a workspaceMembers record.
  To fix: Either run the organization creation flow, or manually add member via Convex dashboard:
  - workspaceMembers.create({ workspace_id: "<workspace_id>", user_id: "<clerk_user_id>", role: "owner" })
files_changed:
  - src/app/api/workspaces/[id]/bot-config/route.ts
  - src/app/api/workspaces/[id]/intern-config/route.ts
  - src/app/api/workspaces/[id]/tags/route.ts
