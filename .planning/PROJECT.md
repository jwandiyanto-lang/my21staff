# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Production-ready application with multi-tenant admin, AI-powered WhatsApp responses, comprehensive lead management, team collaboration, support ticketing, and client-first trust-building features.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current Milestone: v3.0 Performance & Speed

**Goal:** Achieve sub-500ms P95 response times through Convex spike evaluation and potential hybrid migration (Supabase auth + Convex data).

**Target outcomes:**
- Page load time < 2 seconds (P95)
- API response time < 500ms (P95)
- Query count per page < 5 queries
- Real-time updates without polling
- Crisp webhooks and smooth database operations

**Approach:**
1. Convex spike — convert `/api/contacts/by-phone` to Convex, compare performance
2. If Convex wins decisively: hybrid migration (keep Supabase auth, use Convex for data)
3. If comparable: apply Supabase optimizations (nested queries, indexes, column selection)
4. End state: Production CRM that's "crystal clear" and snappy

**Current problem:** 2-6 second response times (sometimes 9+ seconds) despite matching Vercel + Supabase regions.

## Previous State (v2.2)

**Production URL:** https://my21staff.com (Vercel)

**First Client:** Eagle Overseas Education (onboarding ready)

**Shipped in v2.2:**
- ARI database infrastructure (7 tables with workspace-scoped RLS)
- Multi-LLM AI system with Grok + Sea-Lion and deterministic A/B testing
- Lead scoring engine (0-100 with category breakdown)
- Automated lead routing (hot → consultation, warm → nurture, cold → community)
- Consultation booking flow with Indonesian day/time parsing
- Admin configuration UI ("Your Intern" page with 5 tabs)

**Shipped in v2.1:**
- Brand guidelines, email via Resend, role-based permissions
- 4-stage support ticketing with central hub
- Security info page, landing page redesign
- TanStack Query caching, Kapso bot setup

**Tech Stack:**
- ~43,000 lines TypeScript
- Next.js 15 + React 19
- Supabase (PostgreSQL + Auth + RLS)
- Shadcn/ui + Tailwind CSS
- Kapso API for WhatsApp
- Resend for transactional email
- TanStack Query v5 for client caching

## Requirements

### Validated

- ✓ **Database View** — Lead table with form submissions, status badges, filters, detail sheet — v1.0
- ✓ **Kapso Send + Filter** — Send messages via Kapso API, load message history, status filtering, optimistic UI — v1.0
- ✓ **Website Manager** — CMS for articles/webinars, public pages, registration flows creating contacts — v1.0
- ✓ **Production deployment** — Live at my21staff.vercel.app with real Supabase — v2.0
- ✓ **Multi-tenant admin** — Client management, dummy credentials, first-login password change — v2.0
- ✓ **AI-powered responses** — Sea Lion LLM via Kapso for WhatsApp auto-replies — v2.0
- ✓ **Lead management polish** — Editable fields, tags, AI handover toggle, pagination — v2.0
- ✓ **Security hardening** — Rate limiting, input validation, webhook verification, API key encryption — v2.0
- ✓ **Dashboard** — Client stats (total, today, week, month), tag analytics — v2.0
- ✓ **Task management** — Notes with due dates, completion tracking — v2.0
- ✓ **CSV import/export** — Contacts and notes with validation and duplicate detection — v2.0
- ✓ **Team invitations** — Direct user creation with recovery links — v2.0
- ✓ **Pricing form leads** — Public API endpoint for pricing form → CRM — v2.0
- ✓ **Brand Guidelines Document** — Logo rules, colors, typography, voice & tone — v2.1
- ✓ **Email System** — Resend HTTP API for invitation emails — v2.1
- ✓ **Workspace Ownership & Roles** — Owner permissions, member management — v2.1
- ✓ **Support Page** — Full ticketing system (Report → Discuss → Outcome → Implementation) — v2.1
- ✓ **Central Support Hub** — Cross-workspace ticketing, client portal, image attachments — v2.1
- ✓ **Security Info Page** — Data storage, protection methods — v2.1
- ✓ **Landing Page Redesign** — Mobile-friendly, conversion-focused — v2.1
- ✓ **Performance Optimization** — TanStack Query caching, loading skeletons — v2.1
- ✓ **WhatsApp Bot Setup** — Eagle's number via Kapso, Ari persona — v2.1

