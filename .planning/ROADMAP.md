# Roadmap: my21staff

## Milestones

- ✅ **v3.3 Go Live** - Phases 1-6 (shipped 2026-01-27)
- 🚧 **v3.4 Kapso Inbox Integration** - Phases 1-6 (in progress)

## Phases

<details>
<summary>✅ v3.3 Go Live (Phases 1-6) - SHIPPED 2026-01-27</summary>

### Phase 1: Deployment

**Goal**: Production environment is live and accessible with all integrations configured

**Depends on**: Nothing (first phase)

**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04

**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Create Vercel project, configure env vars, verify deployment

### Phase 2: Kapso Integration

**Goal**: WhatsApp messages flow through Kapso webhook and bot can respond

**Depends on**: Phase 1

**Requirements**: KAPSO-01, KAPSO-02, KAPSO-03, KAPSO-04

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Configure Eagle workspace Kapso credentials
- [x] 02-02-PLAN.md — Create ARI configuration for Eagle workspace
- [x] 02-03-PLAN.md — End-to-end verification of webhook, messaging, and inbox

### Phase 3: AI System

**Goal**: Dual-AI architecture working — "The Mouth" for conversations, "The Brain" for analysis

**Depends on**: Phase 2

**Requirements**: AI-01, AI-02, AI-03, AI-04

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Foundation: aiUsage schema, Anthropic SDK, workspace linkage fix
- [x] 03-02-PLAN.md — The Mouth: Sea-Lion/Grok conversational AI module
- [x] 03-03-PLAN.md — The Brain: Claude Haiku analytical AI module
- [x] 03-04-PLAN.md — Wire orchestration: Mouth+Brain in processARI, E2E verification

### Phase 3.1: Inbox Enhancement (INSERTED)

**Goal**: Add missing inbox features from v2.0 - profile sidebar, AI/Human handover toggle, merge contacts

**Depends on**: Phase 3

**Plans:** 1 plan

Plans:
- [x] 03.1-01-PLAN.md — Profile sidebar, handover toggle, merge integration

### Phase 4: Bot Workflow

**Goal**: WhatsApp bot greets new leads, qualifies them with questions, and routes to community or consultation

**Depends on**: Phase 3

**Requirements**: BOT-01, BOT-02, BOT-03, BOT-04, BOT-05, BOT-06

**Plans:** 6 plans

Plans:
- [x] 04-01-PLAN.md — State-aware greeting prompt (QualificationContext + greeting instructions)
- [x] 04-02-PLAN.md — State-aware qualifying prompt (document collection flow)
- [x] 04-03-PLAN.md — Routing prompt + Eagle FAQ knowledge
- [x] 04-04-PLAN.md — Wire state/context through processARI to Mouth
- [x] 04-05-PLAN.md — Human notification on consultation request
- [x] 04-06-PLAN.md — E2E verification of complete bot workflow

### Phase 5: Lead Flow

**Goal**: Leads flow from n8n webhook into Convex CRM with correct data and status tracking

**Depends on**: Phase 1

**Requirements**: LEAD-01, LEAD-02, LEAD-03

**Plans:** 8 plans

Plans:
- [x] 05-01-PLAN.md — Verify n8n webhook endpoint in production
- [x] 05-02-PLAN.md — Verify lead data and phone normalization
- [x] 05-03-PLAN.md — Verify lead status update workflow (GAP: status mismatch found)
- [x] 05-04-PLAN.md — Rename "Lead Management" to "Database" in UI
- [x] 05-05-PLAN.md — Fix DELETE and UPDATE contact functionality (testing deferred)
- [x] 05-06-PLAN.md — Schema + Backend for configurable status stages (gap closure)
- [x] 05-07-PLAN.md — Settings UI for lead stage configuration (gap closure)
- [x] 05-08-PLAN.md — Human verification of status system + CRUD endpoints (gap closure)

### Phase 6: UI Polish

**Goal**: Fix critical production bugs and ensure dev/production environment parity

**Depends on**: Phase 5

**Plans:** 5 plans

