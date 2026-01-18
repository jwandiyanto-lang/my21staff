# Research Summary: v2.1 Client Launch Ready

**Project:** my21staff
**Milestone:** v2.1 (subsequent, not greenfield)
**Researched:** 2026-01-18
**Confidence:** HIGH overall

---

## Executive Summary

Research across stack, features, architecture, and pitfalls reveals a clear path for v2.1. The critical discovery: **SMTP from Vercel is fundamentally broken** — switch to Resend (already installed) immediately. Tawk.to provides free unlimited ticketing, eliminating backend work. The existing workspace roles architecture is sound, just needs permission enforcement. For Eagle onboarding, high-touch VIP treatment is essential — they're not a generic user.

**Key insight:** v2.1 is about trust-building (support, security page, landing redesign), not feature expansion. First paying client success defines the business.

---

## Key Findings by Dimension

### Stack (STACK.md)

| Area | Recommendation | Confidence |
|------|----------------|------------|
| **Email** | Resend (already installed) + React Email | HIGH |
| **Ticketing** | Tawk.to (100% free, includes ticketing + live chat) | HIGH |
| **Query Caching** | TanStack Query + Supabase Cache Helpers | HIGH |
| **Server Caching** | Next.js `use cache` directive | MEDIUM |
| **Bundle** | @next/bundle-analyzer + dynamic imports | HIGH |

**Critical:** Stop trying to fix SMTP. Resend uses HTTP API — works reliably on Vercel.

### Features (FEATURES.md)

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Support Page (4-stage ticketing) | Medium | Email system |
| Security Info Page | Low | None |
| Landing Page Redesign | Medium | None |
| Workspace Roles (3 roles) | Medium | All features |

**Table stakes for trust:**
- Ticket ID + status visibility for customers
- Security page in Bahasa Indonesia (simple, not compliance theater)
- WhatsApp CTA on landing (not forms)

**Anti-features (skip for v2.1):**
- Self-service onboarding
- Billing system
- Advanced analytics
- Custom roles
- Public knowledge base

### Architecture (ARCHITECTURE.md)

| Component | Pattern | Key Consideration |
|-----------|---------|-------------------|
| Email Templates | Database-stored (not filesystem) | Admin-editable |
| Ticketing | 3 tables: tickets, comments, status_history | RLS from day one |
| Roles | Extend existing workspace_members.role | Permission utility at app level |

**Build dependencies:**
```
Email Templates → Ticket Notifications
Workspace Roles → Permission enforcement across features
```

### Pitfalls (PITFALLS.md)

| Priority | Pitfall | Prevention |
|----------|---------|------------|
| **P0** | SMTP DNS Resolution (EBADNAME) | Switch to Resend HTTP API |
| **P0** | RLS not updated for roles | Audit ALL policies when adding roles |
| **P1** | Generic enterprise onboarding | VIP treatment for Eagle |
| **P1** | RLS not enabled on new tables | Checklist: enable RLS, create policies, test |
| **P1** | Building UI before workflow | Define ticket status flow first |

**Vercel-specific:**
- Cold start latency: optimize bundle or enable Fluid Compute
- Function timeout: 10s on Hobby plan — chunk large operations
- Connection pooling: verify `?pgbouncer=true` in Supabase connection

---

## Confidence Assessment

| Research Area | Confidence | Reason |
|---------------|------------|--------|
| Email (Resend) | HIGH | Already installed, verified Vercel docs |
| Ticketing (Tawk.to) | HIGH | Verified free tier includes ticketing |
| Architecture patterns | HIGH | Based on existing codebase + Supabase docs |
| Feature requirements | MEDIUM-HIGH | Cross-referenced multiple sources |
| Pitfall prevention | HIGH | Official documentation + community verification |

**Open questions:**
- Exact testimonial content for landing page (need Eagle permission)
- WhatsApp notification triggers for tickets
- Success metrics for Eagle onboarding

---

## Implications for Roadmap

Based on research, suggested phase structure for v2.1:

### Phase 23: Email System (Resend)
**Rationale:** Foundation for all notifications. Fixes SMTP issue blocking invitations.

- Switch from nodemailer/SMTP to Resend HTTP API
- Add React Email for template components
- Update invitation flow to use Resend
- Add DNS records (SPF, DKIM, DMARC)

