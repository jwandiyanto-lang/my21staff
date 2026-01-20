# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-14)
- v2.0 Production Ready — Phases 6-22 (shipped 2026-01-18)
- v2.1 Client Launch Ready — Phases 1-9 (shipped 2026-01-20)
- **v2.2 ARI & User Flow** — Phases 1-7 (in progress)

---

## Current Milestone: v2.2 ARI & User Flow

**Goal:** End-to-end user journey from social media leads to paid consultations via ARI WhatsApp bot.

**First Client:** Eagle Overseas Education

### Phase 1: Database Schema & Inbox Overhaul ✓

**Goal:** Foundation for ARI + improved inbox experience

**Requirements:** DB-01 through DB-09, INBOX-01 through INBOX-07

**Status:** Complete (2026-01-20)

**Success Criteria:**
- [x] ARI tables created with RLS policies
- [x] Kapso metadata cached on contacts table
- [x] Inbox loads instantly with cached contact data
- [x] Real-time message updates via Supabase subscriptions
- [x] Active/All and tag filters working

**Plans:** 5/5 complete

Plans:
- [x] 01-01-PLAN.md — ARI database tables (7 tables, 21 RLS policies)
- [x] 01-02-PLAN.md — Contacts cache fields + phone normalization
- [x] 01-03-PLAN.md — RLS policies + realtime publication for ARI tables
- [x] 01-04-PLAN.md — Active/All filter toggle + enhanced inbox filters
- [x] 01-05-PLAN.md — Typing indicators + real-time sync improvements

---

### Phase 2: ARI Core Conversation

**Goal:** ARI pulls form data and has intelligent conversations

**Requirements:** ARI-01 through ARI-07

**Success Criteria:**
- [ ] ARI matches incoming WhatsApp number to CRM contact
- [ ] ARI greets with context from form submission
- [ ] ARI asks follow-up questions for missing data
- [ ] ARI answers university/destination questions from knowledge base
- [ ] Natural Indonesian conversation with configurable persona

**Plans:** 5 plans in 4 waves

Plans:
- [ ] 02-01-PLAN.md — ARI foundation: types and multi-LLM clients (Grok + Sea-Lion)
- [ ] 02-02-PLAN.md — State machine and context builder
- [ ] 02-03-PLAN.md — Webhook integration and message processing
- [ ] 02-04-PLAN.md — Form validation and qualification logic
- [ ] 02-05-PLAN.md — Knowledge base integration for university questions

---

### Phase 3: Lead Scoring & Routing

**Goal:** Dynamic scoring and automatic lead routing

**Requirements:** SCORE-01 through SCORE-06, ROUTE-01 through ROUTE-04

**Success Criteria:**
- [ ] Lead score calculated (0-100) based on form + conversation
- [ ] Hot leads (70+) receive consultation push
- [ ] Cold leads (<40) receive community link
- [ ] Lead phase auto-updates in CRM

**Plans:** TBD during `/gsd:plan-phase 3`

---

### Phase 4: Payment Integration

**Goal:** Midtrans payment gateway for consultation booking

**Requirements:** PAY-01 through PAY-06

**Success Criteria:**
- [ ] Payment link generated for Rp500,000 consultation
- [ ] Indonesian payment methods supported (QRIS, GoPay, etc.)
- [ ] Payment callback updates CRM
- [ ] Failed payments handled with retry link

**Plans:** TBD during `/gsd:plan-phase 4`

---

### Phase 5: Scheduling & Handoff

**Goal:** Book consultations and hand off to consultants

**Requirements:** SCHED-01 through SCHED-06, HAND-01 through HAND-05

**Success Criteria:**
- [ ] Admin enters available consultant slots
- [ ] ARI displays slots and books appointments
- [ ] Meeting link notification sent before appointment
- [ ] Consultant receives full context (score, conversation summary)

**Plans:** TBD during `/gsd:plan-phase 5`

---

### Phase 6: Admin Interface

**Goal:** CRM settings for persona, universities, and scoring

**Requirements:** ADMIN-01 through ADMIN-07, KB-01 through KB-06

**Success Criteria:**
- [ ] Persona settings editable (name, tone, language)
- [ ] Universities CRUD with requirements and promotion toggle
- [ ] Scoring thresholds configurable
- [ ] Community link configurable

**Plans:** TBD during `/gsd:plan-phase 6`

---

### Phase 7: AI Model Selection

**Goal:** Grok + Sea-Lion A/B testing

**Requirements:** AI-01 through AI-04

**Success Criteria:**
- [ ] AI model selection in settings
- [ ] A/B testing mode splits traffic
- [ ] Comparison dashboard shows metrics
- [ ] Default model selectable based on results

**Plans:** TBD during `/gsd:plan-phase 7`

---

### v2.2 Requirements Coverage

| Category | Requirements | Phase |
|----------|--------------|-------|
| Database Schema | DB-01 to DB-09 | Phase 1 |
| Inbox Improvements | INBOX-01 to INBOX-07 | Phase 1 |
| ARI Core | ARI-01 to ARI-07 | Phase 2 |
| Lead Scoring | SCORE-01 to SCORE-06 | Phase 3 |
| Lead Routing | ROUTE-01 to ROUTE-04 | Phase 3 |
| Payment | PAY-01 to PAY-06 | Phase 4 |
| Scheduling | SCHED-01 to SCHED-06 | Phase 5 |
| Handoff | HAND-01 to HAND-05 | Phase 5 |
| Admin Persona | ADMIN-01 to ADMIN-05 | Phase 6 |
| Knowledge Base | KB-01 to KB-06 | Phase 6 |
| Admin Scoring | ADMIN-06 to ADMIN-07 | Phase 6 |
| AI Models | AI-01 to AI-04 | Phase 7 |

**Total:** 56 requirements across 7 phases

## Completed Milestones

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
- Production deployment at my21staff.vercel.app
- Multi-tenant admin with client management
- AI-powered WhatsApp responses via Sea Lion LLM
- Lead management polish with pagination, tags, AI handover
- Security hardening (rate limiting, input validation, API key encryption)
- Dashboard with client stats and task management
- Settings with CSV import/export, team invitations, pricing form leads

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

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
- Brand guidelines with logo system and color palette
- Email delivery via Resend (replaced broken SMTP)
- Role-based permissions (owner/admin/member)
- 4-stage support ticketing with approval workflow
- Central support hub for all client tickets
- Security info page for trust-building
- Landing page redesign with conversion focus
- TanStack Query caching for instant navigation
- Kapso bot setup for Eagle's WhatsApp

Full details: [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md)

</details>

---

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-5 | 14/14 | Complete | 2026-01-14 |
| v2.0 Production Ready | 6-22 | 38/38 | Complete | 2026-01-18 |
| v2.1 Client Launch Ready | 1-9 | 30/30 | Complete | 2026-01-20 |
| v2.2 ARI & User Flow | 1-7 | 5/10+ | In Progress | — |

**Total shipped:** 82 plans across 3 milestones

---

*Last updated: 2026-01-20 — Phase 2 planned (5 plans in 4 waves)*
