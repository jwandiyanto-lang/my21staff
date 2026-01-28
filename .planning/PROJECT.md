# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Production-ready application with multi-tenant admin, AI-powered WhatsApp responses, comprehensive lead management, team collaboration, support ticketing, and client-first trust-building features with complete bot configuration and real-time automation.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current State (v3.4 Shipped)

**Production URL:** https://my21staff.com (blocked — Vercel billing freeze)

**Convex Deployment:** https://intent-otter-212.convex.cloud

**Shipped in v3.4:**
- Agent Skills Infrastructure — Kapso agent-skills with 5 skill sets and MCP server
- Your Intern Admin Interface — Global AI toggle, error boundaries, 5 config tabs working
- Inbox Modernization — WhatsApp-first UI with status filtering, real-time sync, AI/Human toggle per conversation
- Configuration Hot-Reload — Complete ARI flow with workspace config applied on every message without restart
- Two-Level AI Gating — Global toggle (ariConfig.enabled) + per-conversation toggle (conversation.status)
- End-to-End Automation — New lead → AI greeting → qualification → routing → consultation booking complete

**Shipped in v3.2:**
- Supabase completely removed (packages + code)
- Contact Database rebuilt fresh with merge functionality
- WhatsApp Inbox with v2.0 filter bar (Active/All toggle, Status/Tags filters)
- Dashboard with stats cards, activity feed, and quick actions
- Settings with team management via Clerk OrganizationProfile
- Real-time updates throughout via Convex subscriptions

**Shipped in v3.1:**
- Clerk authentication (replaced Supabase auth)
- User migration with ID mapping
- Organization migration for Eagle Overseas
- n8n webhook integration for lead flow
- API routes migrated to Convex

**Tech Stack (v3.4):**
- ~47,745 lines TypeScript (34,931 src + 12,814 convex)
- Next.js 15 + React 19
- Clerk (Authentication)
- Convex (Database + Real-time)
- Shadcn/ui + Tailwind CSS
- Kapso API for WhatsApp
- Resend for transactional email
- Grok API + Sea-Lion (Ollama) for AI

**First Client:** Eagle Overseas Education (ready for deployment)

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

### Active

**Future Milestones:**
- [ ] Production deployment optimization (unblock Vercel billing)
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

**Known Issues (v3.4 Tech Debt):**
- MCP connection failure (Kapso endpoint unreachable — skills installed, code works)
- Phase 4 missing formal verification (UAT performed, integration confirmed)
- Sea-Lion local LLM disabled (Grok fallback working)

**Deferred to Production:**
- Webhook E2E testing deferred (ngrok issues, will test in production)
- n8n sync count verification deferred (webhook verified working)
- Vercel deployment blocked (billing freeze)

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Clerk (Auth) + Convex (Data), Shadcn/ui, Tailwind CSS
- **Design System**: CRM uses cool green palette, Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp, Resend for email
- **AI Models**: Grok API + Sea-Lion (Ollama at 100.113.96.25:11434)
- **Deployment**: Vercel (blocked) + Convex Cloud (active)
- **Performance**: Convex achieves 37ms P95, 25.4x faster than Supabase

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

## Current Milestone: v3.5 Production Go-Live

**Goal:** Deploy v3.4 features to production and activate live Kapso bot with Eagle Overseas.

**Target features:**
- Localhost polish (UI details, dev mode bugs, complete flow testing)
- Production deployment (manual deploy, environment setup, feature parity verification)
- Live bot integration (Kapso webhooks, ARI responding to real WhatsApp leads, complete automation)

**Success criteria:**
- All localhost flows work correctly in /demo workspace
- Production deployment matches localhost feature parity
- Kapso webhooks deliver messages to production
- ARI bot responds to real WhatsApp conversations
- Complete lead flow works: greeting → qualification → routing → booking
- All Your Intern settings tabs active and functional in production

---
*Last updated: 2026-01-28 after v3.5 milestone started*
