# Requirements: my21staff v2.0

**Defined:** 2026-01-30
**Core Value:** Your Business, On Autopilot. The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

## v2.0 Requirements

Requirements for v2.0 milestone. Hybrid AI + Rules architecture using Kapso workflows.

### Kapso Workspace Setup

- [ ] **KAPS-01**: Create new my21staff workspace in Kapso (separate from archived Eagle)
- [ ] **KAPS-02**: Provision Indonesian WhatsApp number via Kapso
- [ ] **KAPS-03**: Configure webhook endpoint for message triggers
- [ ] **KAPS-04**: Create workflow trigger for new inbound messages
- [ ] **KAPS-05**: Verify webhook delivery and message reception

### Workflow Rules Engine (Kapso)

- [ ] **RULE-01**: Keyword trigger for handoff ("human", "agent", "speak to person")
- [ ] **RULE-02**: Keyword trigger for AI manager bot ("!summary", "!report")
- [ ] **RULE-03**: Lead routing rules (new lead vs returning lead detection)
- [ ] **RULE-04**: Fixed response templates for FAQs (pricing, services, hours)
- [ ] **RULE-05**: Conditional routing: rules checked first, AI handles unmatched

### Settings & Configuration Management

- [x] **CONF-01**: Settings page in dashboard (Shadcn/ui, black/white, Geist Mono)
- [x] **CONF-02**: Your Team navigation with Intern and Brain sub-tabs
- [x] **CONF-03**: Intern configuration (persona, behavior, response, slots)
- [x] **CONF-04**: Brain configuration (summary, scoring, triggers)
- [x] **CONF-05**: Bot name configuration in Settings (applies to both bots)
- [x] **CONF-06**: Kapso API integration for WhatsApp inbox
- [x] **CONF-07**: Sync status indicator in Settings header
- [x] **CONF-08**: Settings backup to Convex (recoverable configurations)
- [x] **CONF-09**: Dev mode offline support with mock data
- [x] **CONF-10**: Auto-save with toast notifications

### Sarah Chat Bot (Gemini 2.5)

- [ ] **SARA-01**: Gemini 2.5 Flash integration for chat responses
- [ ] **SARA-02**: Sarah persona implementation (warm, efficient, under 140 chars, max 1 emoji)
- [ ] **SARA-03**: 4-slot data collection from conversation (Name, Service, Budget, Timeline)
- [ ] **SARA-04**: Photo/image handling capability (analyze, respond, extract info)
- [ ] **SARA-05**: Context-aware conversation (remembers chat history)
- [ ] **SARA-06**: Price range responses (never specific prices, ranges only)
- [ ] **SARA-07**: Handoff detection (4 slots filled OR user asks for human)

### Lead Database (Convex - Synced from Kapso)

- [x] **LEAD-01**: Contact sync from Kapso to Convex (phone, name, profile)
- [x] **LEAD-02**: Message sync from Kapso to Convex (all messages, bidirectional)
- [x] **LEAD-03**: Custom fields storage (service needed, budget, timeline, qualification status)
- [x] **LEAD-04**: Lead status tracking (new, qualified, contacted, converted, archived)
- [x] **LEAD-05**: Timestamp tracking (created, last message, last contact, last activity)
- [x] **LEAD-06**: Background sync service (Kapso → Convex, near real-time)
- [x] **LEAD-07**: Conflict resolution (Kapso source of truth, Convex read replica)

### Grok Manager Bot

- [ ] **MGR-01**: Grok 2 integration for deep analysis
- [ ] **MGR-02**: !Summary command handler (triggered via Kapso workflow)
- [ ] **MGR-03**: Daily lead summary generation (all leads, activity digest)
- [ ] **MGR-04**: Lead quality scoring (hot/warm/cold based on engagement + data completeness)
- [ ] **MGR-05**: Action items generation (who needs follow-up, prioritized)
- [ ] **MGR-06**: Content recommendations (common questions, suggest FAQ additions)
- [ ] **MGR-07**: Conversation insights (patterns, objections, interests)

### Dashboard - Lead List

