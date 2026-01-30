# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Production-ready application with multi-tenant admin, AI-powered WhatsApp responses, comprehensive lead management, team collaboration, support ticketing, and client-first trust-building features with complete bot configuration and real-time automation.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current State (v3.5 Partial — Pivoted)

**Production URL:** https://www.my21staff.com (live but incomplete)

**Convex Deployment:** https://intent-otter-212.convex.cloud

**v3.5 Status:** Partial completion (12/18 plans). User pivoted to new architectural approach mid-milestone.

**What was shipped in v3.5:**
- Production deployment at my21staff.com with custom domain and HTTPS
- Critical database bug fixes (status toggle data integrity restored)
- Workspace authentication patterns (slug→ID resolution)
- Historical WhatsApp data sync capability
- 10 production bugs resolved

**What was deferred from v3.5:**
- Live Kapso bot integration (webhooks never configured)
- 13 bugs remain unresolved (ARI Config, quick replies, merge contacts, UI polish)
- Bot stability monitoring never performed

**Previous milestones:**
- v3.4: Kapso Inbox Integration — Modern Inbox UI with AI configuration hot-reload
- v3.2: CRM Core Fresh — Complete rebuild on Convex, Supabase removed
- v3.1: Convex + Clerk API Layer — Authentication and data layer migration
- v3.0: Performance & Speed — 25.4x speedup with hybrid architecture

**Tech Stack (v3.5):**
- ~52,664 lines TypeScript total
- Next.js 15 + React 19
- Clerk (Authentication)
- Convex (Database + Real-time)
- Shadcn/ui + Tailwind CSS
- Kapso API for WhatsApp
- Resend for transactional email
- Grok API + Sea-Lion (Ollama) for AI

**First Client:** Eagle Overseas Education (production deployed, bot not live)

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
- ✓ **ARI database infrastructure** — 7 tables with workspace-scoped RLS — v2.2
- ✓ **Multi-LLM AI system** — Grok + Sea-Lion with deterministic A/B testing — v2.2
- ✓ **Lead scoring engine** — 0-100 with category breakdown: basic, qualification, documents, engagement — v2.2
- ✓ **Automated lead routing** — hot → consultation, warm → nurture, cold → community — v2.2
- ✓ **Consultation booking flow** — Indonesian day/time parsing and slot management — v2.2
- ✓ **Admin configuration UI** — "Your Intern" page with 5 tabs: Persona, Flow, Database, Scoring, Slots — v2.2
- ✓ **Performance baseline** — Vercel Speed Insights, API timing wrappers — v3.0
- ✓ **Supabase optimization** — Composite indexes, parallel queries, explicit column selection — v3.0
- ✓ **Convex spike** — 25.4x speedup validation (37ms vs 926ms P95) — v3.0
- ✓ **Decision gate** — Data-driven hybrid architecture decision — v3.0
- ✓ **Convex migration** — Schema, mutations, queries, HTTP actions, real-time subscriptions deployed — v3.0
- ✓ **Clerk authentication** — JWT template, user migration, organization migration — v3.1
- ✓ **n8n integration** — Convex webhook endpoint for Eagle lead flow — v3.1
- ✓ **Supabase removal** — Packages and code completely removed — v3.2
- ✓ **Contact Database** — Rebuilt fresh with merge functionality — v3.2
- ✓ **WhatsApp Inbox** — v2.0 filter bar with Active/All toggle, Status/Tags filters — v3.2
- ✓ **Dashboard** — Stats cards, activity feed, quick actions — v3.2
- ✓ **Settings** — Team management via Clerk OrganizationProfile — v3.2
- ✓ **Agent Skills Infrastructure** — Kapso agent-skills with 5 skill sets and MCP server — v3.4
- ✓ **Your Intern Debug** — Page loads without errors, error boundaries, dev mode bypass — v3.4
- ✓ **Global AI Toggle** — Master on/off control for bot behavior — v3.4
- ✓ **Inbox Modernization** — WhatsApp-first UI with status filtering — v3.4
- ✓ **Real-time Message Sync** — Convex subscriptions for instant updates — v3.4
- ✓ **AI/Human Handover** — Per-conversation toggle with mode indicators — v3.4
- ✓ **Configuration Hot-Reload** — Workspace config applied without restart — v3.4
- ✓ **Complete ARI Flow** — New lead → greeting → qualification → routing → booking — v3.4
- ✓ **Production deployment** — Live at my21staff.com with custom domain and HTTPS — v3.5
- ✓ **Localhost polish** — All /demo pages working, 5 Your Intern tabs functional — v3.5
- ✓ **Critical bug fixes** — Database data integrity (status toggle), inbox filters — v3.5 (partial)

### Active

**v4.0 Planning (New Approach):**
- [ ] Define new architectural direction (reason for v3.5 pivot)
- [ ] Complete deferred v3.5 bugs (13 remaining: ARI Config, quick replies, merge, UI polish)
- [ ] Live Kapso bot integration (webhooks, bot activation, monitoring)
- [ ] Payment Integration (Midtrans)
- [ ] AI Model Selection UI
- [ ] Kapso broadcasts for newsletter distribution
- [ ] Template message support (quick replies)
- [ ] Interactive button responses
- [ ] Broadcast messaging capability

