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

## v1.5 — Lead Management Enhancement (COMPLETE)

### Phase 13: Lead Management Enhancement

**Goal:** Complete lead management with editable fields, message history, and AI handover control
**Depends on:** Phase 12
**Plans:** 3/3 complete

Plans:
- [x] 13-01: Contact Update API + Status/Score UI
- [x] 13-02: Tag Management + Messages Tab
- [x] 13-03: AI Handover Toggle (Kapso integration)

**Completed:**
- PATCH API for contact updates (status, score, tags)
- Status dropdown to change lead pipeline stage
- Lead score slider for manual adjustment
- Tag management (add/remove tags)
- Messages tab with conversation data
- AI handover toggle in inbox (pause/resume Kapso workflows per conversation)

---

## v1.6 — Landing Page Refresh (COMPLETE)

### Phase 14: Landing Page Refresh

**Goal:** Modernize landing page with new hero copy, employee badge cards, pricing section
**Depends on:** Phase 7 (original landing page)
**Plans:** 1 plan (interactive session)

Plans:
- [x] 14-01: Landing Page Refresh (interactive)

**Completed:**
- Hero headline: "No System, No Growth" with better spacing
- Subtext: "Dari berantakan menjadi satu sistem. Software yang bertumbuh bareng bisnis Anda!"
- CTA button: Solid orange "Dapatkan Sistemnya"
- Staff cards: Employee ID badge style with my21staff branding
- AI-generated Notion-style avatars for 8 staff members
- Pricing section: Solo (Rp3.9jt) & Team (Rp7.9jt) plans
- Removed nav links (Harga, Layanan, Kenapa Harus) for cleaner look
- Login button: More prominent with backdrop blur
- Footer: Updated to 2026, simplified links
- Compressed hero section (less green space)

**Pending (future):**
- Real photos to replace placeholder gradients
- Social proof / testimonials
- Before/after transformation section

### Phase 15: Pricing Page

**Goal:** Dedicated pricing page at `/pricing` accessible from landing page CTAs
**Depends on:** Phase 14 (landing page refresh)
**Plans:** 2 plans

Plans:
- [x] 15-01: Pricing Page Refresh (story-driven content, filter section, 3-tier pricing)
- [x] 15-02: Modal Form + Animations (interactive session)

**Completed:**
- Story section with 5 problem scenarios ("Masalah yang sering kami temui")
- Rhetorical question: "Pernah bulan ini ramai... uangnya kemana?"
- Urgency section: "No system = No growth"
- 3-tier pricing: Solo Rp3.9jt, Team Rp7.9jt, Studio Custom
- Features from PRICING.md (WhatsApp numbers, message quotas, AI chats)
- Setup fee box: Rp7.5jt (Website/Web App + Business Consultation)
- Header with centered "21" logo + "Mulai" nav button
- Modal form for lead capture (Nama, WhatsApp, Bisnis)
- Stagger entrance + hover lift animations on pricing cards
- Smooth scroll for "Mulai" nav button
- Footer matching landing page style

---

## v1.7 — Inbox Polish (COMPLETE)

### Phase 17: Inbox UI/UX Fixes

**Goal:** Polish inbox with working filters, better layout, and WhatsApp-style feel
**Depends on:** Phase 13 (Lead Management)
**Plans:** 1/1 complete

Plans:
- [x] 17-01: Inbox UI/UX Fixes (7/7 fixes)

**Completed:**
- WhatsApp-style background pattern in conversation area
- Info panel responsive (no cutoff on narrow screens)
- Header layout: `[Notes] [Merge] ──── [AI Aktif]`
- Tag filter added (filters by contact tags)
- Status filter working
- Unread filter working
- Cascade delete (already in schema with ON DELETE CASCADE)
- Assigned to dropdown (filters by team member)

---

## v1.8 — Kapso Verification

### Phase 18: Kapso Bot Setup & Verification

**Goal:** Configure Kia persona for Eagle Overseas with CRM context integration and verify full Kapso flow
**Depends on:** Phase 17
**Plans:** 2 plans

Plans:
- [ ] 18-01-PLAN.md — Contact lookup API by phone (for Kapso function context)
- [ ] 18-02-PLAN.md — Deploy Kia persona + end-to-end verification

**Scope:**
- Build contact lookup API (`/api/contacts/by-phone/[phone]`)
- Update Kapso sea-lion-reply function with Kia persona (Saya/Kak, no emoji)
- Integrate CRM context (name, metadata, notes, messages) into AI responses
- Verify full flow: inbound, AI response, outbound, handover toggle

---

## v1.9 — Performance & Security

### Phase 19: Performance & Security Audit

**Goal:** Harden the application with authorization fixes, rate limiting, input validation, and performance optimizations
**Depends on:** Phase 18
**Plans:** 5 plans

