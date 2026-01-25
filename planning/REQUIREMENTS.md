# Requirements: my21staff v3.3 Go Live

**Defined:** 2026-01-25
**Core Value:** The system that lets you grow — Eagle Overseas Education as first live client

## v3.3 Requirements

Requirements for production launch with Eagle. Each maps to roadmap phases.

### Deployment

- [ ] **DEPLOY-01**: Fresh Vercel project created and connected to existing codebase
- [ ] **DEPLOY-02**: Production environment variables configured (Clerk, Convex, Kapso)
- [ ] **DEPLOY-03**: Domain configured (my21staff.com or production subdomain)
- [ ] **DEPLOY-04**: Kapso webhook URL updated to production endpoint

### Bot Workflow

- [ ] **BOT-01**: Bot greets incoming WhatsApp messages
- [ ] **BOT-02**: Bot asks qualification questions (destination, documents, English level)
- [ ] **BOT-03**: Bot answers FAQs about Eagle services
- [ ] **BOT-04**: Bot offers Community link (free option)
- [ ] **BOT-05**: Bot offers 1-on-1 Consultation (triggers human notification)
- [ ] **BOT-06**: Human receives notification when consultation requested

### Lead Flow

- [ ] **LEAD-01**: n8n webhook delivers leads to Convex CRM in production
- [ ] **LEAD-02**: Leads appear in Contact Database with correct data
- [ ] **LEAD-03**: Lead status updates work (new → qualified → consultation/community)

### Pricing Page

- [ ] **PRICE-01**: Landing page shows Startup Package ($497)
- [ ] **PRICE-02**: Landing page shows Digital Receptionist plan ($97/mo)
- [ ] **PRICE-03**: Landing page shows Digital Pro plan ($297/mo)
- [ ] **PRICE-04**: Pricing reflects "Staff Evolution" narrative from economics doc

### UI Verification

- [ ] **UI-01**: WhatsApp Inbox displays conversations from Kapso
- [ ] **UI-02**: Contact Database shows leads with correct filters
- [ ] **UI-03**: Dashboard stats update in real-time
- [ ] **UI-04**: Settings/Team management works via Clerk
- [ ] **UI-05**: Mobile responsiveness verified on key pages

## Future Milestone (v4.0+)

Deferred to after first client is live and generating revenue.

### Payment Integration

- **PAY-01**: Midtrans integration for Indonesian payments
- **PAY-02**: Subscription management for $97/$297 plans
- **PAY-03**: One-time payment for $497 startup package

### Self-Service Onboarding

- **ONBOARD-01**: Self-service signup flow
- **ONBOARD-02**: Automated workspace provisioning
- **ONBOARD-03**: Bot persona setup wizard

### Advanced Features

- **ADV-01**: AI model selection UI (choose Grok vs Sea-Lion)
- **ADV-02**: Weekly performance reports via WhatsApp
- **ADV-03**: "Promotion" system (90-day skill upgrades)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Visual workflow builder | Future version — complexity not needed for v3.3 |
| WhatsApp template messages | Requires Meta approval process |
| Multiple AI models per workspace | Single model sufficient for launch |
| Voice note transcription | Future enhancement |
| Document upload handling | Future enhancement |
| Multi-user chat assignment | Single user per workspace for now |
| Google Calendar integration | Manual consultation booking first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-02 | Phase 1 | Pending |
| DEPLOY-03 | Phase 1 | Pending |
| DEPLOY-04 | Phase 1 | Pending |
| BOT-01 | Phase 2 | Pending |
| BOT-02 | Phase 2 | Pending |
| BOT-03 | Phase 2 | Pending |
| BOT-04 | Phase 2 | Pending |
| BOT-05 | Phase 2 | Pending |
| BOT-06 | Phase 2 | Pending |
| LEAD-01 | Phase 3 | Pending |
| LEAD-02 | Phase 3 | Pending |
| LEAD-03 | Phase 3 | Pending |
| PRICE-01 | Phase 4 | Pending |
| PRICE-02 | Phase 4 | Pending |
| PRICE-03 | Phase 4 | Pending |
| PRICE-04 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |
| UI-04 | Phase 5 | Pending |
| UI-05 | Phase 5 | Pending |

**Coverage:**
- v3.3 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after initial definition*
