---
status: complete
phase: 03-workspace-roles
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-01-18T23:00:00Z
updated: 2026-01-18T23:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Member Lead Visibility (RLS)
expected: As a member (not owner/admin), you should only see contacts assigned to you in the leads list. Owner/admin see all contacts.
result: skipped
reason: Need working member invitation link from Phase 2 to test

### 2. Delete Lead - Owner Only
expected: Owner can delete leads via the delete button. Non-owners see the delete button disabled with tooltip "Contact your workspace owner to access this".
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 3. Export Leads - Owner/Admin Only
expected: Owner and admin can export leads via the export button. Members see the export button disabled with tooltip.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 4. Invite Team Member - Owner Only
expected: On team page, owner can click "Invite Member", enter email, and send invitation. Non-owners see the invite button disabled with tooltip.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 5. Remove Team Member - Owner Only
expected: On team page, owner can remove a team member (not themselves, not other owners). Non-owners see remove action disabled.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 6. Change Member Role - Owner Only
expected: On team page, owner sees role dropdown for each member (admin/member options). Non-owners see static role badge, no dropdown.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 7. Owner Role Protected
expected: Owner role cannot be changed - no dropdown to change owner to admin/member. Owners remain owners.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

### 8. Role Change Email Notification
expected: When owner changes someone's role, that person receives an email notification about the role change.
result: skipped
reason: Need working team invitation from Phase 2 to test role permissions

## Summary

total: 8
passed: 0
issues: 0
pending: 0
skipped: 8

## Gaps

[none yet]
