# Roadmap: my21staff v2

## Overview

WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel.

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-01-14)

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

## v1.1 — Real Kapso Integration (COMPLETE)

- [x] Phase 6: Kapso Live — Webhook handler for inbound messages (complete)
- [x] Phase 7: Landing Page — Public marketing/landing page for the product (complete)

## v1.2 — AI & Data Integrations (COMPLETE)

- [x] Phase 8: Sea Lion + Kapso — AI-powered WhatsApp responses using Sea Lion LLM (complete)
- [x] Phase 9: Sheets to Database — Google Sheets sync via n8n workflows (complete - 144 records synced)
- [x] Phase 10: App Verification — Landing→login flow, dev mode disabled, pushed to GitHub (complete)

## v1.3 — Production Deployment (COMPLETE)

- [x] Phase 11: Vercel Deployment — Deployed to Vercel with real Supabase, glassmorphism login (complete)

## v1.4 — Multi-Tenant Admin (COMPLETE)

- [x] Phase 12: Multi-Tenant Admin — Admin dashboard, client management, dummy credentials, first-login password change (complete)

---

## Current Milestone: v1.5 — Lead Management Enhancement

### Phase 13: Lead Management Enhancement

**Goal:** Complete lead management with editable fields, message history, and AI handover control
**Depends on:** Phase 12
**Plans:** 3 plans

Plans:
- [x] 13-01: Contact Update API + Status/Score UI
- [ ] 13-02: Tag Management + Messages Tab
- [ ] 13-03: AI Handover Toggle (Kapso integration)

**Details:**
- Create PATCH API for contact updates (status, score, tags)
- Add status dropdown to change lead pipeline stage
- Add lead score slider for manual adjustment
- Add tag management (add/remove tags)
- Integrate Messages tab with actual conversation data
- Add AI handover toggle in inbox (pause/resume automation per conversation)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-01-14 |
| 2. Database View | v1.0 | 3/3 | Complete | 2026-01-14 |
| 3. Inbox Core | v1.0 | 3/3 | Complete | 2026-01-14 |
| 4. Inbox Send | v1.0 | 1/1 | Complete | 2026-01-14 |
| 5. Website Manager | v1.0 | 4/4 | Complete | 2026-01-14 |
| 6. Kapso Live | v1.1 | 1/1 | Complete | 2026-01-14 |
| 7. Landing Page | v1.1 | 3/3 | Complete | 2026-01-14 |
| 8. Sea Lion + Kapso | v1.2 | 1/1 | Complete | 2026-01-15 |
| 9. Sheets to Database | v1.2 | 1/1 | Complete | 2026-01-15 |
| 10. App Verification | v1.2 | 1/1 | Complete | 2026-01-15 |
| 11. Vercel Deployment | v1.3 | 1/1 | Complete | 2026-01-15 |
| 12. Multi-Tenant Admin | v1.4 | 1/1 | Complete | 2026-01-15 |
| 13. Lead Management Enhancement | v1.5 | 1/3 | In Progress | — |
