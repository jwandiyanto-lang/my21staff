---
phase: 02-workflow-rules-engine
plan: 02
subsystem: workflow
tags: [rules-engine, webhook, convex, kapso, integration]

# Dependency graph
requires:
  - phase: 02-workflow-rules-engine
    provides: processWithRules, keyword trigger matching, FAQ templates
provides:
  - Convex schema tables for workflow configuration and execution logging
  - Convex mutations for workflow CRUD operations
  - Webhook integration with rules-first message processing pipeline
  - Observable manager bot placeholder response for testing
affects: [03-sarah-chat-bot, 04-lead-database, 05-grok-manager-bot]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rule-first, AI-fallback message processing architecture
    - Convex mutations for workflow configuration management
    - Execution logging for analytics and debugging
    - Observable trigger responses for testing verification

key-files:
  created:
    - convex/workflows.ts - Workflow CRUD mutations and queries
  modified:
    - convex/schema.ts - Added workflow_configs and workflow_executions tables
    - src/app/api/webhook/kapso/route.ts - Rules engine integration

key-decisions:
  - "Rules engine runs BEFORE AI processor for all incoming messages"
  - "Manager bot trigger sends observable placeholder response for test verification"
  - "Execution logging records processing time, rule matched, and action taken"
  - "Messages handled by rules skip ARI processing entirely"

patterns-established:
  - "Pattern: Internal Convex mutations for workflow data (no auth, webhook handles auth)"
  - "Pattern: Truncate message content to 500 chars for storage efficiency"

# Metrics
duration: 4min
completed: 2026-01-30
---

# Phase 2 Plan 2: Webhook Integration + Convex Schema Summary

**Rules-first message processing pipeline with Convex schema for workflow configuration and execution logging**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-30T11:19:06Z
- **Completed:** 2026-01-30T11:23:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Convex schema with `workflow_configs` and `workflow_executions` tables for workspace-scoped configuration and analytics
- Convex mutations (`getConfig`, `upsertConfig`, `logExecution`, `getRecentExecutions`, `hasConfig`) for workflow CRUD operations
- Webhook handler now processes messages through rules engine BEFORE AI processor, enabling keyword triggers, FAQ responses, and handoffs
- Manager bot trigger sends observable placeholder response for test verification in Phase 2.3
- Execution logging captures processing time, rule matched, action taken, and lead type for debugging

## Task Commits

1. **Task 1: Add workflow tables to Convex schema** - `206a0c0` (feat)
2. **Task 2: Create Convex mutations for workflow data** - `51435db` (feat)
3. **Task 3: Integrate rules engine into webhook handler** - `5c4962d` (feat)

**Plan metadata:** `cfc0d29` (docs: revise plans based on checker feedback)

## Files Created/Modified

- `convex/schema.ts` - Added `workflow_configs` and `workflow_executions` tables with indexes
- `convex/workflows.ts` - Workflow CRUD mutations: `getConfig`, `upsertConfig`, `logExecution`, `getRecentExecutions`, `hasConfig`
- `src/app/api/webhook/kapso/route.ts` - Rules engine integration with `processWithRules` call before ARI processing

## Decisions Made

- Rules engine runs BEFORE AI processor for all incoming messages (rule-first architecture)
- Manager bot trigger sends observable placeholder response: "[Manager Bot] Summary feature coming in Phase 5! Your request has been logged."
- Message content truncated to 500 characters for execution log storage
- `as any` type assertions used for Convex IDs to match existing codebase patterns
- Execution logging happens regardless of whether rules handled the message or passed to AI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (Sarah Chat Bot) can rely on rules-first processing for keyword triggers and FAQ responses
- Phase 4 (Lead Database) builds on workflow execution logging for analytics
- Phase 5 (Grok Manager Bot) trigger mechanism established with observable placeholder response
- Settings UI (Phase 2.5) will use `upsertConfig` mutation for workflow configuration storage

---
*Phase: 02-workflow-rules-engine*
*Completed: 2026-01-30*
