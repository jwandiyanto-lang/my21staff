---
status: testing
phase: 21-lead-polish-performance
source: 21-01-SUMMARY.md, 21-02-SUMMARY.md, 21-03-SUMMARY.md, 21-04-SUMMARY.md, 21-05-SUMMARY.md, 21-06-SUMMARY.md, 21-07-SUMMARY.md
started: 2026-01-17T12:00:00Z
updated: 2026-01-17T12:00:00Z
---

## Current Test

number: 1
name: Contacts Pagination Load More
expected: |
  In Database view, header shows "Showing X of Y contacts".
  If more than 50 contacts exist, "Load More (N remaining)" button appears below the table.
  Clicking it fetches the next page and appends contacts to the list.
awaiting: user response

## Tests

### 1. Contacts Pagination Load More
expected: In Database view, header shows "Showing X of Y contacts". If more than 50 contacts exist, "Load More (N remaining)" button appears below the table.
result: [pending]

### 2. Activity Timeline Dual Time Format
expected: In contact detail sheet, activity timeline items show both relative time ("2 hours ago") and absolute time ("Jan 17, 14:30") separated by a dot.
result: [pending]

### 3. Notes Due Date WIB Display
expected: In contact detail sheet notes section, due dates display with full WIB format (e.g., "Jan 17, 2026 14:30").
result: [pending]

### 4. Inline Tags Dropdown in Database
expected: In Database table, clicking the Tags cell opens a dropdown with checkboxes. Toggling a tag updates immediately without page refresh.
result: [pending]

### 5. Tags Display with Overflow
expected: In Database table, if a contact has many tags, shows first 2 tags with "+N" badge for overflow.
result: [pending]

### 6. Inbox Conversations Pagination
expected: In Inbox, if more than 50 conversations exist, "Load More" button appears below conversation list. Clicking loads more conversations.
result: [pending]

### 7. Info Panel State Sync
expected: In Inbox, editing contact details in the right sidebar (name, status, score, tags) updates the conversation list immediately without page refresh.
result: [pending]

### 8. Message Date Grouping WIB
expected: In Inbox chat view, message date groups show "Today", "Yesterday", or date in WIB timezone (not UTC).
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0

## Gaps

[none yet]