- [ ] **DBLD-01**: Display all leads from Convex (instant load, real-time)
- [ ] **DBLD-02**: Show contact info (name, phone, avatar) and status badge
- [ ] **DBLD-03**: Filter by status (new/qualified/contacted/converted/archived)
- [ ] **DBLD-04**: Filter by date range (created today/week/month)
- [ ] **DBLD-05**: Search by name or phone number (instant, no latency)
- [ ] **DBLD-06**: Click to view full conversation history (from Convex, instant)
- [ ] **DBLD-07**: Lead cards with key metrics (message count, last activity, qualification status)

### Dashboard - AI Insights

- [ ] **DBLI-01**: Display Grok's daily summaries (generated automatically)
- [ ] **DBLI-02**: Show lead quality scores (hot/warm/cold with visual indicators)
- [ ] **DBLI-03**: Display action items (prioritized follow-up list)
- [ ] **DBLI-04**: Show content recommendations (FAQ suggestions from real conversations)
- [ ] **DBLI-05**: Refresh insights on demand (trigger Grok analysis)
- [ ] **DBLI-06**: Insight cards with trends (new leads, response rate, qualification rate)

### Dashboard - Analytics

- [ ] **DBLA-01**: Total leads counter (all-time)
- [ ] **DBLA-02**: New leads today/week/month (with trend indicators)
- [ ] **DBLA-03**: Response rate metrics (avg response time, response percentage)
- [ ] **DBLA-04**: Lead stage distribution chart (funnel visualization)
- [ ] **DBLA-05**: Common questions/topics trending (from Grok analysis)
- [ ] **DBLA-06**: Conversation volume over time (chart)

### Dashboard - WhatsApp Inbox (whatsapp-cloud-inbox)

- [ ] **INBX-01**: Integrate gokapso/whatsapp-cloud-inbox into dashboard
- [ ] **INBX-02**: Customize styling to match my21staff brand (black/white, Geist Mono)
- [ ] **INBX-03**: Remove Kapso branding (MIT license, fully custom)
- [ ] **INBX-04**: Connect to Kapso API using workspace credentials
- [ ] **INBX-05**: Enable send/receive messages, templates, media, interactive buttons

### Handoff Workflow (Combo Approach)

- [ ] **HAND-01**: Trigger detection via Kapso workflow (4 slots filled OR user keywords)
- [ ] **HAND-02**: Dashboard alert/notification for new qualified leads
- [ ] **HAND-03**: WhatsApp notification to business owner with lead summary
- [ ] **HAND-04**: Auto-reply to lead: "Thanks! Jonathan will reach out soon" (via Kapso)
- [ ] **HAND-05**: Mark lead as "pending human contact" in Convex
- [ ] **HAND-06**: Handoff queue in dashboard (leads awaiting human response)

### Testing & Polish

- [ ] **TEST-01**: End-to-end flow testing (new lead → Sarah → handoff → notification)
- [ ] **TEST-02**: Performance optimization (dashboard load time, sync latency)

## v2.1+ Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Visual workflow builder for custom rules
- **ADV-02**: WhatsApp template messages (requires Meta approval)
- **ADV-03**: Self-service onboarding flow
- **ADV-04**: Billing/subscriptions management
- **ADV-05**: Multi-user chat assignment (round-robin)

### Integrations