Plans:
- [x] 06-01-PLAN.md — Fix Database page dev mode check (executed but didn't fix bug)
- [x] 06-02-PLAN.md — Fix Settings page dev mode check (executed but didn't fix bug)
- [x] 06-03-PLAN.md — Fix Settings page SSR auth crash (gap closure - move AI config to client)
- [x] 06-04-PLAN.md — Fix Database dropdown closure bug (gap closure - add key props)
- [x] 06-05-PLAN.md — Sync dev mode database with production schema (gap closure - environment parity)

</details>

## v3.4 Kapso Inbox Integration (In Progress)

**Milestone Goal:** Replace Inbox with Kapso's WhatsApp-first UI and fix Your Intern production crashes. Build complete bot configuration UI (5 tabs) and integrate end-to-end automation flow. Eagle Overseas has modern interface with fully configurable AI.

### Phase 1: Agent Skills Setup
**Goal**: Install Kapso agent-skills MCP for improved development workflow
**Depends on**: Nothing (development tool, execute first)
**Requirements**: DEV-01
**Success Criteria** (what must be TRUE):
  1. agent-skills MCP installed via `npx skills add gokapso/agent-skills`
  2. MCP server appears in Claude Code skill list
  3. Can execute at least one Kapso command (e.g., list contacts, send test message)
  4. Kapso API key configured and authenticated
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Install agent-skills, configure MCP server, verify Kapso tools

### Phase 2: Your Intern Debug
**Goal**: Your Intern page loads without errors in dev mode, removing P0 blocker for admin configuration work
**Depends on**: Nothing (critical path, execute first)
**Requirements**: INTERN-01
**Success Criteria** (what must be TRUE):
  1. Your Intern page loads at `/demo/knowledge-base` without JS errors
  2. Page loads in dev mode with mock data (no Clerk auth required)
  3. All UI elements render without crash (tabs visible, no console errors)
  4. User can click between tabs without page reload required
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Create page.tsx, add dev mode handling to API routes
- [x] 02-02-PLAN.md — Add error boundaries to tabs, verify page resilience

### Phase 3: Your Intern Configuration
**Goal**: User can configure bot behavior with global AI toggle. All 5 tabs (Persona, Flow, Database, Scoring, Slots) already implemented from v2.2 — this phase adds master on/off control.
**Depends on**: Phase 2 (page must load first)
**Requirements**: INTERN-07 (Global AI toggle)
**Success Criteria** (what must be TRUE):
  1. Global AI toggle (master on/off button) visible at top of page above tabs
  2. Toggle state persists across page refresh
  3. When toggle OFF, processARI skips execution (no AI responses)
  4. When toggle ON, processARI resumes (AI responds automatically)
  5. Visual feedback shows AI enabled vs disabled state clearly
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Create AIToggle component, integrate into page above tabs
- [x] 03-02-PLAN.md — Wire toggle to processARI gate (skip when disabled)

**Note:** Requirements INTERN-02 to INTERN-06 already complete from v2.2:
- ✓ INTERN-02: Persona tab (bot name, description, tone) — src/components/knowledge-base/persona-tab.tsx
- ✓ INTERN-03: Flow tab (conversation stages with add/edit/delete/reorder) — src/components/knowledge-base/flow-tab.tsx
- ✓ INTERN-04: Database tab (knowledge categories + entries CRUD) — src/components/knowledge-base/database-tab.tsx
- ✓ INTERN-05: Scoring tab (hot/warm/cold thresholds + category weights) — src/components/knowledge-base/scoring-tab.tsx
- ✓ INTERN-06: Slots tab (consultation schedule with day/time/duration) — src/components/knowledge-base/slot-manager.tsx

### Phase 4: Inbox UI & Filtering
**Goal**: Conversations display with Kapso's WhatsApp-first UI; user can filter by status (hot/warm/cold/new/client/lost) and tags
**Depends on**: Phase 2 (auth working), Phase 3 (admin config affects filter options)
**Requirements**: INBOX-01, INBOX-02, INBOX-03, INBOX-05, INBOX-06
**Success Criteria** (what must be TRUE):
  1. Conversations render in Kapso-styled UI (modern WhatsApp-like appearance, not custom)
  2. Message thread displays with Kapso components (bubbles, timestamps, author attribution)
  3. Status filter shows dropdown with hot/warm/cold/new/client/lost options; filtering works
  4. Tag filter shows multi-select of workspace tags; can filter conversations by multiple tags
  5. User can send message from Inbox; message appears in thread immediately (optimistic UI)
  6. Real-time filter counts update via Convex subscriptions
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Create FilterTabs, TagFilterDropdown, and getConversationCountsByStatus query
- [x] 04-02-PLAN.md — Enhance message-bubble and message-thread with WhatsApp-style UI
- [x] 04-03-PLAN.md — Integrate filters into inbox-client and verify complete workflow

Note: Plans 04-04 and 04-05 (gap closure for layout redesign) were reverted per user decision. Current implementation uses dropdown status filter with optimized layout: search at top, status dropdown below, Active/All toggle + Tags in bottom row.

### Phase 5: Real-time & Handover
**Goal**: Real-time message updates continue flowing via Convex subscriptions; user can toggle AI/Human mode per conversation
**Depends on**: Phase 4 (Inbox structure in place)
**Requirements**: INBOX-04, ARI-02
**Success Criteria** (what must be TRUE):
  1. New incoming WhatsApp messages appear in Inbox without page refresh (within <2 sec)
  2. Conversation list updates when conversation receives new message (reorders to top, unread count increases)
  3. User sees AI/Human toggle button in message thread; toggling changes conversation.ai_enabled flag
  4. When AI toggle off, new messages skip ARI processing and wait for human response
  5. When AI toggle on, new messages resume going through ARI (Mouth -> Brain cycle)
**Plans**: 3-4 plans

Plans:
- [ ] 05-01: Preserve Convex subscriptions through Kapso integration (verify real-time sync)
- [ ] 05-02: Add AI/Human toggle in message thread (Convex mutation updateConversationAiMode)
- [ ] 05-03: Wire toggle to processARI gate (skip if conversation.ai_enabled === false)
- [ ] 05-04: Test real-time updates with mock Kapso webhook, verify message flow

### Phase 6: ARI Flow Integration
**Goal**: New leads get automatic AI response; configuration changes in Your Intern immediately affect bot behavior end-to-end
**Depends on**: Phase 3 (Your Intern config ready), Phase 4 (Inbox structure ready), Phase 5 (toggle working)
**Requirements**: ARI-01, ARI-03, ARI-04
**Success Criteria** (what must be TRUE):
  1. New conversation from WhatsApp automatically triggers Mouth response (greeting message sent back)
  2. Flow progresses through greeting -> qualification -> routing automatically as user answers
  3. Changes to Persona/Flow tabs in Your Intern immediately appear in next ARI response (no restart needed)
  4. Complete flow works: new lead -> AI greeting -> asks Q1 -> saves answer -> asks Q2 -> routes to consultation/community
  5. Brain analysis updates lead_score and temperature based on conversation; Scoring config rules applied
  6. Conversation.next_action field shows AI's planned next step (human-readable for debugging)
**Plans**: 4 plans

Plans:
- [ ] 06-01: Wire Mouth to read latest Persona/Flow config from workspace.settings (no caching)
- [ ] 06-02: Verify getAriContext fetches workspace config on each call (includes persona, flow, scoring_rules)
- [ ] 06-03: Verify Brain routing logic respects consultation_slots config (offers available times)
- [ ] 06-04: End-to-end test: new lead -> greeting -> Q1 -> answer -> Q2 -> scoring -> routing (via demo mode)

## Progress

**Execution Order:**
Phases execute sequentially: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6. v3.3 | v3.3 | 33/33 | Complete | 2026-01-27 |
| 1. Agent Skills Setup | v3.4 | 1/1 | Complete | 2026-01-27 |
| 2. Your Intern Debug | v3.4 | 2/2 | Complete | 2026-01-27 |
| 3. Your Intern Config | v3.4 | 2/2 | Complete | 2026-01-27 |
| 4. Inbox UI & Filtering | v3.4 | 3/3 | Complete | 2026-01-27 |
| 5. Real-time & Handover | v3.4 | 0/3-4 | Not started | - |
| 6. ARI Flow Integration | v3.4 | 0/4 | Not started | - |

---

*Roadmap created: 2026-01-27*
*Last updated: 2026-01-27*
