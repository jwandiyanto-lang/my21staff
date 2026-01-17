---
status: complete
phase: 20-dashboard-notes
source: ROADMAP.md (interactive session)
started: 2026-01-17T15:30:00Z
updated: 2026-01-17T15:42:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard Client Stats
expected: Navigate to /dashboard. Should see total client count, plus breakdown showing clients added today, this week, and this month.
result: pass

### 2. Tag Analytics (1on1 Consultation)
expected: Dashboard shows "1on1 consultation" tag count with orange styling. Should display all-time count and breakdowns (today, this week, this month).
result: pass

### 3. Notes Due Date Field
expected: Open a contact's notes section. Should see a calendar picker to set a due date on notes.
result: issue
reported: "yes but it is showing failed notes. Also make sure that all the notes, are shown in each user's activity and then it will show in the dashboard to do list according to the recent due date all the way to the farthest, then in dashboard, it will say finish follow up by another note inside that to see whats done"
severity: blocker

### 4. Due Date Calendar Popover
expected: Clicking the calendar picker opens a popover with a date selector. Selecting a date saves it to the note.
result: pass

### 5. Dashboard Upcoming Tasks
expected: Dashboard shows "Upcoming Tasks" section listing notes with due dates, sorted by soonest first.
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Notes can be created with due dates without errors"
  status: failed
  reason: "User reported: Failed to create note error shown"
  severity: blocker
  test: 3
  artifacts: []
  missing: []

- truth: "Notes appear in each user's activity section"
  status: failed
  reason: "User reported: Notes should show in each user's activity"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "Dashboard to-do list sorted by due date (recent to farthest)"
  status: failed
  reason: "User reported: Dashboard should sort by recent due date to farthest"
  severity: major
  test: 3
  artifacts: []
  missing: []

- truth: "Dashboard has 'finish follow up' action to mark tasks done"
  status: failed
  reason: "User reported: Dashboard should have way to mark tasks as done via follow-up note"
  severity: major
  test: 3
  artifacts: []
  missing: []
