---
phase: 02-kapso-integration
plan: 01
status: complete
completed: 2026-01-25
duration: 8m
subsystem: kapso-webhook
tags: [convex, kapso, whatsapp, webhook]

requires:
  - 01-deployment (production Convex at intent-otter-212)

provides:
  - getWorkspaceKapsoStatus query
  - updateKapsoCredentials mutation
  - Webhook GET verification confirmed working

affects:
  - 02-02 (message sending will use these credentials)
  - 02-03 (ARI processing depends on credential lookup)

tech-stack:
  patterns:
    - Convex query/mutation pattern for credential management
    - Webhook verification via challenge response

key-files:
  modified:
    - convex/workspaces.ts

decisions:
  - decision: "Store meta_access_token as plain text in Convex"
    rationale: "Convex database is encrypted at rest, no direct DB access, matches existing getKapsoCredentials pattern"
    timestamp: 2026-01-25
---

# Phase 02 Plan 01: Kapso Credentials Setup Summary

Convex functions for Kapso credential management and webhook verification confirmed working.

## What Was Built

Added two new Convex functions to support Kapso WhatsApp integration:

1. **getWorkspaceKapsoStatus** - Query that checks if a workspace has Kapso credentials configured without exposing the actual values
2. **updateKapsoCredentials** - Mutation for setting kapso_phone_id and meta_access_token on a workspace

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| getWorkspaceKapsoStatus query | Done | Returns hasKapsoPhoneId, hasMetaAccessToken booleans |
| updateKapsoCredentials mutation | Done | Supports optional updates for both fields |
| Webhook GET verification | Done | Returns challenge parameter correctly |
| TypeScript compilation | Done | No errors |

## Requirements Satisfied

- **KAPSO-01**: Webhook GET verification works (tested with curl)
- **KAPSO-02**: updateKapsoCredentials mutation available for credential setup
- **KAPSO-03**: Infrastructure ready for Eagle workspace configuration

## Technical Details

**Webhook Endpoint:** https://intent-otter-212.convex.site/webhook/kapso

**Verification Tests:**
```bash
# With challenge parameter
curl "https://intent-otter-212.convex.site/webhook/kapso?hub.challenge=test123"
# Returns: test123 (HTTP 200)

# Without challenge
curl "https://intent-otter-212.convex.site/webhook/kapso"
# Returns: Kapso webhook endpoint ready (HTTP 200)
```

**New Functions in convex/workspaces.ts:**
- `getWorkspaceKapsoStatus(slug)` - Check credential status
- `updateKapsoCredentials(workspace_id, kapso_phone_id?, meta_access_token?)` - Set credentials

## Deviations from Plan

None - plan executed as written.

## Blockers Discovered

**CONVEX_DEPLOY_KEY mismatch**: The `.env.local` file contains deploy key for `pleasant-antelope-109` but production is `intent-otter-212`. This prevented querying Eagle workspace directly via CLI.

**Resolution**: Code infrastructure is complete. To configure Eagle workspace credentials:
1. Open Convex Dashboard: https://dashboard.convex.dev/t/intent-otter-212
2. Use Data browser to find Eagle workspace by slug "eagle-overseas"
3. Use Functions tab to run `workspaces:updateKapsoCredentials` with the workspace_id and credentials

## Next Steps

1. Get production CONVEX_DEPLOY_KEY for intent-otter-212 (optional, for CLI access)
2. Configure Eagle workspace credentials via Convex dashboard or CLI
3. Proceed to 02-02 for message sending implementation
