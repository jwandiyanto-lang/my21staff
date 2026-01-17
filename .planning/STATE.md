# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Two-way WhatsApp messaging from the CRM — users can send and receive messages without switching apps.
**Current focus:** v1.11 — Lead Management Polish + Performance

## Current Position

Phase: 21 (Lead Management Polish + Performance) - IN PROGRESS
Plan: 21-05 complete, 2 remaining (21-06 to 21-07)
Status: Plan 21-05 executed - Conversations pagination added
Last activity: 2026-01-17 — Plan 21-05 complete

Progress: v1.10 ██████████ Complete & Deployed | v1.11 █████░░░░░ 21-05 done

## Performance Metrics

**Velocity:**
- Total plans completed: 28
- Average duration: 6 min
- Total execution time: 165 min (excludes manual config)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | 32 min | 11 min |
| 2. Database View | 3/3 | 22 min | 7 min |
| 3. Inbox Core | 3/3 | 17 min | 6 min |
| 4. Inbox Send | 1/1 | 10 min | 10 min |
| 5. Website Manager | 4/4 | 11 min | 3 min |
| 6. Kapso Live | 1/1 | 12 min | 12 min |
| 7. Landing Page | 3/3 | 20 min | 7 min |
| 8. Sea Lion + Kapso | 1/1 | manual | — |
| 13. Lead Management | 3/3 | 15 min | 5 min |
| 15. Pricing Page | 2/2 | interactive | — |
| 19. Performance & Security | 8/8 | 33 min | 4 min |

## Accumulated Context

### Roadmap Evolution

- Phase 13 added: Lead Management Enhancement (v1.5)
- Phase 14 added: Landing Page Refresh (v1.6)
- Phase 15 added: Pricing Page (v1.6)
- Phase 17 added: Inbox UI/UX Fixes (v1.7)
- Phase 18 added: Kapso Bot Setup & Verification (v1.8)
- Phase 19 added: Performance & Security (v1.9)
- Phase 20 added: Dashboard Stats & Notes Due Dates (v1.10)
- Phase 21 replanned: Lead Management Polish + Performance (v1.11)
- Phase 22 deferred: Direct Form to CRM + Telegram (v1.12)

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Recent (Phase 19):
- Centralized workspace auth: Single requireWorkspaceMembership function for all routes
- Production safeguard: DEV_MODE bypass requires NODE_ENV !== 'production'
- In-memory rate limiting: Simple sliding window for single Vercel instance
- PII masking: Inline helpers for phone masking in webhook logs
- Webhook signature verification: HMAC-SHA256 with X-Kapso-Signature header
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
- API key encryption: AES-256-GCM at rest with ENCRYPTION_KEY env var

Recent (Phase 21):
- WIB timezone utilities: Centralized timezone functions in src/lib/utils/timezone.ts
- Hardcoded UTC+7 offset: WIB doesn't observe daylight saving time
- Contacts pagination: Load more pattern (not page numbers) for better UX
- Client-side filtering: Filters apply to loaded contacts only (simpler implementation)
- Inline tags dropdown: Checkbox-style tag toggle with optimistic updates in database table
- Conversations pagination: Same load more pattern applied to inbox (50 per page)
- Combined time display: Activity items show relative + absolute time ("2 hours ago · Jan 17, 14:30")

### Deferred Issues

None — production deployment complete.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-17
Stopped at: Plan 21-05 complete (Conversations pagination)
Resume file: None
Next: Execute plan 21-06

## Deployment Info

**Production URL:** https://my21staff.vercel.app
**Vercel CLI:** Installed and linked
**Supabase Project:** my21staff (tcpqqublnkphuwhhwizx)

**Environment Variables (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_PRICING_WORKSPACE_ID (my21staff workspace)
- ENCRYPTION_KEY

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (CRM data)
