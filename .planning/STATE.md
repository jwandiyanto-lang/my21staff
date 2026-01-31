# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Your Business, On Autopilot. The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

**Current focus:** Phase 6 - Dashboard (Lead list + AI insights + analytics)

## Current Position

Milestone: v2.0
Phase: Phase 6 - Dashboard — COMPLETE ✅
Status: 6 of 6 plans complete
Last activity: 2026-01-31 — Completed 06-06-PLAN.md: Dashboard Polish & Dev Mode

Progress: ████████████████████████████████████████░ 124% (31 of 25 base plans, Phase 6 complete)

## V2.0 Milestone

**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database

**Phases Planned:**
1. Foundation (Kapso workspace + webhook) - ✅ COMPLETED (1 plan)
2. Workflow Rules Engine (Kapso native workflows + Grok) - ✅ COMPLETED (3 plans)
2.5. Settings & Configuration (Kapso workflow management UI) - ✅ COMPLETED (5 plans)
3. Sarah Chat Bot - ✅ COMPLETED (4 plans)
4. Lead Database (Kapso → Convex sync) - ✅ COMPLETED (6 plans)
5. Grok Manager Bot (Analysis + insights) - ✅ COMPLETED (6 plans)
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

### Phase 4 Progress: Lead Database — COMPLETE ✅

| Plan | Status | Summary |
|------|--------|---------|
| 04-01 | ✅ Complete (executed 19:44-19:48 UTC) | Extended contacts schema with Sarah fields, lead workflow, notes timeline |
| 04-02 | ✅ Complete | Kapso webhook sync with lastActivityAt tracking |
| 04-03 | ✅ Complete (executed 19:51-19:54 UTC) | Sarah contact sync with state-to-status mapping and failure monitoring |
| 04-04 | ✅ Complete (executed 19:57-20:05 UTC) | Dashboard query functions ready for Phase 6 UI (verification deferred) |
| 04-05 | ✅ Complete | Lead management mutations (updateLeadStatus, addContactNote, syncSarahData) |
| 04-06 | ✅ Complete | Background sync service with hourly cron for stale contact detection |

### Phase 5 Progress: Grok Manager Bot — COMPLETE ✅

| Plan | Status | Summary |
|------|--------|---------|
| 05-01 | ✅ Complete (executed 2026-01-31, 2.5 min) | Brain analytics data layer (brainSummaries, brainInsights, brainActions) |
| 05-02 | ✅ Complete (executed 2026-01-31, 2.1 min) | Grok 4.1-fast integration with daily cron for conversational summaries |
| 05-03 | ✅ Complete (executed 2026-01-31, 2 min) | Weighted priority scoring with Grok-powered personalized WhatsApp templates |
| 05-04 | ✅ Complete (executed 2026-01-31, 2.8 min) | Conversation pattern analysis detecting topics, objections, rejections with FAQ suggestions |
| 05-05 | ✅ Complete (executed 2026-01-31, 2.5 min) | !summary command integration with Kapso HTTP endpoints |
| 05-06 | ✅ Complete (executed 2026-01-31, 3 min) | Kapso workflow documentation (integration deferred to go-live) |

### Phase 6 Progress: Dashboard — COMPLETE ✅

