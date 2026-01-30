# Roadmap: my21staff v2.0

**Milestone:** v2.0
**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database for Indonesian SME lead management.

## Overview

**8 phases** | **69 requirements** | **Hybrid AI + Rules architecture**

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Foundation | Kapso workspace setup + webhook infrastructure | 5 |
| 2 | Workflow Rules Engine | Kapso workflow triggers + conditional routing | 5 |
| 2.5 | Settings & Configuration | CRM settings UI with Kapso API integration | 10 |
| 3 | Sarah Chat Bot | Gemini 2.5 integration + persona + 4-slot extraction | 7 |
| 4 | Lead Database | Kapso → Convex sync + custom fields | 7 |
| 5 | Grok Manager Bot | Analysis + scoring + insights | 7 |
| 6 | Dashboard | Lead list + AI insights + analytics + WhatsApp inbox | 24 |
| 7 | Handoff Workflow | End-to-end handoff flow + notifications | 6 |
| 8 | Testing & Polish | End-to-end testing, bug fixes, performance | 2 |

---

## Phase 1: Foundation

**Goal:** Kapso workspace provisioned with webhook infrastructure ready for messages.

**Requirements:**
- KAPS-01, KAPS-02, KAPS-03, KAPS-04, KAPS-05

**Success Criteria:**
1. New my21staff workspace exists in Kapso (separate from archived Eagle)
2. Indonesian WhatsApp number is provisioned and receiving messages
3. Webhook endpoint is configured and delivering message events
4. Workflow trigger fires on new inbound messages
5. Can verify message reception in system logs

**Deliverables:**
- Kapso workspace created with Indonesian +62 number
- Webhook endpoint deployed (Vercel API route)
- Workflow trigger configured in Kapso
- Test message verified in logs

**Plans:**
- [ ] 01-01-PLAN.md — Kapso workspace & Indonesian number provisioning
- [ ] 01-02-PLAN.md — Webhook endpoint development
- [ ] 01-03-PLAN.md — Workflow trigger & verification

**Status:** Planning complete — ready for execution

---

## Phase 2: Workflow Rules Engine

**Goal:** Kapso's native workflow engine handles keyword triggers and conditional routing before AI.

**Note:** This phase uses **Kapso's built-in workflow system** — no custom code. We configure workflows in Kapso dashboard to handle rule-based automation before AI processes unmatched messages.

**Requirements:**
- RULE-01, RULE-02, RULE-03, RULE-04, RULE-05

**Success Criteria:**
1. Keyword "human"/"agent" triggers handoff flow via Kapso workflow
2. "!summary" command triggers Grok manager bot via Kapso workflow
3. New leads vs returning leads are detected and routed differently via Kapso
4. FAQ responses (pricing, services, hours) work via Kapso template responses
5. Rules are checked first in Kapso workflow, unmatched messages pass to AI

**Deliverables:**
- Kapso workflow configured with keyword triggers (via Settings UI)
- Lead routing logic in Kapso workflow (new vs returning detection)
- FAQ template responses in Kapso workflow
- Conditional routing in Kapso workflow: rules → AI webhook fallback
- Workflow testing verified via Settings UI test panel

---

## Phase 2.5: Settings & Configuration

**Goal:** CRM settings page allows viewing and editing all workflows, triggers, bot personas, and configurations with immediate sync to Kapso via API.

**Note:** This phase builds the **Settings UI** that connects to Kapso's API. Users can see and modify everything that Phase 2 configured — no more dashboard-only setup. Changes apply immediately via "Apply" button.

**Requirements:**
- CONF-01 to CONF-10 (10 requirements)

**Success Criteria:**
1. Settings page accessible in dashboard (/settings route)
2. Workflow list displays all configured workflows (from Kapso API)
3. Create/edit/delete workflows via Settings UI (syncs to Kapso API)
4. Keyword trigger management with test panel
5. FAQ template editor with live preview
6. Bot persona configuration (Sarah & Grok prompts editable in UI)
7. Lead routing rules UI with conditional logic builder
8. "Apply Changes" button syncs all edits to Kapso immediately
9. Configuration history with rollback capability
10. Test panel sends test messages and verifies responses

**Deliverables:**
- Settings page UI (Shadcn/ui components, black/white, Geist Mono)
- Kapso API integration layer (workflows, triggers, templates CRUD)
- Workflow configuration UI (list, create, edit, delete)
- Keyword trigger manager (add/edit/delete, test)
- FAQ template editor (pricing, services, hours, custom)
- Bot persona configuration forms (Sarah prompt, Grok prompt)
- Lead routing rules UI (new vs returning logic builder)
- Apply button with sync status indicator
- Configuration history viewer (past versions, rollback)
- Test panel (send test message, trigger workflow, verify)
- Convex storage for settings backup
- Sync status indicator (shows last sync time, errors)

