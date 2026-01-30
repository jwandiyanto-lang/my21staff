# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Your Business, On Autopilot. The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

**Current focus:** Phase 3 - Sarah Chat Bot workflow execution

## Current Position

Milestone: v2.0
Phase: Phase 3 - Sarah Chat Bot — IN PROGRESS
Status: 3 of 4 plans complete
Last activity: 2026-01-30 — Plan 03-03 complete: Sarah workflow created in Kapso

Progress: ███████████████████░░░░░░░░░░ 92% (11 of 12 total plans across all phases)

## V2.0 Milestone

**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database

**Phases Planned:**
1. Foundation (Kapso workspace + webhook) - ✅ COMPLETED (1 plan)
2. Workflow Rules Engine (Kapso native workflows + Grok) - ✅ COMPLETED (3 plans)
2.5. Settings & Configuration (Kapso workflow management UI) - ✅ COMPLETED (5 plans)
3. Sarah Chat Bot - ✅ PLAN 01 COMPLETE, ✅ PLAN 02 COMPLETE, ✅ PLAN 03 COMPLETE
4. Lead Database (Kapso → Convex sync)
5. Grok Manager Bot (Analysis + insights)
6. Dashboard (Lead list + analytics)
7. Handoff Workflow (End-to-end flow)
8. Testing & Polish

**Total Requirements:** 52+

### Phase 3 Progress: Sarah Chat Bot

| Plan | Status | Summary |
|------|--------|---------|
| 03-01 | ✅ Complete (executed 17:15-17:18 UTC) | Sarah persona prompts, 5-field extraction schema, Gemini API setup |
| 03-02 | ✅ Complete | Convex schema and HTTP endpoints for Sarah state storage |
| 03-03 | ✅ Complete (executed 17:54-18:12 UTC) | Kapso workflow with Gemini Agent + 7 Function nodes + state management |

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
- API Key: `5dbba793f934cde00609e28ad4b1214a8c17bebac3053ad42191759a8e700ec5` (updated 2026-01-30)
- **API Access:** Use `.claude/skills/kapso-automation/scripts/` with `X-API-Key` header (NOT `Authorization: Bearer`)

**Workflow: Rules Engine - Keyword Triggers**
- Workflow ID: `6cae069e-7d5c-4fbb-834d-79e1f66e4672`
- Model: x-ai/grok-4.1-fast
- Status: Active

**Workflow: Sarah Chat Bot**
- Workflow ID: `048c075f-bab4-4ccd-920c-fe5e9a3435b5`
- Model: Gemini 2.5 Flash (gemini-2.5-flash-preview-05-20)
- Status: Draft (requires activation + env vars)
- Functions: 7 deployed (get-state, check-keywords, mark-handoff, mark-completed, extract-and-score, determine-state, save-state)

**Phone:**
- Phone Number ID: `957104384162113`
- Config ID: `827ce387-4f0a-4ca7-9e5a-0a3af01c9320`
- Phone: +62 813-1859-025

**Trigger:**
- Trigger ID: `bdf48a18-4c39-453a-8a81-e7d14a18fe35`
- Type: inbound_message
- Status: Active

### Pending Todos

**Phase 3: Sarah Chat Bot - IN PROGRESS**

Completed:
- ✅ 03-01: Sarah persona definition and Kapso workflow architecture
- ✅ 03-02: Convex schema and HTTP endpoints for state storage
- ✅ 03-03: Kapso workflow with Gemini Agent + 7 Function nodes

Next:
- 03-04: Sarah lead scoring algorithm refinement (already implemented in extract-and-score function)

**Completed phases:**
- ✅ Phase 1: Foundation (Kapso workspace + webhook)
- ✅ Phase 2: Workflow Rules Engine (Kapso native workflows)
- ✅ Phase 2.5: Settings & Configuration (5/5 plans complete)

**Phase 2.5 deliverables:**
- Your Team page with Intern/Brain tabs
- Bot name configuration in Settings
- InternSettings & BrainSettings components with auto-save
- Kapso WhatsApp inbox (conversation list + message view)
- Settings backup & sync status indicator
- Dev mode offline support with mock data

### Blockers/Concerns

**Kapso API Authentication - RESOLVED (2026-01-30):**
- ✅ Correct API key: `5dbba793f934cde00609e28ad4b1214a8c17bebac3053ad42191759a8e700ec5`
- ✅ Correct header format: `X-API-Key` (NOT `Authorization: Bearer`)
- ✅ Automation scripts work perfectly with proper env vars
- All workflows and functions created successfully

**Known technical debt:**
- Production WhatsApp sending requires workspace settings table to store Kapso API credentials
- Template sending endpoint (`/api/whatsapp/send`) referenced in MessageView but not yet created
- Intern/Brain config Convex storage has TODO comments (acceptable per phase scope)
- Sarah workflow requires manual activation + env vars (Kapso API limitation for variable CRUD)

### Session Continuity

**Last session:** 2026-01-30 18:12 UTC
**Stopped at:** Phase 3 Plan 3 complete - Sarah workflow created in Kapso
**Resume file:** None

**Completed in this session:**
- 03-03: Sarah Chat Bot workflow in Kapso (18 minutes)
  - Created workflow with 12 nodes (1 start, 7 function, 1 agent, 1 decide, 2 send_text)
  - Deployed 7 functions to Cloudflare Workers
  - Configured Gemini 2.5 Flash Agent with 800+ word system prompt
  - Implemented 0-100 lead scoring algorithm
  - Connected state management to Convex HTTP endpoints

---

*Last updated: 2026-01-30 — Phase 3 Plan 3 COMPLETE ✅, 11/12 total plans (92%)*
