---
status: testing
phase: 04-bot-workflow
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md]
started: 2026-01-26T15:30:00Z
updated: 2026-01-27T16:40:00Z
---

## Current Test

number: 3
name: FAQ Answers
expected: |
  When user asks about Eagle services (destinations, visa success rate, programs), bot provides accurate answers from embedded FAQ knowledge
awaiting: user response

## Tests

### 1. Greeting Response
expected: When a new WhatsApp message arrives, Ari responds with a time-appropriate greeting and asks ONE question (about destination, documents, or English level)
result: pass

### 2. Document Collection One-at-a-Time
expected: After greeting, bot asks about documents ONE AT A TIME in order: passport → CV → IELTS/TOEFL → transcript. Each question waits for answer before asking next.
result: issue
reported: "Module not found: Can't resolve '@/convex/_generated/api' - import path was incorrect in filter-tabs.tsx and tag-filter-dropdown.tsx"
severity: blocker

### 3. FAQ Answers
expected: When user asks about Eagle services (destinations, visa success rate, programs), bot provides accurate answers from embedded FAQ knowledge
result: [pending]

### 4. Community Link Offer
expected: When user is qualified but not ready for consultation, bot offers free Community WhatsApp link
result: [pending]

### 5. Consultation Offer
expected: When user expresses interest in 1-on-1 help or asks about pricing, bot offers Consultation option
result: [pending]

### 6. Human Notification
expected: When consultation requested, conversation appears in inbox with unread indicator and lead score updates to minimum 70
result: [pending]

### 7. AI/Human Toggle
expected: Toggle button in message thread switches conversation between AI and Human mode. When switched to Human, Ari stops responding automatically.
result: [pending]

### 8. Profile Sidebar
expected: When viewing a conversation, right sidebar shows contact profile info (name, phone, lead score, tags)
result: [pending]

### 9. Inbox Filters
expected: Inbox filters work correctly: All, Unread, AI mode, Human mode conversations
result: [pending]

### 10. Merge Contacts
expected: Merge button visible in profile sidebar for combining duplicate contacts
result: [pending]

## Summary

total: 10
passed: 1
issues: 1
pending: 9
skipped: 0

## Gaps

- truth: "Development server loads without build errors"
  status: failed
  reason: "User reported: Module not found: Can't resolve '@/convex/_generated/api' - import path was incorrect in filter-tabs.tsx and tag-filter-dropdown.tsx"
  severity: blocker
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
