---
status: complete
phase: 20-dashboard-notes
source: 20-08-SUMMARY.md, 20-09-SUMMARY.md
started: 2026-01-17T20:00:00Z
updated: 2026-01-17T20:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Notes Creation Error Handling
expected: Create a note for a contact. If it fails, the error message should include the actual cause instead of generic "Failed to create note".
result: issue
reported: "Failed to create note in the lead management, also in the conversation under each profile. On another note, the note feature on the profile in conversations should also have a due date so it can link together to the dashboard"
severity: blocker

### 2. Due Date Format Validation
expected: Try to save a note with an invalid due date format. Should show a clear error like "Invalid due date format" (400 response).
result: issue
reported: "it only says failed to create note, same as previous test"
severity: major

### 3. Dashboard Task Sorting
expected: Navigate to dashboard. Upcoming tasks should be sorted by due date with nearest first (ascending order).
result: skipped
reason: No data to test - notes creation is broken

### 4. Mark Task Complete
expected: On dashboard, click the complete button (circular checkbox) on a task. Task should be removed from the list immediately.
result: skipped
reason: No data to test - notes creation is broken

### 5. Completed Tasks Hidden
expected: After marking a task complete, refresh the dashboard. The completed task should not reappear in the Upcoming Tasks list.
result: skipped
reason: No data to test - notes creation is broken

## Summary

total: 5
passed: 0
issues: 2
pending: 0
skipped: 3

## Gaps

- truth: "Notes can be created successfully in lead management and conversation profile"
  status: failed
  reason: "User reported: Failed to create note - could not find the due date column"
  severity: blocker
  test: 1
  root_cause: "Migration 16 (due_date column) and Migration 17 (completed_at column) not applied to production Supabase"
  artifacts:
    - path: "supabase/migrations/16_notes_due_date.sql"
      issue: "Not applied to production"
    - path: "supabase/migrations/17_notes_completed_at.sql"
      issue: "Not applied to production"
  missing:
    - "Run migrations on production Supabase database"

- truth: "Notes in conversation profile should have due date feature"
  status: failed
  reason: "User reported: Note feature on the profile in conversations should also have a due date so it can link together to the dashboard"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "Error messages should include actual cause, not generic 'Failed to create note'"
  status: failed
  reason: "User reported: it only says failed to create note, same as previous test"
  severity: major
  test: 2
  artifacts: []
  missing: []
