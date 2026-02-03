---
status: verifying
trigger: "Debug remaining API and Convex errors on Leads page"
created: 2025-02-03T12:00:00Z
updated: 2025-02-03T12:10:00Z
---

## Current Focus

hypothesis: CONFIRMED - field name mismatch caused Convex query failure
test: Deploy fix and verify on production Leads page
expecting: No more Convex errors on listByWorkspaceWithUsers
next_action: User to verify Leads page loads without errors

## Symptoms

expected: Leads page loads without errors, status-config returns 200, workspace members query succeeds
actual: 500 error on /api/workspaces/my21staff-vpdfba/status-config (3 times), Convex server error on workspaceMembers:listByWorkspaceWithUsers
errors:
  - `/api/workspaces/my21staff-vpdfba/status-config` - 500 error (3 times)
  - `[CONVEX Q(workspaceMembers:listByWorkspaceWithUsers)] [Request ID: ee0d3632501d0d97] Server Error`
reproduction: Visit Leads page in production
started: After recent deployment

## Eliminated

(none yet)

## Evidence

- timestamp: 2025-02-03T12:00:00Z
  checked: convex/schema.ts users table definition
  found: Users table has field `clerk_id` with index `by_clerk_id` on field `["clerk_id"]`
  implication: The index field name is `clerk_id` (with underscore)

- timestamp: 2025-02-03T12:01:00Z
  checked: convex/workspaceMembers.ts listByWorkspaceWithUsers query
  found: Query uses `.withIndex("by_clerk_id", (q) => q.eq("clerkId", m.user_id))` - using `clerkId` (camelCase) instead of `clerk_id` (snake_case)
  implication: INDEX FIELD NAME MISMATCH - this is the root cause of the Convex error

- timestamp: 2025-02-03T12:02:00Z
  checked: status-config route
  found: Route uses api.workspaces.getStatusConfig which expects v.id("workspaces") typed argument
  implication: The workspace._id from getBySlug should be correct type

- timestamp: 2025-02-03T12:10:00Z
  checked: Deployed fix via `npx convex deploy`
  found: Convex functions deployed successfully to production
  implication: Fix is live, awaiting verification

## Resolution

root_cause: In `convex/workspaceMembers.ts`, the `listByWorkspaceWithUsers` query used `clerkId` (camelCase) but the schema defines the field as `clerk_id` (snake_case). The index lookup failed because it was looking for a field that doesn't exist.
fix: Changed `q.eq("clerkId", m.user_id)` to `q.eq("clerk_id", m.user_id)` in the query
verification: (awaiting user to test Leads page)
files_changed:
  - convex/workspaceMembers.ts
