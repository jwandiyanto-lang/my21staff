# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-14)
- v2.0 Production Ready — Phases 6-22 (shipped 2026-01-18)
- v2.1 Client Launch Ready — Phases 1-9 (shipped 2026-01-20)
- v2.2 ARI & User Flow — Phases 1-6 (shipped 2026-01-20)
- v3.0 Performance & Speed — Phases 1-5 (shipped 2026-01-23)

---

## Completed Milestones

<details>
<summary>v3.0 Performance & Speed (Phases 1-5) — SHIPPED 2026-01-23</summary>

- [x] Phase 1: Instrumentation & Baseline (3/3 plans) — completed 2026-01-21
- [x] Phase 2: Supabase Optimization (4/4 plans) — completed 2026-01-21
- [x] Phase 3: Convex Spike (6/6 plans) — completed 2026-01-21
- [x] Phase 4: Decision Gate (1/1 plan) — completed 2026-01-23
- [x] Phase 5: Implementation (7/7 plans) — completed 2026-01-21, deployed 2026-01-22

**Key accomplishments:**
- Performance baseline established with Vercel Speed Insights and API timing wrappers
- Supabase optimization with composite indexes, parallel queries, explicit column selection (P95: 926ms)
- Convex spike validated 25.4x speedup over Supabase (P95: 37ms)
- Data-driven decision to proceed with hybrid architecture (Supabase auth + Convex data)
- Full Convex implementation: schema, mutations, queries, HTTP actions, real-time subscriptions deployed

