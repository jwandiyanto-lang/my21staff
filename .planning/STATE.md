# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** The system that lets you grow — lead management, follow-up automation, guided by real business experience.
**Current focus:** v2.1 Client Launch Ready — First paying client onboarding

## Current Position

Phase: 3 of 9 — Workspace Roles Enhancement
Plan: 02 of 03 complete
Status: In progress
Last activity: 2026-01-18 — Completed 03-02-PLAN.md (Permission API Enforcement)

Progress: v1.0 ██████████ Shipped | v2.0 ██████████ Shipped | v2.1 █████░░░░░ Phase 1-2 + Plans 3.1-3.2 Complete

## Performance Metrics

**Velocity:**
- Total plans completed: 59 (14 in v1.0 + 38 in v2.0 + 7 in v2.1)
- v2.0 timeline: 4 days (Jan 14 → Jan 18)
- Commits: 325 in v2.0, 23 in v2.1

**Codebase:**
- Lines: 23,856 TypeScript
- Files: 125 TypeScript files
- Phases: 22 complete (Phase 18 skipped)

## Accumulated Context

### Roadmap Evolution

**v1.0 (Phases 1-5):** Foundation, Database, Inbox, Send, Website Manager
**v2.0 (Phases 6-22):** Kapso Live, Landing, AI, Deployment, Admin, Lead Polish, Security, Dashboard, Settings

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key v2.0 decisions:
- Centralized workspace auth (requireWorkspaceMembership)
- In-memory rate limiting (single Vercel instance)
- HMAC-SHA256 webhook verification
- AES-256-GCM API key encryption
- Direct user creation for team invitations
- Phone E.164 normalization

Key v2.1 decisions:
- Resend HTTP API for email (replaces broken nodemailer/SMTP)
- Lazy-loaded Resend client (getResend) for build-time safety
- React Email templates in src/emails/
- Permission utilities in src/lib/permissions/ (types, constants, check)
- SECURITY DEFINER function in private schema for RLS performance
- requireWorkspaceMembership extended to return role
- API permission guard pattern: requirePermission(role, 'perm'); if (err) return err

### Deferred Issues

- Phase 18 (Kapso Bot Setup) → v2.1
- ~~SMTP email delivery from Vercel (DNS issues)~~ → Fixed in 02-01 with Resend

### Known Issues (Phase 2)

- Forgot password email uses Supabase email, not Resend (P1)
- ~~Resend/delete invitation returns 401 unauthorized (P0)~~ — Fixed in 03-02 (was using wrong auth check)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 03-02-PLAN.md (Permission API Enforcement)
Resume file: None
Next: 03-03-PLAN.md (Team Management UI)

## Deployment Info

**Production URL:** https://my21staff.vercel.app
**Vercel CLI:** Installed and linked
**Supabase Project:** my21staff (tcpqqublnkphuwhhwizx)

**Environment Variables (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_PRICING_WORKSPACE_ID
- ENCRYPTION_KEY

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (CRM data)

---
*Last updated: 2026-01-18 — Plan 03-02 complete (Permission API Enforcement)*
