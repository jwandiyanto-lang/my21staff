# Requirements: my21staff v3.0

**Defined:** 2026-01-20
**Core Value:** Sub-500ms P95 response times — a CRM that feels instant

## v1 Requirements

Requirements for v3.0 Performance & Speed milestone. Each maps to roadmap phases.

### Instrumentation

- [ ] **INST-01**: Enable Vercel Speed Insights for Web Vitals tracking
- [ ] **INST-02**: Add API timing wrapper to `/api/contacts/by-phone`
- [ ] **INST-03**: Add API timing wrapper to `/api/conversations`
- [ ] **INST-04**: Log query count per request in instrumented endpoints
- [ ] **INST-05**: Establish P50/P95/P99 baseline metrics before optimization

### Supabase Optimization

- [ ] **SUPA-01**: Refactor `/api/contacts/by-phone` to use `Promise.all()` for parallel queries
- [ ] **SUPA-02**: Refactor `/api/conversations` to use `Promise.all()` for parallel queries
- [ ] **SUPA-03**: Add composite index `idx_contacts_workspace_phone` on contacts(workspace_id, phone)
- [ ] **SUPA-04**: Add composite index `idx_conversations_workspace_time` on conversations(workspace_id, last_message_at DESC)
- [ ] **SUPA-05**: Add composite index `idx_messages_conversation_time` on messages(conversation_id, created_at DESC)
- [ ] **SUPA-06**: Refactor contacts query to use nested relations (contact -> notes, conversation -> messages)
- [ ] **SUPA-07**: Audit and replace `select('*')` with explicit column selection in hot paths
- [ ] **SUPA-08**: Optimize RLS policies (wrap `auth.uid()` in SELECT for caching)

### Convex Spike

- [ ] **CONV-01**: Set up Convex project with Next.js 15 App Router
- [ ] **CONV-02**: Configure Supabase JWT provider in Convex auth.config.ts
- [ ] **CONV-03**: Implement Convex schema for contacts table
- [ ] **CONV-04**: Implement `requireWorkspaceMembership()` helper in Convex
- [ ] **CONV-05**: Convert `/api/contacts/by-phone` to Convex query function
- [ ] **CONV-06**: Implement Convex HTTP action for Kapso webhook handling
- [ ] **CONV-07**: Benchmark Convex vs optimized Supabase response times
- [ ] **CONV-08**: Test real-time subscription performance in Convex

### Decision Gate

- [ ] **GATE-01**: Document spike results (P50/P95/P99 for both approaches)
- [ ] **GATE-02**: Evaluate webhook handling reliability in Convex
- [ ] **GATE-03**: Make data-driven decision: Convex migration or enhanced Supabase

### Implementation (conditional)

**If Convex wins (GATE-03 = Convex):**
- [ ] **IMPL-01**: Migrate contacts table to Convex with dual-write
- [ ] **IMPL-02**: Migrate conversations table to Convex
- [ ] **IMPL-03**: Migrate messages table to Convex
- [ ] **IMPL-04**: Update inbox to use Convex real-time subscriptions
- [ ] **IMPL-05**: Migrate webhook handler to Convex HTTP action
- [ ] **IMPL-06**: Remove Supabase data queries (keep auth only)

**If Supabase wins (GATE-03 = Supabase):**
- [ ] **IMPL-07**: Replace polling with Supabase real-time subscriptions for inbox
- [ ] **IMPL-08**: Create database function for dashboard data aggregation
- [ ] **IMPL-09**: Tune connection pooling settings
- [ ] **IMPL-10**: Verify sub-500ms P95 across all hot paths

## v2 Requirements

Deferred to future release.

### Advanced Monitoring

- **MON-01**: Custom performance dashboard with P50/P90/P95 trends
- **MON-02**: Automated alerts on response time degradation
- **MON-03**: OpenTelemetry integration for distributed tracing

### Extended Optimization

- **OPT-01**: Database functions for complex multi-table operations
- **OPT-02**: Edge caching for static workspace data
- **OPT-03**: Incremental static regeneration for landing pages

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full Convex migration without spike | High risk, need data first |
| Payment Integration (Midtrans) | Deferred to v3.1, focus on speed |
| AI Model Selection UI | Deferred to v3.1 |
| Custom analytics database | Use existing tools (Vercel, Convex dashboard) |
| CI performance regression tests | Overkill for current scale |
| Session recording for performance | Privacy concerns, not needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 1 | Pending |
| INST-02 | Phase 1 | Pending |
| INST-03 | Phase 1 | Pending |
| INST-04 | Phase 1 | Pending |
| INST-05 | Phase 1 | Pending |
| SUPA-01 | Phase 2 | Pending |
| SUPA-02 | Phase 2 | Pending |
| SUPA-03 | Phase 2 | Pending |
| SUPA-04 | Phase 2 | Pending |
| SUPA-05 | Phase 2 | Pending |
| SUPA-06 | Phase 2 | Pending |
| SUPA-07 | Phase 2 | Pending |
| SUPA-08 | Phase 2 | Pending |
| CONV-01 | Phase 3 | Pending |
| CONV-02 | Phase 3 | Pending |
| CONV-03 | Phase 3 | Pending |
| CONV-04 | Phase 3 | Pending |
| CONV-05 | Phase 3 | Pending |
| CONV-06 | Phase 3 | Pending |
| CONV-07 | Phase 3 | Pending |
| CONV-08 | Phase 3 | Pending |
| GATE-01 | Phase 4 | Pending |
| GATE-02 | Phase 4 | Pending |
| GATE-03 | Phase 4 | Pending |
| IMPL-01 to IMPL-10 | Phase 5 | Pending (conditional) |

**Coverage:**
- v1 requirements: 26 total (6 conditional)
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after initial definition*
