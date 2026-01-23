# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** The system that lets you grow
**Current focus:** v3.1 Full Convex + Clerk

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-01-23 — Milestone v3.1 started

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ (147 plans shipped)

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

**Phase 2 (Supabase Optimization) Results:**
- P50: 504ms, P95: 926ms — improved but still > 500ms target

**Phase 3 (Convex Spike) Results:**
- Convex API P50: 23ms, P95: 37ms — **25.4x faster** than Supabase
- Convex meets < 500ms target with significant margin

**Phase 4 (Decision Gate) Result:**
- **Decision:** Hybrid architecture (Supabase auth + Convex data)
- **Rationale:** 25.4x faster at P95 (37ms vs 926ms)

**Phase 5 (Implementation) Result:**
- Convex deployed to https://intent-otter-212.convex.cloud
- API routes migrated to use Convex queries/mutations
- Real-time subscriptions working
- **Webhook POST handler added** — code complete, deployment pending (Vercel environment)
- **Kapso URL update pending** — manual step after deployment confirmed

**Target outcomes:**
- Page load time < 2 seconds (P95)
- API response time < 500ms (P95)
- Query count per page < 5 queries
- Real-time updates without polling
- Crisp webhooks and smooth database operations

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key v3.0 decisions:
- Use console.log for timing output (no external logging library needed)
- Instrument before optimizing (measure first)
- Supabase optimization and Convex spike run in parallel
- Data-driven decision gate before implementation
- Hybrid architecture viable (Supabase auth + Convex data)
- Manual baseline capture: wait 24-48 hours for production traffic before filling metrics
- Convex migration (hybrid: Supabase auth + Convex data) — 25.4x faster (37ms vs 926ms P95)
- Use v.optional(v.any()) for metadata fields (ARI scores, reply context, user preferences)
- Snake_case naming in Convex to match Supabase for migration consistency
- by_assigned index for contact assignment filtering
- Hard delete for contacts (no soft delete) - fresh start without Supabase complexity
- Phone normalization removes non-digits for consistent WhatsApp matching
- Upsert pattern for webhook idempotency prevents duplicate data on retry
- Client-side filtering for search queries (works for moderate datasets, optimize later if needed)
- Tag filtering done client-side (tags on contacts, conversations on separate table)
- Assignment filter supports 'unassigned' special value alongside user_id
- Active count calculated from filtered results instead of separate query call
- Parallel contact fetching via Promise.all for efficient rendering
- Webhook POST handler with HMAC-SHA256 signature verification

### Deferred Issues

- Forgot password email uses Supabase email (not Resend)
- Resend/delete invitation auth bug
- In-memory rate limiting won't scale multi-instance
- Kapso webhook URL update — manual step to update Kapso dashboard
- Legacy Next.js webhook route cleanup — after verification complete
- ARI integration still uses Supabase for config queries — to be migrated
- Payment integration (Midtrans) — v3.1
- AI model selection UI — v3.1

### Blockers/Concerns

None.

## Deployment Info

**Production URL:** https://my21staff.com
**Vercel CLI:** Installed and linked
**Supabase Project:** my21staff (tcpqqublnkphuwhhwizx)

**Convex Project:** pleasant-antelope-109 (https://pleasant-antelope-109.convex.cloud)

**Environment Variables (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_CONVEX_URL (https://pleasant-antelope-109.convex.cloud)
- CONVEX_DEPLOY_KEY
- NEXT_PUBLIC_PRICING_WORKSPACE_ID
- ENCRYPTION_KEY
- GROK_API_KEY (needed for ARI)

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (first paying client)

**AI Models:**
- Sea-Lion: http://100.113.96.25:11434 (Ollama, via Tailscale)
- Grok: API access available (requires GROK_API_KEY)

---
*Last updated: 2026-01-23 — Milestone v3.1 started, researching*