| Plan | Status | Summary |
|------|--------|---------|
| 06-01 | ✅ Complete (executed 2026-01-31, 3 min) | TanStack Table with temperature-based stage badges and sortable columns |
| 06-02 | ✅ Complete (executed 2026-01-31, 7 min) | Real-time lead filtering with multi-select stage filter, debounced search, and date presets |
| 06-03 | ✅ Complete (executed 2026-01-31, 5.6 min) | Slide-out detail panel with AI insights, notes timeline, and temperature-based guidance |
| 06-04 | ✅ Complete (executed 2026-01-31, 5 min) | Dedicated Insights page with Grok summaries, action items, patterns, and lead quality visualization |
| 06-05 | ✅ Complete (executed 2026-01-31, 3.9 min) | Lead statistics with trend indicators, time period toggle, and conversational highlights |
| 06-06 | ✅ Complete (executed 2026-01-31, 10 min) | Complete Brain analytics mock data, centralized mock architecture, full offline dev mode for dashboard and inbox |

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
- **Lead status state machine** with flexible transitions (new→qualified→contacted→converted→archived, with backwards movement)
- **Notes timeline array with 100-note limit** to prevent unbounded growth
- **Internal mutation for Sarah sync** with phase-to-status mapping (A→new, B/C→qualified, D→contacted)
- **Sync failures logged but don't break Sarah state save** - graceful degradation pattern
- **Sarah state to lead status mapping:** greeting→new, qualifying→qualified, handoff→contacted, completed→converted
- **syncFailures table with 1000-entry limit** and auto-cleanup for monitoring
- **Sync result in HTTP response** for debugging (success, sync, syncReason fields)
- **Dashboard query functions:** In-memory filtering for status (Convex compound index limitation), prioritized follow-up list by score
- **End-to-end verification deferred to Phase 6** - backend ready, UI testing when database page built
- **Three-table Brain analytics architecture** - Separate tables for summaries (text), insights (patterns), actions (recommendations) for clarity and better indexing
- **Brain operations use internal mutations** - createSummary, createInsight, createActionRecommendation are internalMutations (triggered by cron/workflow, not user actions)
- **Actions expire after 24h** - Default expiration prevents stale recommendations; cleanup via cleanupExpiredActions cron job (runs every 6 hours)
- **suggested_faqs field in brainInsights** - Optional array for MGR-06 requirement (FAQ suggestions from detected patterns)
- **Grok 4.1-fast for Brain summaries** - Cost-effective ($0.20/$0.50 per M tokens) for daily automated summaries (~$0.00014 per summary)
- **Fixed daily cron time (01:00 UTC / 09:00 WIB)** - All workspaces get summaries at same time; per-workspace times deferred to future
- **Conversational tone system prompt** - WhatsApp-optimized friendly messages (under 800 chars) instead of formal reports
- **Cost tracking in Brain API calls** - tokens_used and cost_usd stored per summary for billing/optimization
- **Weighted priority scoring for actions** - leadScore 40%, timeSinceContact 30%, engagementDecay 20%, urgencySignals 10% (configurable via ScoringWeights)
- **Action deduplication by contact** - One action per lead, highest priority wins (prevents overwhelming users)
- **Top 20 actions stored in database** - Limit dashboard display to actionable recommendations
- **Template generation limited to top 5 follow-ups** - Control Grok API costs while providing personalization for highest-priority leads
- **Graceful degradation for templates** - Fallback to generic message if Grok API fails (never block action generation)
- **api.leads queries (not internal.leads)** - leads.ts exports regular queries, use api.leads for public API access
- **Language-aware template generation** - Grok generates Indonesian or English based on sarahLanguage field from contact
- **Pattern analysis minimum threshold: 3+ examples** - Grok only reports patterns with 3+ occurrences to avoid false positives
- **FAQ suggestions integrated into pattern analysis** - Single Grok API call generates both patterns and suggested FAQs (MGR-06)
- **Token cost control for pattern analysis: 100 notes max** - Balance comprehensive analysis vs API costs (~2 weeks of activity)
- **Confidence levels for insights** - 3-4 = medium, 5+ = high based on frequency of pattern occurrence
- **Helper query must be defined before action** - Convex requirement: getContactsWithNotes query before analyzeConversationPatterns action
- **!summary command via HTTP endpoint** - POST /brain/summary generates on-demand summaries triggered by WhatsApp command
- **800-character WhatsApp limit** - All command summaries truncated to 800 chars for readability
- **Graceful fallback for !summary** - Returns friendly error message if Grok API fails (never leaves user without response)
- **Command tracking in summaries** - Stored with trigger='command' and triggered_by for usage analytics
- **TanStack Table for lead list** - Sortable, extensible table with getCoreRowModel and getSortedRowModel
- **Temperature-based stage badges** - hot (red/Flame), warm (orange/Sun), lukewarm (yellow/Sun), cold (blue/Snowflake), new (blue/Snowflake), converted (green/CheckCircle)
- **Default sort by lastActivityAt descending** - Most recent lead activity shown first for better UX
- **Icon + text labels in badges** - Accessibility requirement per 06-RESEARCH.md findings
- **MOCK_LEADS for offline dev** - 15 Indonesian business leads with variety of stages, scores, and business types
- **Insights page separate from main dashboard** - Dedicated focus view for AI analytics without cluttering dashboard (DSH-08)
- **Two-column insights layout** - (summary+actions) left, (quality+patterns) right for logical grouping (DSH-09)
- **Expandable pattern cards** - Reduce visual clutter, user controls detail level (DSH-10)
- **CSS-based horizontal bar chart** - No charting library needed, lightweight, matches minimalist brand (DSH-11)
- **Action items placeholder buttons** - Phase 6 focused on read-only display, mutations deferred to Phase 7 (DSH-12)
- **Time period toggle (Today/Week/Month)** - Dashboard stats with flexible time ranges for lead performance analysis (DSH-13)
- **Default to Week period** - Best balance for actionable timeframe (not too granular, not too broad) (DSH-14)
- **Dynamic primary stat card** - Shows most relevant "new leads" metric based on selected time period (DSH-15)
- **Centralized mock data in mock-data.ts** - Single source of truth for all dev mode mocks (no duplication across components)
- **API route dev mode pattern: isDevMode() early return** - Check dev mode at route start, return mocks before auth/external services
- **Brain analytics complete mock data** - MOCK_BRAIN_SUMMARY, MOCK_BRAIN_ACTIONS, MOCK_BRAIN_INSIGHTS, MOCK_LEAD_STATS with Indonesian content
- **Inbox API dev mode support** - /api/conversations and /api/messages endpoints return mocks when NEXT_PUBLIC_DEV_MODE=true
- **Missing /api/messages/[conversationId] endpoint created** - Phase 2.5 gap filled for inbox message display
- **Conversational highlights tailored to period** - Context-aware messaging improves readability and engagement (DSH-16)
- **Responsive stats grid (1/2/4 columns)** - Mobile: stack, Tablet: 2-col, Desktop: 4-col for optimal layout at all breakpoints (DSH-17)
- **Previous period trends with mocks** - Production will need `getLeadStatsPrevious` Convex query for real trend calculations (DSH-18)

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
- ✅ Phase 4: Lead Database (Kapso → Convex sync) - 6/6 plans COMPLETE
- ✅ Phase 5: Grok Manager Bot (Analysis + insights) - 6/6 plans COMPLETE
- ✅ Phase 6: Dashboard (Lead list + analytics) - 6/6 plans COMPLETE

