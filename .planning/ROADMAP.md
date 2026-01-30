# Roadmap: my21staff v2.0

**Milestone:** v2.0
**Started:** 2026-01-30
**Goal:** Build WhatsApp CRM with dual-agent AI (Sarah chat + Grok manager) using Kapso workflows + Convex database for Indonesian SME lead management.

## Overview

**7 phases** | **52 requirements** | **Hybrid AI + Rules architecture**

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Foundation | Kapso workspace setup + webhook infrastructure | 5 |
| 2 | Workflow Rules Engine | Kapso workflow triggers + conditional routing | 5 |
| 3 | Sarah Chat Bot | Gemini 2.5 integration + persona + 4-slot extraction | 7 |
| 4 | Lead Database | Kapso → Convex sync + custom fields | 7 |
| 5 | Grok Manager Bot | Analysis + scoring + insights | 7 |
| 6 | Dashboard | Lead list + AI insights + analytics | 19 |
| 7 | Handoff Workflow | End-to-end handoff flow + notifications | 6 |

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
- Kapso workflow configured with keyword triggers (in Kapso dashboard)
- Lead routing logic in Kapso workflow (new vs returning detection)
- FAQ template responses in Kapso workflow
- Conditional routing in Kapso workflow: rules → AI webhook fallback
- Workflow testing verified via Kapso UI

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

**Goal:** CRM dashboard displays leads, insights, analytics with instant load from Convex.

**Requirements:**
- DBLD-01 to DBLD-07 (7)
- DBLI-01 to DBLI-06 (6)
- DBLA-01 to DBLA-06 (6)

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

**Deliverables:**
- Dashboard UI (Shadcn/ui components)
- Lead list page with filters + search
- Lead detail page with conversation history
- AI insights page with summaries + scores
- Analytics page with charts
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
    Phase 6 (Dashboard)
           │
           ▼
    Phase 7 (Handoff)
```

**Critical Path:** Phase 1 → 2 → 3 → 6 → 7 (Sarah bot + Dashboard core)

**Can Parallelize:**
- Phase 3 (Sarah) + Phase 4 (Database) — independent after Phase 2
- Phase 5 (Grok) can start once Phase 4 database is ready

---

## Milestone Completion Criteria

**v2.0 is complete when:**
1. New my21staff workspace is live with Indonesian number
2. Sarah responds to leads 24/7 with warm, contextual messages
3. Leads are captured in database with extracted info (4 slots)
4. Grok generates daily summaries and scores leads
5. Dashboard shows all leads with instant load
6. Handoff workflow triggers for qualified leads
7. Business owner receives notifications for handoffs

**Definition of Done:**
- All 52 requirements marked complete
- End-to-end flow tested: Lead messages → Sarah qualifies → Handoff → Notification
- Dashboard accessible with real-time data
- No critical bugs in production

---

*Roadmap created: 2026-01-30*
*Last updated: 2026-01-30*
