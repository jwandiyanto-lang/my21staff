# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-14)
- v2.0 Production Ready — Phases 6-22 (shipped 2026-01-18)
- v2.1 Client Launch Ready — Phases 1-9 (shipped 2026-01-20)
- v2.2 ARI & User Flow — Phases 1-6 (shipped 2026-01-20)
- v3.0 Performance & Speed — Phases 1-5 (shipped 2026-01-23)
- **v3.1 Full Convex + Clerk** — Phases 1-7 (in progress)

---

## v3.1 Full Convex + Clerk (In Progress)

**Milestone Goal:** Complete the migration to Convex + Clerk, removing Supabase entirely from the stack and restoring Eagle's n8n lead flow.

### Phase 1: Clerk Auth Infrastructure - COMPLETE
**Goal**: Clerk application configured with JWT template for Convex validation
**Depends on**: v3.0 complete (Convex already deployed)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Clerk application exists with correct settings (email/password enabled)
  2. JWT template configured with Convex issuer claim
  3. Convex auth.config.ts validates Clerk JWTs
  4. Test mutation succeeds with Clerk-issued token
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Clerk app + JWT template + Convex auth config ✓

### Phase 2: Middleware + Provider + Auth UI - COMPLETE
**Goal**: Users can sign in/out using Clerk components with route protection working
**Depends on**: Phase 1
**Requirements**: AUTH-03, AUTH-04, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. User can sign in with Clerk SignIn component
  2. User can sign up with Clerk SignUp component
  3. User profile menu uses Clerk UserButton
  4. Password reset works via Clerk (fixes broken Supabase flow)
  5. Protected routes redirect to sign-in when unauthenticated
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Clerk infrastructure (packages, providers, middleware) ✓
- [x] 02-02-PLAN.md — Auth UI pages (sign-in, sign-up, UserButton) ✓

### Phase 3: Users Table + Clerk Webhook - COMPLETE
**Goal**: User data synced to Convex via Clerk webhook for efficient queries
**Depends on**: Phase 2
**Requirements**: USER-01, USER-02
**Success Criteria** (what must be TRUE):
  1. Users table exists in Convex with Clerk ID as primary identifier
  2. Clerk webhook syncs user.created events to Convex
  3. Clerk webhook syncs user.updated events to Convex
  4. User queries work without hitting Clerk API
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Users table schema + CRUD mutations ✓
- [x] 03-02-PLAN.md — Clerk webhook HTTP action + Dashboard config ✓

### Phase 4: User Migration + Organizations - CODE COMPLETE
**Goal**: Existing users migrated to Clerk with workspaces as organizations
**Depends on**: Phase 3
**Requirements**: USER-03, USER-04, ORG-01, ORG-02, ORG-03
**Success Criteria** (what must be TRUE):
  1. All existing Supabase users exist in Clerk (with external_id mapping)
  2. User ID references updated across all Convex tables
  3. Workspaces exist as Clerk organizations
  4. Team invitations work via Clerk organization invitations
  5. Role-based permissions (owner/admin/member) work with Clerk roles
**Plans**: 6 plans

Plans:
- [x] 04-01-PLAN.md — Migrate Supabase users to Clerk with ID mapping ✓
- [x] 04-02-PLAN.md — Convert workspaces to Clerk organizations ✓
- [x] 04-03-PLAN.md — Update core Convex tables with Clerk user IDs ✓
- [x] 04-03b-PLAN.md — Update ticket Convex tables with Clerk user IDs ✓
- [x] 04-04-PLAN.md — Organization webhooks and member sync ✓
- [x] 04-05-PLAN.md — Team management UI with Clerk OrganizationProfile ✓

**Pending Setup (before verification):**
- Configure organization webhook events in Clerk Dashboard
- Test team page at /eagle-overseas/team

### Phase 5: Data Migration - COMPLETE
**Goal**: All remaining Supabase tables migrated to Convex, main API routes updated
**Depends on**: Phase 4
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. ARI tables migrated (config, sessions, scores, slots, etc.) ✓
  2. Support ticket tables migrated ✓
  3. CMS tables migrated (articles, webinars) ✓
  4. Utility tables migrated (profiles, appointments) ✓
  5. Main API routes use Convex instead of Supabase ✓
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Convex schema extension (12 new tables) ✓
- [x] 05-02-PLAN.md — Migration scripts + data transfer ✓
- [x] 05-03-PLAN.md — ARI API routes update ✓
- [x] 05-04-PLAN.md — CMS API routes update (articles, webinars) ✓
- [x] 05-05-PLAN.md — Tickets + ARI processor final migration ✓

**Note:** Edge routes (cron, kapso webhook) deferred to Phase 7 cleanup.

### Phase 6: n8n Integration
**Goal**: Eagle's lead flow from Google Sheets works via Convex webhook
**Depends on**: Phase 5 (data layer complete)
**Requirements**: N8N-01, N8N-02, N8N-03
**Success Criteria** (what must be TRUE):
  1. Convex HTTP action exists at /webhook/n8n endpoint
  2. n8n workflow configured to use new Convex webhook URL
  3. Test lead from Google Sheets appears in Eagle's CRM
**Plans**: 1 plan

Plans:
- [ ] 06-01-PLAN.md — n8n webhook endpoint + workflow update

### Phase 7: Cleanup + Verification
**Goal**: Supabase removed entirely, clean single-backend architecture
**Depends on**: Phase 6
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. No Supabase client code remains in codebase
  2. Supabase environment variables removed from Vercel
  3. @supabase packages removed from package.json
  4. Full app verification passes (auth, data, webhooks all working)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

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
- Send messages via Convex API with optimistic UI
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
| v3.0 Performance & Speed | 1-5 | 21/21 | Complete | 2026-01-23 |
| **v3.1 Full Convex + Clerk** | 1-7 | 16/TBD | In Progress | - |

**Total shipped:** 152 plans across 5 milestones

---

*Last updated: 2026-01-24 — Phase 6 planned (1 plan)*
