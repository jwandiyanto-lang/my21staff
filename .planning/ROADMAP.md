# Roadmap: my21staff v3.5 Production Go-Live

## Milestones

- ✅ **v3.4 Kapso Inbox Integration** - Phases 1-6 (shipped 2026-01-28)
- 🚧 **v3.5 Production Go-Live** - Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v3.4 Kapso Inbox Integration (Phases 1-6) - SHIPPED 2026-01-28</summary>

**Delivered:** Modern WhatsApp-first Inbox UI with AI configuration hot-reload. Complete bot admin interface with real-time filtering, AI/Human handover toggle, and end-to-end automation flow from new lead to consultation booking.

**Key accomplishments:**
- Agent Skills Infrastructure — Kapso agent-skills with 5 skill sets and MCP server (26 API tools)
- Your Intern Admin Interface — Global AI toggle, error boundaries, 5 config tabs (Persona, Flow, Database, Scoring, Slots)
- Inbox Modernization — WhatsApp-first UI with status filtering, real-time sync, AI/Human toggle per conversation
- Configuration Hot-Reload — Complete ARI flow with workspace config applied on every message without restart
- Two-Level AI Gating — Global toggle (ariConfig.enabled) + per-conversation toggle (conversation.status)
- End-to-End Automation — New lead → AI greeting → qualification → routing → consultation booking complete

</details>

### 🚧 v3.5 Production Go-Live (In Progress)

**Milestone Goal:** Deploy v3.4 features to production and activate live Kapso bot with Eagle Overseas.

**Target features:**
- Localhost polish (UI details, dev mode bugs, complete flow testing)
- Production deployment (manual deploy, environment setup, feature parity verification)
- Live bot integration (Kapso webhooks, ARI responding to real WhatsApp leads, complete automation)

**Success criteria:**
- All localhost flows work correctly in /demo workspace
- Production deployment matches localhost feature parity
- Kapso webhooks deliver messages to production
- ARI bot responds to real WhatsApp conversations
- Complete lead flow works: greeting → qualification → routing → booking
- All Your Intern settings tabs active and functional in production

---

### Phase 1: Localhost Polish

**Goal:** All localhost flows verified working and production-ready through interactive audit and comprehensive testing.

**Depends on:** None (first phase of v3.5)

**Requirements:** LOCALHOST-01, LOCALHOST-02, LOCALHOST-03, LOCALHOST-04, LOCALHOST-05, LOCALHOST-06, LOCALHOST-07, LOCALHOST-08

**Success Criteria** (what must be TRUE):
1. User completes interactive audit and identifies all issues
2. All identified issues are fixed and verified
3. All /demo pages load without console errors or unhandled rejections
4. All 5 Your Intern tabs render and function correctly (Persona, Flow, Database, Scoring, Slots)
5. Complete lead flow is testable end-to-end in offline mode (greeting → qualification → routing → booking)
6. Dev mode code is confirmed safe (no dev bypasses leak to production build)
7. All React hooks follow rules of hooks (no conditional calls)
8. UI polish complete (spacing, labels, visual consistency)

**Plans:** TBD

Plans:
- [ ] 07-01: TBD (plan-phase will create)

---

### Phase 2: Production Deployment

**Goal:** Application deployed to production hosting with all environment variables configured and feature parity verified.

**Depends on:** Phase 1 (Localhost Polish)

**Requirements:** DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07

**Success Criteria** (what must be TRUE):
1. All 13 production environment variables are configured and validated
2. Clerk JWT template includes org_id claim and is verified
3. Production build succeeds without errors (`npm run build` passes)
4. Application is deployed to hosting platform (Railway/Render/Fly.io) with HTTPS enforced
5. All smoke tests pass (authentication works, all pages accessible, no 500 errors)
6. Production matches localhost feature parity (all v3.4 features work identically)
7. Eagle Overseas workspace is accessible with real Convex data (no mock data visible)

**Plans:** TBD

Plans:
- [ ] 08-01: TBD (plan-phase will create)

---

### Phase 3: Live Bot Integration

**Goal:** Kapso webhooks connected to production, ARI bot responding to real WhatsApp messages, complete automation verified stable.

**Depends on:** Phase 2 (Production Deployment)

**Requirements:** BOT-01, BOT-02, BOT-03, BOT-04, BOT-05, BOT-06, BOT-07

**Success Criteria** (what must be TRUE):
1. Kapso webhook URL updated to production endpoint and GET challenge verified
2. Webhook signature verification is active and tested (valid signatures accepted, invalid rejected)
3. Test message triggers bot response successfully
4. ARI greeting, qualification, and routing work with real WhatsApp conversations
5. All Your Intern configuration tabs affect live bot behavior (changes applied immediately)
6. Complete automation verified end-to-end (new lead → greeting → qualification → routing → booking)
7. 24-hour monitoring confirms stability (no webhook failures, no integration errors)

**Plans:** TBD

Plans:
- [ ] 09-01: TBD (plan-phase will create)

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Agent Skills | v3.4 | 3/3 | Complete | 2026-01-27 |
| 2. Your Intern Debug | v3.4 | 2/2 | Complete | 2026-01-27 |
| 3. Global AI Toggle | v3.4 | 3/3 | Complete | 2026-01-27 |
| 4. Inbox Modernization | v3.4 | 3/3 | Complete | 2026-01-28 |
| 5. AI/Human Handover | v3.4 | 2/2 | Complete | 2026-01-28 |
| 6. ARI Flow Integration | v3.4 | 2/2 | Complete | 2026-01-28 |
| 1. Localhost Polish | v3.5 | 0/? | Not started | - |
| 2. Production Deployment | v3.5 | 0/? | Not started | - |
| 3. Live Bot Integration | v3.5 | 0/? | Not started | - |

---

*Last updated: 2026-01-28*