### Active

**Performance & Speed (v3.0):**
- [x] Convex spike — convert `/api/contacts/by-phone` and compare performance
- [x] Decision gate — compare Convex vs optimized Supabase response times
- [x] Convex migration: hybrid architecture (Supabase auth + Convex data layer)
- [x] Complete Convex schema with all Supabase fields
- [x] Create Convex mutations and query functions
- [x] Implement Kapso webhook HTTP action
- [x] Update Next.js API routes to use Convex
- [x] Update inbox to use Convex real-time subscriptions
- [x] Deploy Convex and verify performance
- [ ] Production performance monitoring (Web Vitals dashboard)
- [ ] Target: sub-500ms P95 response times (met in spike: 37ms P95)

### Out of Scope

- Payment Integration (Midtrans) — deferred to v3.1, focus on speed first
- AI Model Selection UI — deferred to v3.1
- Visual workflow builder — future version
- WhatsApp template messages (24h rule) — requires Meta approval process
- Self-service onboarding — manual for now
- Billing/subscriptions — not needed yet
- Multi-user chat assignment — single user per workspace
- Google Calendar integration — future version
- Voice note transcription — future version
- Document upload handling — future version
- Video call support — use external platforms

## Context

**The Message:** No system = Can't grow. I help you build that system.

**Target Users:** Indonesian SMEs who have leads everywhere but no system to manage them.

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (first paying client)

**Known Issues (Deferred):**
- Forgot password still uses Supabase email (not Resend)
- Resend/delete invitation has auth bug
- In-memory rate limiting won't scale multi-instance

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Supabase (Auth) + potentially Convex (data), Shadcn/ui, Tailwind CSS
- **Design System**: CRM uses cool green palette, Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp, Resend for email
- **AI Models**: Grok API + Sea-Lion (Ollama at 100.113.96.25:11434)
- **Deployment**: Vercel (single instance)
- **Performance**: Must achieve sub-500ms P95 response times

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild in new folder (v2) | Clean slate while preserving v1 reference | ✓ Good — clean codebase |
| 3 features only for v2 | Focus over feature creep | ✓ Good — all 3 shipped |
| Kapso over official WhatsApp API | Already integrated in v1, simpler | ✓ Good — working integration |
| Dev mode bypass for local testing | Test without Supabase/Kapso setup | ✓ Good — fast iteration |
| Multi-env Supabase via SUPABASE_ENV | Switch dev/prod with one variable | ✓ Good — flexible |
| Centralized workspace auth | Single requireWorkspaceMembership function | ✓ Good — consistent security |
| Production safeguard for DEV_MODE | Requires NODE_ENV !== 'production' | ✓ Good — safe defaults |
| In-memory rate limiting | Simple sliding window for single instance | ⚠️ Revisit — won't scale multi-instance |
| HMAC-SHA256 webhook verification | Kapso signature validation | ✓ Good — secure webhooks |
| AES-256-GCM API key encryption | Encrypt at rest with ENCRYPTION_KEY | ✓ Good — secure storage |
| WIB timezone utilities | Hardcoded UTC+7 (no daylight saving) | ✓ Good — simple, correct |
| Load more pagination | Better UX than page numbers | ✓ Good — smoother experience |
| Direct user creation for invites | Supabase admin API + recovery links | ✓ Good — bypasses email issues |
| Phone E.164 normalization | Indonesian 0812 → +6281 | ✓ Good — consistent data |
| Resend over SMTP | HTTP API more reliable than DNS-dependent SMTP | ✓ Good — v2.1 fix |
| TanStack Query for caching | Stale-while-revalidate for instant navigation | ✓ Good — v2.1 perf |
| 4-stage ticket workflow | Trust-building with clear progress | ✓ Good — v2.1 feature |
| Central support hub | All client tickets → my21staff workspace | ✓ Good — v2.1 feature |
| Convex migration (hybrid: Supabase auth + Convex data) | 25.4x faster (37ms vs 926ms P95) | ✓ Good — proceed with IMPL-01 through IMPL-06 |

---
*Last updated: 2026-01-20 after v3.0 milestone initialized*
