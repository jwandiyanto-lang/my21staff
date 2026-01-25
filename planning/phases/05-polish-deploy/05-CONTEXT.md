# Phase 5: Polish + Deploy - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Final verification and production deployment for v3.2 CRM rebuild. Test that rebuilt inbox works with live Kapso webhooks before deploying.

</domain>

<decisions>
## Implementation Decisions

### Webhook Testing Approach
- Use ngrok tunnel to expose localhost for Kapso webhooks
- Install ngrok via npm (`npm install ngrok` as dev dependency)
- Create public URL pointing to localhost:3000

### Test Scope
- Full round-trip messaging: receive WhatsApp messages, view in inbox, reply, verify delivery
- Both directions must work before considering inbox "verified"

### Claude's Discretion
- Exact ngrok configuration and setup steps
- Whether to use Kapso sandbox or live API
- Error handling and retry logic during testing
- Cleanup of ngrok after testing complete

</decisions>

<specifics>
## Specific Ideas

- User wants to verify inbox works with real Kapso integration before deploying to production
- localhost testing preferred before production deployment

</specifics>

<deferred>
## Deferred Ideas

- Deployment strategy (existing Vercel project vs fresh) — discuss in later session
- Environment variable cleanup — discuss in later session
- Post-deploy monitoring — discuss in later session

</deferred>

---

*Phase: 05-polish-deploy*
*Context gathered: 2026-01-25*
