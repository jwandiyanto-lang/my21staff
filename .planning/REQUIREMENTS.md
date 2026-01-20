# Requirements: my21staff v2.2

**Defined:** 2026-01-20
**Core Value:** The system that lets you grow — lead management, follow-up automation, guided by real business experience.

## v2.2 Requirements

Requirements for ARI & User Flow milestone. Converts social media leads into paid consultations.

### ARI Core Conversation

- [x] **ARI-01**: ARI pulls form data from CRM when user initiates WhatsApp conversation (phone number matching)
- [x] **ARI-02**: ARI greets user by name with context from their form submission
- [x] **ARI-03**: ARI validates form completeness and asks follow-up questions for missing data
- [x] **ARI-04**: ARI answers questions about universities/destinations using knowledge base
- [x] **ARI-05**: ARI asks document readiness questions ("Do you have IELTS/transcript ready?")
- [x] **ARI-06**: ARI maintains conversation context across multiple message turns
- [x] **ARI-07**: ARI uses natural Indonesian language with configurable persona (tone, pronouns)

### Lead Scoring

- [x] **SCORE-01**: Dynamic lead scoring (0-100) based on form data + conversation responses
- [x] **SCORE-02**: Basic data scoring: form completeness, valid phone/email, target country
- [x] **SCORE-03**: Qualification scoring: IELTS score, GPA, budget, program clarity, timeline
- [x] **SCORE-04**: Engagement scoring: response time, question quality, interest signals
- [x] **SCORE-05**: Score thresholds: Hot (70+), Warm (40-69), Cold (<40)
- [x] **SCORE-06**: Lead phase auto-update in CRM based on score threshold

### Lead Routing

- [x] **ROUTE-01**: Hot leads (70+) receive consultation booking push
- [x] **ROUTE-02**: Warm leads (40-69) continue qualification conversation
- [x] **ROUTE-03**: Cold leads (<40) receive WhatsApp community link
- [x] **ROUTE-04**: Cold lead follow-up scheduled (30 days)

### Payment Integration (Deferred)

- [ ] **PAY-01**: Midtrans payment gateway integration *(deferred to v2.3)*
- [ ] **PAY-02**: Payment link generation (Rp500,000 consultation fee) *(deferred to v2.3)*
- [ ] **PAY-03**: Support Indonesian payment methods (QRIS, GoPay, OVO, bank transfer, cards) *(deferred to v2.3)*
- [ ] **PAY-04**: Payment success callback updates CRM *(deferred to v2.3)*
- [ ] **PAY-05**: Payment failure/expiry handling with retry link *(deferred to v2.3)*
- [ ] **PAY-06**: Payment link validity (24 hours) *(deferred to v2.3)*

### Scheduling

- [ ] **SCHED-01**: Admin enters consultant availability slots in CRM
- [ ] **SCHED-02**: ARI displays available slots after payment success
- [ ] **SCHED-03**: User selects slot via WhatsApp (reply with number)
- [ ] **SCHED-04**: Appointment confirmation with date/time/consultant name
- [ ] **SCHED-05**: Meeting link notification 1 hour before appointment
- [ ] **SCHED-06**: Appointment status tracking (scheduled, completed, cancelled, no-show)

### Consultant Handoff

- [ ] **HAND-01**: Lead phase updates to "Hot" after payment
- [ ] **HAND-02**: Auto-generated notes with conversation summary
- [ ] **HAND-03**: Due date set to consultation date
- [ ] **HAND-04**: Consultant assignment to appointment
- [ ] **HAND-05**: Consultant notification with full lead context (score, form data, conversation)

### Admin Interface - Persona

- [ ] **ADMIN-01**: Editable bot name (default: "ARI")
- [ ] **ADMIN-02**: Greeting style configuration (casual/formal/professional)
- [ ] **ADMIN-03**: Language setting (Bahasa Indonesia primary, English fallback)
- [ ] **ADMIN-04**: Tone configuration (supportive, clear, encouraging)
- [ ] **ADMIN-05**: Community link setting for cold lead routing

### Admin Interface - Knowledge Base

- [ ] **KB-01**: University/destination CRUD (add, edit, delete)
- [ ] **KB-02**: Country > City > University hierarchy
- [ ] **KB-03**: Requirements per university (IELTS min, GPA min, budget range, deadline)
- [ ] **KB-04**: Programs list per university
- [ ] **KB-05**: Promotion toggle and priority for destinations
- [ ] **KB-06**: Notes field for special info (scholarships, etc.)

### Admin Interface - Scoring

- [ ] **ADMIN-06**: Scoring threshold configuration (Hot/Warm/Cold cutoffs)
- [ ] **ADMIN-07**: Scoring weight adjustments (basic/qualification/engagement)

### Admin Interface - AI Models

- [ ] **AI-01**: AI model selection (Grok, Sea-Lion)
- [ ] **AI-02**: A/B testing toggle (split traffic between models)
- [ ] **AI-03**: Model comparison dashboard (response time, cost, satisfaction, conversion)
- [ ] **AI-04**: Default model selection based on A/B results

### Inbox Improvements

