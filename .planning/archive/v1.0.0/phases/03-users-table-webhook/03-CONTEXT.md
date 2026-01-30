# Phase 3: Users Table + Clerk Webhook - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Sync user data from Clerk to Convex via webhooks. Users table stores minimal user info with workspace association. Webhook handles full user lifecycle (created, updated, deleted). Organization/workspace membership events are Phase 4 scope.

</domain>

<decisions>
## Implementation Decisions

### User Schema
- Minimal data: clerk_id as primary identifier (no denormalized name/email/image)
- Include workspace_id (single workspace per user, not array)
- No legacy_id field — starting fresh, no Supabase migration
- Fetch name/email from Clerk API when display is needed

### Webhook Events
- Handle full user lifecycle: user.created, user.updated, user.deleted
- user.deleted triggers hard delete (remove record completely)
- Skip session events (no last_sign_in tracking)
- Organization membership events deferred to Phase 4

### Data Migration
- Clean slate approach — no migration from Supabase data
- Existing Supabase data (leads, tickets) stays in Supabase, not migrated
- Will set up fresh after v3.1 is complete

### Error Handling
- Rely on Clerk's built-in webhook retry (up to 3 retries over 24h)
- Validate svix signatures for security
- Log all webhook events to audit table for debugging
- HTTP status codes: Claude's discretion based on best practices

### Claude's Discretion
- Exact HTTP status codes for error responses
- Audit log table schema details
- Webhook endpoint path naming

</decisions>

<specifics>
## Specific Ideas

- Workspace invitations will be handled via Clerk organizations in Phase 4 — this phase just establishes the users table foundation

</specifics>

<deferred>
## Deferred Ideas

- Organization membership webhook events — Phase 4
- Session tracking (last_sign_in) — not needed now
- Multi-workspace support (array of workspace_ids) — future consideration

</deferred>

---

*Phase: 03-users-table-webhook*
*Context gathered: 2026-01-23*
