# my21staff

## What This Is

**No system = Can't grow. I help you build that system.**

WhatsApp CRM SaaS for Indonesian SMEs. Multi-tenant admin with AI-powered WhatsApp responses, lead management, and automation.

## Core Value

The system that lets you grow. Lead management, proposal organization, follow-up automation — all guided by someone who's been in business, not just developers selling software.

## Current State (v2.0 — Fresh Start)

**Production URL:** https://www.my21staff.com

**Convex Deployment:** https://intent-otter-212.convex.cloud

**v2.0 Status:** Requirements defined. Ready for roadmap creation.

**What's preserved from v1.0.0:**
- Production deployment infrastructure (Vercel + Convex)
- Authentication system (Clerk with organizations)
- Core integrations (Kapso WhatsApp API)
- Development patterns (dev mode, testing approach)

**What's new in v2.0:**
- Dual-bot AI architecture (Gemini + Grok)
- Kapso inbox integration (direct message sync)
- Lead database with AI analysis
- Dashboard with insights and recommendations
- New my21staff workspace (separate from Eagle)

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

(None yet — ship v2.0 to validate)

### Active (v2.0)

**Kapso Integration:**
- [ ] Create new my21staff workspace in Kapso
- [ ] Provision Indonesian WhatsApp number via Kapso
- [ ] Sync all Kapso conversations to local database
- [ ] Sync all Kapso messages to local database
- [ ] Store contact info (phone, name, last contact date)

**Sarah Chat Bot (Gemini 2.5):**
- [ ] Gemini 2.5 Flash integration for chat responses
- [ ] Sarah persona implementation (warm, efficient, under 140 chars)
- [ ] 4-slot data collection (Name, Service, Budget, Timeline)
- [ ] Photo/image handling capability
- [ ] Trigger word detection (!Summary, HANDOVER_REQUIRED)
- [ ] Price range responses (never specific prices)

**Lead Database:**
- [ ] Contact storage (phone, name, profile)
- [ ] Message history storage (all Kapso messages)
- [ ] Custom fields (service needed, budget, timeline)
- [ ] Lead status tracking (new, qualified, contacted, etc.)
- [ ] Timestamp tracking (created, last message, last contact)

**Grok Manager Bot:**
- [ ] Grok 2 integration for analysis
- [ ] !Summary command handler
- [ ] Daily lead summary generation
- [ ] Lead quality scoring (hot/warm/cold)
- [ ] Action items generation (who needs follow-up)
- [ ] Content recommendations based on incoming questions

**Dashboard - Lead List:**
- [ ] Display all leads from database
- [ ] Show contact info and status
- [ ] Filter by status/date
- [ ] Search by name/phone
- [ ] Click to view full conversation history

**Dashboard - AI Insights:**
- [ ] Display Grok's daily summaries
- [ ] Show lead quality scores
- [ ] Display action items
- [ ] Show content recommendations
- [ ] Refresh insights on demand

**Dashboard - Analytics:**
- [ ] Total leads counter
- [ ] New leads today/week/month
- [ ] Response rate metrics
- [ ] Lead stage distribution chart
- [ ] Common questions/topics trending

**Handoff Workflow:**
- [ ] Detect HANDOVER_REQUIRED trigger (4 slots filled OR user asks for human)
- [ ] Dashboard alert/notification for new qualified leads
- [ ] WhatsApp notification to business owner with lead summary
- [ ] Auto-reply to lead: "Jon will reach out soon"
- [ ] Mark lead as "pending human contact" in database

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

## Next Milestone: v2.0

**Status:** Requirements defined, ready for roadmap

**Core Features:**
- Kapso workspace + WhatsApp number provisioning
- Dual-bot AI (Sarah chat + Grok manager)
- Lead database with message sync
- Dashboard with insights, analytics, recommendations
- Handoff workflow (combo approach)

**Next Steps:**
1. Research Kapso Platform API + WhatsApp Cloud API patterns
2. Create detailed requirements document (REQUIREMENTS.md)
3. Generate roadmap with phases
4. Begin Phase 1 implementation

---
*Last updated: 2026-01-30 — V2.0 requirements defined*
