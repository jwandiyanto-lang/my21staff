---
status: diagnosed
phase: 05-central-support-hub
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md
started: 2026-01-19T11:45:00Z
updated: 2026-01-19T11:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Admin sees client tickets routed to workspace
expected: In admin dashboard (/my21staff-workspace/support), tickets routed from clients have "Client" badge with source workspace name
result: skipped
reason: Blocked by test 6 - routing to admin not working

### 2. Source filter tabs in admin ticket list
expected: When client tickets exist, admin sees filter tabs (All Sources/Internal/Client) above ticket list
result: skipped
reason: Blocked by test 6 - no client tickets visible to admin

### 3. Internal notes feature for admin
expected: On client ticket detail, admin (owner/admin role) can toggle "Internal Note" checkbox when adding comments. Internal notes show amber styling with "Internal Note" badge.
result: skipped
reason: Blocked by test 6 - no client tickets visible to admin

### 4. Upload image attachment to ticket
expected: On ticket detail (admin or portal), click upload button and select an image. Image uploads and appears in the conversation.
result: issue
reported: "dont have that image uploaded button"
severity: major

### 5. Client portal ticket list
expected: Navigate to /portal/support while logged in as a client user. See list of only your own tickets with status badges.
result: pass

### 6. Client portal create ticket
expected: Click "New Ticket" in portal, fill form (title, description, category, priority), submit. Ticket appears in list and is routed to my21staff admin.
result: issue
reported: "appears in the list but admin sees nothing"
severity: major

### 7. Client portal ticket detail and comments
expected: Click a ticket in portal list. See ticket details, stage progress bar, and discussion thread. Can add comments (but not internal notes).
result: pass

### 8. Closed tickets prevent commenting
expected: On a closed ticket, the comment form is replaced with a message indicating the ticket is closed.
result: skipped
reason: No closed tickets available to test

### 9. Client cannot see internal notes
expected: If admin added internal notes on a client ticket, those notes should NOT appear in the portal view for the client.
result: skipped
reason: Blocked by test 6 - admin can't add internal notes without seeing client tickets

### 10. Tawk.to widget in portal (optional)
expected: If NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID are set, Tawk.to chat widget appears in bottom-right of portal pages. If not set, no widget (graceful degradation).
result: skipped
reason: Tawk.to not configured yet (optional feature)

### 11. Vercel deployment is live
expected: Visit https://my21staff.com and confirm the site loads. Check /portal/support is accessible.
result: pass

## Summary

total: 11
passed: 3
issues: 2
pending: 0
skipped: 6

## Gaps

- truth: "Ticket created via portal is routed to my21staff admin workspace"
  status: failed
  reason: "User reported: appears in the list but admin sees nothing"
  severity: major
  test: 6
  root_cause: "RLS policy 'Admin workspace can view routed tickets' from migration 28 not applied to database"
  artifacts:
    - path: "supabase/migrations/28_central_support_hub.sql"
      issue: "Migration may not be applied - policy checks admin_workspace_id"
  missing:
    - "Apply migration 28 to database OR run policy SQL directly"
  debug_session: ".planning/debug/portal-tickets-not-routed.md"

- truth: "Image upload button exists on ticket detail for attachments"
  status: failed
  reason: "User reported: dont have that image uploaded button"
  severity: major
  test: 4
  root_cause: "ImageUpload component exists in portal but missing from admin ticket-detail-client.tsx"
  artifacts:
    - path: "src/app/(dashboard)/[workspace]/support/[id]/ticket-detail-client.tsx"
      issue: "Missing ImageUpload import and integration"
  missing:
    - "Import ImageUpload from @/components/portal/image-upload"
    - "Add attachments state and handlers"
    - "Render ImageUpload in comment form section"
  debug_session: ""
