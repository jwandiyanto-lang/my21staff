# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Multi-tenant admin with AI-powered WhatsApp responses, lead management, and automation.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current State

**Production URL:** https://www.my21staff.com

**Convex Deployment:** https://intent-otter-212.convex.cloud

**Latest Shipped:** v2.0 WhatsApp CRM (2026-02-01)

**What's live in production:**
- WhatsApp integration via Kapso (+62 813-1859-025)
- Dual-bot AI (Sarah chatbot + Brain analytics with Grok 4.1-fast)
- Lead database with real-time Convex sync
- Dashboard with AI insights and embedded Kapso inbox
- Production deployment with Clerk authentication

**Codebase:**
- ~62,000 LOC TypeScript (44,337 frontend + 17,751 backend)
- 9 phases shipped in 2 days (32/35 plans complete)

**Tech Stack:**
- Next.js 15 + React 19 + TypeScript
- Clerk (Authentication + Organizations)
- Convex (Database + Real-time)
- Shadcn/ui + Tailwind CSS
- Kapso API for WhatsApp (inbox + messaging)
- Gemini 2.5 Flash (chat bot) + Grok 2 (manager bot)

**Codebase Documentation:**
See `.planning/codebase/` for detailed stack, architecture, and conventions analysis.

**v1.0.0 Archive:**
See `.planning/archive/v1.0.0/` for previous milestone history.

## Requirements

### Validated

**v2.0 (Shipped 2026-02-01):**
- ✓ Kapso workspace setup with Indonesian WhatsApp number — v2.0
- ✓ Workflow rules engine with AI-powered routing (Grok 4.1-fast) — v2.0
- ✓ Settings & configuration management (Intern + Brain tabs) — v2.0
- ✓ Sarah chatbot integration for lead qualification — v2.0
- ✓ Lead database with Kapso → Convex sync — v2.0
- ✓ Grok Manager Bot for AI analytics and insights — v2.0
- ✓ Dashboard with lead list, filters, and AI insights — v2.0
- ✓ Embedded Kapso inbox for WhatsApp messaging — v2.0
- ✓ Handoff workflow with lead scoring — v2.0
- ✓ Production deployment to www.my21staff.com — v2.0

(69 requirements total — see `.planning/milestones/v2.0-REQUIREMENTS.md`)

### Active

(Next milestone requirements will be defined via `/gsd:new-milestone`)

### Out of Scope

- Visual workflow builder
- WhatsApp template messages (requires Meta approval)
- Self-service onboarding
- Billing/subscriptions (not needed yet)
- Multi-user chat assignment
- Google Calendar integration
- Voice note transcription
- Document upload handling
- Video call support
- WhatsApp Flows (requires Meta approval)
- Voice agent integration

## Context

**The Message:** No system = Can't grow. I help you build that system.

**Target Users:** Indonesian SMEs who have leads everywhere but no system to manage them.

**Organizations (Clerk):**
- Eagle Overseas: Being deactivated/archived

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript, Clerk (Auth) + Convex (Data), Shadcn/ui, Tailwind CSS
- **Design System**: CRM uses cool green palette, Landing uses sage/orange (Plus Jakarta Sans + Inter)
- **Integration**: Kapso API for WhatsApp (inbox + messaging), Resend for email
- **AI Models**: Gemini 2.5 Flash (Sarah chat bot), Grok 2 (manager/analysis)
- **Deployment**: Vercel + Convex Cloud
- **Architecture**: Database is single source of truth - all features read from Database API
- **Kapso Workspace**: New my21staff workspace (separate from Eagle, provisioned Indonesian number)
- **Bot Persona**: "Sarah" - warm, efficient, conversational (under 140 chars, 1 emoji per message)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| V1.0.0 → V2.0 reset | Fresh feature approach, keep infrastructure | ✓ Clean slate |
| Dual-bot architecture | Gemini for chat (photos), Grok for analysis (deeper reasoning) | — Pending |
| Command-based bot switching | !Summary triggers Grok, otherwise Sarah handles all messages | — Pending |
| Kapso inbox integration | Use Kapso's existing conversation/message structure vs building custom | ✓ Good |
| New my21staff workspace | Separate from Eagle (different brand, features, bot setup) | — Pending |
| Provision WhatsApp number | Kapso auto-provisions Indonesian number vs connecting existing | — Pending |
| Sarah persona (intake specialist) | Focused 4-slot collection (Name, Service, Budget, Timeline) vs open-ended chat | — Pending |
| Combo handoff workflow | Dashboard alert + WhatsApp notification + auto-reply vs single channel | — Pending |
| Keep Convex + Clerk + Vercel | Infrastructure proven and working | ✓ Good |

## Next Milestone

Ready to plan next iteration. Run `/gsd:new-milestone` to begin.

---
*Last updated: 2026-02-01 after v2.0 milestone completion*
