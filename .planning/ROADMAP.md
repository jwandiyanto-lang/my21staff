# Roadmap: my21staff

## Milestones

- ✅ **v2.0 WhatsApp CRM** - Phases 1-9 (shipped 2026-02-01)
- 🚧 **v2.0.1 Workflow Integration & Lead Automation** - Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v2.0 WhatsApp CRM (Phases 1-9) - SHIPPED 2026-02-01</summary>

### Phase 1: Project Foundation
**Goal**: Working Next.js application with authentication
**Plans**: 3 plans

Plans:
- [x] 01-01: Create Next.js 15 project with TypeScript
- [x] 01-02: Configure Clerk authentication
- [x] 01-03: Add Convex database

### Phase 2: Landing Page
**Goal**: Professional landing page that converts visitors
**Plans**: 2 plans

Plans:
- [x] 02-01: Build landing page with brand guidelines
- [x] 02-02: Add demo workspace redirect

### Phase 3: Sarah Chat Bot
**Goal**: AI-powered WhatsApp lead qualification
**Plans**: 3 plans

Plans:
- [x] 03-01: Kapso workspace setup
- [x] 03-02: Sarah bot integration
- [x] 03-03: Lead extraction logic (incomplete - webhook issues)

### Phase 4: Lead Database
**Goal**: Store and manage leads from WhatsApp
**Plans**: 2 plans

Plans:
- [x] 04-01: Convex schema for leads
- [x] 04-02: Webhook integration for automatic lead creation

### Phase 5: Dashboard Interface
**Goal**: View and manage leads with AI insights
**Plans**: 3 plans

Plans:
- [x] 05-01: Dashboard layout with lead list
- [x] 05-02: Lead detail view
- [x] 05-03: AI insights integration

### Phase 6: Grok Manager Bot
**Goal**: AI analytics and insights for business owners
**Plans**: 2 plans

Plans:
- [x] 06-01: Grok 2 integration for analysis
- [x] 06-02: Brain settings UI (incomplete - advanced features deferred)

### Phase 7: Inbox Integration
**Goal**: Embedded WhatsApp messaging in CRM
**Plans**: 2 plans

Plans:
- [x] 07-01: Embed Kapso inbox
- [x] 07-02: Inbox-lead linking

### Phase 8: Handoff Workflow
**Goal**: AI-to-human handoff with lead scoring
**Plans**: 2 plans

Plans:
- [x] 08-01: Handoff detection logic
- [x] 08-02: Notification system

### Phase 9: Production Deployment
**Goal**: Live production deployment
**Plans**: 3 plans

Plans:
- [x] 09-01: Production environment setup
- [x] 09-02: Inbox bidirectional flow (partially complete - view-only)
- [x] 09-03: Launch validation (incomplete - testing deferred)

</details>

### 🚧 v2.0.1 Workflow Integration & Lead Automation (In Progress)

**Milestone Goal:** Fix Sarah bot, automate lead creation/update, enable production testing

#### Phase 10: Sarah Bot Refinement
**Goal**: Sarah responds correctly with proper persona and handoff logic
**Depends on**: Phase 9 (production deployment exists)
**Requirements**: SARAH-01, SARAH-02, SARAH-03, TEST-01
**Success Criteria** (what must be TRUE):
  1. Sarah messages match persona guide (conversational tone, under 140 chars, NO emojis)
  2. Sarah escalates to human when user requests or qualification stalls
  3. Sarah extracts lead fields accurately (name, business_type, location, tenure, pain_confirmed)
  4. Developer can test Sarah changes by messaging WhatsApp number immediately
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Refine Sarah persona prompt + document CLI workflow

#### Phase 11: Smart Lead Automation
**Goal**: First message creates lead, subsequent messages update existing lead
**Depends on**: Phase 10
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. New WhatsApp contact automatically creates lead in database
  2. Existing contact messages update lead lastActivityAt (no duplicate leads)
  3. Phone numbers normalized to E.164 format prevent duplicates (+62813 = 0813)
  4. Dashboard shows lead activity timestamps for follow-up prioritization
  5. Leads linked to Kapso conversations via conversation_id for inbox sync
  6. Webhook retries don't create duplicate leads (idempotency working)
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Fix phone deduplication bug + activity timestamp tracking
- [ ] 11-02-PLAN.md — Dashboard right panel with structured lead data sections

#### Phase 12: Sarah Template System
**Goal**: Sarah configuration documented and duplicatable for new workspaces
**Depends on**: Phase 11
**Requirements**: SARAH-04, SARAH-05
**Success Criteria** (what must be TRUE):
  1. Sarah configuration documented as reusable template (prompt, settings, triggers)
  2. Developer can duplicate Sarah setup for new workspace using template
  3. Your Team page shows simplified Intern settings (Bot Name, Persona, Script)
  4. Brain configuration section hidden from UI
**Plans**: 5 plans (3 original + 2 gap closure)

Plans:
- [x] 12-01-PLAN.md — Convex backend: sarahConfigs schema + API endpoints
- [x] 12-02-PLAN.md — UI: SarahConfigCard component on team page
- [x] 12-03-PLAN.md — Documentation: SARAH-TEMPLATE.md + Kapso function code
- [x] 12-04-PLAN.md — Gap closure: Remove Brain tab from Your Team page
- [x] 12-05-PLAN.md — Gap closure: Create SimplifiedInternSettings component

#### Phase 13: Production Validation
**Goal**: All v2.0.1 features working in production with confidence
**Depends on**: Phase 12
**Requirements**: TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Lead creation verifiable in dashboard within 10 seconds of WhatsApp message
  2. All v2.0.1 changes deployed incrementally without downtime
**Plans**: TBD

Plans:
- [ ] 13-01: TBD during planning

## Progress

**Execution Order:**
Phases execute numerically: 10 → 11 → 12 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Foundation | v2.0 | 3/3 | Complete | 2026-01-30 |
| 2. Landing Page | v2.0 | 2/2 | Complete | 2026-01-30 |
| 3. Sarah Chat Bot | v2.0 | 2/3 | Complete | 2026-01-31 |
| 4. Lead Database | v2.0 | 2/2 | Complete | 2026-01-31 |
| 5. Dashboard Interface | v2.0 | 3/3 | Complete | 2026-02-01 |
| 6. Grok Manager Bot | v2.0 | 1/2 | Complete | 2026-02-01 |
| 7. Inbox Integration | v2.0 | 2/2 | Complete | 2026-02-01 |
| 8. Handoff Workflow | v2.0 | 2/2 | Complete | 2026-02-01 |
| 9. Production Deployment | v2.0 | 2/3 | Complete | 2026-02-01 |
| 10. Sarah Bot Refinement | v2.0.1 | 1/1 | Complete | 2026-02-01 |
| 11. Smart Lead Automation | v2.0.1 | 0/2 | Not started | - |
| 12. Sarah Template System | v2.0.1 | 5/5 | Complete | 2026-02-01 |
| 13. Production Validation | v2.0.1 | 0/TBD | Not started | - |