### Out of Scope

- Visual workflow builder — future version
- WhatsApp template messages (24h rule) — requires Meta approval process
- Self-service onboarding — manual for now
- Billing/subscriptions — not needed yet
- Multi-user chat assignment — single user per workspace
- Google Calendar integration — future version
- Voice note transcription — future version
- Document upload handling — future version
- Video call support — use external platforms
- Complete Kapso Inbox replacement — using as UI pattern reference only
- WhatsApp Flows (multi-step forms) — requires Meta approval
- Voice agent integration — defer to v4.0+
- Custom bot training UI — Persona/Flow tabs sufficient

## Context

**The Message:** No system = Can't grow. I help you build that system.

**Target Users:** Indonesian SMEs who have leads everywhere but no system to manage them.

**Organizations (Clerk):**
- Eagle Overseas: `org_38fXP0PN0rgNQ2coi1KsqozLJYb` (first paying client)

**Known Issues (v3.5 Tech Debt):**
- 13 production bugs remain unresolved (ARI Config, quick replies, merge contacts, UI polish)
- Live bot never activated (webhooks not configured)
- Pre-existing TypeScript build error in convex/lib/auth.ts:61 (runtime unaffected)
- Your Intern tabs may be broken in production (ARI Config API fix deferred)
- No 24-hour stability monitoring performed

**v3.5 Pivot Context:**
- User decided to fundamentally change technical approach mid-milestone
- Work halted after 12 of 18 plans to start fresh with v4.0
- Production deployed but incomplete (partial feature parity)

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Clerk (Auth) + Convex (Data), Shadcn/ui, Tailwind CSS
- **Design System**: CRM uses cool green palette, Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp, Resend for email
- **AI Models**: Grok API + Sea-Lion (Ollama at 100.113.96.25:11434)
- **Deployment**: Vercel (blocked) + Convex Cloud (active)
- **Performance**: Convex achieves 37ms P95, 25.4x faster than Supabase
- **Architecture**: Database is single source of truth - Dashboard, Inbox, and all features MUST read from Database API (no parallel data stores)

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
| Convex migration (hybrid: Supabase auth + Convex data) | 25.4x faster (37ms vs 926ms P95) | ✓ Good — v3.0 achievement |
| Clerk authentication | Free tier, good React integration | ✓ Good — v3.1 migration |
| User ID mapping (Supabase UUID → Clerk ID) | Preserve data relationships | ✓ Good — smooth migration |
| Eagle-only org migration | Clerk free plan limit | ✓ Good — practical |
| Clean slate approach for v3.2 | Delete Supabase, rebuild fresh | ✓ Good — clean codebase |
| UI revert to v2.0 style | User preference for original design | ✓ Good — familiar UX |
| Webhook testing deferred to production | ngrok connectivity issues | — Pending production deployment |
| Agent-skills for progressive disclosure | Complex Kapso API needs contextual docs | ✓ Good — v3.4 pattern |
| MCP server at user scope | Available across all projects | ✓ Good — v3.4 setup |
| Two-level AI gating | Global + per-conversation control | ✓ Good — v3.4 feature |
| Configuration hot-reload via mutation | No caching, fresh on every call | ✓ Good — v3.4 pattern |
| Toast notifications for config saves | User feedback on state changes | ✓ Good — v3.4 UX |
| Dropdown status filter (reverted redesign) | User preference for original layout | ✓ Good — v3.4 decision |
| Database as single source of truth | All features (Dashboard, Inbox) derive from Database API | ✓ Good — v3.5 architecture |
| Remove assigned_to column | Simplify database view, remove unused staff management | ✓ Good — v3.5 simplification |
| Production deployment on Vercel | Billing freeze resolved, native Next.js support | ✓ Good — v3.5 deployment |
| Workspace slug→ID resolution pattern | Prevent mixing slugs and IDs in database queries | ✓ Good — v3.5 auth layer |
| Filter-then-paginate queries | Apply filters before pagination to avoid empty results | ✓ Good — v3.5 pattern |
| Z-index hierarchy (Base < Dropdowns < Overlays) | Prevent dropdown overlays from blocking sidebar clicks | ✓ Good — v3.5 UI pattern |
| Iterate queries for cache updates | TanStack Query setQueryData per query vs setQueriesData | ✓ Good — v3.5 bug fix |
| Pivot v3.5 mid-milestone | Fundamental architectural change needed | — Pending — v3.5 decision |

## Next Milestone: v4.0 (TBD — New Approach)

**Status:** Planning phase (v3.5 pivoted mid-stream)

**Reason for pivot:** User decided to fundamentally change the technical approach

**To be defined:**
- New architectural direction
- Requirements for v4.0
- Roadmap phases

**Deferred from v3.5:**
- Live Kapso bot integration (webhooks, activation, monitoring)
- 13 production bugs (ARI Config, quick replies, merge contacts, UI polish)
- Full feature parity verification

**Use `/gsd:new-milestone` to start v4.0 planning**

---
*Last updated: 2026-01-30 after v3.5 milestone completion (pivoted)*
