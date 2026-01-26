# Roadmap: my21staff v3.3 Go Live

## Overview

Take my21staff from development to production with Eagle Overseas Education as the first paying client. This milestone focuses on deployment, Kapso WhatsApp integration, dual-AI system (Mouth + Brain), bot qualification workflow, lead sync, pricing updates, and end-to-end verification.

## Milestones

- **v3.3 Go Live** - Phases 1-7 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Deployment** - Fresh Vercel project with production environment
- [x] **Phase 2: Kapso Integration** - WhatsApp webhook and messaging
- [x] **Phase 2.1: UI Documentation** - INSERTED: Document UI/buttons before deployment
- [x] **Phase 3: AI System** - Dual-bot architecture (Mouth + Brain)
- [x] **Phase 3.1: Inbox Enhancement** - INSERTED: Profile sidebar, AI/Human handover, merge
- [x] **Phase 4: Bot Workflow** - Eagle qualification flow
- [ ] **Phase 5: Lead Flow** - n8n to Convex production verification + configurable status stages
- [ ] **Phase 6: Pricing Page** - Economics-based pricing update
- [ ] **Phase 7: UI Verification** - End-to-end testing with real workflows

## Phase Details

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

**Success Criteria** (what must be TRUE):
  1. Kapso webhook receives WhatsApp messages in production
  2. Bot sends replies back via Kapso API
  3. Message history syncs to Convex database
  4. Webhook signature verification working

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Configure Eagle workspace Kapso credentials
- [x] 02-02-PLAN.md — Create ARI configuration for Eagle workspace
- [x] 02-03-PLAN.md — End-to-end verification of webhook, messaging, and inbox

### Phase 3: AI System

**Goal**: Dual-AI architecture working — "The Mouth" for conversations, "The Brain" for analysis

**Depends on**: Phase 2

**Requirements**: AI-01, AI-02, AI-03, AI-04

**Success Criteria** (what must be TRUE):
  1. "The Mouth" (Sea-Lion) handles greetings, FAQ, qualification conversations
  2. "The Brain" (Claude) analyzes leads — scoring, CRM updates, smart decisions
  3. Conversation context passed between Mouth and Brain
  4. Usage tracking shows chat energy vs brain power consumption

**Plans:** 4 plans

Plans:
- [x] 03-01-PLAN.md — Foundation: aiUsage schema, Anthropic SDK, workspace linkage fix
- [x] 03-02-PLAN.md — The Mouth: Sea-Lion/Grok conversational AI module
- [x] 03-03-PLAN.md — The Brain: Claude Haiku analytical AI module
- [x] 03-04-PLAN.md — Wire orchestration: Mouth+Brain in processARI, E2E verification

### Phase 3.1: Inbox Enhancement (INSERTED)

**Goal**: Add missing inbox features from v2.0 - profile sidebar, AI/Human handover toggle, merge contacts

**Depends on**: Phase 3

**Requirements**: N/A (gap closure)

**Success Criteria** (what must be TRUE):
  1. Contact profile sidebar appears when viewing conversation
  2. AI/Human handover toggle button works in message thread
  3. Merge contacts functionality available from inbox

**Plans:** 1 plan

Plans:
- [x] 03.1-01-PLAN.md — Profile sidebar, handover toggle, merge integration

### Phase 4: Bot Workflow

**Goal**: WhatsApp bot greets new leads, qualifies them with questions, and routes to community or consultation

**Depends on**: Phase 3

**Requirements**: BOT-01, BOT-02, BOT-03, BOT-04, BOT-05, BOT-06

**Success Criteria** (what must be TRUE):
  1. Incoming WhatsApp message receives greeting from bot
  2. Bot asks qualification questions (destination, documents, English level)
  3. Bot answers common FAQs about Eagle services
  4. Qualified lead receives Community link (free path)
  5. Hot lead can request 1-on-1 Consultation
  6. Human receives notification when consultation is requested

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

**Success Criteria** (what must be TRUE):
  1. n8n webhook successfully delivers lead data to production Convex endpoint
  2. Lead appears in Contact Database with all fields populated correctly
  3. Lead status updates work (new -> qualified -> consultation/community)
  4. Lead statuses are configurable per workspace in Settings

**Plans:** 8 plans

Plans:
- [x] 05-01-PLAN.md — Verify n8n webhook endpoint in production
- [x] 05-02-PLAN.md — Verify lead data and phone normalization
- [x] 05-03-PLAN.md — Verify lead status update workflow (GAP: status mismatch found)
- [x] 05-04-PLAN.md — Rename "Lead Management" to "Database" in UI
- [x] 05-05-PLAN.md — Fix DELETE and UPDATE contact functionality (testing deferred)
- [ ] 05-06-PLAN.md — Schema + Backend for configurable status stages (gap closure)
- [ ] 05-07-PLAN.md — Settings UI for lead stage configuration (gap closure)
- [ ] 05-08-PLAN.md — Human verification of status system + CRUD endpoints (gap closure)

### Phase 6: Pricing Page

**Goal**: Landing page pricing reflects $497 startup + $97/$297 monthly plans with staff evolution narrative

**Depends on**: Nothing (independent update)

**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04

**Success Criteria** (what must be TRUE):
  1. Landing page shows Startup Package at $497
  2. Landing page shows Digital Receptionist plan at $97/mo
  3. Landing page shows Digital Pro plan at $297/mo
  4. Pricing copy uses "Staff Evolution" narrative from economics document

Plans:
- [ ] TBD during planning

### Phase 7: UI Verification

**Goal**: All core UI features work correctly in production with real data and mobile devices

**Depends on**: Phase 4, Phase 5

**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05

**Success Criteria** (what must be TRUE):
  1. WhatsApp Inbox displays conversations from Kapso with correct filters
  2. Contact Database shows leads with working status and tag filters
  3. Dashboard stats update in real-time when new leads arrive
  4. Settings page allows team management via Clerk
  5. Key pages (Inbox, Contacts, Dashboard) work correctly on mobile devices

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
(Phase 5 and 6 can run in parallel after Phase 1)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Deployment | 1/1 | Complete | 2026-01-25 |
| 2. Kapso Integration | 3/3 | Complete | 2026-01-25 |
| 3. AI System | 4/4 | Complete | 2026-01-25 |
| 3.1 Inbox Enhancement | 1/1 | Complete | 2026-01-25 |
| 4. Bot Workflow | 6/6 | Complete | 2026-01-26 |
| 5. Lead Flow | 5/8 | In Progress (gap closure) | - |
| 6. Pricing Page | 0/TBD | Not started | - |
| 7. UI Verification | 0/TBD | Not started | - |

---
*Created: 2026-01-25*
*Last updated: 2026-01-26*
