---
status: complete
phase: 21-lead-polish-performance
source: 21-01-SUMMARY.md, 21-02-SUMMARY.md, 21-03-SUMMARY.md, 21-04-SUMMARY.md, 21-05-SUMMARY.md, 21-06-SUMMARY.md, 21-07-SUMMARY.md, fixes
started: 2026-01-17T12:00:00Z
updated: 2026-01-17T17:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Avatar Color Stability
expected: Edit a contact's name - the avatar color should NOT change (stays same color before and after)
result: pass

### 2. Info Panel Calendar Icon
expected: In contact detail sheet, the "Added" date row shows plain text date, NOT a calendar widget
result: pass

### 3. Assigned To Dropdown in Database
expected: In Database table, clicking the Assigned To cell opens a dropdown. Shows current user and any team members.
result: pass
note: Required migration 18 to add assigned_to column to contacts table

### 4. Contacts Pagination Load More
expected: In Database view, header shows "Showing X of Y contacts". If more than 50 contacts exist, "Load More (N remaining)" button appears below the table.
result: pass

### 5. Activity Timeline Dual Time Format
expected: In contact detail sheet, activity timeline items show both relative time ("2 hours ago") and absolute time ("Jan 17, 14:30") separated by a dot.
result: pass

### 6. Notes Due Date WIB Display
expected: In contact detail sheet notes section, due dates display with full WIB format (e.g., "Jan 17, 2026 14:30").
result: pass

### 7. Inline Tags Dropdown in Database
expected: In Database table, clicking the Tags cell opens a dropdown with checkboxes. Toggling a tag updates immediately without page refresh.
result: pass

### 8. Tags Display Compact
expected: In Database table: 1 tag shows tag name, 2+ tags shows "+N" badge only
result: pass

### 9. Inbox Conversations Pagination
expected: In Inbox, if more than 50 conversations exist, "Load More" button appears below conversation list. Clicking loads more conversations.
result: pass

### 10. Info Panel State Sync
expected: In Inbox, editing contact details in the right sidebar (name, status, score, tags) updates the conversation list immediately without page refresh.
result: pass

### 11. Message Date Grouping WIB
expected: In Inbox chat view, message date groups show "Today", "Yesterday", or date in WIB timezone (not UTC).
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none]

## Post-UAT Fixes Applied

1. **assigned_to column** - Migration 18 created to add column to contacts table
2. **Tags compact display** - 1 tag = name, 2+ tags = "+N" only
3. **Auth fix** - Admin client bypass for workspace access check
4. **Calendar widget** - Removed inline calendar from Added date rows
