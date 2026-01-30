---
status: complete
phase: 04-bot-workflow + inbox
source: [02-inbox/02-01-SUMMARY.md, 02-inbox/02-02-SUMMARY.md, 02-inbox/02-03-SUMMARY.md, 03.1-inbox-enhancement/03.1-01-SUMMARY.md, 04-bot-workflow/04-01-SUMMARY.md, 04-bot-workflow/04-02-SUMMARY.md, 04-bot-workflow/04-03-SUMMARY.md, 04-bot-workflow/04-04-SUMMARY.md, 04-bot-workflow/04-05-SUMMARY.md, 04-bot-workflow/04-06-SUMMARY.md]
started: 2026-01-26T16:00:00Z
updated: 2026-01-26T16:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Conversation List Display
expected: Two-panel inbox layout. Conversation items show avatar, name, last message preview, timestamp, tags (max 2), unread badge.
result: issue
reported: "yes but the profile should be able to be hidden and has a button where if it clicks, then it shows the profile that way, the chat can be highlighted. Then also look at the chat on the left side, it should not keep going, but should be cut so its not hitting the border, it should stop before"
severity: minor

### 2. Status Filter Chips
expected: Filter chips at top show status labels (Active, All, All Status dropdown). Clicking filters conversations by lead status.
result: pass

### 3. Tag Filter Chips
expected: Tag filter chips appear dynamically based on contact tags. Clicking filters by that tag.
result: skipped
reason: no tags configured yet

### 4. Select Conversation
expected: Clicking a conversation item selects it (highlighted) and shows message thread on right panel.
result: pass

### 5. Message Thread Display
expected: Messages show with brand-colored bubbles (outbound) and white/muted (inbound). Date separators show "Today", "Yesterday", or full date.
result: pass
note: Feature request - add reply button to reply to specific chat bubble (WhatsApp-style quote reply)

### 6. Message Auto-Scroll
expected: Thread auto-scrolls to bottom when new messages arrive (if already near bottom). Stays in place if scrolled up reading old messages.
result: pass

### 7. Read Receipt Indicators
expected: Outbound messages show status: single gray check (sent), double gray checks (delivered), double blue checks (read).
result: issue
reported: "dont see that"
severity: minor

### 8. Compose and Send Message
expected: Type message in compose area at bottom. Enter key sends. Shift+Enter adds new line. Textarea auto-expands as you type (up to 5 rows).
result: issue
reported: "pass, but currently I cant send the message here"
severity: major

### 9. Message Delivery
expected: After sending, message appears in thread immediately. Message delivered to WhatsApp recipient via Kapso.
result: skipped
reason: cant send - blocked by test 8 issue

### 10. Empty State
expected: When no conversation selected, message area shows empty state with appropriate message.
result: issue
reported: "no it shows previous state on whatever I have typed"
severity: minor

### 11. Profile Sidebar
expected: When conversation selected, right sidebar shows contact profile (name, phone, lead score, tags, quick actions).
result: issue
reported: "yes it shows, but: 1) needs to be collapsible, 2) should show form data they filled, 3) remove 'View conversations' button (already in conversation), 4) note feature should not be popup modal - allow typing notes directly in sidebar, 5) show 3 recent activity/notes"
severity: minor

### 12. AI/Human Toggle
expected: Toggle button in message thread header switches between AI (green, Bot icon) and Human (orange, User icon) mode.
result: pass

### 13. Merge Contacts Button
expected: Profile sidebar shows "Merge with..." button in quick actions section.
result: issue
reported: "merge works, its just that the second column should be able to be picked from the list of users, currently it is autopick"
severity: minor

### 14. Bot Greeting Response
expected: When new WhatsApp message arrives from unknown contact, Ari responds with time-appropriate greeting and asks ONE question about destination, documents, or English level.
result: skipped
reason: need to test with real WhatsApp

### 15. Document Collection One-at-a-Time
expected: Bot asks about documents in order: passport first, then CV, then IELTS/TOEFL, then transcript. Each waits for answer before asking next.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

### 16. FAQ Answers
expected: When user asks about Eagle services (destinations, visa success rate, programs), bot provides accurate answers from embedded FAQ knowledge.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

### 17. Community Link Offer
expected: When user is qualified but not ready for consultation, bot offers free Community WhatsApp link.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

### 18. Consultation Offer
expected: When user expresses interest in 1-on-1 help or asks about pricing, bot offers Consultation option.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

### 19. Human Notification on Consultation Request
expected: When consultation requested, conversation appears in inbox with unread indicator (unread_count = 1) and lead score updates to minimum 70.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

### 20. AI Toggle Stops Auto-Response
expected: When AI/Human toggle switched to Human mode, Ari stops responding automatically to incoming messages.
result: skipped
reason: need to set bot flow first, test with real WhatsApp

## Summary

total: 20
passed: 5
issues: 6
pending: 0
skipped: 9

## Gaps

- truth: "Two-panel inbox layout with properly truncated conversation list items and collapsible profile sidebar"
  status: failed
  reason: "User reported: Profile should be collapsible with toggle button. Conversation list text overflows, should truncate before hitting border."
  severity: minor
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Outbound messages show read receipt indicators (single check, double check, blue double check)"
  status: failed
  reason: "User reported: dont see that"
  severity: minor
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "User can send messages from compose area"
  status: failed
  reason: "User reported: UI works (enter/shift+enter/auto-expand) but can't actually send messages"
  severity: major
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Empty state shown when no conversation selected"
  status: failed
  reason: "User reported: shows previous state on whatever I have typed instead of empty state"
  severity: minor
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Profile sidebar shows contact info with proper UX"
  status: failed
  reason: "User reported: 1) needs to be collapsible, 2) should show form data they filled, 3) remove 'View conversations' button, 4) notes should be inline not popup modal, 5) show 3 recent activity/notes"
  severity: minor
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Merge contacts allows user to pick second contact from list"
  status: failed
  reason: "User reported: merge works but second column should be pickable from list of users, currently it is autopick"
  severity: minor
  test: 13
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
