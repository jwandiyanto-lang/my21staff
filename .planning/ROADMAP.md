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

### Phase 5: Central Support Hub
**Goal:** All client support flows to my21staff workspace for centralized handling
**Status:** Complete
**Plans:** 6/6 plans — completed 2026-01-19

Plans:
- [x] 05-01-PLAN.md — Database migration (admin_workspace_id, is_internal, RLS policies)
- [x] 05-02-PLAN.md — Storage bucket for ticket attachments
- [x] 05-03-PLAN.md — Portal API routes (client ticket CRUD)
- [x] 05-04-PLAN.md — Admin UI updates (client ticket visibility, internal notes)
- [x] 05-05-PLAN.md — Client portal UI (ticket list, create, detail with image upload)
- [x] 05-06-PLAN.md — Tawk.to live chat widget (optional)

**Scope:**
- Cross-workspace ticketing: Client tickets -> my21staff workspace
- my21staff team can view/respond to all client tickets
- Client portal at /portal/support: Clients see only their own tickets
- Image attachments for both clients and admins
- Internal notes (admin-only comments, amber styling)
- Tawk.to widget for live chat (optional, requires env vars)

**Depends on:** Phase 4 (Ticketing Core)

---

### Phase 6: Security Info Page
**Goal:** Trust signal for paying clients — simple explanation of data security
**Status:** Complete
**Plans:** 1/1 plan — completed 2026-01-19

Plans:
- [x] 06-01-PLAN.md — Security info page at /keamanan + footer links

**Scope:**
- Static page (Bahasa Indonesia)
- Data storage location (Singapore)
- Data control (export/delete)
- Contact options (WhatsApp + email)
- Footer link on landing/pricing pages

**Can parallelize with:** Phase 7

---

### Phase 7: Landing Page Redesign
**Goal:** Mobile-first English landing page with conversion optimization
**Status:** Complete
**Plans:** 3/3 plans — completed 2026-01-19

Plans:
- [x] 07-01-PLAN.md — Foundation (component folder + constants)
- [x] 07-02-PLAN.md — Hero section + Features grid
- [x] 07-03-PLAN.md — CTA sections + Page integration + Checkpoint

**Scope:**
- English language ("24/7 Digital Workforce" headline)
- Hero with WhatsApp CTA and StaffDeck visual
- Minimalist features grid (4 cards)
- Mobile sticky CTA (appears after scrolling)
- Single WhatsApp CTA per section

**Depends on:** Phase 1 (Brand Guidelines)

---

### Phase 8: Performance Optimization
**Goal:** First impression polish for Eagle — make dashboard feel snappy
**Status:** Complete
**Plans:** 5/5 plans — completed 2026-01-20

Plans:
- [x] 08-01-PLAN.md — Bundle analyzer + TanStack Query provider setup
- [x] 08-02-PLAN.md — Inbox + Database TanStack Query migration
- [x] 08-03-PLAN.md — Loading skeletons for all dashboard routes
- [x] 08-04-PLAN.md — Gap closure: Client-side caching migration (Inbox + Database)
- [x] 08-05-PLAN.md — Gap closure: Optimistic rollback fix

**Scope:**
- Bundle analyzer setup (visibility into bundle size)
- TanStack Query v5 for client-side caching
- Stale-while-revalidate for instant navigation feel
- Skeleton loading states (eliminate blank screens)
- Real-time integration with query cache
- Client-side data fetching for Inbox and Database (instant cache hits on navigation)
- Optimistic rollback fix (correct conversation targeting)

---

### Phase 9: Kapso Bot Setup (Eagle)
**Goal:** Get Ari persona working on Eagle's WhatsApp — AI responds to leads with CRM context
**Status:** Complete
**Plans:** 1/1 plan — completed 2026-01-20

Plans:
- [x] 09-01-PLAN.md — Deploy Kapso function + verification testing

**Scope:**
- Contact lookup API already complete (`/api/contacts/by-phone`)
- Bot persona already configured (`business/bots/eagle-studenthub-bot.md`)
- Manual Kapso deployment (browser action)
- End-to-end verification testing via WhatsApp

**Note:** CRM code complete — remaining work is manual Kapso setup + verification

---

### Deferred to v2.2

- Folder Restructure (my21staff/ vs my21staff-business/)

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 14/14 | Complete | 2026-01-14 |
| 6-22 | v2.0 | 38/38 | Complete | 2026-01-18 |
| 1-9 | v2.1 | 34/34 | Complete | 2026-01-20 |

**Note:** v2.1 uses fresh phase numbering. Old phases archived in `.planning/phases-v2.0-archive/`

---

*Last updated: 2026-01-20 — v2.1 COMPLETE (34 plans)*