**Addresses:**
- PITFALLS.md: SMTP DNS resolution (P0)
- STACK.md: Resend recommendation

**Estimated:** 1-2 days

### Phase 24: Workspace Roles Enhancement
**Rationale:** Permission infrastructure affects all other features.

- Create permissions utility (`hasPermission()`)
- Extend `requireWorkspaceMembership` to check roles
- Audit all RLS policies for role enforcement
- Add role management UI in settings
- Ensure owner consistency migration

**Addresses:**
- PITFALLS.md: RLS not updated for roles (P0)
- FEATURES.md: Owner/Admin/Member permission matrix
- ARCHITECTURE.md: Application-level permission checks

**Estimated:** 2-3 days

### Phase 25: Support Ticketing Core
**Rationale:** Trust-building feature for first client. Depends on email + roles.

- Define workflow first: Report → Discuss → Outcome → Implementation
- Create tables: tickets, comments, status_history (with RLS)
- Build ticket list + detail pages
- Add status transition logic
- Email notifications on status change

**Addresses:**
- FEATURES.md: 4-stage ticketing flow
- ARCHITECTURE.md: Ticket data model
- PITFALLS.md: Define workflow before UI (P1)

**Estimated:** 3-4 days

### Phase 26: Tawk.to Integration (Optional)
**Rationale:** Quick win for live chat + backup ticketing. No backend work.

- Embed Tawk.to widget on landing + CRM
- Configure Bahasa Indonesia
- Test chat → ticket flow

**Alternative:** Skip if Phase 25 ticketing is sufficient.

**Estimated:** 0.5 day

### Phase 27: Security Info Page
**Rationale:** Trust signal for paying clients. Can parallelize.

- Static page with key points (Bahasa Indonesia)
- Data storage location (Singapore)
- Encryption explanation
- FAQ accordion
- WhatsApp contact for questions

**Addresses:**
- FEATURES.md: Table stakes for trust

**Estimated:** 1 day

### Phase 28: Landing Page Redesign
**Rationale:** Conversion optimization. Can parallelize.

- Mobile-first hero with "WhatsApp Automation untuk UMKM"
- Social proof section (testimonials, client logos)
- Features grid
- Single WhatsApp CTA per section
- Performance optimization (bundle, images)

**Addresses:**
- FEATURES.md: Landing page best practices
- PITFALLS.md: Cold start latency (P2)

**Estimated:** 2-3 days

### Phase 29: Performance Optimization
**Rationale:** First impression for Eagle. Address after features stable.

- Run bundle analyzer, identify targets
- Dynamic imports for heavy components
- TanStack Query for client-side caching
- Verify Supabase connection pooling

**Addresses:**
- STACK.md: Performance tools
- PITFALLS.md: Cold start, connection exhaustion

**Estimated:** 2-3 days

---

## Phase Ordering Rationale

1. **Email first** — Unblocks notifications for everything else. Current SMTP is broken.

2. **Roles second** — Affects who can do what in ticketing and settings. Must audit RLS.

3. **Ticketing third** — Primary trust feature. Uses email, respects roles.

4. **Security + Landing parallel** — Independent pages, can build simultaneously.

5. **Performance last** — Optimize after features are stable. Measure before improving.

**Parallelization opportunities:**
- Security Info Page + Landing Page Redesign (Phases 27-28)
- Tawk.to is optional and quick if needed

---

## Research Flags for Phases

| Phase | Research Needed? | Reason |
|-------|------------------|--------|
| Email System | No | Solution clear (Resend) |
| Workspace Roles | Maybe | Permission matrix design if complex |
| Support Ticketing | No | Standard patterns, well-documented |
| Security Page | No | Simple static page |
| Landing Page | No | Best practices documented |
| Performance | No | Standard Next.js patterns |

---

## Files Produced

| File | Purpose |
|------|---------|
| `STACK.md` | Technology recommendations with versions |
| `FEATURES.md` | Feature landscape with table stakes, differentiators, anti-features |
| `ARCHITECTURE.md` | Data models, API patterns, RLS policies |
| `PITFALLS.md` | 20 pitfalls with prevention strategies |
| `SUMMARY.md` | This synthesis with roadmap implications |

---

*Research complete. Ready for `/gsd:create-roadmap` or `/gsd:define-requirements`.*
