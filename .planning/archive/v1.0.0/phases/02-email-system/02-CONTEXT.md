# Phase 2: Email System + Member Onboarding - Context

**Gathered:** 2026-01-18
**Status:** Ready for research

<domain>
## Phase Boundary

Replace broken SMTP with Resend HTTP API for email delivery. Complete the member invitation flow end-to-end: from adding a member in the webapp, through invitation email, to onboarding them into the workspace.

Scope:
- Resend HTTP API integration (replacing nodemailer/SMTP)
- React Email templates (branded, reusable)
- Member addition UI (add member → send invite)
- Invitation acceptance flow (email → signup/login → join workspace)
- Member onboarding experience (first login, workspace context)
- DNS authentication (SPF, DKIM, DMARC)

Future notification types (ticketing, alerts) belong in other phases but should use the template foundation built here.

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

### Member onboarding
- New members can be added by workspace admins/owners
- Invitation email with magic link or signup link
- Graceful handling: invited email may already have account, or be new user
- First login shows workspace context (what they're joining, who invited them)

### Claude's Discretion
- Email body layout/width
- Whether to add expiry reminder for invitations
- Technical implementation of shared template architecture
- Onboarding UI flow (modal vs full page)

</decisions>

<specifics>
## Specific Ideas

- "Kia dari my21staff" persona carries through from WhatsApp bot to email
- No tagline in footer yet — skip for now
- Build for reuse — Phase 4 ticketing will need email notifications
- Consider: what happens if invited user already has account vs new user?
- Consider: invitation expiry and re-send capability

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

<issues>
## Issues Found During Testing (2026-01-18)

### 1. Language: English after landing page
**Priority:** UX preference
**Issue:** App UI uses Bahasa Indonesia in some places (forgot-password, reset-password, etc.)
**Fix:** All app UI should be in English. Landing page stays Indonesian for local market.

### 2. Forgot password email not arriving
**Priority:** P1
**Issue:** /forgot-password shows success but email never arrives
**Cause:** Uses Supabase's built-in `resetPasswordForEmail()` which sends via Supabase email (not Resend)
**Fix:** Either configure Supabase SMTP to use Resend, or build custom password reset flow with Resend

### 3. Resend/delete invitation returns "Unauthorized"
**Priority:** P0
**Issue:** Owner cannot resend or delete pending invitations - API returns 401 "Unauthorized"
**Location:** `src/app/api/invitations/[id]/route.ts`
**Cause:** Auth session not being passed correctly to server-side API route. The `supabase.auth.getUser()` returns null/error.
**Fix:** Debug why cookies aren't being read in this specific route. May be Next.js 15 cookies handling.

</issues>

---

*Phase: 02-email-system*
*Context updated: 2026-01-18*