- **INT-01**: Google Calendar integration (appointment booking)
- **INT-02**: Voice note transcription
- **INT-03**: Document upload handling (PDF, images)
- **INT-04**: Video call support (WhatsApp video)
- **INT-05**: WhatsApp Flows (requires Meta approval)
- **INT-06**: Voice agent integration (Kapso voice agents)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Visual workflow builder | Use Kapso workflow UI, build custom later |
| WhatsApp template messages | Requires Meta approval process, use API for now |
| Self-service onboarding | Manual onboarding sufficient for v2.0 |
| Billing/subscriptions | Not needed yet — focus on core CRM |
| Multi-user chat assignment | Single user focus for v2.0 |
| Google Calendar integration | Defer to v2.1+ |
| Voice note transcription | Edge case, not core to CRM v2.0 |
| Document upload handling | Requires storage strategy, defer |
| Video call support | Outside CRM scope |
| WhatsApp Flows | Meta approval required, use workflows instead |
| Voice agent integration | Future consideration |
| Eagle workspace operations | Eagle is archived, new workspace only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| KAPS-01 | Phase 1 | Pending |
| KAPS-02 | Phase 1 | Pending |
| KAPS-03 | Phase 1 | Pending |
| KAPS-04 | Phase 1 | Pending |
| KAPS-05 | Phase 1 | Pending |
| RULE-01 | Phase 2 | Pending |
| RULE-02 | Phase 2 | Pending |
| RULE-03 | Phase 2 | Pending |
| RULE-04 | Phase 2 | Pending |
| RULE-05 | Phase 2 | Pending |
| CONF-01 | Phase 2.5 | Complete |
| CONF-02 | Phase 2.5 | Complete |
| CONF-03 | Phase 2.5 | Complete |
| CONF-04 | Phase 2.5 | Complete |
| CONF-05 | Phase 2.5 | Complete |
| CONF-06 | Phase 2.5 | Complete |
| CONF-07 | Phase 2.5 | Complete |
| CONF-08 | Phase 2.5 | Complete |
| CONF-09 | Phase 2.5 | Complete |
| CONF-10 | Phase 2.5 | Complete |
| SARA-01 | Phase 3 | Pending |
| SARA-02 | Phase 3 | Pending |
| SARA-03 | Phase 3 | Pending |
| SARA-04 | Phase 3 | Pending |
| SARA-05 | Phase 3 | Pending |
| SARA-06 | Phase 3 | Pending |
| SARA-07 | Phase 3 | Pending |
| LEAD-01 | Phase 4 | Complete |
| LEAD-02 | Phase 4 | Complete |
| LEAD-03 | Phase 4 | Complete |
| LEAD-04 | Phase 4 | Complete |
| LEAD-05 | Phase 4 | Complete |
| LEAD-06 | Phase 4 | Complete |
| LEAD-07 | Phase 4 | Complete |
| MGR-01 | Phase 5 | Pending |
| MGR-02 | Phase 5 | Pending |
| MGR-03 | Phase 5 | Pending |
| MGR-04 | Phase 5 | Pending |
| MGR-05 | Phase 5 | Pending |
| MGR-06 | Phase 5 | Pending |
| MGR-07 | Phase 5 | Pending |
| DBLD-01 | Phase 6 | Pending |
| DBLD-02 | Phase 6 | Pending |
| DBLD-03 | Phase 6 | Pending |
| DBLD-04 | Phase 6 | Pending |
| DBLD-05 | Phase 6 | Pending |
| DBLD-06 | Phase 6 | Pending |
| DBLD-07 | Phase 6 | Pending |
| DBLI-01 | Phase 6 | Pending |
| DBLI-02 | Phase 6 | Pending |
| DBLI-03 | Phase 6 | Pending |
| DBLI-04 | Phase 6 | Pending |
| DBLI-05 | Phase 6 | Pending |
| DBLI-06 | Phase 6 | Pending |
| DBLA-01 | Phase 6 | Pending |
| DBLA-02 | Phase 6 | Pending |
| DBLA-03 | Phase 6 | Pending |
| DBLA-04 | Phase 6 | Pending |
| DBLA-05 | Phase 6 | Pending |
| DBLA-06 | Phase 6 | Pending |
| INBX-01 | Phase 6 | Pending |
| INBX-02 | Phase 6 | Pending |
| INBX-03 | Phase 6 | Pending |
| INBX-04 | Phase 6 | Pending |
| INBX-05 | Phase 6 | Pending |
| HAND-01 | Phase 7 | Pending |
| HAND-02 | Phase 7 | Pending |
| HAND-03 | Phase 7 | Pending |
| HAND-04 | Phase 7 | Pending |
| HAND-05 | Phase 7 | Pending |
| HAND-06 | Phase 7 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |

**Coverage:**
- v2.0 requirements: 69 total
- Mapped to phases: 69
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after research-based requirements gathering*
