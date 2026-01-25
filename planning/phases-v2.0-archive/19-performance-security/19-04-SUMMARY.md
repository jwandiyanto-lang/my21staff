---
phase: 19-performance-security
plan: 04
subsystem: logging
tags: [security, privacy, pii, logging]

dependency-graph:
  requires: [19-01]
  provides: [pii-masked-logs]
  affects: []

tech-stack:
  added: []
  patterns: [pii-masking-helpers]

files:
  created: []
  modified:
    - src/app/api/webhook/kapso/route.ts
    - src/app/api/contacts/merge/route.ts

decisions:
  - id: mask-phone-inline
    choice: Inline masking helpers in webhook file
    rationale: Single-use location, no need for shared utility yet

metrics:
  duration: 4 min
  completed: 2026-01-17
---

# Phase 19 Plan 04: PII Logging Cleanup Summary

Masked phone numbers and removed PII from production logs for privacy compliance.

## What Was Built

### Task 1: Phone Masking Utility and Webhook Log Cleanup

Added two helper functions to the Kapso webhook handler:

```typescript
function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***'
  return phone.slice(0, 3) + '***' + phone.slice(-4)
}

function maskPayload(payload: unknown): string {
  const str = JSON.stringify(payload)
  return str.replace(/"\d{10,15}"/g, '"***MASKED***"')
    .replace(/"from":\s*"\d+"/g, '"from":"***"')
    .replace(/"wa_id":\s*"\d+"/g, '"wa_id":"***"')
}
```

Changes to logging:
- Raw payload logging now uses `maskPayload()` and is limited to 500 chars
- Removed full metadata log that exposed `display_phone_number`
- Replaced "All workspaces" dump with simple count: `Workspace count: N`

### Task 2: Merge Contact Log Cleanup

Removed phone number from merge success log:
- Before: `[Merge] Successfully merged contact X into Y. Phone: +62812xxxxx`
- After: `[Merge] Successfully merged contact X into Y`

Contact IDs are sufficient for debugging; phone numbers are PII.

## Commits

| Commit | Description |
|--------|-------------|
| 6376d33 | Add PII masking to webhook logs |
| 92fe73b | Remove phone number from merge success log |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Build completes without errors
2. No phone numbers in console.log statements (except internal `phone_number_id` which is Meta's internal ID, not customer data)
3. No `Phone:` pattern in merge route
4. Webhook payloads logged with masking applied

## Next Phase Readiness

Plan 19-04 complete. All critical and high-priority security issues from the research phase have been addressed:

- 19-01: Authorization fixes (complete)
- 19-02: Performance optimizations (separate)
- 19-03: Input validation with Zod (separate)
- 19-04: PII logging cleanup (complete)

Production logs are now safe for operations team viewing.
