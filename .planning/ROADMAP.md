# Roadmap: my21staff

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-01-14)
- ✅ **v2.0 Production Ready** — Phases 6-22 (shipped 2026-01-18)
- 📋 **v2.1 Kapso Persona** — Phase 18 + SMTP (planned)

## Completed Milestones

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-01-14</summary>

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
<summary>✅ v2.0 Production Ready (Phases 6-22) — SHIPPED 2026-01-18</summary>

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

## v2.1 — Kapso Persona + SMTP (Planned)

### Phase 18: Kapso Bot Setup & Verification

**Goal:** Configure Kia persona for Eagle Overseas with CRM context integration
**Status:** Not started

Plans:
- [ ] 18-01: Contact lookup API by phone (for Kapso function context)
- [ ] 18-02: Deploy Kia persona + end-to-end verification

**Scope:**
- Build contact lookup API (`/api/contacts/by-phone/[phone]`)
- Update Kapso sea-lion-reply function with Kia persona
- Integrate CRM context into AI responses

### Phase 23: SMTP Email Delivery (NEW)

**Goal:** Fix team invitation email delivery from Vercel
**Status:** Not started

**Scope:**
- Investigate DNS resolution issues (smtp.hostinger.com EBADNAME)
- Try alternative SMTP providers (SendGrid, Resend, Mailgun)
- Or use Supabase email triggers

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 14/14 | Complete | 2026-01-14 |
| 6-22 | v2.0 | 38/38 | Complete | 2026-01-18 |
| 18 | v2.1 | 0/2 | Planned | — |
| 23 | v2.1 | 0/1 | Planned | — |

---

*Last updated: 2026-01-18 after v2.0 milestone*
