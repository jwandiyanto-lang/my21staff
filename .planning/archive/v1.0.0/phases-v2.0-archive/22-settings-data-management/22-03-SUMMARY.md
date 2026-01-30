---
phase: 22-settings-data-management
plan: 03
subsystem: team
tags: [invitations, smtp, nodemailer, supabase-admin, magic-link]

# Dependency graph
requires:
  - phase: 22-settings-data-management
    plan: 01
    provides: Settings page structure with Team tab
provides:
  - Team invitation API with direct user creation
  - Set-password page for new team members
  - SMTP email transporter for invitation emails
  - Recovery link generation via Supabase admin API
affects: [team-management, authentication]

# Tech tracking
tech-stack:
  added: [nodemailer]
  patterns: [direct-user-creation, recovery-link, lazy-transporter]

key-files:
  created:
    - src/app/(auth)/set-password/page.tsx
    - supabase/migrations/19_workspace_invitations.sql
    - src/lib/email/transporter.ts
  modified:
    - src/app/api/invitations/route.ts
    - src/app/api/invitations/[id]/route.ts
    - src/app/(dashboard)/[workspace]/settings/settings-client.tsx

key-decisions:
  - "Direct user creation: Use auth.admin.createUser() with email_confirm: true"
  - "Recovery link: Generate via auth.admin.generateLink() for password setup"
  - "Lazy transporter: Create nodemailer transport at runtime, not module load"
  - "SMTP deferred: SMTP configuration issues to be resolved in next milestone"

patterns-established:
  - "Team invitation flow: create user -> generate recovery link -> send email -> set password -> accept invitation"
  - "Supabase admin API: Use service role for user creation and link generation"

# Metrics
duration: interactive
completed: 2026-01-18
status: partial
---

# Phase 22 Plan 03: Team Invitation System Summary

**Team invitation with direct user creation and recovery links**

## Performance

- **Duration:** Interactive session
- **Started:** 2026-01-17
- **Completed:** 2026-01-18 (code complete, SMTP deferred)
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- POST /api/invitations creates users directly via Supabase admin API
- Recovery links generated for password setup (no Supabase confirmation email)
- New /set-password page for invited team members
- Improved error handling with detailed messages
- Debug logging for SMTP configuration
- Delete and resend functionality for pending invitations

## Deferred
- SMTP email configuration on Vercel (DNS resolution issues)
- To be resolved in next milestone

## Files Created/Modified
- `src/app/(auth)/set-password/page.tsx` - Password setup page for new members
- `src/lib/email/transporter.ts` - Nodemailer SMTP transporter with lazy init
- `src/app/api/invitations/route.ts` - Create invitation with direct user creation
- `src/app/api/invitations/[id]/route.ts` - Resend/delete with recovery links

## Decisions Made
- Skip Supabase email confirmation by using createUser with email_confirm: true
- Generate recovery links for password setup flow
- Lazy transporter initialization to ensure env vars are available at runtime
- Hardcoded SMTP settings (smtp.hostinger.com:465 SSL) for reliability

## UAT Results
- 5/6 tests passed
- 1 test skipped (delete team member - requires member to be added first)
- SMTP issues prevent full end-to-end testing

---
*Phase: 22-settings-data-management*
*Completed: 2026-01-18 (partial - SMTP deferred)*
