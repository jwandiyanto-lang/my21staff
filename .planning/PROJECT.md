# my21staff v2

## What This Is

A WhatsApp CRM SaaS for Indonesian small businesses — education consultants and sales teams who use WhatsApp as their primary communication channel. This is a focused rebuild of v1, completing half-built features and adding a Website Manager for content-driven lead generation.

## Core Value

Two-way WhatsApp messaging from the CRM — users can send and receive messages without switching apps.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Database View** — Lead table showing all contacts with form submission answers, status badges (Hot/Warm/Cold/Converted), expandable detail sheet, and filters
- [ ] **Kapso Send + Filter** — Wire up Send button to Kapso API, load message history, filter conversations by lead status, optimistic UI for sent messages
- [ ] **Website Manager** — CMS for articles and webinars with public pages, webinar registration flows that create contacts in CRM

### Out of Scope

- Visual workflow builder — future version
- WhatsApp template messages (24h rule) — requires Meta approval process
- Self-service onboarding — manual for now
- Billing/subscriptions — not needed yet
- AI auto-reply — future version
- Multi-user chat assignment — single user per workspace for v2

## Context

**Target Users:** Indonesian education consultants, small business owners using WhatsApp for sales.

**v1 Reference:** `~/Desktop/21/my21staff/` contains working implementations of:
- Supabase auth + RLS policies
- Multi-tenant workspace architecture
- Kapso webhook for receiving messages
- Contact/Conversation/Message schema
- Form builder and submissions

**Build Approach:** Copy and adapt working code from v1. Don't reinvent — reference and reuse patterns.

**Incomplete in v1:**
- Inbox Send button is a placeholder
- Inbox doesn't load actual messages
- No lead status filtering
- Form submission responses not displayed in database view

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Supabase (PostgreSQL + Auth + RLS), Shadcn/ui, Tailwind CSS, Framer Motion
- **Design System**: CRM uses peach/forest green palette (Plus Jakarta Sans), Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp (API key exists in v1)
- **Reference**: Always reference v1 for patterns before building new

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild in new folder (v2) | Clean slate while preserving v1 reference | — Pending |
| 3 features only for v2 | Focus over feature creep | — Pending |
| Kapso over official WhatsApp API | Already integrated in v1, simpler | — Pending |

---
*Last updated: 2026-01-14 after initialization*
