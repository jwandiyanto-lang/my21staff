---
status: resolved
trigger: "API calls returning 401 Unauthorized - workspace ID mismatch (dev_workspace_001 vs demo)"
created: 2026-01-27T00:00:00Z
updated: 2026-01-27T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - knowledge-base/page.tsx passes MOCK_CONVEX_WORKSPACE._id (dev_workspace_001) instead of slug (demo) to KnowledgeBaseClient, causing all child components to make API calls with wrong workspace ID
test: API routes check for workspaceId === 'demo' in dev mode, but receive 'dev_workspace_001' instead
expecting: All API routes will reject calls with dev_workspace_001, returning 401
next_action: Document root cause and required fix

## Symptoms

expected: All API calls to `/api/workspaces/demo/*` return 200 OK with mock data in dev mode
actual: API calls going to `/api/workspaces/dev_workspace_001/*` returning 401 Unauthorized
errors:
  - Failed to load resource: /api/workspaces/dev_workspace_001/ari-config (401)
  - Failed to load resource: /api/workspaces/dev_workspace_001/flow-stages (401)
  - Failed to load resource: /api/workspaces/dev_workspace_001/knowledge (401)
  - Failed to load resource: /api/workspaces/dev_workspace_001/scoring-config (401)
  - Failed to load resource: /api/workspaces/dev_workspace_001/slots (401)
reproduction: Navigate to http://localhost:3000/demo/knowledge-base in dev mode
started: UAT Test 3 - API Dev Mode Returns Mock Data (Phase 02-your-intern-debug)

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-01-27T00:00:00Z
  checked: MOCK_CONVEX_WORKSPACE definition in mock-data.ts
  found: "_id is 'dev_workspace_001', but slug is 'demo'"
  implication: When page.tsx passes workspace.id to child components, it passes the _id field which is 'dev_workspace_001', NOT the slug. The API routes expect 'demo' for dev mode.

- timestamp: 2026-01-27T00:00:01Z
  checked: knowledge-base-client.tsx component
  found: "Receives workspace prop and passes workspace.id to all tab components (PersonaTab, FlowTab, DatabaseTab, ScoringTab, SlotManager)"
  implication: All child components receive the wrong workspace ID

- timestamp: 2026-01-27T00:00:02Z
  checked: knowledge-base/page.tsx server component
  found: "When shouldUseMockData(workspaceSlug) is true, passes MOCK_CONVEX_WORKSPACE._id to child component. _id is 'dev_workspace_001' not 'demo'"
  implication: This is the source of the mismatch - the page component is passing _id instead of slug

- timestamp: 2026-01-27T00:00:03Z
  checked: persona-tab.tsx (PersonaTab component)
  found: "Line 61 uses fetch(`/api/workspaces/${workspaceId}/ari-config`) - passes workspaceId directly from prop"
  implication: If workspaceId is 'dev_workspace_001', API call goes to /api/workspaces/dev_workspace_001/ari-config

- timestamp: 2026-01-27T00:00:04Z
  checked: all API route files in src/app/api/workspaces/[id]/
  found: "14 instances of 'if (isDevMode() && workspaceId === \"demo\")' pattern across ari-config, knowledge, flow-stages, slots, and scoring-config routes"
  implication: All these routes expect workspaceId to be exactly 'demo' in dev mode. When it's 'dev_workspace_001', the check fails, falls through to requireWorkspaceMembership(), which returns 401 Unauthorized

## Resolution

root_cause: MOCK_CONVEX_WORKSPACE._id was set to 'dev_workspace_001' but all 5 API routes (ari-config, flow-stages, knowledge, scoring-config, slots) check for 'demo' in dev mode via `if (isDevMode() && workspaceId === 'demo')`. knowledge-base/page.tsx (line 20) passes MOCK_CONVEX_WORKSPACE._id to KnowledgeBaseClient. All child components (PersonaTab, FlowTab, DatabaseTab, ScoringTab, SlotManager) make API calls using this workspace ID. When workspaceId is 'dev_workspace_001' instead of 'demo', API routes fail the dev mode check, skip the mock data path, and fall through to requireWorkspaceMembership() which returns 401 Unauthorized.

fix: ALREADY APPLIED in commit 10e4eb3 - Changed MOCK_CONVEX_WORKSPACE._id from 'dev_workspace_001' to 'demo' (line 38 of src/lib/mock-data.ts)

verification: VERIFIED - Current code has _id set to 'demo'. All API routes will now accept 'demo' as workspaceId in dev mode and return mock data instead of 401.

files_changed:
  - src/lib/mock-data.ts (line 38: MOCK_CONVEX_WORKSPACE._id changed from 'dev_workspace_001' to 'demo')
