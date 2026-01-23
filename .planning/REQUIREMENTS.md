# Requirements: my21staff v3.1

**Defined:** 2026-01-23
**Core Value:** The system that lets you grow

## v3.1 Requirements

Requirements for Full Convex + Clerk migration. Remove Supabase entirely.

### Auth Infrastructure

- [x] **AUTH-01**: Clerk application configured with JWT template for Convex
- [x] **AUTH-02**: Convex auth.config.ts updated for Clerk JWT validation
- [x] **AUTH-03**: ConvexProviderWithClerk replaces Supabase provider
- [x] **AUTH-04**: clerkMiddleware replaces Supabase middleware for route protection

### User Migration

- [x] **USER-01**: Users table in Convex with Clerk ID as primary identifier
- [x] **USER-02**: Clerk webhook syncs user creation/updates to Convex
- [ ] **USER-03**: Existing Supabase users imported to Clerk with password hashes
- [ ] **USER-04**: User ID mapping preserves data relationships (Supabase UUID → Clerk ID)

### Auth UI

- [x] **UI-01**: Clerk SignIn component replaces custom login form
- [x] **UI-02**: Clerk SignUp component replaces custom signup form
- [x] **UI-03**: Clerk UserButton replaces custom profile menu
- [x] **UI-04**: Password reset works via Clerk (fixes broken Supabase flow)

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
| AUTH-01 | 1 | Complete |
| AUTH-02 | 1 | Complete |
| AUTH-03 | 2 | Complete |
| AUTH-04 | 2 | Complete |
| UI-01 | 2 | Complete |
| UI-02 | 2 | Complete |
| UI-03 | 2 | Complete |
| UI-04 | 2 | Complete |
| USER-01 | 3 | Complete |
| USER-02 | 3 | Complete |
| USER-03 | 4 | Pending |
| USER-04 | 4 | Pending |
| ORG-01 | 4 | Pending |
| ORG-02 | 4 | Pending |
| ORG-03 | 4 | Pending |
| DATA-01 | 5 | Pending |
| DATA-02 | 5 | Pending |
| DATA-03 | 5 | Pending |
| DATA-04 | 5 | Pending |
| DATA-05 | 5 | Pending |
| N8N-01 | 6 | Pending |
| N8N-02 | 6 | Pending |
| N8N-03 | 6 | Pending |
| CLEAN-01 | 7 | Pending |
| CLEAN-02 | 7 | Pending |
| CLEAN-03 | 7 | Pending |

**Coverage:**
- v3.1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 — Phases renumbered 1-7*
