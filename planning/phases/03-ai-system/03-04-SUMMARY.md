---
phase: 03-ai-system
plan: 04
subsystem: orchestration
tags: [convex, kapso, grok, dual-ai, integration, internalAction]

# Dependency graph
requires:
  - phase: 03-02-mouth
    provides: generateMouthResponse action
  - phase: 03-03-brain
    provides: analyzeConversation action
provides:
  - Complete dual-AI orchestration (Mouth + Brain wired into processARI)
  - Admin utilities for testing and diagnostics
  - E2E verified WhatsApp → AI → Response flow
affects: [production-ready, whatsapp-bot]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - internalAction for orchestration (calls other actions + external APIs)
    - Helper mutations for database operations within actions
    - ctx.scheduler.runAfter for async Brain analysis (1s delay)

key-files:
  created:
    - convex/admin.ts (admin utilities)
  modified:
    - convex/kapso.ts (major refactor: processARI mutation → action)
    - convex/ai/mouth.ts (grok-beta → grok-3, disabled Sea-Lion)
    - convex/ai/brain.ts (grok-beta → grok-3, added logging)

key-decisions:
  - "processARI as internalAction: mutations cannot call actions (ctx.runAction)"
  - "Helper mutations: getAriContext, saveAriResponse, logOutboundMessage"
  - "Model: grok-3 (grok-beta deprecated 2025-09-15)"
  - "Sea-Lion disabled: not accessible from Convex cloud"

patterns-established:
  - "Actions that need HTTP + DB: action orchestrates, mutations handle DB"
  - "Scheduler in actions: await ctx.scheduler.runAfter() for async work"
  - "Verbose logging: track each step for debugging"

# Metrics
duration: ~60min (debug-heavy due to multiple issues)
completed: 2026-01-25
---

# Phase 03 Plan 04: Wire Orchestration Summary

**Wired Mouth and Brain into processARI — complete dual-AI orchestration with E2E verification**

## Performance

- **Duration:** ~60 min (debug session due to multiple blockers)
- **Started:** 2026-01-25
- **Completed:** 2026-01-25
- **Tasks:** 3 (2 auto + 1 verification)
- **Files modified:** 4

## Accomplishments

- Refactored processARI from `internalMutation` to `internalAction` (required for calling other actions)
- Created helper mutations for database operations: `getAriContext`, `saveAriResponse`, `logOutboundMessage`
- Wired The Mouth for immediate WhatsApp responses
- Wired The Brain for async lead scoring (scheduled 1s after Mouth)
- Created comprehensive admin utilities for testing and diagnostics
- Fixed multiple bugs blocking E2E flow (see Issues Encountered)
- Verified E2E: WhatsApp message → Mouth response → Brain analysis → Lead score update

## E2E Verification Results

```json
{
  "ai_usage_by_type": {
    "brain": 2,
    "mouth": 6
  },
  "ari_conversations": [
    {
      "lead_score": 25,
      "lead_temperature": "cold",
      "state": "greeting"
    }
  ],
  "ari_latest": {
    "ai_model": "grok-3",
    "content": "Halo! Untuk beasiswa S2 di Melbourne...",
    "role": "assistant"
  }
}
```

## Files Created/Modified

- **convex/kapso.ts** - Major refactor:
  - Changed processARI from internalMutation → internalAction
  - Added helper mutations: getAriContext, saveAriResponse, logOutboundMessage
  - Wired Mouth and Brain with proper error handling

- **convex/ai/mouth.ts** - Updates:
  - Changed model from grok-beta → grok-3
  - Disabled Sea-Lion (not accessible from Convex cloud)
  - Direct Grok API call as primary

- **convex/ai/brain.ts** - Updates:
  - Changed model from grok-beta → grok-3
  - Added verbose logging for debugging

- **convex/admin.ts** - New admin utilities:
  - listWorkspaces, listAriConfigs, fixAriConfigWorkspace
  - testAriProcessing, testBrainAnalysis, testGrokApi
  - checkRecentActivity (comprehensive diagnostics)

## Issues Encountered (Debug Session)

### 1. ariConfig Workspace Linkage
- **Initial concern:** STATE.md mentioned workspace ID mismatch
- **Investigation:** Actually correct (Eagle workspace correctly linked)
- **Resolution:** No fix needed

### 2. Wrong API Reference
- **Issue:** `processWebhook` called `api.kapso.processARI` but processARI is internal
- **Fix:** Changed to `internal.kapso.processARI`

### 3. Mutation Cannot Call Action
- **Issue:** `a.runAction is not a function` error
- **Cause:** processARI was internalMutation, but Mouth is internalAction
- **Fix:** Refactored processARI to internalAction with helper mutations for DB ops

### 4. Missing GROK_API_KEY
- **Issue:** Environment variable not set in Convex
- **Fix:** `npx convex env set GROK_API_KEY "..."`

### 5. Invalid API Key
- **Issue:** Original key was invalid
- **Fix:** User provided new valid key

### 6. Deprecated Model
- **Issue:** `grok-beta` deprecated (404 error)
- **Fix:** Updated all references to `grok-3` (mouth.ts, brain.ts, schema.ts)

### 7. Sea-Lion Timeout
- **Issue:** Local Ollama not accessible from Convex cloud
- **Fix:** Commented out Sea-Lion, using Grok directly
- **TODO:** Re-enable Sea-Lion when running on local/Tailscale environment

### 8. Brain Not Running
- **Issue:** Brain showing 0 usage after Mouth calls
- **Investigation:** Scheduler call missing await, added logging
- **Fix:** Added await and better error handling to scheduler call

## Decisions Made

1. **processARI as internalAction:** Required because mutations cannot call actions (ctx.runAction). This is a Convex architectural constraint.

2. **Helper mutation pattern:** Actions can't directly write to DB during transactions, so we use helper mutations:
   - `getAriContext`: Load all context (workspace, config, contact, conversation, messages)
   - `saveAriResponse`: Log user message, AI response, and usage
   - `logOutboundMessage`: Create outbound message record

3. **Grok-3 as primary model:** Sea-Lion (local Ollama) not accessible from Convex cloud. Using Grok-3 (~$5/M tokens) as the production model.

4. **Admin utilities:** Created comprehensive test functions to enable manual testing without WhatsApp messages.

## Deviations from Plan

### Major Architectural Change
- **Plan said:** Update processARI (assumed to be mutation)
- **Reality:** Had to refactor from mutation → action due to Convex constraints
- **Impact:** More code, but cleaner separation of concerns

### Model Change
- **Plan said:** Use grok-beta
- **Reality:** grok-beta deprecated, switched to grok-3
- **Impact:** Same cost, same API

### Sea-Lion Disabled
- **Plan said:** Primary is Sea-Lion (free), fallback is Grok
- **Reality:** Sea-Lion not accessible from Convex cloud
- **Impact:** All AI calls use Grok (paid) until local deployment ready

---

**Total deviations:** 3 (architectural, model, Sea-Lion)
**Impact on plan:** Plan completed with adaptations; E2E verified working

## Next Steps

- Phase 3 complete - all plans executed and verified
- Ready for Phase 4 (Dashboard) or user acceptance testing
- Consider re-enabling Sea-Lion when deploying to local/Tailscale environment

---
*Phase: 03-ai-system*
*Completed: 2026-01-25*