- [x] **INBOX-01**: Kapso metadata caching (contact name, profile pic, online status)
- [x] **INBOX-02**: Cache refresh via Kapso webhook updates
- [x] **INBOX-03**: Real-time message updates via Supabase subscriptions
- [x] **INBOX-04**: Active/All conversation filter toggle
- [x] **INBOX-05**: Filter by tags (e.g., "Australia", "Business")
- [x] **INBOX-06**: Filter by lead status (Hot, Warm, Cold, New)
- [x] **INBOX-07**: Improved Kapso sync (no disappearing chats)

### Database Schema

- [x] **DB-01**: ari_config table (workspace persona settings)
- [x] **DB-02**: ari_destinations table (universities with requirements)
- [x] **DB-03**: ari_conversations table (conversation tracking with scoring)
- [x] **DB-04**: ari_messages table (message history with role/type)
- [x] **DB-05**: ari_payments table (payment records with gateway data)
- [x] **DB-06**: ari_appointments table (scheduling with status)
- [x] **DB-07**: ari_ai_comparison table (A/B testing metrics)
- [x] **DB-08**: Add cached fields to contacts table (Kapso metadata)
- [x] **DB-09**: RLS policies for all new tables (workspace isolation)

## v2.3+ Requirements (Deferred)

### Scheduling Enhancement
- **SCHED-07**: Google Calendar integration for real-time availability
- **SCHED-08**: Auto-sync consultant calendars

### AI Enhancement
- **AI-05**: Voice note handling (transcription + response)
- **AI-06**: Document upload handling (CV, transcripts)
- **AI-07**: Multi-language detection and response

### Analytics
- **ANALYTICS-01**: Conversation analytics (resolution rate, satisfaction)
- **ANALYTICS-02**: Conversion funnel visualization
- **ANALYTICS-03**: AI model performance trends

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video call support | Use external platforms (Google Meet, Zoom) |
| In-app payment | Redirect to Midtrans gateway |
| Scholarship application automation | Complex, manual process |
| Visa application automation | Complex, manual process |
| WhatsApp template messages | Requires Meta approval, not needed for user-initiated |
| Multi-agent human handoff | One consultant per booking for v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARI-01 | Phase 2 | Complete |
| ARI-02 | Phase 2 | Complete |
| ARI-03 | Phase 2 | Complete |
| ARI-04 | Phase 2 | Complete |
| ARI-05 | Phase 2 | Complete |
| ARI-06 | Phase 2 | Complete |
| ARI-07 | Phase 2 | Complete |
| SCORE-01 | Phase 3 | Complete |
| SCORE-02 | Phase 3 | Complete |
| SCORE-03 | Phase 3 | Complete |
| SCORE-04 | Phase 3 | Complete |
| SCORE-05 | Phase 3 | Complete |
| SCORE-06 | Phase 3 | Complete |
| ROUTE-01 | Phase 3 | Complete |
| ROUTE-02 | Phase 3 | Complete |
| ROUTE-03 | Phase 3 | Complete |
| ROUTE-04 | Phase 3 | Complete |
| PAY-01 | Phase 4 | Deferred |
| PAY-02 | Phase 4 | Deferred |
| PAY-03 | Phase 4 | Deferred |
| PAY-04 | Phase 4 | Deferred |
| PAY-05 | Phase 4 | Deferred |
| PAY-06 | Phase 4 | Deferred |
| SCHED-01 | Phase 5 | Pending |
| SCHED-02 | Phase 5 | Pending |
| SCHED-03 | Phase 5 | Pending |
| SCHED-04 | Phase 5 | Pending |
| SCHED-05 | Phase 5 | Pending |
| SCHED-06 | Phase 5 | Pending |
| HAND-01 | Phase 5 | Pending |
| HAND-02 | Phase 5 | Pending |
| HAND-03 | Phase 5 | Pending |
| HAND-04 | Phase 5 | Pending |
| HAND-05 | Phase 5 | Pending |
| ADMIN-01 | Phase 6 | Pending |
| ADMIN-02 | Phase 6 | Pending |
| ADMIN-03 | Phase 6 | Pending |
| ADMIN-04 | Phase 6 | Pending |
| ADMIN-05 | Phase 6 | Pending |
| KB-01 | Phase 6 | Pending |
| KB-02 | Phase 6 | Pending |
| KB-03 | Phase 6 | Pending |
| KB-04 | Phase 6 | Pending |
| KB-05 | Phase 6 | Pending |
| KB-06 | Phase 6 | Pending |
| ADMIN-06 | Phase 6 | Pending |
| ADMIN-07 | Phase 6 | Pending |
| AI-01 | Phase 7 | Pending |
| AI-02 | Phase 7 | Pending |
| AI-03 | Phase 7 | Pending |
| AI-04 | Phase 7 | Pending |
| INBOX-01 | Phase 1 | Complete |
| INBOX-02 | Phase 1 | Complete |
| INBOX-03 | Phase 1 | Complete |
| INBOX-04 | Phase 1 | Complete |
| INBOX-05 | Phase 1 | Complete |
| INBOX-06 | Phase 1 | Complete |
| INBOX-07 | Phase 1 | Complete |
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| DB-04 | Phase 1 | Complete |
| DB-05 | Phase 1 | Complete |
| DB-06 | Phase 1 | Complete |
| DB-07 | Phase 1 | Complete |
| DB-08 | Phase 1 | Complete |
| DB-09 | Phase 1 | Complete |

**Coverage:**
- v2.2 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 — Phase 4 deferred (PAY-01 to PAY-06 moved to v2.3)*
