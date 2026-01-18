# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-14)
- v2.0 Production Ready — Phases 6-22 (shipped 2026-01-18)
- v2.1 Kapso Persona — Phase 18 + SMTP (planned)

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

## v2.1 — Client Launch Ready

**Goal:** Complete package to onboard Eagle as first paying client — trust-building features, not feature expansion.

**Key insight:** First paying client success defines the business. VIP treatment for Eagle.

---

### Phase 1: Brand Guidelines
**Goal:** Foundation for all visual work — logo, colors, typography, voice
**Status:** Complete
**Plans:** 3/3 plans — completed 2026-01-18

Plans:
- [x] 01-01-PLAN.md — Create BRAND.md and logo SVG files
- [x] 01-02-PLAN.md — Generate logo PNGs and update references
- [x] 01-03-PLAN.md — Folder restructure (business/ vs webapp)

---

### Phase 2: Email System + Member Onboarding
**Goal:** Fix email delivery AND complete member invitation flow — from adding member to working account
**Status:** Complete (with known issues)
**Plans:** 2/2 plans — completed 2026-01-18

Plans:
- [x] 02-01-PLAN.md — Resend setup + React Email templates (invitation)
- [x] 02-02-PLAN.md — Password reset template + DNS verification

**Known issues:** Forgot password uses Supabase email (not Resend), resend/delete invitation auth bug

**Scope:**
- Replace nodemailer/SMTP with Resend HTTP API
- Add React Email for invitation templates
- Member addition UI in webapp (already exists)
- Invitation acceptance flow (already exists)
- DNS records (SPF, DKIM, DMARC)

**Addresses:** P0 SMTP DNS resolution issue + complete team onboarding

---

### Phase 3: Workspace Roles Enhancement
**Goal:** Permission infrastructure — owner/admin/member enforcement
**Status:** Complete
**Plans:** 4/4 plans — completed 2026-01-18

Plans:
- [x] 03-01-PLAN.md — Permission types, utilities, and RLS policy
- [x] 03-02-PLAN.md — API route permission enforcement
- [x] 03-03-PLAN.md — Role management UI in team page
- [x] 03-04-PLAN.md — Gap closure: Wire invite/remove UI and update API permission

**Scope:**
- Create `hasPermission()` utility
- Extend `requireWorkspaceMembership` for roles
- RLS policy for member lead visibility
- Role management UI in team settings

**Addresses:** P0 RLS policy gaps

---

### Phase 4: Support Ticketing Core
**Goal:** Trust-building feature — 4-stage workflow (Report -> Discuss -> Outcome -> Implementation)
**Status:** Complete
**Plans:** 5/5 plans — completed 2026-01-18

Plans:
- [x] 04-01-PLAN.md — Database migration (tickets, comments, status_history + RLS)
- [x] 04-02-PLAN.md — TypeScript utilities (types, constants, transitions, tokens)
- [x] 04-03-PLAN.md — API routes (CRUD, transition, comments, approval, reopen)
- [x] 04-04-PLAN.md — UI pages (ticket list, detail, form sheet + navigation)
- [x] 04-05-PLAN.md — Email notifications + pg_cron auto-close

**Scope:**
- Tables: tickets, comments, status_history (with RLS)
- TypeScript state machine for stage transitions
- Ticket list + detail pages with comments
- Stage transition with approval workflow for skips
- Email notifications (opt-in per action)
- Auto-close after 7 days in Implementation + reopen capability

**Depends on:** Phase 2 (Email), Phase 3 (Roles)

---

### Phase 5: Tawk.to Integration
**Goal:** Quick win for live chat + backup ticketing
**Status:** Not started (optional)

**Scope:**
- Embed Tawk.to widget on landing + CRM
- Configure Bahasa Indonesia
- Test chat -> ticket flow

**Note:** Skip if Phase 4 ticketing is sufficient

---

### Phase 6: Security Info Page
**Goal:** Trust signal for paying clients
**Status:** Not started

**Scope:**
- Static page (Bahasa Indonesia)
- Data storage location (Singapore)
- Encryption explanation
- FAQ accordion
- WhatsApp contact

**Can parallelize with:** Phase 7

---

### Phase 7: Landing Page Redesign
**Goal:** Mobile-first conversion optimization
**Status:** Not started

**Scope:**
- Hero: "WhatsApp Automation untuk UMKM"
- Social proof (testimonials, client logos)
- Features grid per BRAND.md
- Single WhatsApp CTA per section
- Bundle optimization

**Depends on:** Phase 1 (Brand Guidelines)
**Can parallelize with:** Phase 6

---

### Phase 8: Performance Optimization
**Goal:** First impression polish for Eagle
**Status:** Not started

**Scope:**
- Bundle analyzer, identify targets
- Dynamic imports for heavy components
- TanStack Query for client caching
- Verify Supabase connection pooling

**Note:** Optimize after features stable

---

### Phase 9: Kapso Bot Setup (Eagle)
**Goal:** Get Kia persona working on Eagle's WhatsApp — most important for first client
**Status:** Not started
**Priority:** HIGH — can start early, minimal dependencies

**Scope:**
- Contact lookup API (`/api/contacts/by-phone/[phone]`)
- Update Kapso sea-lion-reply function with Kia persona
- Integrate CRM context into AI responses
- End-to-end testing with Eagle's number

**Note:** Can run in parallel with Phases 2-8

---

### Deferred to v2.2

- Folder Restructure (my21staff/ vs my21staff-business/)

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 14/14 | Complete | 2026-01-14 |
| 6-22 | v2.0 | 38/38 | Complete | 2026-01-18 |
| 1-9 | v2.1 | 19/? | Phase 1-4 complete | — |

**Note:** v2.1 uses fresh phase numbering. Old phases archived in `.planning/phases-v2.0-archive/`

---

*Last updated: 2026-01-18 — Phase 4 complete (5/5 plans)*
