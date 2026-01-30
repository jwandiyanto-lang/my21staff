# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Your Business, On Autopilot. The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

**Current focus:** Phase 2.5 - Settings & Configuration (Plan 04 - WhatsApp Inbox - just completed)

## Current Position

Milestone: v2.0
Phase: Phase 2.5 - Settings & Configuration
Plan: 4 of 5 plans complete
Status: Phase 2.5 IN PROGRESS 🔄
Last activity: 2026-01-30 — Plan 04 completed: WhatsApp Inbox with Kapso API integration

Progress: ███████████████░░░░░░░░░░░░░░ 58% (7 of 12 total plans across all phases)

## V2.0 Milestone

**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database

**Phases Planned:**
1. Foundation (Kapso workspace + webhook) - COMPLETED (1 plan)
2. Workflow Rules Engine (Kapso native workflows + Grok) - ✅ COMPLETED (3 plans)
2.5. Settings & Configuration (Kapso workflow management UI) - 🔄 IN PROGRESS (4 of 5 plans complete)
3. Sarah Chat Bot (Gemini 2.5 + persona) - PLANNING
4. Lead Database (Kapso → Convex sync)
5. Grok Manager Bot (Analysis + insights)
6. Dashboard (Lead list + analytics)
7. Handoff Workflow (End-to-end flow)

**Total Requirements:** 52+

## V1.0.0 Archive Summary

**Archived:** 2026-01-30
**Location:** `.planning/archive/v1.0.0/`

**What was preserved:**
- Production infrastructure (Vercel + Convex + Clerk)
- Core integrations (Kapso WhatsApp API)
- Development patterns
- Codebase documentation (`.planning/codebase/`)

**What was reset:**
- All features (rebuilding from scratch)
- Milestone history (archived)
- Phase execution logs (archived)
- Eagle workspace (archived, new my21staff workspace for v2.0)

## Accumulated Context

### Decisions

All current decisions are logged in `.planning/PROJECT.md` Key Decisions table.

**v2.0 decisions:**
- **Kapso native workflows** (not custom code) for all automation
- Kapso is the **source of truth** for workflows
- Convex is a **read mirror** for dashboard display only (Phase 4+)
- **Grok 4.1-fast** for AI decisions and responses in workflows
- **AI decide node** for intent classification (handoff, manager, FAQs, general)
- **Agent node** for AI fallback (Sarah persona)
- Rule-first, AI-fallback approach (keyword triggers checked first)
- **"Your Team" navigation** with Intern (Sarah) and Brain (Grok) tabs for dual-bot configuration
- **URL-based tab state** (?tab=intern|brain) for shareable links
- **Backwards-compatible redirect** from /knowledge-base to /your-team
- **Bot names stored in separate Convex table** (botConfig) for type safety and queryability
- **Default bot names: Sarah (Intern), Grok (Brain)** to match existing brand persona
- **Kapso API direct integration** for inbox (not Convex mirror)
- **10-second conversation polling / 5-second message polling** for real-time updates (Kapso doesn't support WebSocket)
- **Next.js API routes** proxy Kapso operations for auth and CORS handling
- **Bot settings auto-save on change** (no submit button) for better UX
- **localStorage persistence for dev mode** bot configurations
- **Deep merge utility** preserves nested config structure during updates
- **Brain scoring weights must total 100%** with validation warning
- **Settings backup non-blocking pattern** - saves succeed even if backup fails
- **Dev mode shows "Offline Mode" indicator** and skips backup network calls
- **Sync status tracked per-workspace** with last sync time, status, and error fields
- **Two-panel inbox layout** (conversation list + message view) with my21staff green/orange branding
- **Geist Mono font** for inbox data fields (phone numbers, timestamps, message content)
- **Optimistic message sending** with rollback on error for better UX
- **TypeScript literal types** for message direction to ensure type safety

### Kapso Configuration

**Project:** my21staff
- Project ID: `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`
- API Key: `da99e74e320048a32cc3ff818615bed93a53f39bb62ce073ef8cffa85e778cc6`

**Workflow:** Rules Engine - Keyword Triggers
- Workflow ID: `6cae069e-7d5c-4fbb-834d-79e1f66e4672`
- Model: x-ai/grok-4.1-fast
- Status: Active

**Phone:**
- Phone Number ID: `957104384162113`
- Config ID: `827ce387-4f0a-4ca7-9e5a-0a3af01c9320`
- Phone: +62 813-1859-025

**Trigger:**
- Trigger ID: `bdf48a18-4c39-453a-8a81-e7d14a18fe35`
- Type: inbound_message
- Status: Active

### Pending Todos

**Phase 2.5: 🔄 IN PROGRESS**
Plans completed (4 of 5):
- ✅ Your Team Navigation & Layout
- ✅ Bot Name Configuration
- ✅ Bot Configuration Components (Intern & Brain)
- ✅ WhatsApp Inbox (Kapso API integration, template/interactive messages)
- ✅ Settings Backup & Sync Status

**Next:** Plan 05 - Final Phase 2.5 plan (TBD)

### Blockers/Concerns

**Production WhatsApp sending not yet functional:** Requires workspace settings table to store Kapso API credentials. Template sending endpoint (`/api/whatsapp/send`) referenced in MessageView but not yet created.

### Session Continuity

**Last session:** 2026-01-30 15:27 UTC
**Stopped at:** Phase 2.5 Plan 04 completed - WhatsApp Inbox fully functional with dev mode support
**Resume file:** None

---

*Last updated: 2026-01-30 — Phase 2.5 IN PROGRESS 🔄 (4/5 plans), 7/12 total plans (58%)*
