---
phase: 04-lead-database
plan: "01"
subsystem: database
tags: [convex, schema, sarah, lead-workflow, contacts]
requires:
  - 03-04-SUMMARY.md
provides:
  - Extended contacts schema with Sarah extraction fields
  - Lead status workflow (new → qualified → contacted → converted → archived)
  - Notes timeline for bot and human annotations
  - Timestamp tracking for activity monitoring
affects:
  - 04-02 (will use these fields for Kapso → Convex sync)
  - 06-01 (dashboard will query by leadStatus and leadTemperature)
tech-stack:
  added: []
  patterns:
    - Optional fields for backward compatibility
    - Literal unions for enum-like field values
    - Array of objects for timeline data
    - Composite indexes for dashboard queries
key-files:
  created:
    - convex/brainConfig.ts
    - convex/internConfig.ts
  modified:
    - convex/schema.ts
decisions:
  - id: sarah-fields-optional
    what: All 16 Sarah fields are optional (v.optional)
    why: Prevents breaking existing contacts without Sarah data
    impact: Safe to deploy without data migration
  - id: separate-lead-scores
    what: Keep existing lead_score + add new leadScore field
    why: ARI score vs Sarah-specific score serve different purposes
    impact: Both scoring systems can coexist
  - id: notes-as-array
    what: Notes stored as array of {content, addedBy, addedAt} objects
    why: Preserves timeline and attribution for all annotations
    impact: Enables full audit trail of bot/human interactions
  - id: status-enum-literal-union
    what: leadStatus and leadTemperature use v.union(v.literal(...))
    why: Type safety and validation at database level
    impact: Invalid values rejected by Convex
metrics:
  duration: 4m 21s
  completed: 2026-01-30
---

# Phase 04 Plan 01: Extended Contacts Schema Summary

**One-liner:** Added 16 Sarah extraction fields (business info, pain points, closing data), lead workflow status, notes timeline, and activity timestamps to contacts table.

## What Was Built

Extended the Convex `contacts` table schema to support Sarah's 3-phase lead qualification workflow and lead management features.

### Schema Changes

**Sarah Phase 1 (Gathering) - 5 fields:**
- `businessType` - Type of business (e.g., "restaurant", "e-commerce")
- `domisili` - Business location/domicile
- `businessDuration` - How long business has operated
- `story` - Business story/background
- `sarahLanguage` - Conversation language ('id' | 'en')

**Sarah Phase 2 (Interest) - 4 fields:**
- `painPoints` - Array of business challenges
- `interestMotivation` - Why interested in service
- `priority` - Current priority level
- `urgencyLevel` - How urgent is the need

**Sarah Phase 3 (Closing) - 4 fields:**
- `leadScore` - Sarah-specific score (0-100)
- `leadTemperature` - "hot" | "warm" | "lukewarm" | "cold"
- `closingTechnique` - Which technique was used
- `objectionRaised` - Any objections mentioned

**Status Workflow - 3 fields:**
- `leadStatus` - "new" | "qualified" | "contacted" | "converted" | "archived"
- `statusChangedAt` - Timestamp of last status change
- `statusChangedBy` - Who changed it ("sarah-bot" | "grok-bot" | user email)

**Notes Timeline - 1 field:**
- `notes` - Array of {content, addedBy, addedAt} objects

**Activity Timestamps - 2 fields:**
- `lastContactAt` - Last human outreach (outbound)
- `lastActivityAt` - Any interaction (message, status, note)

**New Indexes:**
- `by_workspace_status` - For dashboard filtering by lead status
- `by_workspace_temperature` - For dashboard filtering by temperature

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Convex validator errors in brainConfig.ts and internConfig.ts**
- **Found during:** Initial schema validation (`npx convex dev --once`)
- **Issue:** Existing files had malformed Convex validators - used plain strings like `'workspaces'` instead of `v.id('workspaces')`, and plain object syntax instead of `v.object()` wrappers
- **Fix:** Rewrote both files with proper validator syntax:
  - `workspaceId: 'workspaces'` → `workspaceId: v.id('workspaces')`
  - Plain object args → `v.object({ ... })` with proper validators
  - Added missing `import { v } from 'convex/values'`
- **Files modified:** `convex/brainConfig.ts`, `convex/internConfig.ts`
- **Commit:** 993a2c9 (same commit as schema changes)
- **Why blocking:** Schema validation was failing completely - couldn't proceed without fixing these files

## Decisions Made

**1. All Sarah fields are optional**
- Existing contacts won't break when schema deploys
- Sarah data fills in progressively during conversations
- No migration required

**2. Separate lead scores**
- Keep existing `lead_score` (ARI scoring from old system)
- Add new `leadScore` (Sarah-specific scoring)
- Both can be used for different purposes (ARI dashboard vs Sarah dashboard)

**3. Notes as timeline array**
- Each note has content, who added it, and when
- Supports both bot annotations ("sarah-bot", "grok-bot") and human notes (user email)
- Enables full audit trail and activity feed

**4. Type-safe enums via literal unions**
- `leadStatus` enforces workflow stages at database level
- `leadTemperature` enforces temperature values
- Convex rejects invalid values automatically

## Testing

### Verification Results

✅ Schema validation passed (`npx convex dev --once` - 3.44s)
✅ businessType field found (1 match)
✅ leadStatus field and usage found (2 matches: field + index)
✅ by_workspace_status index created (1 match)
✅ by_workspace_temperature index created (1 match)

### Manual Testing

- Deployed schema to Convex cloud successfully
- No existing data conflicts (all fields optional)
- Generated TypeScript types in `convex/_generated` updated automatically

## Next Phase Readiness

**Phase 04 Plan 02 (Kapso → Convex Sync) can proceed:**
- ✅ Contacts schema has all Sarah extraction fields
- ✅ leadStatus field ready for workflow updates
- ✅ notes array ready for bot annotations
- ✅ Timestamp fields ready for activity tracking

**Phase 06 (Dashboard) can use new indexes:**
- ✅ `by_workspace_status` for lead status filtering
- ✅ `by_workspace_temperature` for temperature-based views

**No blockers or concerns.**

## Files Changed

### Created (2)
1. `convex/brainConfig.ts` - Grok Brain configuration queries/mutations (fixed validators)
2. `convex/internConfig.ts` - Sarah Intern configuration queries/mutations (fixed validators)

### Modified (1)
1. `convex/schema.ts` - Extended contacts table with 16 Sarah fields + 2 indexes

## Performance Notes

- **Duration:** 4 minutes 21 seconds (includes debugging validator errors)
- **Schema deployment:** 3.44s (Convex cloud)
- **No data migration needed:** All fields optional
- **Index creation:** Instant (no existing data to reindex)

---

**Status:** ✅ Complete
**Commit:** 993a2c9
**Date:** 2026-01-30