**Next phases (not yet started):**
- Phase 7: Handoff Workflow (End-to-end flow)
- Phase 8: Testing & Polish

**Phase 4 deliverables:**
- Extended contacts schema with 16 Sarah extraction fields
- Lead status workflow (new → qualified → contacted → converted → archived)
- Notes timeline with 100-note limit and attribution
- Kapso webhook sync with lastActivityAt tracking
- Sarah contact sync with state-to-status mapping
- Sync failure monitoring (syncFailures table, graceful degradation)
- Lead management mutations (updateLeadStatus, addContactNote, syncSarahData)
- Background sync service with hourly cron for stale detection
- Dashboard query functions (getLeadsByStatus, getLeadsNeedingFollowUp, getLeadStats)
- Complete lead database sync pipeline ready for Phase 6 UI

**Phase 6 deliverables:**
- Lead List UI with TanStack Table (sortable columns, temperature badges)
- Real-time lead filtering (status, search, date ranges)
- Lead detail panel (slide-out sheet with AI insights, notes timeline)
- AI Insights page (daily summaries, action items, patterns, lead quality overview)
- Lead statistics dashboard (time period toggle, trend indicators, conversational highlights)
- Complete Brain analytics mock data (Indonesian sample content)
- Centralized mock data architecture (single source of truth)
- Full offline dev mode support (dashboard + inbox)
- Dev mode API routes (/api/conversations, /api/messages/send, /api/messages/[conversationId])
- Dashboard ready for Phase 7 handoff workflow integration

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
- End-to-end verification deferred to Phase 6 - backend ready, UI testing when database page built
- Previous period trend calculations use mocks - need `getLeadStatsPrevious` Convex query for production

### Session Continuity

**Last session:** 2026-01-31 03:51 UTC
**Stopped at:** Completed 06-06: Dashboard Polish & Dev Mode - SUMMARY.md created, Phase 6 COMPLETE ✅
**Resume file:** None

**Completed in this session:**
- 06-06: Dashboard Polish & Dev Mode (10 minutes)
  - Added complete Brain analytics mock data (summaries, actions, insights, stats)
  - Centralized all mocks in mock-data.ts (single source of truth)
  - Updated sidebar icons: Users for Leads, Bot for Your Team
  - Refactored insights-client to use centralized mocks
  - Added dev mode support to inbox API routes (conversations, messages)
  - Created missing /api/messages/[conversationId] endpoint
  - Verified INBX-01 to INBX-05 requirements functional
  - 4 atomic commits (ccc524f, 2bc275f, b6b1694, 73a900c)
  - Files: mock-data.ts +213 LOC, 5 modified, 1 created
  - Files: trend-indicator.tsx, lead-stats.tsx, page.tsx, dashboard-client.tsx

**Previous session (2026-01-31 03:37 UTC):**
- 06-04: AI Insights Page (5 minutes)
  - Created /[workspace]/insights page with server + client components
  - Built 4 insight components: DailySummaryCard, ActionItemsList, PatternInsights, LeadQualityOverview
  - Two-column responsive layout for insights display
  - Expandable pattern cards with examples and FAQ suggestions
  - CSS-based horizontal bar chart for lead temperature distribution
  - Added Insights navigation to sidebar with Sparkles icon
  - 3 atomic commits (7e407ea, c5ea026, d880dae)
  - Files: page.tsx, insights-client.tsx, daily-summary-card.tsx, action-items-list.tsx, pattern-insights.tsx, lead-quality-overview.tsx, sidebar.tsx