Plans:
- [ ] 19-01-PLAN.md — Authorization fixes (workspace auth helper, API route fixes, DEV_MODE safeguard)
- [ ] 19-02-PLAN.md — Rate limiting (auth, messaging, public forms)
- [ ] 19-03-PLAN.md — Input validation (Zod schemas for API endpoints)
- [ ] 19-04-PLAN.md — Logging cleanup (mask PII in logs)
- [ ] 19-05-PLAN.md — Performance (fix build error, caching headers, dependency updates)

**Scope:**
- Fix 2 API routes missing workspace authorization
- Add production safeguard for DEV_MODE bypass
- Implement rate limiting on auth/messaging/public endpoints
- Add Zod validation schemas for API inputs
- Remove/mask PII from production logs
- Fix TypeScript build error
- Add caching headers for public content
- Update outdated dependencies

---

## v1.10 — Dashboard & Notes (COMPLETE)

### Phase 20: Dashboard Stats & Notes Due Dates

**Goal:** Add dashboard with client stats and enhance notes with due dates for task management
**Depends on:** Phase 19 (security)
**Plans:** 3/3 complete

**Scope:**
- Dashboard showing total clients, new daily clients
- Tag analytics: "1on1 consultation" count (all time, today, this week, this month)
- Notes enhancement: add due_date field
- Dashboard task view: show notes with upcoming due dates

**Plans:**
- [x] 20-01: Dashboard page (interactive session)
- [x] 20-08: Fix Notes Creation Error Handling
- [x] 20-09: Dashboard Task Sorting & Complete Action

**Completed:**
- [x] Dashboard page with client stats (total, today, week, month)
- [x] Tag-based analytics (1on1 consultation with orange styling)
- [x] Notes schema update (due_date column via migration 16)
- [x] Due dates UI in notes (calendar picker with popover)
- [x] Task-like view on dashboard (upcoming tasks section)
- [x] Notes API error handling with detailed messages
- [x] Due date format validation with 400 error response
- [x] Task completion action (completed_at column + server action)
- [x] UpcomingTasks client component with optimistic UI

---

## v1.11 — Lead Management Polish + Performance (COMPLETE)

### Phase 21: Lead Management Polish + Performance

**Goal:** Polish lead management features and improve app performance
**Depends on:** Phase 20
**Plans:** 7/7 complete

**Scope:**
- Notes/Activity: Show dates, auto-update midnight WIB
- Assign dropdown: Per-row dropdown for staff assignment (auto-include new team members)
- Tags dropdown: Per-row inline tag editing
- Info box: Fix display issues
- Performance: Faster inbox/chat, faster webhooks

**Plans:**
- [x] 21-01: WIB Timezone Utilities (Wave 1)
- [x] 21-02: Contacts Pagination (Wave 1)
- [x] 21-03: Notes Dates Display with WIB (Wave 2)
- [x] 21-04: Inline Tags Dropdown (Wave 2)
- [x] 21-05: Conversations Pagination (Wave 2)
- [x] 21-06: Info Panel Extraction (Wave 3)
- [x] 21-07: Webhook Batching (Wave 3)

---

## v1.12 — Direct Lead Capture (Deferred)

### Phase 22: Direct Form to CRM + Telegram Notifications

**Goal:** Connect website forms directly to CRM database with instant Telegram notifications
**Depends on:** Phase 21
**Plans:** 2 plans

Plans:
- [ ] 22-01: Leads API + Telegram Notifications
- [ ] 22-02: Connect Pricing Form to API

**Scope:**
- API endpoint for direct lead submission (`/api/leads`)
- Pricing page form → Supabase contacts table (real-time)
- Telegram notification service (`src/lib/telegram/client.ts`)
- Notification on new lead with contact details

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
| 13. Lead Management Enhancement | v1.5 | 3/3 | Complete | 2026-01-16 |
| 14. Landing Page Refresh | v1.6 | 1/1 | Complete | 2026-01-16 |
| 15. Pricing Page | v1.6 | 2/2 | Complete | 2026-01-16 |
| 16. Pricing Form Enhancement | v2.0 | 0/1 | Not started | — |
| 17. Inbox UI/UX Fixes | v1.7 | 1/1 | Complete | 2026-01-16 |
| 18. Kapso Bot Setup | v1.8 | 0/2 | Planned | — |
| 19. Performance & Security | v1.9 | 8/8 | Complete | 2026-01-17 |
| 20. Dashboard & Notes | v1.10 | 3/3 | Complete | 2026-01-17 |
| 21. Lead Polish + Performance | v1.11 | 7/7 | Complete | 2026-01-17 |
| 22. Direct Form + Telegram | v1.12 | 0/2 | Deferred | — |
