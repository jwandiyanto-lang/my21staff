# Requirements: my21staff v2.0.1

**Defined:** 2026-02-01
**Core Value:** The system that lets you grow — lead management, proposal organization, follow-up automation powered by dual-agent AI.

## v2.0.1 Requirements

Requirements for fixing Sarah bot and implementing smart lead automation.

### Sarah Bot Improvements

- [ ] **SARAH-01**: Fix persona/response style (conversational tone, message length, emoji usage)
- [ ] **SARAH-02**: Improve handoff logic (when to escalate to human, handoff triggers)
- [ ] **SARAH-03**: Refine field extraction (what data to collect, validation rules)
- [ ] **SARAH-04**: Document current Sarah configuration as reusable template
- [ ] **SARAH-05**: Enable bot duplication for new workspaces (clone Sarah config)

### Lead Automation

- [ ] **LEAD-01**: Create lead on first message from new contact (webhook-triggered)
- [ ] **LEAD-02**: Update lead lastActivityAt on subsequent messages (no new lead)
- [ ] **LEAD-03**: Deduplicate contacts by normalized phone number (E.164 format)
- [ ] **LEAD-04**: Track lead activity timestamps for follow-up prioritization
- [ ] **LEAD-05**: Link leads to Kapso conversations via conversation_id

### Data Integrity

- [ ] **DATA-01**: Phone number normalization to E.164 before storage
- [ ] **DATA-02**: Webhook idempotency tracking to prevent duplicates
- [ ] **DATA-03**: Prevent orphaned leads (all leads linked to valid workspace)

### Production Testing

- [ ] **TEST-01**: Sarah bot changes testable via live WhatsApp messaging
- [ ] **TEST-02**: Lead creation verifiable in dashboard immediately
- [ ] **TEST-03**: All changes deployable to production incrementally (no big bang)

## Future Requirements

Deferred to v2.1+.

### Workflow Automation

- **AUTO-01**: Daily activity summaries as lead notes
- **AUTO-02**: Automatic lead scoring based on Sarah interactions
- **AUTO-03**: Sync workflow config to Kapso Dashboard (manual copy-paste for now)

### Advanced Lead Management

- **ADV-01**: Lead qualification threshold (ignore spam messages)
- **ADV-02**: Multi-workspace timezone handling for cron jobs
- **ADV-03**: Bulk lead import from CSV

## Out of Scope

Explicitly excluded for v2.0.1.

| Feature | Reason |
|---------|--------|
| Direct Kapso workflow editing via API | Kapso API does not provide workflow editing endpoints |
| Automatic CRM → Kapso sync | Not possible without workflow API access |
| Visual workflow builder | Too complex for SME users, creates analysis paralysis |
| Real-time workflow editing | Risk of breaking active conversations |
| Custom JavaScript in workflows | Security risk, maintainability issues |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SARAH-01 | Phase 10 | Pending |
| SARAH-02 | Phase 10 | Pending |
| SARAH-03 | Phase 10 | Pending |
| SARAH-04 | Phase 12 | Pending |
| SARAH-05 | Phase 12 | Pending |
| LEAD-01 | Phase 11 | Pending |
| LEAD-02 | Phase 11 | Pending |
| LEAD-03 | Phase 11 | Pending |
| LEAD-04 | Phase 11 | Pending |
| LEAD-05 | Phase 11 | Pending |
| DATA-01 | Phase 11 | Pending |
| DATA-02 | Phase 11 | Pending |
| DATA-03 | Phase 11 | Pending |
| TEST-01 | Phase 10 | Pending |
| TEST-02 | Phase 13 | Pending |
| TEST-03 | Phase 13 | Pending |

**Coverage:**
- v2.0.1 requirements: 16 total
- Mapped to phases: 16/16 (100%)
- Unmapped: 0

**Phase distribution:**
- Phase 10 (Sarah Bot Refinement): 4 requirements
- Phase 11 (Smart Lead Automation): 8 requirements
- Phase 12 (Sarah Template System): 2 requirements
- Phase 13 (Production Validation): 2 requirements

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*
