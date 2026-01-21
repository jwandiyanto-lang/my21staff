# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-14)
- v2.0 Production Ready — Phases 6-22 (shipped 2026-01-18)
- v2.1 Client Launch Ready — Phases 1-9 (shipped 2026-01-20)
- v2.2 ARI & User Flow — Phases 1-6 (shipped 2026-01-20)
- **v3.0 Performance & Speed** — Phases 1-5 (current)

---

## v3.0 Performance & Speed

**Goal:** Achieve sub-500ms P95 response times through measured optimization and data-driven architecture decisions.

**Approach:** Instrument first, optimize Supabase, spike Convex in parallel, decide based on data, then implement winning path.

---

### Phase 1: Instrumentation & Baseline

**Goal:** Establish performance baseline before any optimization work begins

**Dependencies:** None (starting phase)

**Requirements:**
- INST-01: Enable Vercel Speed Insights for Web Vitals tracking
- INST-02: Add API timing wrapper to `/api/contacts/by-phone`
- INST-03: Add API timing wrapper to `/api/conversations`
- INST-04: Log query count per request in instrumented endpoints
- INST-05: Establish P50/P95/P99 baseline metrics before optimization

**Success Criteria:**
1. Vercel Speed Insights dashboard shows Web Vitals (LCP, FID, CLS) for production traffic
2. API routes log response time (ms) for every request in Vercel logs
3. Query count per request visible in logs (e.g., "5 queries, 2340ms total")
4. Baseline document exists with P50/P95/P99 for `/api/contacts/by-phone` and `/api/conversations`

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Install Speed Insights and create timing infrastructure
- [x] 01-02-PLAN.md — Instrument /api/contacts/by-phone and /api/conversations
- [x] 01-03-PLAN.md — Deploy and establish baseline
- [x] VERIFIED 2026-01-21

---

### Phase 2: Supabase Optimization

**Goal:** Apply known optimization patterns to achieve significant latency reduction with existing stack

**Dependencies:** Phase 1 (need baseline to measure improvement)

**Requirements:**
- SUPA-01: Refactor `/api/contacts/by-phone` to use `Promise.all()` for parallel queries
- SUPA-02: Refactor `/api/conversations` to use `Promise.all()` for parallel queries
- SUPA-03: Add composite index `idx_contacts_workspace_phone` on contacts(workspace_id, phone)
- SUPA-04: Add composite index `idx_conversations_workspace_time` on conversations(workspace_id, last_message_at DESC)
- SUPA-05: Add composite index `idx_messages_conversation_time` on messages(conversation_id, created_at DESC)
- SUPA-06: Use nested relations for `/api/conversations` (SATISFIED - already uses conversations -> contacts!inner join)
- SUPA-07: Audit and replace `select('*')` with explicit column selection in hot paths
- SUPA-08: Review RLS policies for performance (verification-only in this phase)

**Success Criteria:**
1. `/api/contacts/by-phone` responds in <1 second P95 (down from 2-6 seconds)
2. `/api/conversations` responds in <1 second P95
3. Response latency reduced via parallel query execution (Promise.all())
4. All hot path queries use indexes (verified via EXPLAIN ANALYZE)
5. No `select('*')` in `/api/contacts/by-phone`, `/api/conversations`, or `/api/messages`

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md — Create composite indexes on contacts, conversations, messages
- [x] 02-02-PLAN.md — Refactor /api/contacts/by-phone to parallel queries
- [x] 02-03-PLAN.md — Refactor /api/conversations to explicit columns + parallel queries
- [x] 02-04-PLAN.md — Verify optimization results and document performance
- [x] VERIFIED 2026-01-21

---

### Phase 3: Convex Spike

**Goal:** Validate whether Convex offers meaningful performance improvement over optimized Supabase

**Dependencies:** Phase 1 (need baseline), runs parallel to Phase 2

**Requirements:**
- CONV-01: Set up Convex project with Next.js 15 App Router
- CONV-02: Configure Supabase JWT provider in Convex auth.config.ts
- CONV-03: Implement Convex schema for contacts table
- CONV-04: Implement `requireWorkspaceMembership()` helper in Convex
- CONV-05: Convert `/api/contacts/by-phone` to Convex query function
- CONV-06: Implement Convex HTTP action for Kapso webhook handling
- CONV-07: Benchmark Convex vs optimized Supabase response times
- CONV-08: Test real-time subscription performance in Convex

