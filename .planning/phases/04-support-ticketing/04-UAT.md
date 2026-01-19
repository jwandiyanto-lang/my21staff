---
status: testing
phase: 04-support-ticketing
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md
started: 2026-01-18T14:30:00Z
updated: 2026-01-19T08:35:00Z
---

## Current Test

number: 4
name: Add Comment to Ticket
expected: |
  Type in comment textarea and submit. Comment appears in timeline with author name and timestamp.
awaiting: user response

## Tests

### 1. Navigate to Support Page
expected: Click "Support" in sidebar. Support page loads showing ticket list with tab filters (All, Report, Discuss, Outcome, Implementation, Closed).
result: pass

### 2. Create New Ticket
expected: Click "New Ticket" button. Form opens with Subject, Description, Category, Priority fields. Submit creates ticket and shows in list with "Report" stage badge.
result: pass

### 3. View Ticket Detail
expected: Click a ticket row. Detail page loads showing subject, description, category, priority, current stage progress indicator, and requester info.
result: pass

### 4. Add Comment to Ticket
expected: Type in comment textarea and submit. Comment appears in timeline with author name and timestamp.
result: issue
reported: "Comment section is not visible anywhere on ticket detail page"
severity: blocker

### 5. Transition Ticket Stage
expected: Click transition button (e.g., "Lanjut ke Diskusi"). Stage advances. Status history shows the transition.
result: [pending]

### 6. Skip Stage (Admin)
expected: As admin, attempt to skip stages. Sets pending approval. Approval banner appears for requester.
result: [pending]

### 7. Approve/Reject Skip
expected: As requester viewing pending skip ticket, approval banner shows with approve/reject options. Approving advances stage, rejecting returns to previous.
result: [pending]

### 8. Close Ticket
expected: Transition ticket to "Selesai" (Closed). Reopen button appears. Stage shows completed.
result: [pending]

### 9. Reopen Closed Ticket
expected: On closed ticket, click "Buka Kembali" (Reopen). Ticket returns to Report stage and can be worked on again.
result: [pending]

### 10. Email Notification Opt-in
expected: When transitioning with "notify participants" checked, email is sent to requester and commenters. (Check Resend dashboard or email inbox)
result: [pending]

## Summary

total: 10
passed: 3
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
