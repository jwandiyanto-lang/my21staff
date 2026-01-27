---
phase: 02-kapso-integration
plan: 03
status: complete
completed: 2026-01-25
duration: 3h (with debugging)
subsystem: kapso-webhook
tags: [convex, kapso, whatsapp, webhook, verification]

requires:
  - 02-01 (Kapso credentials)
  - 02-02 (ARI config)

provides:
  - Working Kapso webhook processing
  - Message storage in Convex
  - Inbox display of WhatsApp messages

affects:
  - Phase 3 (AI System)
  - Phase 4 (Bot Workflow)

tech-stack:
  patterns:
    - Convex internalMutation for async processing
    - withIndex queries instead of filter callbacks

key-files:
  modified:
    - convex/kapso.ts

decisions:
  - decision: "Use undefined instead of null for optional Convex fields"
    rationale: "Convex v.optional(v.string()) rejects null, accepts undefined"
    timestamp: 2026-01-25
  - decision: "Use withIndex instead of filter for Convex queries"
    rationale: "Convex filter uses query builder pattern, not JS callback"
    timestamp: 2026-01-25
---

# Phase 02 Plan 03: End-to-End Verification Summary

**Kapso WhatsApp webhook working — messages appear in inbox**

## What Was Verified

1. ✓ Webhook POST receives messages from Kapso
2. ✓ Contact created with name from WhatsApp profile
3. ✓ Conversation created with correct status
4. ✓ Message stored with content and metadata
5. ✓ Inbox UI displays conversation with preview

## Issues Fixed During Verification

### Issue 1: Schema validation error (assigned_to: null)
- **Error:** `Value does not match validator. Path: .assigned_to, Value: null`
- **Fix:** Changed `null` to `undefined` for optional fields in contact/conversation creation
- **Commit:** `46b012b`

### Issue 2: Invalid Convex filter syntax
- **Error:** `TypeError: a.has is not a function`
- **Fix:** Changed `.filter((q) => q.has("field"))` to `.withIndex("by_workspace", ...)`
- **Commit:** `58c343d`

### Issue 3: CONVEX_DEPLOY_KEY mismatch
- **Error:** Vercel had wrong deploy key (`pleasant-antelope-109` instead of `intent-otter-212`)
- **Fix:** Updated CONVEX_DEPLOY_KEY in Vercel environment variables
- **Resolution:** Manual update via Vercel CLI

### Issue 4: NEXT_PUBLIC_CONVEX_URL had trailing newline
- **Error:** App couldn't connect to Convex
- **Fix:** Removed and re-added environment variable without newline

## Requirements Satisfied

- **KAPSO-01:** Kapso webhook receives WhatsApp messages ✓
- **KAPSO-02:** Bot sends replies via Kapso API — Partial (ARI not responding, different workspace ID)
- **KAPSO-03:** Message history syncs to Convex ✓
- **KAPSO-04:** Webhook verification working ✓

## Known Issues for Next Phase

1. **ARI not enabled:** Log shows `[Kapso] ARI not enabled for workspace js7b1cwpdpadcgds1cr8dqw7dh7zv3a3`
   - The workspace ID found by kapso_phone_id lookup differs from where ARI was configured
   - Need to verify workspace linkage in Phase 3

## Deployment Notes

- Convex deployed to: `intent-otter-212`
- Vercel deployed to: `my21staff.com`
- Deploy key updated in Vercel environment

---
*Phase: 02-kapso-integration*
*Completed: 2026-01-25*