**Success Criteria:**
1. Convex project initialized and connected to Next.js app
2. User can authenticate via Supabase and access Convex data (JWT hybrid works)
3. `/api/contacts/by-phone` equivalent in Convex responds in <500ms P95
4. Kapso webhook can be received and processed by Convex HTTP action
5. Comparison document exists with side-by-side P50/P95/P99 for both approaches

**Plans:** 0 plans

Plans:
- [ ] TBD — Set up Convex project and auth integration
- [ ] TBD — Implement contacts schema and query function
- [ ] TBD — Benchmark vs Supabase and document results

---

### Phase 4: Decision Gate

**Goal:** Make data-driven architecture decision based on spike results

**Dependencies:** Phase 2 (optimized Supabase metrics), Phase 3 (Convex spike results)

**Requirements:**
- GATE-01: Document spike results (P50/P95/P99 for both approaches)
- GATE-02: Evaluate webhook handling reliability in Convex
- GATE-03: Make data-driven decision: Convex migration or enhanced Supabase

**Success Criteria:**
1. Decision document exists with performance comparison table (Supabase vs Convex)
2. Webhook reliability assessment complete (success rate, error handling, retry behavior)
3. Clear written decision with rationale: "Proceed with [Convex/Supabase] because [data-backed reason]"

**Plans:** 0 plans

Plans:
- [ ] TBD — Document comparison metrics and make architecture decision

---

### Phase 5: Implementation

**Goal:** Execute winning path to achieve sub-500ms P95 response times across all hot paths

**Dependencies:** Phase 4 (decision made)

**Requirements (conditional on GATE-03 decision):**

**If Convex wins (GATE-03 = Convex):**
- IMPL-01: Migrate contacts table to Convex with dual-write
- IMPL-02: Migrate conversations table to Convex
- IMPL-03: Migrate messages table to Convex
- IMPL-04: Update inbox to use Convex real-time subscriptions
- IMPL-05: Migrate webhook handler to Convex HTTP action
- IMPL-06: Remove Supabase data queries (keep auth only)

**If Supabase wins (GATE-03 = Supabase):**
- IMPL-07: Replace polling with Supabase real-time subscriptions for inbox
- IMPL-08: Create database function for dashboard data aggregation
- IMPL-09: Tune connection pooling settings
- IMPL-10: Verify sub-500ms P95 across all hot paths

**Success Criteria:**
1. `/api/contacts/by-phone` P95 < 500ms in production
2. `/api/conversations` P95 < 500ms in production
3. Inbox updates in real-time without polling (subscription-based)
4. Page load time P95 < 2 seconds (Vercel Speed Insights)
5. No regression in functionality (all existing features work)

**Plans:** 0 plans

Plans:
- [ ] TBD — Execute based on Phase 4 decision (Convex migration or Supabase enhancement)

---

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
- ARI database infrastructure (7 tables with RLS)
- Multi-LLM AI system (Grok + Sea-Lion with A/B testing)
- Lead scoring engine (0-100 with category breakdown)
- Automated lead routing (hot/warm/cold)
- Consultation booking flow with scheduling
- Admin configuration UI ("Your Intern" page)

Full details: [milestones/v2.2-ROADMAP.md](milestones/v2.2-ROADMAP.md)

</details>

---

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-5 | 14/14 | Complete | 2026-01-14 |
| v2.0 Production Ready | 6-22 | 38/38 | Complete | 2026-01-18 |
| v2.1 Client Launch Ready | 1-9 | 30/30 | Complete | 2026-01-20 |
| v2.2 ARI & User Flow | 1-6 | 23/23 | Complete | 2026-01-20 |
| **v3.0 Performance & Speed** | 1-5 | 7/12 | Active | - |

**Total shipped:** 105 plans across 4 milestones

---

*Last updated: 2026-01-21 — Phase 2 revised to clarify success criteria and SUPA-06 status*
