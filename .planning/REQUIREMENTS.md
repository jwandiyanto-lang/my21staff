# Requirements: my21staff v3.4

**Defined:** 2026-01-27
**Core Value:** The system that lets you grow

## v3.4 Requirements

Requirements for Kapso Inbox Integration milestone. Each maps to roadmap phases.

### Inbox UI & Filtering

- [ ] **INBOX-01**: User can view conversations in Kapso-styled UI
- [ ] **INBOX-02**: User can view message thread with Kapso-styled components
- [ ] **INBOX-03**: User can filter conversations by status (hot/warm/cold/new/client/lost)
- [ ] **INBOX-04**: User sees real-time message updates without refresh
- [ ] **INBOX-05**: User can send messages from Inbox
- [ ] **INBOX-06**: User can view media (images, documents) in messages

### Your Intern Configuration

- [ ] **INTERN-01**: Your Intern page loads without errors in production
- [ ] **INTERN-02**: User can configure bot persona in Persona tab
- [ ] **INTERN-03**: User can configure conversation flow in Flow tab
- [ ] **INTERN-04**: User can configure database fields in Database tab
- [ ] **INTERN-05**: User can configure lead scoring rules in Scoring tab
- [ ] **INTERN-06**: User can configure consultation slots in Slots tab
- [ ] **INTERN-07**: User can toggle AI on/off globally with one button

### ARI Flow Integration

- [ ] **ARI-01**: New leads receive automatic AI response (AI-first)
- [ ] **ARI-02**: User can toggle AI/Human mode per conversation in Inbox
- [ ] **ARI-03**: Your Intern configuration changes reflect in ARI behavior
- [ ] **ARI-04**: Complete flow works (new lead → ARI greeting → qualification → handover)

### Development Workflow

- [ ] **DEV-01**: Agent-skills MCP installed and configured

## Future Requirements

Deferred to next milestone.

### Advanced Inbox Features

- **INBOX-07**: Template message support (quick replies)
- **INBOX-08**: Interactive button responses
- **INBOX-09**: Broadcast messaging capability

### Development Workflow

- **DEV-02**: MCP commands documented for team use

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complete Kapso Inbox replacement | Using Kapso as UI pattern reference, not wholesale replacement |
| WhatsApp Flows (multi-step forms) | Requires Meta approval, complex setup |
| Voice agent integration | Significant complexity, defer to v4.0+ |
| Multi-user chat assignment | Single workspace user model for now |
| Custom bot training UI | Persona/Flow tabs provide sufficient control |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEV-01 | 1 | Pending |
| INBOX-01 | 4 | Pending |
| INBOX-02 | 4 | Pending |
| INBOX-03 | 4 | Pending |
| INBOX-04 | 5 | Pending |
| INBOX-05 | 4 | Pending |
| INBOX-06 | 4 | Pending |
| INTERN-01 | 2 | Pending |
| INTERN-02 | 3 | Pending |
| INTERN-03 | 3 | Pending |
| INTERN-04 | 3 | Pending |
| INTERN-05 | 3 | Pending |
| INTERN-06 | 3 | Pending |
| INTERN-07 | 3 | Pending |
| ARI-01 | 6 | Pending |
| ARI-02 | 5 | Pending |
| ARI-03 | 6 | Pending |
| ARI-04 | 6 | Pending |

**Coverage:**
- v3.4 requirements: 18 total
- Mapped to phases: 18 (100%)
- Unmapped: 0 ✓

---

*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after roadmap creation*
