# Requirements: my21staff v3.5 Production Go-Live

**Defined:** 2026-01-28
**Core Value:** The system that lets you grow

## v3.5 Requirements

Requirements for production deployment and live bot activation. Each maps to roadmap phases.

### Localhost Polish

- [x] **LOCALHOST-01**: Interactive localhost audit (user identifies issues to fix)
- [x] **LOCALHOST-02**: All identified issues fixed
- [x] **LOCALHOST-03**: All /demo pages load without errors
- [x] **LOCALHOST-04**: Your Intern 5 tabs functional (Persona, Flow, Database, Scoring, Slots)
- [x] **LOCALHOST-05**: Complete lead flow testable offline (greeting → qualification → routing → booking)
- [x] **LOCALHOST-06**: Dev mode audit complete (no dev bypasses leak to production)
- [x] **LOCALHOST-07**: React hooks compliance verified (all hooks follow rules)
- [x] **LOCALHOST-08**: UI polish complete (spacing, labels, visual refinements)

### Production Deployment

- [ ] **DEPLOY-01**: Environment variables configured (13 production secrets)
- [ ] **DEPLOY-02**: Clerk JWT template verified (includes org_id claim)
- [ ] **DEPLOY-03**: Production build succeeds (npm run build passes)
- [ ] **DEPLOY-04**: Deployed to hosting platform (Railway/Render/Fly.io)
- [ ] **DEPLOY-05**: Smoke tests pass (all pages accessible, auth works)
- [ ] **DEPLOY-06**: Feature parity verified (production matches localhost capabilities)
- [ ] **DEPLOY-07**: Eagle workspace accessible with real Convex data

### Live Bot Integration

- [ ] **BOT-01**: Kapso webhook URL updated to production endpoint
- [ ] **BOT-02**: Webhook signature verification active
- [ ] **BOT-03**: Test message triggers bot response
- [ ] **BOT-04**: ARI greeting, qualification, routing work with real WhatsApp
- [ ] **BOT-05**: All Your Intern config tabs affect live bot behavior
- [ ] **BOT-06**: Complete automation verified (new lead → booking)
- [ ] **BOT-07**: 24-hour monitoring confirms stability

## Future Requirements

Deferred to v3.6+:

### Payment Integration
- **PAY-01**: Midtrans integration for Eagle billing
- **PAY-02**: Payment flow UI in settings

### Model Selection
- **AI-01**: UI to choose between Grok and Sea-Lion
- **AI-02**: Model preference persisted per workspace

## Out of Scope

Explicitly excluded from v3.5:

| Feature | Reason |
|---------|--------|
| Vercel billing resolution | User handling deployment manually |
| Payment integration | Deferred to v3.6 |
| Model selection UI | Deferred to v3.6 |
| Multi-instance rate limiting | Single instance sufficient for launch |
| Automated backups | Manual backups acceptable for now |
| Load testing | Monitoring sufficient initially |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOCALHOST-01 | Phase 1 | Complete |
| LOCALHOST-02 | Phase 1 | Complete |
| LOCALHOST-03 | Phase 1 | Complete |
| LOCALHOST-04 | Phase 1 | Complete |
| LOCALHOST-05 | Phase 1 | Complete |
| LOCALHOST-06 | Phase 1 | Complete |
| LOCALHOST-07 | Phase 1 | Complete |
| LOCALHOST-08 | Phase 1 | Complete |
| DEPLOY-01 | Phase 2 | Pending |
| DEPLOY-02 | Phase 2 | Pending |
| DEPLOY-03 | Phase 2 | Pending |
| DEPLOY-04 | Phase 2 | Pending |
| DEPLOY-05 | Phase 2 | Pending |
| DEPLOY-06 | Phase 2 | Pending |
| DEPLOY-07 | Phase 2 | Pending |
| BOT-01 | Phase 3 | Pending |
| BOT-02 | Phase 3 | Pending |
| BOT-03 | Phase 3 | Pending |
| BOT-04 | Phase 3 | Pending |
| BOT-05 | Phase 3 | Pending |
| BOT-06 | Phase 3 | Pending |
| BOT-07 | Phase 3 | Pending |

**Coverage:**
- v3.5 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after Phase 1 completion*
