# my21staff v2

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM + AI team for Indonesian SMEs. Not just software — guidance from real business experience.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Requirements

### Validated

- ✓ **Database View** — Lead table with form submissions, status badges, filters, detail sheet — v1.0
- ✓ **Kapso Send + Filter** — Send messages via Kapso API, load message history, status filtering, optimistic UI — v1.0
- ✓ **Website Manager** — CMS for articles/webinars, public pages, registration flows creating contacts — v1.0

### Active

- [ ] Production deployment and testing
- [ ] Real Kapso API integration (currently dev mode mock)
- [ ] Supabase migration execution

### Out of Scope

- Visual workflow builder — future version
- WhatsApp template messages (24h rule) — requires Meta approval process
- Self-service onboarding — manual for now
- Billing/subscriptions — not needed yet
- AI auto-reply — future version
- Multi-user chat assignment — single user per workspace for v2

## Context

**The Message:** No system = Can't grow. I help you build that system.

**Target Users:** Indonesian SMEs who have leads everywhere but no system to manage them.

**Current State (v1.0):**
- 9,043 lines TypeScript, Next.js 15 + React 19
- Tech stack: Supabase (PostgreSQL + Auth + RLS), Shadcn/ui, Tailwind CSS
- Dev mode with mock data for local testing
- Schema ready for Supabase migration

**v1 Reference:** `~/Desktop/21/my21staff/` was used for patterns (auth, RLS, Kapso integration).

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Supabase (PostgreSQL + Auth + RLS), Shadcn/ui, Tailwind CSS, Framer Motion
- **Design System**: CRM uses peach/forest green palette (Plus Jakarta Sans), Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp (API key exists in v1)
- **Reference**: Always reference v1 for patterns before building new

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild in new folder (v2) | Clean slate while preserving v1 reference | ✓ Good — clean codebase |
| 3 features only for v2 | Focus over feature creep | ✓ Good — all 3 shipped |
| Kapso over official WhatsApp API | Already integrated in v1, simpler | ✓ Good — working integration |
| Dev mode bypass for local testing | Test without Supabase/Kapso setup | ✓ Good — fast iteration |
| Multi-env Supabase via SUPABASE_ENV | Switch dev/prod with one variable | ✓ Good — flexible |
| Simplified v2 schema (core tables) | Only what's needed for v2 features | ✓ Good — lean schema |
| Public SELECT for articles/webinars | No auth required for public pages | ✓ Good — lead gen works |
| Contact lookup before create | Prevent duplicate contacts on registration | ✓ Good — clean data |

---
*Last updated: 2026-01-14 after v1.0 milestone*
