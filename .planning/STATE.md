# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** The system that lets you grow — lead management, follow-up automation, guided by real business experience.
**Current focus:** v2.1 Client Launch Ready — First paying client onboarding

## Current Position

Phase: 5 of 9 — Central Support Hub (VERIFIED ✓)
Plan: 06 of 06 complete
Status: Human verification passed
Last activity: 2026-01-19 — Phase 5 verified (ticket routing confirmed)

Progress: v1.0 ██████████ Shipped | v2.0 ██████████ Shipped | v2.1 ██████████ Phase 5 complete

## Performance Metrics

**Velocity:**
- Total plans completed: 73 (14 in v1.0 + 38 in v2.0 + 21 in v2.1)
- v2.0 timeline: 4 days (Jan 14 → Jan 18)
- Commits: 325 in v2.0, 52 in v2.1

**Codebase:**
- Lines: ~24,500 TypeScript
- Files: ~136 TypeScript files
- Phases: 23 complete (Phase 18 skipped)

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
- PermissionButton with disabled:pointer-events-auto for tooltip accessibility
- Owner role protected from change (contact support for ownership transfer)
- CHECK constraints over ENUM types for ticket category/priority/stage (flexibility)
- Subquery RLS pattern for joined tables (comments/history via tickets)
- Ticket state machine in src/lib/tickets/ (types, transitions, tokens)
- HMAC tokens reuse ENCRYPTION_KEY (TICKET_TOKEN_SECRET fallback)
- Ticket permissions: tickets:assign, tickets:transition, tickets:skip_stage
- Ticket API routes follow contacts pattern (fetch ticket, then verify workspace membership)
- Dual-mode reopen (HMAC token for email links, authenticated for logged-in users)
- One-time reopen tokens (cleared after successful reopen)
- react-hook-form for ticket creation form validation
- Type casting for Supabase joins (as unknown as Type) when Relationships missing
- Ticket email templates (created/updated/closed) with Resend
- pg_cron auto-close job for stale implementation tickets (7 days)
- Email participants = requester + unique commenters
- Cross-workspace RLS: Check private.get_user_role_in_workspace(admin_workspace_id) IN ('owner', 'admin')
- Support config module: Centralized constants at src/lib/config/support.ts
- admin_workspace_id nullable for workspace-internal vs routed tickets
- supabase migration repair for syncing migration history
- Private storage bucket with RLS for ticket attachments (not public bucket)
- Storage path format: {ticket_id}/{timestamp}-{sanitized_filename}
- Portal APIs filter by requester_id for client isolation (no workspace membership check)
- Internal comment filtering: or('is_internal.is.null,is_internal.eq.false')
- Dual workspace access check: membership in workspace_id OR admin_workspace_id
- Source filter tabs only shown when client tickets exist in list
- Portal layout: header-only (no sidebar), auth check in layout.tsx
- Client portal isolation: requester_id filter for all queries
- Custom Tawk.to integration via script injection (React 19 compatible, avoiding tawkto-react peer dependency)

### Deferred Issues

- Phase 18 (Kapso Bot Setup) → v2.1
- ~~SMTP email delivery from Vercel (DNS issues)~~ → Fixed in 02-01 with Resend

### Known Issues (Phase 2)

- Forgot password email uses Supabase email, not Resend (P1)
- ~~Resend/delete invitation returns 401 unauthorized (P0)~~ — Fixed in 03-02 (was using wrong auth check)
- Website content tables (articles, webinars) not in remote DB — manual types added (P2)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed 05-06-PLAN.md (Tawk.to Widget Integration) - Phase 5 complete
Resume file: None
Next: Phase 6 (plans to be created)

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
*Last updated: 2026-01-19 — Phase 05 complete (Central Support Hub, 6/6 plans)*
