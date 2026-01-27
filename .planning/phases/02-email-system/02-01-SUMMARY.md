---
phase: 02-email-system
plan: 01
subsystem: api
tags: [resend, react-email, email, invitations]

# Dependency graph
requires:
  - phase: 01-brand-guidelines
    provides: Brand colors and logo assets for email templates
provides:
  - Resend HTTP API integration for email delivery
  - React Email base layout with my21staff branding
  - InvitationEmail template in Bahasa Indonesia
  - sendInvitationEmail typed function
affects: [02-02-member-onboarding, password-reset, notifications]

# Tech tracking
tech-stack:
  added: ["@react-email/components@1.0.4"]
  removed: ["nodemailer@7.0.12", "@types/nodemailer@7.0.5"]
  patterns:
    - "Lazy-loaded Resend client (getResend) for build-time safety"
    - "React Email templates in src/emails/ with components/"

key-files:
  created:
    - src/lib/email/resend.ts
    - src/lib/email/send.ts
    - src/emails/components/base-layout.tsx
    - src/emails/invitation.tsx
    - public/logo.png
  modified:
    - src/app/api/invitations/route.ts
    - src/app/api/invitations/[id]/route.ts
    - package.json
  deleted:
    - src/lib/email/transporter.ts

key-decisions:
  - "Use lazy-loaded Resend client (getResend function) to avoid build-time errors when env var not set"
  - "Green CTA button (bg-brand-forest) per BRAND.md contrast guidelines"
  - "From: 'Kia dari my21staff' to match WhatsApp bot persona"

patterns-established:
  - "Email templates: src/emails/{type}.tsx using BaseLayout wrapper"
  - "Email sending: src/lib/email/send.ts with typed functions per email type"
  - "Lazy client initialization for services requiring API keys"

# Metrics
duration: 4min
completed: 2026-01-18
---

# Phase 02 Plan 01: Resend Email Infrastructure Summary

**Resend HTTP API replacing broken nodemailer/SMTP, React Email templates with my21staff branding, invitation flow wired and build passing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-18T08:34:33Z
- **Completed:** 2026-01-18T08:38:14Z
- **Tasks:** 2
- **Files modified:** 9 (6 created, 2 modified, 1 deleted)

## Accomplishments

- Replaced nodemailer SMTP with Resend HTTP API for reliable serverless email delivery
- Created branded React Email templates with base layout component
- InvitationEmail template in Bahasa Indonesia with green CTA button
- Both invitation APIs (create and resend) now use new email system
- Build passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Setup Resend client and React Email infrastructure** - `d5a9539` (feat)
2. **Task 2: Create invitation email template and wire to API** - `d6923fb` (feat)

## Files Created/Modified

- `src/lib/email/resend.ts` - Resend client singleton with lazy loading
- `src/lib/email/send.ts` - Typed sendInvitationEmail function
- `src/emails/components/base-layout.tsx` - Shared email layout with logo and footer
- `src/emails/invitation.tsx` - Team invitation email template
- `public/logo.png` - Logo for email embedding (copied from brand assets)
- `src/app/api/invitations/route.ts` - Updated import to new email system
- `src/app/api/invitations/[id]/route.ts` - Updated import for resend functionality
- `package.json` - Added @react-email/components, removed nodemailer

## Decisions Made

1. **Lazy-loaded Resend client** - Build was failing because RESEND_API_KEY isn't available at build time. Changed from exported singleton to getResend() function that initializes on first call.

2. **Green CTA button** - Per BRAND.md, orange fails contrast for small text. Used bg-brand-forest (green) for the "Terima Undangan" button.

3. **"Kia dari my21staff" sender** - Matches the WhatsApp bot persona per CONTEXT.md branding decisions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed second API route import**
- **Found during:** Task 2 (build verification)
- **Issue:** `/api/invitations/[id]/route.ts` also imported from old transporter.ts, breaking build
- **Fix:** Updated import to `@/lib/email/send`
- **Files modified:** src/app/api/invitations/[id]/route.ts
- **Verification:** Build passes
- **Committed in:** d6923fb (Task 2 commit)

**2. [Rule 3 - Blocking] Made Resend client lazy-loaded**
- **Found during:** Task 2 (build verification)
- **Issue:** Build failed with "RESEND_API_KEY is not set" because module-level initialization runs during static page generation
- **Fix:** Changed from exported `resend` constant to `getResend()` function
- **Files modified:** src/lib/email/resend.ts, src/lib/email/send.ts
- **Verification:** Build passes
- **Committed in:** d6923fb (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to pass build. No scope creep.

## Issues Encountered

None beyond the auto-fixed blocking issues documented above.

## User Setup Required

**External services require manual configuration.**

Before invitation emails will work in production:

1. **Add RESEND_API_KEY to Vercel:**
   - Get API key from [Resend Dashboard](https://resend.com) -> API Keys -> Create API Key
   - Add to Vercel project environment variables

2. **Verify domain in Resend (for kia@my21staff.com):**
   - Add domain in Resend Dashboard -> Domains
   - Add required DNS records (SPF, DKIM)
   - Wait for verification

**Verification command:**
```bash
# After setting RESEND_API_KEY locally:
npm run dev
# Then test invitation from admin panel
```

## Next Phase Readiness

- Email infrastructure complete and build passes
- Ready for Plan 02 (Member Onboarding UI) or Plan 03 (Password Reset Email)
- User setup (RESEND_API_KEY + domain verification) required before production testing

---
*Phase: 02-email-system*
*Completed: 2026-01-18*
