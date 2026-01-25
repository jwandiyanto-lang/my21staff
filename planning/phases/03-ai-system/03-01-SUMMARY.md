---
phase: 03-ai-system
plan: 01
subsystem: database
tags: [convex, schema, ai-usage, cost-tracking, grok]

# Dependency graph
requires:
  - phase: 02-kapso-integration
    provides: Working Kapso webhook, Eagle workspace with kapso_phone_id
provides:
  - aiUsage table for AI cost tracking (Mouth and Brain)
  - Schema foundation ready for AI modules
affects: [03-02-mouth, 03-03-brain, ai-cost-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - aiUsage table with workspace and conversation indexes
    - Grok API (not Claude) for The Brain per architecture decision

key-files:
  created: []
  modified:
    - convex/schema.ts

key-decisions:
  - "aiUsage table tracks both Mouth (Sea-Lion/Grok) and Brain (Grok) usage separately via ai_type field"
  - "Grok API key confirmed in Vercel env - ready for API calls"
  - "Lead scoring fields already exist in schema (contacts.lead_score, ariConversations.state)"

patterns-established:
  - "AI cost tracking: workspace_id + conversation_id + model + ai_type"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 03 Plan 01: AI Foundation Summary

**aiUsage table added to schema for dual-AI cost tracking; Grok API key confirmed; workspace linkage issue documented**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T15:39:12Z
- **Completed:** 2026-01-25T15:41:41Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Added aiUsage table with indexes (by_workspace, by_workspace_type, by_conversation)
- Verified GROK_API_KEY exists in Vercel environment (xai-... format)
- Investigated Eagle workspace ARI linkage issue and documented findings

## Task Commits

Each task was committed atomically:

1. **Task 1: Add aiUsage table to schema** - `e6494d2` (feat)

**Note:** Tasks 2 and 3 were verification/documentation tasks with no code changes.

## Files Created/Modified
- `convex/schema.ts` - Added aiUsage table with workspace_id, conversation_id, model, ai_type, input_tokens, output_tokens, cost_usd, created_at fields

## Decisions Made
- **Only aiUsage table added:** Schema already has lead_score and lead_status on contacts table (line 44-45), and state/lead_score/lead_temperature on ariConversations table (line 133-135). These are NOT optional fields as the plan suggested - they are required.
- **Grok API confirmed:** GROK_API_KEY in Vercel env starts with `xai-`, which is the correct xAI API format.
- **Cannot push schema without CLI auth:** Convex deploy key mismatch prevents `npx convex dev`. Schema change is syntactically valid (TypeScript compiles) and will work when deployed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Skipped lead scoring field additions**
- **Found during:** Task 1 (Schema update)
- **Issue:** Plan instructed to add lead_score, lead_status to contacts and state, lead_score, lead_temperature to ariConversations - but these fields already exist in schema
- **Fix:** Only added aiUsage table as per user's note in execution context
- **Files modified:** convex/schema.ts
- **Verification:** TypeScript compilation succeeds
- **Committed in:** e6494d2

---

**Total deviations:** 1 auto-fixed (1 bug - plan outdated vs actual schema)
**Impact on plan:** Correct behavior - avoided duplicate field definitions which would have caused errors.

## Issues Encountered

### Convex CLI Authentication
- **Issue:** `npx convex dev` fails with "Please set CONVEX_DEPLOY_KEY to a new key"
- **Root cause:** .env.local has `pleasant-antelope-109` deploy key but convex.json points to `intent-otter-212` project
- **Impact:** Cannot verify schema push via CLI
- **Workaround:** TypeScript compilation confirms syntax validity; schema will deploy when Convex auth is fixed

### Eagle Workspace ARI Linkage Investigation

**Investigation completed as per Task 3:**

**Finding:** Phase 2 log shows `[Kapso] ARI not enabled for workspace js7b1cwpdpadcgds1cr8dqw7dh7zv3a3`

**What this means:**
1. Webhook receives message and finds workspace by `kapso_phone_id` lookup
2. Found workspace ID: `js7b1cwpdpadcgds1cr8dqw7dh7zv3a3`
3. Queries `ariConfig` table for that workspace ID
4. No config found - returns "ARI not enabled"

**Root cause hypothesis:**
- The `ariConfig` was created (in Phase 02-02) for a different workspace ID
- The workspace that has `kapso_phone_id = 930016923526449` is different from the workspace where ARI was configured

**To fix (manual steps required):**
1. Open Convex dashboard: https://dashboard.convex.dev
2. Query `workspaces` table: Find entry with `kapso_phone_id = 930016923526449`
3. Note its `_id` (should be `js7b1cwpdpadcgds1cr8dqw7dh7zv3a3` based on log)
4. Query `ariConfig` table: Check what `workspace_id` the Eagle config has
5. If different: Update `ariConfig.workspace_id` to match the workspace with kapso_phone_id

**Why this matters:** Without this fix, ARI cannot process incoming WhatsApp messages for Eagle.

## User Setup Required

**Convex Dashboard Operations (cannot be automated due to CLI auth issue):**

1. **Verify schema deployed:**
   - Visit https://dashboard.convex.dev
   - Check that `aiUsage` table exists
   - If not: Run `npx convex deploy` after fixing deploy key

2. **Fix ARI workspace linkage:**
   - In workspaces table: Find workspace with `kapso_phone_id = 930016923526449`
   - In ariConfig table: Update `workspace_id` to match

3. **Verify GROK_API_KEY in Convex:**
   - Settings > Environment Variables
   - Confirm GROK_API_KEY is set (should match Vercel env)

## Next Phase Readiness
- Schema foundation ready for Mouth (03-02) and Brain (03-03) modules
- aiUsage table ready for cost tracking
- **Blocker:** ARI workspace linkage must be fixed before AI responses work

---
*Phase: 03-ai-system*
*Completed: 2026-01-25*
