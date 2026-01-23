# Phase 4: User Migration + Organizations - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate existing Supabase users to Clerk with ID mapping across all Convex tables. Convert workspaces to Clerk organizations with role-based permissions. This phase handles the data migration and organizational structure — n8n integration and Supabase cleanup are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Organization setup
- Standardized naming format: "[Business Name] - my21staff"
- Jonathan becomes initial owner of all organizations (can transfer ownership later)
- Organizations are private/invite-only (standard B2B SaaS model)

### Invitation handling
- Claude's discretion on pending invitations approach (cancel and re-invite vs migrate)

### Role permissions
- Focus on owner role only for now — member/admin roles refined later
- Super-admin concept: Jonathan's account has cross-org access for support and debugging
- New members get role set during invitation (inviter chooses)

### Claude's Discretion
- Owner vs admin permission boundaries (sensible defaults for B2B CRM)
- Member role restrictions (deferred — not focused on this now)
- Pending invitation migration strategy
- Organization visibility settings

</decisions>

<specifics>
## Specific Ideas

- "Do me and allow switch to owner" — Jonathan as initial owner with ability to transfer
- Focus on owner role first, member/admin refinement comes later
- Built-in super-admin access for solo-founder support workflow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-user-migration-organizations*
*Context gathered: 2026-01-23*
