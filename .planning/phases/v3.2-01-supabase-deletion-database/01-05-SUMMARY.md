---
phase: v3.2-01-supabase-deletion-database
plan: "05"
subsystem: database
tags: [convex, contact-management, merge, deduplication, crm]

# Dependency graph
requires:
  - phase: v3.2-01-02
    provides: Database client layout with Contact type
provides:
  - Field-by-field contact merge dialog
  - mergeContacts mutation in contacts.ts
  - Merge API endpoint at /api/contacts/merge
  - Conversation reassignment on merge
  - System notes for merge history
affects: [v3.2-02-crm-rebuild, duplicate-detection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "User-selected field values for merge operations"
    - "Side-by-side comparison with radio group selection"
    - "System notes for audit trail"
    - "Conversation reassignment on contact merge"

key-files:
  created:
    - src/app/(dashboard)/[workspace]/database/merge-contacts-dialog.tsx
  modified:
    - src/app/api/contacts/merge/route.ts
    - convex/contacts.ts
    - src/app/(dashboard)/[workspace]/database/database-client.tsx

key-decisions:
  - "User must select each field individually (no auto-selection per CONTEXT.md)"
  - "Tags automatically combined from both contacts"
  - "Conversations reassigned to primary contact before deletion"
  - "Merge history logged in contactNotes with system type"

patterns-established:
  - "Merge mode toggle in database toolbar"
  - "Selection limit enforced (max 2 contacts)"
  - "Visual instruction banner for merge mode status"

# Metrics
duration: 7min
completed: 2026-01-24
---

# Phase v3.2-01 Plan 05: Contact Merge Summary

**Side-by-side contact merge with user-controlled field selection, automatic tag combination, and system audit trail**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-24T12:29:39Z
- **Completed:** 2026-01-24T12:36:01Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Field-by-field merge dialog with side-by-side comparison
- User explicitly selects value for each field (name, email, phone, status, assignee, lead score)
- Conversations automatically reassigned to primary contact
- Merge history logged in contactNotes table as system note
- Zero Supabase imports (pure Convex implementation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create merge contacts dialog component** - `77a7251` (feat)
2. **Task 2: Create merge API endpoint and Convex mutation** - `c93f2dc` (feat)
3. **Task 3: Add merge button to database client** - `b6c8994` (feat)

## Files Created/Modified
- `src/app/(dashboard)/[workspace]/database/merge-contacts-dialog.tsx` - Side-by-side merge dialog with RadioGroup field selection
- `src/app/api/contacts/merge/route.ts` - API endpoint accepting user-selected field values
- `convex/contacts.ts` - mergeContacts mutation with conversation reassignment and system notes
- `src/app/(dashboard)/[workspace]/database/database-client.tsx` - Merge mode toggle, contact selection, visual instructions

## Decisions Made
- **User field selection enforced:** Per CONTEXT.md requirement "user picks each field (always ask, no auto-selection)", replaced existing auto-merge logic with field-by-field RadioGroup selection
- **Tags auto-combined:** Tags from both contacts merged into Set to eliminate duplicates, shown to user as preview
- **System notes for audit:** Merge history logged in contactNotes table with type='system' for audit trail
- **Conversation reassignment:** All conversations from secondary contact reassigned to primary before deletion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Existing merge implementation lacked field-by-field selection**
- **Found during:** Task 2 (API endpoint update)
- **Issue:** Existing mergeContacts mutation in mutations.ts auto-selected fields (only allowed phone/email choice), violating CONTEXT.md requirement that "user picks each field"
- **Fix:** Created new mergeContacts mutation in contacts.ts accepting mergedFields object with all user-selected values
- **Files modified:** src/app/api/contacts/merge/route.ts, convex/contacts.ts
- **Verification:** Build succeeds, API accepts fields object
- **Committed in:** c93f2dc (Task 2 commit)

**2. [Rule 1 - Bug] Contact type mismatch in merge dialog**
- **Found during:** Task 3 (TypeScript validation)
- **Issue:** MergeContactsDialog defined local Contact interface instead of importing from @/types/database, causing type errors
- **Fix:** Imported Contact type from @/types/database, added type guards for nullable metadata field
- **Files modified:** src/app/(dashboard)/[workspace]/database/merge-contacts-dialog.tsx
- **Verification:** TypeScript compilation succeeds, build passes
- **Committed in:** b6c8994 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. Existing auto-merge violated CONTEXT.md requirement. No scope creep.

## Issues Encountered
None - plan executed smoothly after fixing existing implementation to match requirements.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Contact merge functionality complete and ready for use
- Database client has full CRUD + merge capabilities
- Ready for Wave 4 plans (bulk operations, advanced filters)
- Merge history audit trail established for compliance

---
*Phase: v3.2-01-supabase-deletion-database*
*Completed: 2026-01-24*
