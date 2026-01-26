# Quick Task 003: Database UX Fixes

## Goal

Clean up Database page UX issues: remove "Merge Duplicates" button, change default tags from ['Community', '1on1'] to [], and verify all filters (status, assigned to, tags) and inline editing work correctly.

## Context

User feedback on Database page:
1. "Merge Duplicates" button should not be visible - feature not needed now
2. Tags should default to empty array `[]`, not `['Community', '1on1']`
3. Verify existing functionality works: status filter, assigned to filter, inline editing

## Tasks

### Task 1: Remove Merge Duplicates Button

**File:** `src/app/(dashboard)/[workspace]/database/database-client.tsx`

Remove the "Merge Duplicates" / "Cancel Merge" button and related merge mode UI:
- Remove the Button at lines 319-333 (Merge Duplicates toggle)
- Remove the conditional "Merge Selected" button (lines 335-342)
- Remove the merge mode instructions banner (lines 555-564)
- Keep the MergeContactsDialog import and component for future use (commented)

**Acceptance:**
- [ ] No "Merge Duplicates" button visible in header
- [ ] No merge mode instructions banner
- [ ] No "Merge Selected" button
- [ ] State variables can stay (mergeMode, selectedForMerge) - just not triggered

### Task 2: Change Default Tags to Empty Array

**Files:**
- `src/lib/queries/use-workspace-settings.ts` (line 44)
- `src/app/(dashboard)/[workspace]/database/database-client.tsx` (line 112)
- `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx` (line 113)
- `src/lib/queries/use-conversations.ts` (line 50)
- `src/lib/mock-data.ts` (line 100)

Change all occurrences of default `['Community', '1on1']` to `[]`:
- Line 44 in use-workspace-settings.ts: `|| ['Community', '1on1']` → `|| []`
- Line 112 in database-client.tsx: `?? ['Community', '1on1']` → `?? []`
- Line 113 in contact-detail-sheet.tsx: `contactTags = ['Community', '1on1']` → `contactTags = []`
- Line 50 in use-conversations.ts: `tags: ['Community', '1on1']` → `tags: []`
- Line 100 in mock-data.ts: `tags: ['Community', '1on1']` → `tags: []`

**Acceptance:**
- [ ] Tags filter dropdown shows no predefined tags
- [ ] Tags section in contact detail sheet shows "No tags configured" when workspace has no tags

### Task 3: Verify Existing Functionality

Manual verification checklist (no code changes):
- [ ] Status filter dropdown works (filters contacts by lead status)
- [ ] Assigned To filter works (All Staff, Unassigned, specific members)
- [ ] Column visibility toggle works
- [ ] Inline status editing works (change status in table row)
- [ ] Inline assignee editing works
- [ ] Inline tags editing works (if tags exist)
- [ ] Contact detail sheet opens on row click
- [ ] Delete contact works from detail sheet and row menu
- [ ] Pagination works

## Verification

After changes:
1. Load Database page → No "Merge Duplicates" button visible
2. Tags filter → Empty (no Community/1on1 defaults)
3. Open contact detail → Tags section shows "No tags configured. Add tags in Settings."
4. Change status inline → Works
5. Change assignee inline → Works
6. All filters apply correctly

## Commit

```
fix(database): remove merge button and clear default tags

- Remove Merge Duplicates button from header
- Change default contactTags from ['Community', '1on1'] to []
- Tags will be populated via Settings by workspace owner

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
