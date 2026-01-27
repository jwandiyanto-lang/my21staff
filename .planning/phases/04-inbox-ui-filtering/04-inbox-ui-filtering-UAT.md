---
status: complete
phase: 04-inbox-ui-filtering
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-01-27T16:45:00Z
updated: 2026-01-27T16:55:00Z
---

## Current Test

[testing complete - blocker found]

## Tests

### 1. Status Filter Tabs Visible
expected: At the top of the Inbox page, you see 7 horizontal status tabs: All, New, Hot, Warm, Cold, Client, Lost. Each tab shows a count badge (number of conversations in that status).
result: issue
reported: "Inbox doesn't match Kapso WhatsApp Cloud Inbox design (github.com/gokapso/whatsapp-cloud-inbox). Should be clean 2-column layout with WhatsApp Web aesthetic: narrow conversation sidebar with search, wide message thread with green bubbles, minimal design. Current UI appears to be old custom design, not Kapso's WhatsApp-first structure."
severity: blocker

### 2. Status Tab Filtering Works
expected: Clicking a status tab (e.g., "Hot") filters the conversation list to show only conversations with that lead status. The active tab is visually highlighted.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 3. Tag Filter Dropdown Visible
expected: Next to the status tabs, there's a Tags dropdown button with a tag icon. Clicking it opens a popover showing available workspace tags as checkboxes.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 4. Tag Filtering Works
expected: Selecting one or more tags in the dropdown filters conversations to show only those that have ALL selected tags (AND logic). Selected tags show a count badge on the Tags button.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 5. Clear All Tags Button
expected: When tags are selected, a "Clear all" button appears in the tag dropdown. Clicking it deselects all tags and removes the filter.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 6. Real-time Count Updates
expected: When conversation statuses change (e.g., a lead becomes "Hot"), the count badges on status tabs update automatically without page refresh.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 7. WhatsApp-Style Message Bubbles
expected: In a message thread, sender messages appear as green/emerald bubbles on the right, receiver messages as white/gray bubbles on the left. Bubbles are rounded with a sharp corner (like WhatsApp).
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 8. Message Thread Auto-Scroll
expected: When viewing a conversation and at the bottom of the thread, new incoming messages automatically scroll into view smoothly.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 9. New Messages Indicator
expected: When scrolled up in a conversation and a new message arrives, a floating "new messages" button with down arrow appears at the bottom of the thread.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

### 10. New Messages Indicator Click
expected: Clicking the "new messages" indicator button smoothly scrolls the thread to the bottom to show the new message.
result: skipped
reason: Blocker found in Test 1 - need to fix Inbox structure first

## Summary

total: 10
passed: 0
issues: 1
pending: 0
skipped: 9

## Gaps

- truth: "Inbox displays with Kapso's WhatsApp Cloud Inbox design (clean 2-column layout, WhatsApp Web aesthetic)"
  status: failed
  reason: "User reported: Inbox doesn't match Kapso WhatsApp Cloud Inbox design (github.com/gokapso/whatsapp-cloud-inbox). Should be clean 2-column layout with WhatsApp Web aesthetic: narrow conversation sidebar with search, wide message thread with green bubbles, minimal design. Current UI appears to be old custom design, not Kapso's WhatsApp-first structure."
  severity: blocker
  test: 1
  root_cause: "Architecture mismatch - Current 3-column layout (sidebar + thread + overlay) vs Kapso's 2-column design. InfoSidebar uses floating overlay instead of integrated panel. Filters crammed into header instead of dedicated bar. Components are individually correct (FilterTabs, MessageBubble use emerald-500 properly), but layout structure diverges from Kapso reference."
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx"
      issue: "3-column layout needs restructure to 2-column"
    - path: "src/components/contact/info-sidebar.tsx"
      issue: "Overlay positioning needs integration or modal conversion"
    - path: "src/components/inbox/filter-tabs.tsx"
      issue: "Needs dedicated filter bar section"
  missing:
    - "Dedicated filter bar (separate section below search)"
    - "Integrated right panel (not overlay)"
    - "Responsive proportions for sidebar (25-30% width)"
  debug_session: ".planning/debug/inbox-kapso-design-gap.md"
