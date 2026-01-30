# Phase 3: Workspace Roles Enhancement - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Permission infrastructure for workspace roles — enforce owner/admin/member distinctions across the app. Create hasPermission() utility, extend requireWorkspaceMembership for roles, audit RLS policies, and add role management UI.

</domain>

<decisions>
## Implementation Decisions

### Role permissions
- **Delete leads:** Owner only — not even my21staff admin staff can override
- **Team management (invite/remove):** Owner only
- **Workspace settings (name, API key, integrations):** Owner only
- **Admin vs Member distinction:**
  - Admin: View all leads + export data
  - Member: Only see leads assigned to them, no export capability

### Violation UX
- **Approach:** Disabled with tooltip (not hidden)
- **Consistency:** Same for navigation items and inline actions (e.g., Delete button)
- **Tooltip tone:** Helpful — "Contact your workspace owner to access this"
- **API violations:** 403 Forbidden + reason ("Insufficient permissions: requires owner role")

### Role visibility
- **Own role:** Shown in profile/account settings only (not in sidebar)
- **Team list:** Show role badges ("Owner", "Admin", "Member") next to each name
- **Team list access:** All members can see the full team list
- **Lead assignee:** Always visible on leads (not just in detail view)

### Role transitions
- **Ownership transfer:** No self-service — customer must email my21staff to request
- **Promote/demote:** Owner can change Member ↔ Admin via team settings UI
- **Confirmation:** Required for all role changes
- **Notification:** Email sent when someone's role changes

### Claude's Discretion
- Exact tooltip wording beyond the tone guidance
- Role badge styling (color, shape)
- Role change email template content
- hasPermission() API design

</decisions>

<specifics>
## Specific Ideas

- Owner-centric model: Most power concentrated with owner, admins are limited to visibility/export
- Transparency over hiding: Show disabled elements with explanation rather than hiding them
- No self-service ownership transfer (prevents accidental/unauthorized transfers)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-workspace-roles*
*Context gathered: 2026-01-18*
