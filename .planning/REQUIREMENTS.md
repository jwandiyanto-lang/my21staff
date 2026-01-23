# Requirements: my21staff v3.1

**Defined:** 2026-01-23
**Core Value:** The system that lets you grow

## v3.1 Requirements

Requirements for Full Convex + Clerk migration. Remove Supabase entirely.

### Auth Infrastructure

- [ ] **AUTH-01**: Clerk application configured with JWT template for Convex
- [ ] **AUTH-02**: Convex auth.config.ts updated for Clerk JWT validation
- [ ] **AUTH-03**: ConvexProviderWithClerk replaces Supabase provider
- [ ] **AUTH-04**: clerkMiddleware replaces Supabase middleware for route protection

### User Migration

- [ ] **USER-01**: Users table in Convex with Clerk ID as primary identifier
- [ ] **USER-02**: Clerk webhook syncs user creation/updates to Convex
- [ ] **USER-03**: Existing Supabase users imported to Clerk with password hashes
- [ ] **USER-04**: User ID mapping preserves data relationships (Supabase UUID → Clerk ID)

### Auth UI

- [ ] **UI-01**: Clerk SignIn component replaces custom login form
- [ ] **UI-02**: Clerk SignUp component replaces custom signup form
- [ ] **UI-03**: Clerk UserButton replaces custom profile menu
- [ ] **UI-04**: Password reset works via Clerk (fixes broken Supabase flow)

### Organization/Workspace

- [ ] **ORG-01**: Clerk organizations created for existing workspaces
- [ ] **ORG-02**: Clerk organization invitations replace custom invitation system
- [ ] **ORG-03**: Role-based permissions work with Clerk organization roles

### Data Migration

- [ ] **DATA-01**: ARI tables migrated to Convex (7 tables: config, sessions, scores, slots, etc.)
- [ ] **DATA-02**: Support ticket tables migrated to Convex
- [ ] **DATA-03**: CMS tables migrated to Convex (articles, webinars)
- [ ] **DATA-04**: Utility tables migrated to Convex (profiles, appointments)
- [ ] **DATA-05**: All API routes updated to use Convex instead of Supabase

### n8n Integration

- [ ] **N8N-01**: Convex HTTP action created for n8n lead webhook
- [ ] **N8N-02**: n8n workflow updated to use new Convex webhook URL
- [ ] **N8N-03**: Eagle Overseas lead flow verified working

### Cleanup

- [ ] **CLEAN-01**: Supabase client code removed
- [ ] **CLEAN-02**: Supabase environment variables removed from Vercel
- [ ] **CLEAN-03**: @supabase packages removed from dependencies

## Future Requirements

Deferred to v3.2 or later.

### Payments

- **PAY-01**: Midtrans payment integration
- **PAY-02**: Subscription management

### AI Enhancement

- **AI-01**: AI model selection UI
- **AI-02**: Custom model configuration per workspace

## Out of Scope

| Feature | Reason |
|---------|--------|
| Clerk custom permissions | Requires B2B SaaS add-on ($100/month) — use role-based checks |
| Multi-organization users | Complex, not needed for current clients |
| Social login (Google, etc.) | Email/password sufficient for Indonesian SME market |
| Supabase data archival | Delete after migration verified, no need to preserve |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 6 | Pending |
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 7 | Pending |
| AUTH-04 | Phase 7 | Pending |
| UI-01 | Phase 7 | Pending |
| UI-02 | Phase 7 | Pending |
| UI-03 | Phase 7 | Pending |
| UI-04 | Phase 7 | Pending |
| USER-01 | Phase 8 | Pending |
| USER-02 | Phase 8 | Pending |
| USER-03 | Phase 9 | Pending |
| USER-04 | Phase 9 | Pending |
| ORG-01 | Phase 9 | Pending |
| ORG-02 | Phase 9 | Pending |
| ORG-03 | Phase 9 | Pending |
| DATA-01 | Phase 10 | Pending |
| DATA-02 | Phase 10 | Pending |
| DATA-03 | Phase 10 | Pending |
| DATA-04 | Phase 10 | Pending |
| DATA-05 | Phase 10 | Pending |
| N8N-01 | Phase 11 | Pending |
| N8N-02 | Phase 11 | Pending |
| N8N-03 | Phase 11 | Pending |
| CLEAN-01 | Phase 12 | Pending |
| CLEAN-02 | Phase 12 | Pending |
| CLEAN-03 | Phase 12 | Pending |

**Coverage:**
- v3.1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 — Traceability updated for Phases 6-12*