**Previous session (2026-01-31 01:45 UTC):**
- 05-01: Brain Analytics Data Layer (2.5 minutes)
  - Added three Brain analytics tables to schema (brainSummaries, brainInsights, brainActions)
  - Created brainSummaries.ts with 4 CRUD operations
  - Created brainInsights.ts with 3 CRUD operations (includes suggested_faqs for MGR-06)
  - Created brainActions.ts with 6 operations (includes cleanup for expired actions)
  - All functions compiled and deployed successfully
  - 3 atomic commits, 444 LOC added

- 05-02: Grok Integration for Pattern Analysis (2.1 minutes)
  - Created brainAnalysis.ts with Grok 4.1-fast API integration
  - Implemented conversational summary generation (friendly, WhatsApp-optimized)
  - Added daily summary cron (01:00 UTC / 09:00 WIB) and action cleanup cron (every 6h)
  - Cost tracking built in ($0.20/$0.50 per M tokens)
  - Workspace iteration with Brain-enabled filtering
  - All functions compiled and deployed successfully
  - 2 atomic commits, 251 LOC added

- 05-03: Action Recommendation Engine (2 minutes)
  - Extended brainAnalysis.ts with action recommendation logic
  - Implemented weighted priority scoring (leadScore 40%, timeSinceContact 30%, engagementDecay 20%, urgencySignals 10%)
  - Added opportunity detection (budget, competitor, urgency, demo signals)
  - Grok-powered personalized WhatsApp message templates (top 5 follow-ups, <200 chars)
  - Deduplication by contact (highest priority wins), top 20 stored in database
  - All functions compiled and deployed successfully
  - 3 atomic commits, 185 LOC added

- 05-04: Conversation Pattern Analysis (2.8 minutes)
  - Extended brainAnalysis.ts with pattern detection logic
  - Implemented trending topics, objections, interest signals, rejection reasons analysis
  - Added FAQ auto-suggestion for topics and objections (MGR-06)
  - Confidence scoring (3+ = medium, 5+ = high)
  - Token limit (100 notes max) for cost control
  - Helper query defined before action (Convex requirement)
  - All functions compiled and deployed successfully
  - 3 atomic commits, 328 LOC added

- 05-05: !summary Command Integration (2.5 minutes)
  - Added generateCommandSummary internalAction for on-demand summaries
  - Created POST /brain/summary HTTP endpoint for Kapso workflow integration
  - Created GET /brain/summary endpoint for latest summary retrieval
  - 800-character WhatsApp limit enforcement with graceful fallback
  - Comprehensive Kapso workflow integration documentation
  - All functions compiled and deployed successfully
  - 3 atomic commits, 236 LOC added

**Phase 5 Progress (6/6 plans) - COMPLETE ✅:**
- 05-01: Brain Analytics Data Layer (2.5 min) - COMPLETE ✅
- 05-02: Grok integration for pattern analysis (2.1 min) - COMPLETE ✅
- 05-03: Action recommendation engine (2 min) - COMPLETE ✅
- 05-04: Conversation pattern analysis (2.8 min) - COMPLETE ✅
- 05-05: !summary command integration (2.5 min) - COMPLETE ✅
- 05-06: Kapso workflow documentation (3 min) - COMPLETE ✅

**Phase 6 Progress (5/6+ plans):**
- 06-01: Lead List UI (3 min) - COMPLETE ✅
- 06-02: Lead Filtering & Search (7 min) - COMPLETE ✅
- 06-03: Lead Detail Panel (5.6 min) - COMPLETE ✅
- 06-04: AI Insights Page (5 min) - COMPLETE ✅
- 06-05: Lead Stats with Trends (3.9 min) - COMPLETE ✅

**Phase 6-05 Deliverables:**
- TrendIndicator component: Reusable arrow with percentage display (green/red/gray)
- LeadStats component: 4 stat cards (Total, New period-based, Hot, Avg Score)
- Time period toggle: Today/Week/Month tabs with default to Week
- Dynamic primary stat card: Shows relevant "new leads" metric based on period
- Conversational highlights: Period-aware natural language summaries
- Responsive grid: 1 col mobile / 2 col tablet / 4 col desktop
- Dashboard page updated to render stats at hero position (removed /your-team redirect)
- Full dev mode support with comprehensive mock trends

---

*Last updated: 2026-01-31 — Phase 6 in progress, 30/25+ total plans*