**Key Features:**
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                          Synced ✓ │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│  Workflows                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔄 Keyword Triggers                    Edit │ Delete  │   │
│  │ • "human" → Handoff to human                            │   │
│  │ • "!summary" → Generate daily summary                   │   │
│  │ • [Add New Trigger]                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  FAQ Templates                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💬 Pricing Response                     Edit │ Delete  │   │
│  │ "Our services start from $500/month..."                │   │
│  │ • [Add New Template]                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  Bot Personas                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🤖 Sarah (Chat Bot)                                  │   │
│  │ Prompt: [You are Sarah, warm and efficient...]        │   │
│  │                                                        │   │
│  │ 🧠 Grok (Manager Bot)                                │   │
│  │ Prompt: [Analyze leads and generate insights...]      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  Lead Routing Rules                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ If new phone number → [Start fresh conversation]      │   │
│  │ If returning → [Resume with context]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  Test Panel                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Send test message to: [+62xxx...]                    │   │
│  │ [Send Test]                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│                                        [Apply Changes]        │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints Used:**
```
GET    /workflows                    # List all workflows
POST   /workflows                    # Create workflow
PATCH  /workflows/{id}               # Update workflow
DELETE /workflows/{id}               # Delete workflow

GET    /workflow_triggers            # List triggers
POST   /workflow_triggers            # Create trigger
PATCH  /workflow_triggers/{id}       # Update trigger
DELETE /workflow_triggers/{id}       # Delete trigger

POST   /workflows/{id}/executions    # Test workflow
GET    /workflow_executions/{id}     # Get execution result
```

---

## Phase 3: Sarah Chat Bot

**Goal:** Sarah (Gemini 2.5) handles natural conversation with 4-slot data extraction.

**Requirements:**
- SARA-01, SARA-02, SARA-03, SARA-04, SARA-05, SARA-06, SARA-07

**Success Criteria:**
1. Sarah responds to WhatsApp messages via Kapso API
2. Sarah persona: warm, under 140 chars, max 1 emoji per message
3. Extracts Name, Service, Budget, Timeline from conversation
4. Handles photo/image messages (analyze + respond)
5. Remembers conversation context across messages
6. Never gives specific prices, only ranges
7. Detects when 4 slots are filled for handoff

**Deliverables:**
- Gemini 2.5 Flash integration
- Sarah persona prompt + response formatting
- 4-slot extraction logic (structured output)
- Image handling pipeline
- Conversation memory (Convex storage)
- Handoff detection logic

---

## Phase 4: Lead Database

**Goal:** Kapso contacts and messages sync to Convex for instant dashboard access.

**Requirements:**
- LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06, LEAD-07

**Success Criteria:**
1. Kapso contacts auto-sync to Convex on creation/update
2. All messages sync bidirectionally (Kapso ↔ Convex)
3. Custom fields store: service, budget, timeline, qualification status
4. Lead status workflow: new → qualified → contacted → converted → archived
5. Timestamps track: created, last message, last contact, last activity
6. Background sync service runs near real-time
7. Kapso remains source of truth, Convex is read replica for dashboard

**Deliverables:**
- Convex schema: contacts, messages, leads tables
- Kapso → Convex sync service (background job)
- Custom fields in Convex schema
- Lead status state machine
- Timestamp tracking implementation
- Conflict resolution strategy (Kapso wins)

---

## Phase 5: Grok Manager Bot

**Goal:** Grok 2 analyzes leads, generates summaries, scores quality, suggests actions.

**Requirements:**
- MGR-01, MGR-02, MGR-03, MGR-04, MGR-05, MGR-06, MGR-07

**Success Criteria:**
1. Grok 2 integration handles deep analysis requests
2. "!summary" command generates daily lead digest
3. Lead quality scoring: hot/warm/cold based on engagement + data
4. Action items list prioritizes follow-ups (who needs contact)
5. Content recommendations suggest FAQs from real questions
6. Conversation insights surface patterns, objections, interests
7. Summary command works via Kapso workflow trigger

**Deliverables:**
- Grok 2 API integration
- !Summary command handler (triggered by Kapso workflow)
- Lead scoring algorithm (engagement + completeness)
- Action items generator (prioritization logic)
- Content recommendation engine (topic clustering)
- Conversation insights analyzer (pattern detection)
- Daily summary scheduler

---

## Phase 6: Dashboard

**Goal:** CRM dashboard displays leads, insights, analytics, and WhatsApp inbox with instant load from Convex + Kapso integration.

**Requirements:**
- DBLD-01 to DBLD-07 (7)
- DBLI-01 to DBLI-06 (6)
- DBLA-01 to DBLA-06 (6)
- INBX-01 to INBX-05 (5)

**Success Criteria:**

**Lead List:**
1. All leads display instantly from Convex (no loading delay)
2. Contact info (name, phone, avatar) + status badge visible
3. Filter by status works (new/qualified/contacted/converted/archived)
4. Filter by date range (today/week/month)
5. Search by name/phone is instant
6. Click lead card → full conversation history loads instantly
7. Lead cards show metrics (message count, last activity, qualification)

