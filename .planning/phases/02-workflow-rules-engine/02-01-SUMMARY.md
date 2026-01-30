---
phase: 02-workflow-rules-engine
plan: 01
subsystem: workflow
tags: [rules-engine, keyword-triggers, lead-detection, faq-response, convex]

# Dependency graph
requires: []
provides:
  - Internal Convex query for lead type detection
  - Workflow type definitions (LeadType, TriggerAction, WorkflowConfig, RulesResult)
  - Keyword trigger matching with multiple match modes
  - FAQ template response system
  - Main rules engine orchestrator (processWithRules)
affects: [03-sarah-chat-bot, 04-lead-database, 05-grok-manager-bot]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rule-first, AI-fallback architecture
    - Keyword-based routing with configurable match modes
    - Thread-based lead type detection (24h window)
    - Workspace-scoped configuration with placeholder defaults

key-files:
  created:
    - src/lib/workflow/types.ts - Type definitions for workflow system
    - src/lib/workflow/keyword-triggers.ts - Keyword/FAQ matching logic
    - src/lib/workflow/rules-engine.ts - Main orchestrator
  modified:
    - convex/conversations.ts - Added getByContactInternal query

key-decisions:
  - "All configuration values are placeholders - configured via Settings UI in Phase 2.5"
  - "Keyword triggers support exact, contains, and starts_with match modes"
  - "Processing order: lead detection -> keyword triggers -> FAQ templates -> AI fallback"

patterns-established:
  - "Pattern: Internal Convex queries for rules engine (no auth, webhook handles auth)"
  - "Pattern: Workspace-scoped configuration with DEFAULT_WORKFLOW_CONFIG fallback"

# Metrics
duration: 10min
completed: 2026-01-30
---

# Phase 2 Plan 1: Workflow Rules Engine Core Summary

**Workflow rules engine core with keyword triggers, FAQ templates, and lead type detection for rule-first AI routing**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-30T11:06:00Z
- **Completed:** 2026-01-30T11:16:16Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Internal Convex query (`getByContactInternal`) for lead type detection without auth overhead
- Complete TypeScript type definitions for workflow system (`LeadType`, `TriggerAction`, `WorkflowConfig`, `RulesResult`)
- Keyword trigger matching supporting exact, contains, and starts_with match modes with case sensitivity options
- FAQ template response system with placeholder Indonesian/English keywords (pricing, services, hours)
- Main rules engine orchestrator (`processWithRules`) with 5-step processing pipeline

## Task Commits

1. **Task 1: Add getByContactInternal query** - `98ceb8b` (feat)
2. **Task 2: Create workflow type definitions** - `0bf7587` (feat)
3. **Task 3: Create keyword trigger matching logic** - `f33e369` (feat)
4. **Task 4: Create main rules engine orchestrator** - `fcb28ac` (feat)

**Plan metadata:** `cfc0d29` (docs: revise plans based on checker feedback)

## Files Created/Modified

- `convex/conversations.ts` - Added `getByContactInternal` internal query
- `src/lib/workflow/types.ts` - All workflow type definitions
- `src/lib/workflow/keyword-triggers.ts` - Keyword and FAQ matching functions
- `src/lib/workflow/rules-engine.ts` - Main `processWithRules` orchestrator

## Decisions Made

- All configuration values are placeholders configured via Settings UI in Phase 2.5
- Keyword triggers support exact, contains, and starts_with match modes
- Processing order: lead detection -> keyword triggers -> FAQ templates -> AI fallback
- Lead type detection uses 24-hour time window for new vs returning classification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (Sarah Chat Bot) can integrate `processWithRules` for rule-first message processing
- Phase 4 (Lead Database) builds on `getByContactInternal` query for conversation tracking
- Phase 5 (Grok Manager Bot) receives `should_trigger_manager` signal from rules engine
- Settings UI (Phase 2.5) will populate actual values for placeholder configurations

---
*Phase: 02-workflow-rules-engine*
*Completed: 2026-01-30*
