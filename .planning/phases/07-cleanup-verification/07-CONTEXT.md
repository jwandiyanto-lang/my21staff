# Phase 7: Cleanup + Verification - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all Supabase code, packages, and configuration from the codebase. Migrate file storage to Convex. Verify the complete Convex + Clerk stack works end-to-end with Eagle's production data.

</domain>

<decisions>
## Implementation Decisions

### Verification scope
- Claude decides verification scope based on codebase analysis
- Test with real data (Eagle's CRM contacts, messages, n8n flow)
- Manual checklist approach (no automated scripts)
- Fix issues as they're discovered during cleanup (don't block on pre-verification)

### Cleanup approach
- Remove all Supabase code in a single commit (code, packages, env vars together)
- File attachments migrate to new storage (not left broken)
- Supabase project kept dormant after migration (don't delete from dashboard)

### Claude's Discretion
- Specific verification checklist items
- File storage solution (Convex file storage vs Cloudflare R2)
- Order of cleanup operations within the single commit
- Which env vars to remove from Vercel vs keep commented

</decisions>

<specifics>
## Specific Ideas

- Real data testing means actually using Eagle's inbox, sending test messages through n8n flow
- "Fix as we go" means cleanup can proceed even if minor issues found — address them in the same phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-cleanup-verification*
*Context gathered: 2026-01-24*
