---
phase: 05-grok-manager-bot
plan: 01
type: execute
status: complete
completed: 2026-01-31

subsystem: data-layer
tags: [convex, schema, brain, analytics, summaries, insights, actions]

dependency_graph:
  requires:
    - "04-01: Extended contacts schema with Sarah fields"
    - "02-05: Brain config schema and settings UI"
  provides:
    - "Brain summaries data layer"
    - "Pattern insights storage"
    - "Action recommendations storage"
  affects:
    - "05-02: Grok integration will use these tables"
    - "06-*: Dashboard will query these tables for analytics"

tech_stack:
  added: []
  patterns: [data-layer, crud-operations, internal-mutations]

key_files:
  created:
    - path: "convex/brainSummaries.ts"
      lines: 126
      purpose: "Summary CRUD operations"
    - path: "convex/brainInsights.ts"
      lines: 88
      purpose: "Pattern insight storage"
    - path: "convex/brainActions.ts"
      lines: 147
      purpose: "Action recommendation queries"
  modified:
    - path: "convex/schema.ts"
      delta: +83
      change: "Added brainSummaries, brainInsights, brainActions tables"

metrics:
  tasks: 3
  commits: 3
  duration: "2.5 minutes"

decisions:
  - id: BRAIN-01
    what: "Three-table architecture for Brain analytics"
    rationale: "Separation of concerns: summaries (text), insights (patterns), actions (recommendations)"
    alternatives: "Single brain_data table with type discriminator"
    impact: "Clearer schema, better indexes, simpler queries"

  - id: BRAIN-02
    what: "suggested_faqs field in brainInsights table"
    rationale: "MGR-06 requirement for FAQ suggestions from trending topics/objections"
    impact: "Brain can suggest FAQ entries directly from detected patterns"

  - id: BRAIN-03
    what: "Actions expire after 24h by default"
    rationale: "Prevent stale action recommendations from cluttering dashboard"
    impact: "Cron job cleanupExpiredActions needed (will be added in Phase 5 later)"

  - id: BRAIN-04
    what: "Internal mutations for createSummary, createInsight, createActionRecommendation"
    rationale: "Brain operations triggered by cron jobs, not user actions"
    impact: "Only Brain service can create analytics data; dashboard is read-only"
---

# Phase 5 Plan 01: Brain Analytics Data Layer Summary

**One-liner:** Convex schema and CRUD layer for Brain summaries, pattern insights, and action recommendations.

## What Was Built

Created three new Convex tables with complete CRUD operations for Brain analytics:

1. **brainSummaries** - Daily/on-demand summaries
   - Stores conversational summary text
   - Metrics snapshot (new leads, hot/warm/cold counts, response rate, avg score)
   - Token usage and cost tracking
   - Triggered by cron, command (!summary), or API

2. **brainInsights** - Pattern detection results
   - Trending topics, objection patterns, interest signals, rejection analysis
   - Frequency counts and example quotes
   - AI recommendations
   - **suggested_faqs array** for MGR-06 compliance (FAQ suggestions)
   - Confidence levels and time ranges

3. **brainActions** - Action recommendations
   - Follow-up alerts, response templates, handoff readiness, opportunity alerts
   - Priority scoring (0-100) and urgency levels
   - Status tracking (pending → actioned/dismissed)
   - 24h expiration with cleanup mutation

**CRUD operations implemented:**

**brainSummaries.ts:**
- `createSummary` (internalMutation) - Create summary record
- `getLatestSummary` (query) - Get most recent summary
- `getSummariesByWorkspace` (query) - Get summaries with type filter
- `getRecentSummaries` (internalQuery) - Prevent duplicate daily summaries

**brainInsights.ts:**
- `createInsight` (internalMutation) - Store detected pattern
- `getInsightsByWorkspace` (query) - Get insights with filters
- `bulkCreateInsights` (internalMutation) - Batch insert for pattern analysis

**brainActions.ts:**
- `createActionRecommendation` (internalMutation) - Store action item
- `getActionsByWorkspace` (query) - Get pending actions by status
- `getActionsByPriority` (query) - Get top priority actions with urgency filter
- `markActionActioned` (mutation) - Mark action as completed
- `dismissAction` (mutation) - Dismiss action
- `cleanupExpiredActions` (internalMutation) - Cron job for expired actions

## Task Execution Log

| Task | Name | Status | Duration | Commit |
|------|------|--------|----------|--------|
| 1 | Add Brain analytics tables to schema | Complete | ~1 min | be919f5 |
| 2 | Create brainSummaries.ts with CRUD operations | Complete | ~1 min | 0710840 |
| 3 | Create brainInsights.ts and brainActions.ts | Complete | ~30 sec | a3b9ecb |

**Total execution time:** 2.5 minutes

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

**BRAIN-01: Three-table architecture**
- Separated summaries (text), insights (patterns), and actions (recommendations)
- Alternative: Single brain_data table with type discriminator
- Impact: Clearer schema, better indexes, simpler queries per use case

**BRAIN-02: suggested_faqs field in brainInsights**
- Added optional suggested_faqs array to brainInsights table
- Purpose: MGR-06 requirement for FAQ suggestions from patterns
- Impact: Brain can suggest FAQ entries directly from trending topics/objections

**BRAIN-03: 24h expiration for actions**
- Default expires_at = created_at + 24 hours
- Cleanup via cleanupExpiredActions internalMutation
- Impact: Prevents stale recommendations from cluttering dashboard

**BRAIN-04: Internal mutations for Brain operations**
- createSummary, createInsight, createActionRecommendation are internalMutations
- Rationale: Brain operations triggered by cron/workflow, not user actions
- Impact: Only Brain service can create analytics; dashboard is read-only for these tables

## Verification Results

**Schema deployment:**
- All three tables deployed successfully to Convex
- All indexes created (by_workspace, by_workspace_type, by_workspace_status, by_priority)
- TypeScript compilation: 0 errors

**Must-haves validation:**
- brainSummaries table with workspace index
- brainInsights table with suggested_faqs field (MGR-06)
- brainActions table with priority index
- CRUD operations follow existing patterns (leads.ts)
- All exports verified

## Next Phase Readiness

**Phase 5, Plan 2 (Grok integration) ready to proceed:**
- Data layer complete for storing Brain outputs
- Summary, insight, and action schemas defined
- Query functions ready for dashboard consumption (Phase 6)

**No blockers identified.**

## Files Changed

**Created:**
- convex/brainSummaries.ts (126 lines)
- convex/brainInsights.ts (88 lines)
- convex/brainActions.ts (147 lines)

**Modified:**
- convex/schema.ts (+83 lines)

**Total LOC:** +444

## Commits

```
be919f5 feat(05-01): add Brain analytics tables to schema
0710840 feat(05-01): add brainSummaries CRUD operations
a3b9ecb feat(05-01): add brainInsights and brainActions CRUD operations
```

## Testing Notes

**Convex deployment verification:**
- npx convex dev --once: 0 errors
- All functions compiled and deployed successfully
- Schema push completed without issues

**End-to-end verification deferred to Phase 6** when dashboard UI consumes these queries.

---

**Executed by:** Claude Sonnet 4.5
**Execution date:** 2026-01-31
**Execution time:** 2.5 minutes
