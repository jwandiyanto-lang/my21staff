# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Your Business, On Autopilot. The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

**Current focus:** Phase 3 - Sarah Chat Bot workflow execution

## Current Position

Milestone: v2.0
Phase: Phase 3 - Sarah Chat Bot — COMPLETE ✅
Status: 4 of 4 plans complete
Last activity: 2026-01-30 — Plan 03-04 complete: Sarah integrated into WhatsApp flow

Progress: ████████████████████████████████ 100% (12 of 12 total plans across all phases)

## V2.0 Milestone

**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database

**Phases Planned:**
1. Foundation (Kapso workspace + webhook) - ✅ COMPLETED (1 plan)
2. Workflow Rules Engine (Kapso native workflows + Grok) - ✅ COMPLETED (3 plans)
2.5. Settings & Configuration (Kapso workflow management UI) - ✅ COMPLETED (5 plans)
3. Sarah Chat Bot - ✅ COMPLETED (4 plans)
4. Lead Database (Kapso → Convex sync)
5. Grok Manager Bot (Analysis + insights)
6. Dashboard (Lead list + analytics)
7. Handoff Workflow (End-to-end flow)
8. Testing & Polish

**Total Requirements:** 52+

### Phase 3 Progress: Sarah Chat Bot — COMPLETE ✅

| Plan | Status | Summary |
|------|--------|---------|
| 03-01 | ✅ Complete (executed 17:15-17:18 UTC) | Sarah persona prompts, 5-field extraction schema, Gemini API setup |
| 03-02 | ✅ Complete | Convex schema and HTTP endpoints for Sarah state storage |
| 03-03 | ✅ Complete (executed 17:54-18:12 UTC) | Kapso workflow with Gemini Agent + 7 Function nodes + state management |
| 03-04 | ✅ Complete (executed 18:17-18:49 UTC) | Sarah integrated into WhatsApp flow, end-to-end verified, all 8 tests passed |

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
- **Sarah integrated into Rules Engine** (not separate workflow) for simpler architecture
- **Dynamic configuration via function nodes** - fetch settings from Convex on every message
- **Cloudflare Workers for external API calls** in Kapso workflows
- **Fallback defaults for graceful degradation** when Convex unreachable

### Kapso Configuration

**Project:** my21staff
- Project ID: `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`
- API Key: `5dbba793f934cde00609e28ad4b1214a8c17bebac3053ad42191759a8e700ec5` (updated 2026-01-30)
- **API Access:** Use `.claude/skills/kapso-automation/scripts/` with `X-API-Key` header (NOT `Authorization: Bearer`)

**Workflow: Rules Engine - Keyword Triggers (with Sarah integrated)**
- Workflow ID: `6cae069e-7d5c-4fbb-834d-79e1f66e4672`
- Model: x-ai/grok-4.1-fast
- Status: Active (lock_version: 6, updated 2026-01-30)
- Architecture: Start → Fetch Settings → AI Decide → [handoff|manager|faq_pricing|faq_services|ai_fallback(Sarah)]

**Function: fetch-intern-settings**
- Function ID: `958a4cc3-4230-4b6c-b708-86729aa81b1a`
- Status: Deployed to Cloudflare Workers
- URL: https://fn.kapso.ai/prj-1fda0f3d-a913-4a82-bc1f-a07e1cb5213c__fetch-intern-settings
- Purpose: Fetches Sarah configuration from Convex before each message

**Workflow: Sarah Chat Bot (Advanced - DRAFT, NOT USED)**
- Workflow ID: `048c075f-bab4-4ccd-920c-fe5e9a3435b5`
- Model: Gemini 2.5 Flash (gemini-2.5-flash-preview-05-20)
- Status: Draft (created in 03-03, not activated - Sarah integrated into Rules Engine instead)
- Functions: 7 deployed (get-state, check-keywords, mark-handoff, mark-completed, extract-and-score, determine-state, save-state)
- Note: Available for future use if advanced stateful conversation needed

**Phone:**
- Phone Number ID: `957104384162113`
- Config ID: `827ce387-4f0a-4ca7-9e5a-0a3af01c9320`
- Phone: +62 813-1859-025

**Trigger:**
- Trigger ID: `bdf48a18-4c39-453a-8a81-e7d14a18fe35`
- Type: inbound_message
- Status: Active

### Pending Todos

**Completed phases:**
- ✅ Phase 1: Foundation (Kapso workspace + webhook) - 1 plan
- ✅ Phase 2: Workflow Rules Engine (Kapso native workflows) - 3 plans
- ✅ Phase 2.5: Settings & Configuration (5/5 plans complete) - 5 plans
- ✅ Phase 3: Sarah Chat Bot - 4 plans COMPLETE

**Next phases (not yet started):**
- Phase 4: Lead Database (Kapso → Convex sync)
- Phase 5: Grok Manager Bot (Analysis + insights)
- Phase 6: Dashboard (Lead list + analytics)
- Phase 7: Handoff Workflow (End-to-end flow)
- Phase 8: Testing & Polish

**Phase 3 deliverables:**
- Sarah persona definition (Indonesian-first, friendly, <280 chars)
- Convex schema for intern/brain configuration
- HTTP endpoints for settings management
- fetch-intern-settings Cloudflare Worker function
- Rules Engine workflow updated with Sarah integration
- Dynamic configuration: language, tone, emoji, message length, handoff keywords
- End-to-end verified WhatsApp conversation flow (all 8 tests passed)
- Graceful degradation with fallback defaults

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
- Sarah advanced workflow (048c075f-bab4-4ccd-920c-fe5e9a3435b5) created but not used - integrated into Rules Engine instead

### Session Continuity

**Last session:** 2026-01-30 18:49 UTC
**Stopped at:** Phase 3 COMPLETE - Sarah live on WhatsApp
**Resume file:** None

**Completed in this session:**
- 03-04: Sarah WhatsApp Integration (31 minutes)
  - Created fetch-intern-settings Cloudflare Worker function
  - Updated Rules Engine workflow with settings fetch node
  - Modified AI agent system prompt with Handlebars templates for dynamic config
  - End-to-end verification: all 8 WhatsApp tests passed
  - Sarah now responds on ai_fallback path with configurable persona

**Phase 3 Summary (4 plans, all complete):**
- 03-01: Sarah persona and prompts (3 min)
- 03-02: Convex schema and HTTP endpoints
- 03-03: Advanced Sarah workflow (18 min) - draft, not used
- 03-04: Sarah integration into Rules Engine (31 min) - LIVE ✅

---

*Last updated: 2026-01-30 — Phase 3 COMPLETE ✅, 12/12 total plans (100%)*
