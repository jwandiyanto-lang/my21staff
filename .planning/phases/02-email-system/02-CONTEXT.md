# Phase 2: Email System (Resend) - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace broken SMTP with Resend HTTP API for email delivery. Includes team invitations, password reset, proper DNS authentication (SPF, DKIM, DMARC). Future notification types (ticketing, alerts) belong in other phases but should use the template foundation built here.

</domain>

<decisions>
## Implementation Decisions

### Email branding
- Include my21staff logo at the top of all emails
- From name: "Kia dari my21staff" (matches bot persona)
- From address: kia@my21staff.com
- Footer: Copyright + WhatsApp link + address (no tagline yet)

### Template style
- Styled HTML with brand colors from BRAND.md (green accent, dark text)
- Solid green CTA buttons (filled, not outline)
- Claude's Discretion: Email layout (centered card vs full width)

### Notification types
- Phase 2 scope: Team invitations + password reset
- Build shared base template for future email types (ticketing, etc.)
- Language: Detect from user's preference (browser/profile)

### Claude's Discretion
- Email body layout/width
- Whether to add expiry reminder for invitations
- Technical implementation of shared template architecture

</decisions>

<specifics>
## Specific Ideas

- "Kia dari my21staff" persona carries through from WhatsApp bot to email
- No tagline in footer yet — skip for now
- Build for reuse — Phase 4 ticketing will need email notifications

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-email-system*
*Context gathered: 2026-01-18*
