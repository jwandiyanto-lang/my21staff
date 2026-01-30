---
status: diagnosed
phase: 08-performance-optimization
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md
started: 2026-01-20T10:00:00Z
updated: 2026-01-20T10:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Bundle Analyzer Script
expected: Running `npm run analyze` opens browser with bundle visualization showing client/server chunks
result: pass

### 2. Inbox Caching - Instant Return
expected: Navigate to Inbox, click away to Database, return to Inbox. Should load instantly from cache (no loading spinner, no blank screen)
result: issue
reported: "yes I see skeleton every time I return"
severity: major

### 3. Database Caching - Instant Return
expected: Navigate to Database, click to Inbox, return to Database. Should load instantly from cache
result: issue
reported: "same issue - skeleton shows every time on return"
severity: major

### 4. Inbox Real-Time Updates
expected: Send a WhatsApp message to a contact. Message appears in Inbox without manual refresh
result: issue
reported: "appears, but failed send still shows in chat - optimistic update not rolling back on failure"
severity: major

### 5. Contact Optimistic Update
expected: In Database, change a contact's status. UI updates immediately (no spinner), then persists after page refresh
result: pass

### 6. Dashboard Loading Skeleton
expected: Navigate to dashboard route. Before content loads, see a skeleton matching the layout (stats grid, consultation section, tasks)
result: pass

### 7. Inbox Loading Skeleton
expected: Hard refresh the Inbox page. Skeleton shows conversation list and message thread placeholders before content loads
result: pass

### 8. Database Loading Skeleton
expected: Hard refresh the Database page. Skeleton shows table with placeholder rows before content loads
result: pass

### 9. Support Loading Skeleton
expected: Hard refresh the Support page. Skeleton shows table layout before tickets load
result: pass

### 10. Settings Loading Skeleton
expected: Hard refresh the Settings page. Skeleton shows card placeholders before settings load
result: pass

## Summary

total: 10
passed: 7
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Returning to Inbox loads instantly from cache (no skeleton)"
  status: failed
  reason: "User reported: yes I see skeleton every time I return"
  severity: major
  test: 2
  root_cause: "Architecture mismatch - page.tsx is async server component that refetches on every navigation. loading.tsx shows during server render BEFORE client can check TanStack Query cache."
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/inbox/page.tsx"
      issue: "Async server component does ALL data fetching on every navigation"
    - path: "src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx"
      issue: "Takes initialConversations prop - no TanStack Query for conversation list"
  missing:
    - "Create useConversations hook for client-side caching"
    - "Simplify page.tsx to minimal server work"
    - "Let InboxClient fetch via TanStack Query"
  debug_session: ".planning/debug/tanstack-query-skeleton-flash.md"

- truth: "Returning to Database loads instantly from cache (no skeleton)"
  status: failed
  reason: "User reported: same issue - skeleton shows every time on return"
  severity: major
  test: 3
  root_cause: "Same as Test 2 - server component refetches on every navigation"
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/database/page.tsx"
      issue: "Same pattern as inbox - server fetches on every navigation"
  missing:
    - "Move database fetching to client-side TanStack Query"
  debug_session: ".planning/debug/tanstack-query-skeleton-flash.md"

- truth: "Failed message sends are rolled back from UI (not shown as sent)"
  status: failed
  reason: "User reported: failed send still shows in chat - optimistic update not rolling back on failure"
  severity: major
  test: 4
  root_cause: "handleMessageError captures selectedConversation.id via closure. If user switches conversations during API call, wrong cache is targeted."
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx"
      issue: "handleMessageError uses closure for conversationId instead of parameter"
    - path: "src/app/(dashboard)/[workspace]/inbox/message-input.tsx"
      issue: "onMessageError interface doesn't include conversationId parameter"
  missing:
    - "Change onMessageError signature to accept (conversationId, optimisticId)"
    - "Pass conversationId from MessageInput to error handler"
  debug_session: ".planning/debug/optimistic-rollback-failure.md"
