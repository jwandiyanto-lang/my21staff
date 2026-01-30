# Phase 6: n8n Integration - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconnect Eagle's existing Google Sheets → n8n workflow to Convex, replacing the previous Supabase endpoint. This is a temporary bridge until Eagle's website connects directly to the CRM.

Scope: Create Convex HTTP endpoint, update n8n workflow URL, verify lead flow works.

</domain>

<decisions>
## Implementation Decisions

### Control & Flexibility
- We control both n8n workflow AND Convex endpoint — can update either as needed
- Match previous payload structure where possible, otherwise follow Excel template fields

### Duplicate Handling
- Skip if phone number already exists in contacts
- Return success response but note "already exists" (don't create duplicate)
- Merge feature is a separate future capability — not this phase

### Claude's Discretion
- Exact endpoint URL path (e.g., /n8n-leads or /webhook/n8n)
- Authentication approach (API key, shared secret, or none for now)
- Response format details
- Field mapping specifics based on existing schema

</decisions>

<specifics>
## Specific Ideas

- This is meant to be simple — reconnect what was working before
- Temporary solution until Eagle is fully onboarded as a client with direct website integration
- Don't over-engineer — it will be replaced

</specifics>

<deferred>
## Deferred Ideas

- Contact merge feature — future phase (combine duplicate contacts)
- Direct website → CRM integration — after Eagle onboarding

</deferred>

---

*Phase: 06-n8n-integration*
*Context gathered: 2026-01-24*
