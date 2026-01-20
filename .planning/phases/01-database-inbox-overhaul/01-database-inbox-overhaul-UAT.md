---
status: testing
phase: 01-database-inbox-overhaul
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md
started: 2026-01-20T13:00:00Z
updated: 2026-01-20T13:00:00Z
---

## Current Test

number: 1
name: Inbox Loads with Contact Data
expected: |
  Open the Inbox page. Conversations should load showing contact names and profile pictures
  (from cached Kapso data). No separate loading spinner for contact details — everything
  appears together.
awaiting: user response

## Tests

### 1. Inbox Loads with Contact Data
expected: Open the Inbox page. Conversations should load showing contact names and profile pictures (from cached Kapso data). No separate loading spinner for contact details — everything appears together.
result: [pending]

### 2. Active/All Filter Toggle
expected: At the top of the conversation list, there should be an Active/All toggle. "Active" shows only unread conversations. "All" shows all conversations including read ones. Default should be Active view.
result: [pending]

### 3. Status Filter (Hot/Warm/Cold/Lead/Customer)
expected: There should be a way to filter conversations by lead status. Selecting a status (e.g., Hot) should show only conversations with that status.
result: [pending]

### 4. Tag Filter
expected: There should be a way to filter conversations by tags. Selecting a tag should show only conversations with that tag assigned.
result: [pending]

### 5. Filter Preset Save
expected: After applying filters (e.g., Active + Hot status), there should be a way to save this combination as a preset with a custom name for quick access later.
result: [pending]

### 6. Filter Preset Load
expected: Previously saved filter presets should appear in a list. Clicking a preset should instantly apply those saved filters.
result: [pending]

### 7. Typing Indicator in Conversation List
expected: When a contact is typing a message (in WhatsApp), their conversation row should show an animated typing indicator (bouncing dots or "typing...").
result: [pending]

### 8. Typing Indicator in Message Thread
expected: When viewing a conversation, if the contact starts typing, a typing indicator should appear in the message thread header area.
result: [pending]

### 9. Real-time Message Updates
expected: When a new message arrives from a contact, it should appear in the conversation list immediately without needing to refresh the page. The conversation should move to the top of the list.
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0

## Gaps

[none yet]
