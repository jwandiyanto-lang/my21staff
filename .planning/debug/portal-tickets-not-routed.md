---
status: diagnosed
trigger: "Portal tickets not routed to admin workspace"
created: 2026-01-19T12:00:00Z
updated: 2026-01-19T12:00:30Z
---

## Current Focus

hypothesis: RLS policy grants access only to users with role in admin_workspace_id, but portal user's CLIENT workspace_id is checked instead by original "Members can view tickets" policy
test: Analyzed both migration 26 and 28 RLS policies
expecting: Conflict between policies
next_action: Document root cause

## Symptoms

expected: Tickets created via /portal/support should appear in my21staff admin workspace (/my21staff/support)
actual: Ticket appears in portal ticket list but admin workspace shows 0 tickets
errors: None reported
reproduction: Create ticket via portal, check admin workspace
started: Unknown

## Eliminated

- hypothesis: POST /api/portal/tickets does not set admin_workspace_id
  evidence: Line 94 in route.ts correctly sets admin_workspace_id: ADMIN_WORKSPACE_ID
  timestamp: 2026-01-19T12:00:15Z

- hypothesis: ADMIN_WORKSPACE_ID is wrong value
  evidence: support.ts has correct UUID 0318fda5-22c4-419b-bdd8-04471b818d17
  timestamp: 2026-01-19T12:00:18Z

- hypothesis: Admin support page queries wrong column
  evidence: Line 65 correctly queries .eq('admin_workspace_id', workspace.id)
  timestamp: 2026-01-19T12:00:20Z

## Evidence

- timestamp: 2026-01-19T12:00:10Z
  checked: src/app/api/portal/tickets/route.ts
  found: Line 94 correctly sets admin_workspace_id to ADMIN_WORKSPACE_ID constant
  implication: Tickets ARE being created with admin_workspace_id set

- timestamp: 2026-01-19T12:00:12Z
  checked: src/lib/config/support.ts
  found: ADMIN_WORKSPACE_ID = '0318fda5-22c4-419b-bdd8-04471b818d17' (correct my21staff workspace)
  implication: Config is correct

- timestamp: 2026-01-19T12:00:14Z
  checked: src/app/(dashboard)/[workspace]/support/page.tsx lines 57-66
  found: Query correctly filters by admin_workspace_id = workspace.id
  implication: Query logic is correct

- timestamp: 2026-01-19T12:00:25Z
  checked: supabase/migrations/26_tickets.sql (original policies)
  found: "Members can view tickets" policy checks get_user_role_in_workspace(workspace_id)
  implication: Original policy checks workspace_id (client's workspace), not admin_workspace_id

- timestamp: 2026-01-19T12:00:28Z
  checked: supabase/migrations/28_central_support_hub.sql (new policies)
  found: "Admin workspace can view routed tickets" policy checks get_user_role_in_workspace(admin_workspace_id) IN ('owner', 'admin')
  implication: Admin needs owner/admin role in admin_workspace_id to see tickets

- timestamp: 2026-01-19T12:00:30Z
  checked: RLS policy interaction
  found: CRITICAL - The RLS SELECT policy evaluates as: (role in workspace_id IS NOT NULL) OR (admin_workspace_id IS NOT NULL AND role in admin_workspace_id IN ('owner','admin'))
  implication: For admin user viewing client ticket, workspace_id points to CLIENT's workspace where admin has NO role, so first condition fails. Second condition should work IF admin has owner/admin role in admin_workspace_id.

## Resolution

root_cause: |
  The RLS policies from migration 26 and 28 are ADDITIVE (OR logic in PostgreSQL), so they SHOULD work.
  The actual issue is likely one of:

  1. **Migration 28 not applied** - The policies don't exist in database
  2. **User role issue** - Admin user may not have 'owner' or 'admin' role in my21staff workspace
  3. **Member role excluded** - Policy only allows 'owner' or 'admin', not 'member' role in admin workspace

  Most likely: Migration 28 was never applied to the production database. The new RLS policies that grant admin_workspace access don't exist.

fix: |
  1. Verify migration 28 was applied: Check supabase_migrations table or try to view policies
  2. If not applied, run: supabase db push or apply migration manually
  3. Verify admin user has 'owner' or 'admin' role in my21staff workspace
  4. Consider adding 'member' to allowed roles if needed for broader admin team access

verification:
files_changed: []
