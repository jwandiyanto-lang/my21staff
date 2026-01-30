---
status: resolved
trigger: "Tabs show 'failed to load score setting' errors when clicked - API calls going to dev_workspace_001 instead of demo workspace"
created: 2026-01-27T14:11:00Z
updated: 2026-01-27T14:15:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: CONFIRMED - Mock data uses workspace ID "dev_workspace_001" but API routes check for "demo" in dev mode
test: Traced flow from page.tsx → knowledge-base-client.tsx → persona-tab → API call to /api/workspaces/${workspaceId}/ari-config
expecting: API route checks: if (isDevMode() && workspaceId === 'demo') but receives workspaceId="dev_workspace_001" instead
next_action: Verify all 5 API routes have same issue and confirm mock data should use 'demo' not 'dev_workspace_001'

## Symptoms

expected: Click between tabs on /demo/knowledge-base without errors, all API calls should hit /api/workspaces/demo/* endpoints
actual: Clicking tabs triggers API calls to /api/workspaces/dev_workspace_001/* endpoints, resulting in 401 Unauthorized errors
errors: |
  Failed to fetch config: Error: Failed to fetch
  Failed to fetch stages: Error: Failed to fetch
  Failed to fetch knowledge data: Error: Failed to fetch
  Failed to fetch slots: Error: Failed to fetch
reproduction: |
  1. Navigate to http://localhost:3000/demo/knowledge-base
  2. Click on any of the 5 tabs (Config, Stages, Knowledge, Scoring, Slots)
  3. Observe console errors and API calls to /api/workspaces/dev_workspace_001/*
started: Discovered during Phase 02-your-intern-debug UAT Test #2
context: |
  - Dev mode enabled (NEXT_PUBLIC_DEV_MODE=true)
  - Page loads at /demo/knowledge-base
  - Plan 02-01 added dev mode handling to all 5 API routes
  - API routes should check isDevMode() && workspaceId === 'demo' before requireWorkspaceMembership
  - Workspace ID mismatch: calling dev_workspace_001 instead of demo

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-01-27T14:11:15Z
  checked: Issue description from UAT
  found: |
    - All 5 API endpoints return 401 Unauthorized
    - Calls are going to /api/workspaces/dev_workspace_001/* instead of /api/workspaces/demo/*
    - Pattern suggests workspace ID is resolved incorrectly in tab components
    - This is not an auth issue, but a workspace ID mismatch issue
  implication: |
    Root cause is not in API middleware (those were already fixed in 02-01)
    Root cause is in how tab components determine which workspace ID to use
    Need to find where tabs fetch their workspace ID

- timestamp: 2026-01-27T14:12:00Z
  checked: Flow from page.tsx to persona-tab component
  found: |
    - page.tsx calls shouldUseMockData('demo') which returns true
    - page.tsx then uses MOCK_CONVEX_WORKSPACE._id which is 'dev_workspace_001' (line 38 of mock-data.ts)
    - knowledge-base-client.tsx passes workspace.id to all 5 tab components
    - persona-tab.tsx uses workspaceId directly in fetch: `/api/workspaces/${workspaceId}/ari-config`
    - So persona-tab receives 'dev_workspace_001' and passes it to API
  implication: |
    Tab components are receiving the correct mock workspace ID from the page
    But MOCK_CONVEX_WORKSPACE._id should be 'demo' not 'dev_workspace_001'

- timestamp: 2026-01-27T14:12:30Z
  checked: All 5 API routes dev mode checks
  found: |
    - /api/workspaces/[id]/ari-config (line 47, 97)
    - /api/workspaces/[id]/flow-stages (multiple checks)
    - /api/workspaces/[id]/knowledge (multiple checks)
    - /api/workspaces/[id]/scoring-config (multiple checks)
    - /api/workspaces/[id]/slots (multiple checks)
    ALL check: if (isDevMode() && workspaceId === 'demo')
  implication: |
    All API routes CORRECTLY implemented the dev mode check
    But they're all checking for 'demo', while mock data provides 'dev_workspace_001'
    FIX: Change MOCK_CONVEX_WORKSPACE._id from 'dev_workspace_001' to 'demo' in mock-data.ts

## Resolution

root_cause: |
  MOCK_CONVEX_WORKSPACE._id is set to 'dev_workspace_001' but all 5 API routes expect 'demo' in dev mode.
  When tabs fetch data in dev mode, they send workspace ID 'dev_workspace_001' to API routes that check 'if (isDevMode() && workspaceId === 'demo')',
  which fails and triggers requireWorkspaceMembership(), resulting in 401 Unauthorized.
  This is a mismatch between mock data setup and API route dev mode implementation.

fix: |
  Change MOCK_CONVEX_WORKSPACE._id from 'dev_workspace_001' to 'demo' in src/lib/mock-data.ts (line 38)
  This aligns mock data with the workspace ID expected by all 5 API routes in their dev mode checks.

verification: |
  After fix applied, navigate to http://localhost:3000/demo/knowledge-base
  Click on each of the 5 tabs (Persona, Flow, Database, Scoring, Slots)
  Verify: No console errors, all API calls succeed to /api/workspaces/demo/* endpoints
  Verify: All tabs load data without "failed to load" messages

files_changed:
  - src/lib/mock-data.ts (line 38: _id field)
