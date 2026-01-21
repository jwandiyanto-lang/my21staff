# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Sub-500ms P95 response times — a CRM that feels instant
**Current focus:** v3.0 Performance & Speed

## Current Position

Phase: 3 - Convex Spike
Plan: 04 of 5
Status: In progress
Last activity: 2026-01-21 — Completed 03-04-PLAN.md (Convex HTTP Actions)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 █████████░ (117 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 117 (14 in v1.0 + 38 in v2.0 + 30 in v2.1 + 23 in v2.2 + 12 in v3.0)
- v2.2 timeline: 1 day (Jan 20)
- Commits: 325 in v2.0, 282 in v2.1

**Codebase:**
- Lines: ~43,200 TypeScript
- Phases completed: 32 total (v1.0: 5, v2.0: 16, v2.1: 9, v2.2: 6, v3.0: 4)

## Accumulated Context

### Roadmap Evolution

**v1.0 (Phases 1-5):** Foundation, Database, Inbox, Send, Website Manager
**v2.0 (Phases 6-22):** Kapso Live, Landing, AI, Deployment, Admin, Lead Polish, Security, Dashboard, Settings
**v2.1 (Phases 1-9):** Brand, Email, Roles, Support, Central Hub, Security Page, Landing Redesign, Performance, Kapso Bot
**v2.2 (Phases 1-6):** Database/Inbox, ARI Core, Scoring, Scheduling, Admin
**v3.0 (Phases 1-5):** Instrumentation, Supabase Optimization, Convex Spike, Decision Gate, Implementation

### v3.0 Performance Context

**Current problem:** 2-6 second response times (sometimes 9+ seconds) despite matching Vercel + Supabase regions.

**Root causes identified (research):**
- `/api/contacts/by-phone` has 4 sequential queries
- `/dashboard/page.tsx` runs 7-8 sequential queries
- Missing composite indexes on hot paths
- RLS policies use per-row subqueries
- Active polling instead of real-time subscriptions

**Target outcomes:**
- Page load time < 2 seconds (P95)
- API response time < 500ms (P95)
- Query count per page < 5 queries
- Real-time updates without polling

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key v3.0 decisions:
- Use console.log for timing output (no external logging library needed)
- Instrument before optimizing (measure first)
- Supabase optimization and Convex spike run in parallel
- Data-driven decision gate before implementation
- Hybrid architecture viable (Supabase auth + Convex data)
- Manual baseline capture: wait 24-48 hours for production traffic before filling metrics
- Supabase JWT provider using customJwt with JWKS endpoint verification
- Schema migration with supabaseId field for reference tracking
- Timestamps stored as numbers (Unix ms) in Convex
- Use @convex-dev/auth for getAuthUserId integration with Supabase JWT
- All Convex queries must call requireWorkspaceMembership() for authorization
- Use parallel Promise.all for non-dependent queries to optimize performance
- Convex HTTP actions use CRM_API_KEY for authentication (spake), JWT in production

### Deferred Issues

- Forgot password email uses Supabase email, not Resend (P1)
- Resend/delete invitation auth bug
- In-memory rate limiting won't scale multi-instance
- Payment integration (Midtrans) -> v3.1
- AI model selection UI -> v3.1

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-21
Stopped at: Completed 03-04-PLAN.md (Convex HTTP Actions)
Resume file: None
Next: 03-03-PLAN.md (Benchmark Convex vs Supabase)

## Deployment Info

**Production URL:** https://my21staff.com
**Vercel CLI:** Installed and linked
**Supabase Project:** my21staff (tcpqqublnkphuwhhwizx)
**Convex Project:** intent-otter-212

**Environment Variables (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_PRICING_WORKSPACE_ID
- ENCRYPTION_KEY
- GROK_API_KEY (needed for ARI)

**Environment Variables (Convex):**
- NEXT_PUBLIC_SUPABASE_URL

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (first paying client, ARI pilot)

**AI Models:**
- Sea-Lion: http://100.113.96.25:11434 (Ollama, via Tailscale)
- Grok: API access available (requires GROK_API_KEY)

---
*Last updated: 2026-01-21 — Completed 03-04-PLAN.md (Convex HTTP Actions)*