**AI Insights:**
8. Grok's daily summaries display on dashboard
9. Lead quality scores show with visual indicators (hot/warm/cold)
10. Action items list prioritizes follow-ups
11. Content recommendations suggest FAQ additions
12. Refresh button triggers on-demand Grok analysis
13. Insight cards show trends (new leads, response rate, qualification rate)

**Analytics:**
14. Total leads counter shows all-time count
15. New leads today/week/month with trend indicators
16. Response rate metrics (avg response time, response %)
17. Lead stage distribution chart (funnel visualization)
18. Common questions/topics trending (from Grok)
19. Conversation volume chart over time

**WhatsApp Inbox (whatsapp-cloud-inbox):**
20. whatsapp-cloud-inbox integrated into dashboard
21. Styled to match my21staff brand (black/white, Geist Mono)
22. Kapso branding removed (fully custom UI)
23. Connected to Kapso API with workspace credentials
24. Send/receive messages, templates, media, and interactive buttons work

**Deliverables:**
- Dashboard UI (Shadcn/ui components)
- Lead list page with filters + search
- Lead detail page with conversation history
- AI insights page with summaries + scores
- Analytics page with charts
- WhatsApp inbox page (whatsapp-cloud-inbox integrated)
- Convex real-time queries for instant load
- Refresh functionality for insights

---

## Phase 7: Handoff Workflow

**Goal:** When lead qualifies, handoff triggers dashboard alert + WhatsApp notification + auto-reply.

**Requirements:**
- HAND-01, HAND-02, HAND-03, HAND-04, HAND-05, HAND-06

**Success Criteria:**
1. Kapso workflow detects handoff trigger (4 slots filled OR keywords)
2. Dashboard shows alert/notification for new qualified leads
3. Business owner receives WhatsApp notification with lead summary
4. Auto-reply sent to lead: "Thanks! Jonathan will reach out soon"
5. Lead marked as "pending human contact" in Convex
6. Handoff queue in dashboard shows leads awaiting human response

**Deliverables:**
- Kapso workflow handoff trigger
- Dashboard notification system
- WhatsApp notification to business owner
- Auto-reply to lead via Kapso API
- Convex status update to "pending human contact"
- Handoff queue UI component

---

## Phase Dependencies

```
Phase 1 (Foundation)
    │
    ▼
Phase 2 (Workflow Rules)
    │
    ▼
Phase 2.5 (Settings & Configuration)
    │
    ├─────────────┐
    ▼             ▼
Phase 3      Phase 4
(Sarah Bot)  (Database)
    │             │
    └──────┬──────┘
           ▼
    Phase 5 (Grok Manager)
           │
           ▼
    Phase 6 (Dashboard + Inbox)
           │
           ▼
    Phase 7 (Handoff)
           │
           ▼
    Phase 8 (Testing & Polish)
```

**Critical Path:** Phase 1 → 2 → 2.5 → 3 → 6 → 7 → 8 (Foundation → Settings → Sarah → Dashboard → Handoff → Test)

**Can Parallelize:**
- Phase 3 (Sarah) + Phase 4 (Database) — independent after Phase 2.5
- Phase 5 (Grok) can start once Phase 4 database is ready

**Why Phase 2.5 Between 2 and 3:**
- After workflows are built (Phase 2), build the UI to see/edit them (Phase 2.5)
- Before building AI bots (Phase 3+), have the Settings UI ready to configure personas
- Each subsequent feature can be configured in Settings as it's built

---

## Phase 8: Testing & Polish

**Goal:** End-to-end testing of all features, bug fixes, performance optimization, production readiness.

**Requirements:**
- TEST-01: End-to-end flow testing (new lead → Sarah → handoff → notification)
- TEST-02: Performance optimization (dashboard load time, sync latency)

**Success Criteria:**
1. Complete user journey tested and working
2. Dashboard loads under 2 seconds
3. Message sync latency under 5 seconds
4. No critical bugs in production
5. Settings UI applies changes correctly
6. WhatsApp inbox sends/receives reliably
7. Handoff notifications fire consistently

**Deliverables:**
- Test plan documentation
- Bug fixes applied
- Performance benchmarks met
- Production deployment verified

---

## Milestone Completion Criteria

**v2.0 is complete when:**
1. New my21staff workspace is live with Indonesian number
2. Settings UI allows viewing and editing all configurations
3. Sarah responds to leads 24/7 with warm, contextual messages
4. Leads are captured in database with extracted info (4 slots)
5. Grok generates daily summaries and scores leads
6. Dashboard shows all leads with instant load
7. WhatsApp inbox (whatsapp-cloud-inbox) integrated with custom branding
8. Handoff workflow triggers for qualified leads
9. Business owner receives notifications for handoffs

**Definition of Done:**
- All 69 requirements marked complete
- End-to-end flow tested: Lead messages → Sarah qualifies → Handoff → Notification
- Dashboard accessible with real-time data
- Settings UI applies changes to Kapso immediately
- WhatsApp inbox sends/receives with templates and media
- No critical bugs in production

---

*Roadmap created: 2026-01-30*
*Last updated: 2026-01-30*
