# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Multi-tenant admin with AI-powered WhatsApp responses, lead management, and automation.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current State (v2.0 — Fresh Start)

**Production URL:** https://www.my21staff.com

**Convex Deployment:** https://intent-otter-212.convex.cloud

**v2.0 Status:** Fresh feature rebuild. Infrastructure preserved from v1.0.0.

**What's preserved from v1.0.0:**
- Production deployment infrastructure (Vercel + Convex)
- Authentication system (Clerk with organizations)
- Core integrations (Kapso WhatsApp API)
- Development patterns (dev mode, testing approach)

**What's reset for v2.0:**
- All features (rebuilding from scratch)
- Workspace approach (Eagle workspace being deactivated)
- Feature roadmap (defining fresh requirements)

**Tech Stack:**
- Next.js 15 + React 19 + TypeScript
- Clerk (Authentication + Organizations)
- Convex (Database + Real-time)
- Shadcn/ui + Tailwind CSS
- Kapso API for WhatsApp
- Grok API + Sea-Lion (Ollama) for AI

**Codebase Documentation:**
See `.planning/codebase/` for detailed stack, architecture, and conventions analysis.

**v1.0.0 Archive:**
See `.planning/archive/v1.0.0/` for previous milestone history.

## Requirements

### Active (v2.0 Planning)

To be defined. Use `/gsd:new-project` or `/gsd:new-milestone` to start fresh requirements gathering.

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
- **Integration**: Kapso API for WhatsApp, Resend for email
- **AI Models**: Grok API + Sea-Lion (Ollama at 100.113.96.25:11434)
- **Deployment**: Vercel + Convex Cloud
- **Architecture**: Database is single source of truth - all features read from Database API

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| V1.0.0 → V2.0 reset | Fresh feature approach, keep infrastructure | ✓ Clean slate |
| Archive Eagle workspace | Deactivate first client workspace | — Pending |
| Keep Convex + Clerk + Vercel | Infrastructure proven and working | ✓ Good |
| Preserve codebase map | Document current state before changes | ✓ Good |

## Next Milestone: v2.0 (TBD)

**Status:** Planning phase

**Ready to define:**
- New feature requirements
- Roadmap phases
- Implementation approach

**Use `/gsd:new-project` or `/gsd:new-milestone` to start v2.0 planning**

---
*Last updated: 2026-01-30 — V1.0.0 archived, V2.0 fresh start*
