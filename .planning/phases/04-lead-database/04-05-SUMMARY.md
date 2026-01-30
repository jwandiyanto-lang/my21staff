---
phase: 04-lead-database
plan: 05
subsystem: data-management
tags: [convex, mutations, lead-status, notes, sarah-sync]
requires: [04-01]
provides:
  - "Lead status management with validation"
  - "Contact notes management with timeline"
  - "Sarah data sync internal mutation"
affects: [04-06, 04-07]
tech-stack:
  added: []
  patterns: ["status state machine", "timeline array with limit", "internal mutation for bot sync"]
key-files:
  created:
    - convex/leads.ts
  modified: []
decisions:
  - id: lead-status-transitions
    decision: "Valid status transitions: new→qualified→contacted→converted→archived, with backwards movement and re-engagement"
    rationale: "Flexible workflow supports deal fall-through and re-engagement scenarios"
  - id: notes-array-limit
    decision: "Limit notes array to 100 entries, keeping most recent"
    rationale: "Prevents unbounded array growth while maintaining sufficient history"
  - id: sarah-phase-mapping
    decision: "Map Sarah phases to lead status: A→new, B/C→qualified, D→contacted"
    rationale: "Aligns chat conversation progress with lead workflow status"
duration: 140
completed: 2026-01-30
---

# Phase 04 Plan 05: Lead Management Mutations Summary

**One-liner:** Status management mutations with transition validation, note timeline management (max 100), and internal Sarah data sync with phase-to-status mapping.

## What Was Delivered

Created `convex/leads.ts` with three mutations for lead management:

1. **updateLeadStatus** - Validates status transitions based on state machine
2. **addContactNote** - Appends notes to timeline array with 100-note limit
3. **syncSarahData** - Internal mutation for Sarah bot to sync extracted data to contacts

All functions compile successfully and deploy to Convex.

## Implementation Details

### Status State Machine

Valid transitions implemented:
- **new** → qualified, archived
- **qualified** → contacted, archived
- **contacted** → converted, qualified (backwards), archived
- **converted** → archived
- **archived** → new (re-engagement)

Tracks who made the change (`changedBy: "sarah-bot" | "grok-bot" | user_email`) and when (`statusChangedAt`).

### Notes Timeline Management

Notes stored as array of objects:
```typescript
{
  content: string,
  addedBy: string,
  addedAt: number
}
```

Max limit: 100 notes (keeps most recent when limit reached).

### Sarah Data Sync

Internal mutation maps Sarah conversation phases to lead status:
- **Phase A (Greeting)** → new
- **Phase B (Gathering)** → qualified
- **Phase C (Interest)** → qualified
- **Phase D (Closing)** → contacted

Accepts optional fields:
- name, businessType, domisili, businessDuration (Phase 1)
- painPoints[], interestMotivation, priority, urgencyLevel (Phase 2)
- leadScore, leadTemperature (Phase 3)
- sarahLanguage, currentPhase

Validates leadTemperature against valid values (hot/warm/lukewarm/cold).

## Technical Decisions

### Flattened Args Structure

Initial implementation used nested `extractedData` object, but Convex validators don't support `v.optional(v.union(...))` inside `v.object()` entries. Solution: flattened args to top level with individual optional fields.

**Pattern:** `args: { contactId, name: v.optional(...), businessType: v.optional(...), ... }`

This matches the pattern in existing Convex mutations and avoids validator complexity.

### Validation Strategy

- **Status transitions:** Validated in mutation using lookup table
- **Lead temperature:** Validated in handler against whitelist
- **Notes limit:** Enforced by slicing array to last 99 + new note

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| convex/leads.ts | 158 | Lead management mutations |

## Commits

| Hash | Message |
|------|---------|
| 275e99f | feat(04-05): create lead management mutations |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Blocks nothing.** All mutations ready for use by:
- Phase 04-06: Sarah sync implementation
- Phase 04-07: Grok manager bot status updates
- Future dashboard: Manual status changes by users

**Schema dependency:** Relies on contacts table schema from 04-01 (leadStatus, notes, Sarah fields).

## Testing Notes

All three functions compile and deploy successfully:
- `npx convex dev --once` completes without errors
- updateLeadStatus export verified
- addContactNote export verified
- syncSarahData export verified

---

**Phase:** 04-lead-database
**Duration:** 2.3 minutes (140 seconds)
**Status:** ✅ Complete