Full details: [milestones/v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>v2.2 ARI & User Flow (Phases 1-6) — SHIPPED 2026-01-20</summary>

- [x] Phase 1: Database Schema & Inbox Overhaul (5/5 plans) — completed 2026-01-20
- [x] Phase 2: ARI Core Conversation (5/5 plans) — completed 2026-01-20
- [x] Phase 3: Lead Scoring & Routing (4/4 plans) — completed 2026-01-20
- [x] Phase 4: Payment Integration — SKIPPED (deferred to v2.3)
- [x] Phase 5: Scheduling & Handoff (4/4 plans) — completed 2026-01-20
- [x] Phase 6: Admin Interface (5/5 plans) — completed 2026-01-20
- [x] Phase 7: AI Model Selection — DEFERRED to v2.3

**Key accomplishments:**
- ARI database infrastructure (7 tables with workspace-scoped RLS)
- Multi-LLM AI system with Grok + Sea-Lion and deterministic A/B testing
- Lead scoring engine (0-100 with category breakdown: basic, qualification, documents, engagement)
- Automated lead routing (hot → consultation, warm → nurture, cold → community)
- Consultation booking flow with Indonesian day/time parsing and slot management
- Admin configuration UI ("Your Intern" page with 5 tabs: Persona, Flow, Database, Scoring, Slots)

Full details: [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md)

</details>

<details>
<summary>v2.1 Client Launch Ready (Phases 1-9) — SHIPPED 2026-01-20</summary>

- [x] Phase 1: Brand Guidelines (3/3 plans) — completed 2026-01-18
- [x] Phase 2: Email System + Member Onboarding (2/2 plans) — completed 2026-01-18
- [x] Phase 3: Workspace Roles Enhancement (4/4 plans) — completed 2026-01-18
- [x] Phase 4: Support Ticketing Core (5/5 plans) — completed 2026-01-18
- [x] Phase 5: Central Support Hub (6/6 plans) — completed 2026-01-19
- [x] Phase 6: Security Info Page (1/1 plan) — completed 2026-01-19
- [x] Phase 7: Landing Page Redesign (3/3 plans) — completed 2026-01-19
- [x] Phase 8: Performance Optimization (5/5 plans) — completed 2026-01-20
- [x] Phase 9: Kapso Bot Setup (1/1 plan) — completed 2026-01-20

**Key accomplishments:**
- Brand guidelines with logo system, color palette, typography rules
- Email delivery via Resend HTTP API (replaced broken SMTP)
- Role-based permissions with owner/admin/member enforcement and RLS policies
- 4-stage support ticketing workflow (Report → Discuss → Outcome → Implementation)
- Central support hub for all client tickets with image attachments
- Security info page for trust-building with clients
- Landing page redesign with conversion optimization
- TanStack Query caching for instant navigation
- Kapso bot setup with Ari persona for Eagle's WhatsApp

Full details: [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md)

</details>

<details>
<summary>v2.0 Production Ready (Phases 6-22) — SHIPPED 2026-01-18</summary>

- [x] Phase 6: Kapso Live (1/1 plan) — completed 2026-01-14
- [x] Phase 7: Landing Page (3/3 plans) — completed 2026-01-14
- [x] Phase 8: Sea Lion + Kapso (1/1 plan) — completed 2026-01-15
- [x] Phase 9: Sheets to Database (1/1 plan) — completed 2026-01-15
- [x] Phase 10: App Verification (1/1 plan) — completed 2026-01-15
- [x] Phase 11: Vercel Deployment (1/1 plan) — completed 2026-01-15
- [x] Phase 12: Multi-Tenant Admin (1/1 plan) — completed 2026-01-15
- [x] Phase 13: Lead Management Enhancement (3/3 plans) — completed 2026-01-16
- [x] Phase 14: Landing Page Refresh (1/1 plan) — completed 2026-01-16
- [x] Phase 15: Pricing Page (2/2 plans) — completed 2026-01-16
- [x] Phase 17: Inbox UI/UX Fixes (1/1 plan) — completed 2026-01-16
- [x] Phase 19: Performance & Security (8/8 plans) — completed 2026-01-17
- [x] Phase 20: Dashboard & Notes (3/3 plans) — completed 2026-01-17
- [x] Phase 21: Lead Polish + Performance (7/7 plans) — completed 2026-01-17
- [x] Phase 22: Settings & Data Management (4/4 plans) — completed 2026-01-18

**Skipped:** Phase 18 (Kapso Bot Setup) — deferred to v2.1

**Key accomplishments:**
- Production deployment at my21staff.vercel.app with real Supabase
- Multi-tenant admin with client management and first-login password change
- AI-powered WhatsApp responses via Sea Lion LLM + Kapso
- Lead management polish with editable fields, tags, AI handover toggle, pagination
- Security hardening (rate limiting, input validation, API key encryption)
- Dashboard with client stats and task management (notes with due dates)
- Settings with CSV import/export, team invitations, pricing form leads

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>v1.0 MVP (Phases 1-5) — SHIPPED 2026-01-14</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-01-14
- [x] Phase 2: Database View (3/3 plans) — completed 2026-01-14
- [x] Phase 3: Inbox Core (3/3 plans) — completed 2026-01-14
- [x] Phase 4: Inbox Send (1/1 plan) — completed 2026-01-14
- [x] Phase 5: Website Manager (4/4 plans) — completed 2026-01-14

**Key accomplishments:**
- Lead database with form submissions, status badges, filters, detail sheet
- Two-panel inbox with message history from Kapso
- Send messages via Kapso API with optimistic UI
- Website manager CMS with articles, webinars, public pages

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

---

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-5 | 14/14 | Complete | 2026-01-14 |
| v2.0 Production Ready | 6-22 | 38/38 | Complete | 2026-01-18 |
| v2.1 Client Launch Ready | 1-9 | 30/30 | Complete | 2026-01-20 |
| v2.2 ARI & User Flow | 1-6 | 23/23 | Complete | 2026-01-20 |
| **v3.0 Performance & Speed** | 1-5 | 21/21 | Complete | 2026-01-23 |

**Total shipped:** 147 plans across 6 milestones

---

*Last updated: 2026-01-23 — v3.0 milestone complete*
