# Project Research Summary: v3.4 Kapso Integration + v2.1 Feature Launch

**Project:** my21staff (WhatsApp CRM + AI for Indonesian SMEs)
**Domain:** B2B SaaS — Auth migration (Supabase → Clerk) + data consolidation (→ Convex) + UI component integration (Kapso) + feature launch (v2.1)
**Researched:** 2026-01-18 through 2026-01-27
**Confidence:** HIGH (codebase verified, official docs cross-referenced, multiple sources aligned)

---

## Executive Summary

my21staff is at an inflection point: stabilize the infrastructure (Clerk + Convex) while launching v2.1 (support/security/landing page) to convert first paying client (Eagle Overseas Education) from pilot to revenue. The project combines three parallel workstreams:

1. **Auth infrastructure migration** — Replace Supabase with Clerk for identity, store user data in Convex. Critical challenge: Supabase UUID references throughout schema become orphaned when Clerk assigns new IDs. Mitigation: User ID mapping table + staged migration prevents breaking workspace ownership, ticket assignments, message attribution.

2. **Kapso UI integration** — Replace 1000+ lines of custom inbox components with Kapso's `whatsapp-cloud-inbox` library. This is straightforward component swapping because Kapso is a UI library, not a data owner. Data stays in Convex, Kapso reads via props, real-time sync continues unchanged.

3. **v2.1 feature launch** — Support ticketing (4-stage workflow), security info page, landing page redesign (mobile-first, Bahasa Indonesia), workspace roles (Owner/Admin/Member). These features build trust with Indonesian SMEs, essential for converting Eagle from pilot to paying customer.

**Recommended approach:** Phase these carefully. Infrastructure (Clerk, Convex consolidation) is the critical path — everything else depends on working auth. Kapso UI and v2.1 features can parallelize once infrastructure is ready. Key risks are session disruption (all users logged out during auth switch — unavoidable, schedule maintenance window), webhook double-migration (both Kapso and n8n move to Convex HTTP actions — document URLs carefully), and Eagle-specific verification (first paying client deserves validation, don't rush go-live).

---

## Key Findings

### Recommended Stack

The stack is largely locked in (Next.js 15, Convex 1.31.5, React 19, Shadcn/ui, Tailwind). Research confirms this is solid and identifies precise additions:

**Core technologies (existing, keep):**
- **Convex 1.31.5** — Data layer with real-time subscriptions. v3.0 partially migrated; v3.1 completes remaining tables.
- **Next.js 16.1.1** — App framework. Stable, shipped.
- **React 19.2.3** — UI library. Compatible with Clerk.
- **Shadcn/ui + Tailwind CSS** — Design system. Consistent with brand.

**To add:**
- **@clerk/nextjs@^6.36.8** — Auth provider replacing Supabase. Published 2026-01-20, verified compatible with Next.js 15 + React 19. Includes `ConvexProviderWithClerk` integration and JWT issuance for Convex validation.
- **svix@^1.84.1** — Webhook signature verification for Clerk user sync (user.created, user.updated, user.deleted events).
- **@kapso/whatsapp-cloud-inbox** — React component library for WhatsApp inbox. Replaces custom ConversationList, MessageThread, MessageBubble, DateSeparator components.

**To remove (after migration):**
- **@supabase/ssr** and **@supabase/supabase-js** — Fully replaced by Convex + Clerk.

**Critical integration point:** Clerk auth flow: ClerkProvider (wraps app) → ConvexProviderWithClerk (Clerk's useAuth hook passed to Convex) → Component tree can use both Clerk auth and Convex queries.

**Do NOT add:** @clerk/clerk-react (redundant), @clerk/backend (redundant), @clerk/themes (use Shadcn), @auth/core (wrong library).

### Expected Features

v2.1 focus is **trust-building + team enablement**, not feature expansion. Core CRM works; goal is converting Eagle from pilot to revenue.

**Must have (table stakes):**
- **Support/Ticketing system** — 4-stage workflow: Report → Discuss → Outcome → Implementation. Unique because "Implementation" stage shows work was done, not just ticket closed. Includes unique ticket IDs, email notifications, admin response interface, status tracking.
- **Security Info page** — Headline: "Data Anda, Perlindungan Kami" (Your Data, Our Protection). Must explain: encryption (at rest + in transit), server location (Singapore), RLS isolation, automatic backups, WHO can access data, password handling (bcrypt). Avoid: SOC 2, GDPR, penetration testing claims (don't have them).
- **Landing page redesign** — Mobile-first (83% traffic mobile, but converts 8% lower). Hero: "WhatsApp Automation untuk UMKM Indonesia". Single WhatsApp CTA (not generic forms). Social proof with Indonesian client logos. Load speed <3s, 16px+ body text, 44x44px touch targets, no pop-ups, forms with ≤5 fields.
- **Workspace roles** — Binary pattern: Owner (everything + delete + transfer), Admin (manage leads + invite), Member (view/edit leads + send messages). Enables team collaboration under one subscription.

**Should have (differentiators):**
- WhatsApp notifications for ticket updates (vs email).
- Bahasa Indonesia interface (already standard).
- Direct escalation to Jonathan (personal touch for early clients).
- Workspace ownership transfer capability.

**Defer (v2.2+):**
- Self-service onboarding (learn from first clients first).
- Billing/subscriptions (manual invoicing fine for 1-5 clients).
- Advanced analytics (not core value prop).
- Public knowledge base (no FAQ patterns yet).
- Chat widgets, multiple ticket queues, SLA automation, custom roles, audit logs, 2FA, API access.

**Why defer matters:** Each feature adds maintenance, potential bugs, and confuses users. For v2.1: **minimum viable trust + minimum viable team management**.

### Architecture Approach

Kapso integration requires **minimal architectural changes** because:
1. Kapso is a **UI library, not a database** — It renders inbox UI but doesn't own data.
2. Data stays in Convex — Kapso reads from Convex queries via props.
3. Kapso handles webhooks — It receives WhatsApp messages via Kapso API, Convex HTTP action processes them.
4. Real-time sync unchanged — Convex subscriptions trigger Kapso re-renders when conversation data changes.

**Major components:**
1. **KapsoInbox wrapper** (`/src/components/inbox/kapso-inbox.tsx`) — Adapter between Kapso UI and Convex data. Passes conversations/messages as props, implements onSendMessage callback.
2. **Message sending API** (`/src/app/api/messages/send-kapso/route.ts`) — Validates workspace access, creates outbound message in Convex, calls Kapso API endpoint, returns message ID for optimistic UI.
3. **Kapso HTTP action** (in `convex/http.ts`) — Receives WhatsApp messages from Kapso webhook, validates signature, upserts contact/conversation, schedules ARI processing.
4. **Users table + Clerk webhook** (`convex/schema.ts`, `convex/http.ts`) — Clerk events sync user data to Convex for efficient queries (avoid rate limiting Clerk API).
5. **Real-time subscriptions** (unchanged) — Convex subscriptions on conversations/messages drive Kapso re-renders. Kapso's auto-polling is fallback only.

**Dev mode compatibility:** Mock data structure matches Kapso expectations. Dev mode disables Kapso API calls and auto-polling, uses Convex subscriptions instead.

**Observed issue:** Settings page crashes in production (SSR auth context). Root cause: `useQuery(api.ari.getAriConfig)` in server component. Solution: Move all Convex queries to client components, add error boundary + loading state.

### Critical Pitfalls

Ranked by severity and blast radius:

1. **User Session Disruption (P0)** — Switching from Supabase to Clerk terminates ALL existing sessions immediately. Eagle's team gets logged out mid-session. **Prevention:** Schedule explicit 1-2 hour maintenance window with Eagle's approval. Pre-create Clerk accounts with same email addresses. Send email: "We're upgrading security, please reset password by [date]." Have password reset flow tested and ready.

2. **User ID Mapping Breaks Foreign Keys (P0)** — Supabase UUIDs (`owner_id`, `assigned_to`, `requester_id`, `author_id`, `user_id`, `created_by`) referenced in 10+ Convex tables become orphaned when Clerk assigns new IDs (format: `user_xxxxxxxxxxxxx`). Workspace ownership checks fail, tickets show "Unknown requester", assigned contacts appear unassigned. **Prevention:** Store Supabase UUID as Clerk `external_id` during import. Create `userMappings` table in Convex as bridge lookup. Run migration script that updates all user_id references to new Clerk IDs. Preserve `legacy_user_id` field during transition for rollback.

3. **n8n Webhook Double-Migration (P0)** — n8n workflows on home server (100.113.96.25:5678) send to old Next.js API endpoints that depend on Supabase. After migration, webhooks silently fail, leads stop appearing. **Prevention:** Audit n8n right now (document ALL webhook URLs: Kapso forwarding, lead creation endpoint, others). Create Convex HTTP action equivalents BEFORE removing old endpoints. Update n8n workflows with new URLs. Keep old endpoints as 307 redirects temporarily. Test n8n workflows post-update.

4. **Password Hash Incompatibility (P0)** — Both Supabase and Clerk use bcrypt, but import format may differ. Hash algorithm identifier, cost factor, and salt must match exactly. Users can't log in with existing passwords. **Prevention:** Export Supabase password hashes (query `auth.users` directly). Test import on single user first in Clerk. If hash import fails, implement forced password reset for all users. Use `external_id` for mapping old users.

5. **Middleware Route Matcher Misconfiguration (P1)** — Clerk middleware uses different API than Supabase session checking. `clerkMiddleware()` with `createRouteMatcher()` is different from Supabase cookie validation. Easy to accidentally expose protected routes or block public routes. **Warning signs:** Login page redirects to itself, protected pages accessible without auth, webhooks returning 401, public pages requiring login. **Prevention:** Map all current public routes explicitly: `/`, `/login`, `/signup`, `/pricing`, `/articles/*`, `/api/webhook/*` (webhooks MUST be public), `/portal/*`. Test EVERY route type manually: public pages, protected pages, API routes, webhooks. Use Clerk's route matcher for clarity.

6. **Kapso Props Change Signature (P2)** — npm update changes Kapso component interface, UI breaks. **Prevention:** Pin Kapso version in package.json. Keep KapsoInbox wrapper as translation layer so prop changes only impact one file. Add comment noting Kapso version.

7. **Settings Page SSR Crash (P1)** — Already observed in codebase. `useQuery` in server component causes production crash. **Prevention:** Never use Convex queries in server components. Move all Convex queries to `'use client'` boundaries. Add ESLint rule to catch this pattern (`no-client-hooks-in-server-components`). Code review checklist: "Browser-only context for all Convex queries?"

### Other Notable Pitfalls

- **Real-time subscription breaks during migration** — Schema changes may invalidate subscriptions. Use optional fields during transition, deploy in phases, monitor Convex dashboard.
- **Data volume limits** — Convex has execution time limits. Chunk imports into 100-500 record batches.
- **Webhook signature verification** — Kapso webhook secret must be in Convex environment variables. Different from Vercel env setup.
- **Zero-downtime is not zero** — Sessions terminate, subscriptions disconnect during deploy. Plan for 1-2 hour maintenance window, don't surprise users.
- **Eagle-specific verification** — Generic migration tests pass but Eagle's data has issues. Create Eagle verification checklist (contact count, message history, ARI config, team login).

---

## Implications for Roadmap

### Suggested 7-Phase Structure

This roadmap interleaves infrastructure migration (critical path) with feature work (can parallelize once infrastructure foundation is ready) and Kapso integration (depends on auth + data working).

### Phase 1: Clerk Auth Foundation (Core)
**Rationale:** Auth is the foundation. Everything downstream depends on working Clerk integration and valid JWT validation in Convex.

**Delivers:**
- Clerk application created at clerk.com
- JWT template for Convex configured (CLERK_JWT_ISSUER_DOMAIN extracted)
- @clerk/nextjs@^6.36.8 + svix@^1.84.1 installed
- ConvexClientProvider created: ClerkProvider → ConvexProviderWithClerk → children
- src/middleware.ts updated: clerkMiddleware with route matchers (public, protected, webhooks)
- convex/auth.config.ts migrated: Clerk domain-based auth instead of Supabase JWT issuer
- Testing: All route types tested in staging (public pages, protected pages, API routes, webhooks)

**Addresses:** JWT validation, session persistence, route protection
**Avoids:** P2 webhook auth confusion, P1 middleware misconfiguration
**Dependencies:** None (parallel with Phase 2-4)
**Estimate:** 2-3 days (testing is majority of time)

### Phase 2: User Data Preparation (Core)
**Rationale:** Must complete before auth switchover. Creates the identity bridge that prevents orphaned foreign keys.

**Delivers:**
- Supabase users exported (password hashes, profiles, metadata)
- Clerk webhook configured in Clerk dashboard (user.created, user.updated, user.deleted)
- convex/schema.ts: users table added (clerkId, email, name, imageUrl, timestamps, indexes)
- convex/http.ts: /clerk-users-webhook HTTP action (receives Clerk events, upserts users table)
- Convex environment: CLERK_JWT_ISSUER_DOMAIN + CLERK_WEBHOOK_SECRET set
- Test: Single user imported to Clerk, verified in Convex users table
- userMappings table created: supabase_id → clerk_id bridge for lookups
- Data mapping script prepared (ready to run after Clerk import)

**Addresses:** User identity preservation, user data queries without Clerk API rate limits
**Avoids:** P0 user ID mapping breaks, P0 password hash incompatibility
**Dependencies:** Phase 1 (auth config must be ready for testing)
**Estimate:** 3-4 days (includes testing password hash import)

### Phase 3: Convex Data Migration (Parallel with Phase 2)
**Rationale:** While user data prepared, migrate remaining Supabase tables. No conflict with Phase 2.

**Delivers:**
- Audit Supabase: Document all remaining tables (research lists 14: ari_appointments, consultant_slots, workspace_invitations, user_todos, ari_knowledge_categories, ari_knowledge_entries, ari_destinations, ari_payments, ari_ai_comparison, flows, form_templates, etc.)
- convex/schema.ts updated: All remaining tables added with proper indexes
- Migration scripts written: Chunked in 100-500 record batches (avoid timeouts)
- Data import executed: All Supabase tables → Convex
- Verification: Count checks (total rows per table), spot checks (5 random documents per table)

**Addresses:** Complete data consolidation into Convex
**Avoids:** P0 remaining Supabase tables not migrated, P2 data volume limits
**Dependencies:** None (independent of auth work)
**Estimate:** 3-5 days (depends on number of tables and row counts)

### Phase 4: User Migration & ID Mapping (Core)
**Rationale:** After Clerk auth ready and Convex data prepared, import all existing users and update references.

**Delivers:**
- Supabase users bulk-imported to Clerk with external_id = supabase_uuid
- Test: Password import tested on 5 real users (hash format compatibility)
- Fallback: If hash import fails, password reset flow prepared
- userMappings populated: Every existing user has supabase_id → clerk_id entry
- Migration script run: All workspace members, contacts, tickets, messages updated with new Clerk IDs
- Verification: All workspaces still accessible, workspace members correct count, ticket ownership preserved
- Supabase migration: Database remains read-only (rollback fallback)

**Addresses:** Foreign key integrity, workspace ownership, ticket assignments, message attribution
**Avoids:** P0 user ID mapping breaks, P0 session termination surprise
**Dependencies:** Phases 1, 2 (auth + users table ready)
**Estimate:** 2-3 days (includes verification)

### Phase 5: Webhooks & Integration Layer (Core)
**Rationale:** Once Convex ready, prepare all external integrations (n8n, Kapso) to point to Convex HTTP actions instead of Next.js routes.

**Delivers:**
- Audit n8n workflows (document all URLs, payloads, triggers)
- convex/http.ts: Added routes: /n8n-lead, /kapso-webhook (if not already present)
- Environment variables: KAPSO_WEBHOOK_SECRET copied to Convex settings
- n8n workflows updated: Old endpoint URLs → new Convex HTTP URLs
- Kapso webhook: Verified/updated in Kapso dashboard (points to Convex)
- Old endpoints: Kept as 307 temporary redirects in Next.js (fallback during transition)
- Testing: Webhook POST to old URL redirects to Convex, succeeds

**Addresses:** Data flow from external systems, preserves Eagle's lead pipeline
**Avoids:** P0 n8n webhook double-migration, P1 Kapso webhook URL change, webhook signature verification
**Dependencies:** Phases 1-4 (Convex HTTP actions must exist)
**Estimate:** 2-3 days (mostly external service configuration)

### Phase 6: Kapso UI Integration (Feature)
**Rationale:** After auth/data/webhooks working, safe to integrate Kapso components. Dev mode testing can happen in parallel, production testing requires Phase 5 complete.

**Delivers:**
- /src/components/inbox/kapso-inbox.tsx created: Wrapper adapting Kapso UI to Convex data
- /src/app/api/messages/send-kapso/route.ts created: Message sending API
- InboxClient updated: Custom components (ConversationList, MessageThread) replaced with KapsoInbox wrapper
- Dev mode checks added: If(isDevMode) return mock responses for Kapso API calls
- Settings page SSR crash fixed: Move useQuery to client-only, add error boundary
- Testing at /demo: Conversations/messages display with mock data, no network errors
- Testing production: Real conversations display, message sending works end-to-end, real-time sync working

**Addresses:** Modern UI, professional appearance, WhatsApp-first UX
**Avoids:** P2 Kapso props change (wrapper translation layer), missing error boundaries, SSR in server components
**Dependencies:** Phase 5 (webhooks must work for testing)
**Estimate:** 3-4 days (UI integration + edge case testing)

### Phase 7: Go-Live Coordination (Core)
**Rationale:** Only after phases 1-6 complete in staging. Gated by Eagle verification.

**Delivers:**
- Communication: Email to Eagle team: "Security infrastructure upgrade, [date] 1-2pm maintenance window"
- Password reset flow tested: Users can request reset, email works
- Clerk accounts verified: All Eagle team members exist in Clerk with correct email/roles
- ID mapping script verification: Spot-check workspace members, contacts, tickets have correct ownership
- Supabase read-only: Last fallback before flip
- Go-live execution: (1) Switch auth (clerkMiddleware active, Supabase middleware disabled), (2) Enable Convex HTTP actions, (3) Run ID mapping script, (4) Monitor logs for errors
- Post-migration verification (Eagle-specific checklist):
  - [ ] Eagle workspace accessible
  - [ ] All Eagle contacts present (count match)
  - [ ] Message history spot-check (5 random conversations)
  - [ ] ARI configuration intact ("Your Intern" admin page works)
  - [ ] Eagle team members can log in
  - [ ] New WhatsApp messages flowing through
- Supabase retention: Keep read-only for 2 weeks (rollback window)

**Addresses:** Production migration, operational readiness, first-paying-client validation
**Avoids:** P0 session termination surprise, P1 Eagle data not verified, no rollback plan
**Dependencies:** Phases 1-6 (all infrastructure ready)
**Estimate:** 2 days (mostly waiting for verification + monitoring)

### Phase 8: v2.1 Feature Launch (Parallel with Phases 5-7)
**Rationale:** Can be built in parallel with infrastructure work. Deploy at same time as Go-Live or immediately after.

**Delivers:**
- Support/Ticketing system:
  - Ticket creation form (title, description, priority)
  - Unique ticket IDs (auto-generated)
  - 4-stage workflow UI (Report → Discuss → Outcome → Implementation)
  - Admin response interface (view + reply)
  - Email notifications (Hostinger SMTP)
  - Ticket history list with filtering
- Security Info page:
  - Headline: "Data Anda, Perlindungan Kami"
  - Trust signal cards: Enkripsi, Server Singapore, Akses Terbatas, Backup Otomatis
  - FAQ accordion (6-8 Q&As in Bahasa Indonesia)
  - WhatsApp contact button
- Landing page redesign:
  - Mobile-first hero section
  - "WhatsApp Automation untuk UMKM Indonesia" value prop
  - Social proof section (Indonesian client logos, testimonials)
  - Features grid (3-6 features with icons)
  - Single WhatsApp CTA (repeated throughout)
  - Optimized for <3s load speed, readable text (16px+), touch-friendly buttons (44x44px)
- Workspace roles:
  - Owner role (full access + billing + transfer + delete)
  - Admin role (manage leads + invite)
  - Member role (view/edit leads + send messages)
  - Permission checks on all protected routes
  - Transfer ownership UI
- Email system:
  - Hostinger SMTP configured
  - Email notifications for ticket updates

**Addresses:** All v2.1 must-haves + should-haves
**Avoids:** None (feature work, no infrastructure pitfalls)
**Dependencies:** Phase 5 (auth + webhooks must work for testing)
**Estimate:** 12-14 days dev + design/copy time (can parallelize with Phases 5-7)

---

### Phase Ordering Rationale

- **Phases 1-4 sequential:** Auth must work before data migration, data must exist before ID mapping, ID mapping before user verification.
- **Phase 3 parallel with 2:** Convex data migration independent of auth work, can happen simultaneously.
- **Phase 5 after Phases 1-4:** Webhooks depend on Convex HTTP actions (which need auth + data ready).
- **Phase 6 after Phase 5:** UI integration testing requires working webhooks.
- **Phase 7 gated by Phases 1-6:** Go-live only after everything verified in staging.
- **Phase 8 parallel with 5-7:** Feature development can happen independently, merged into deployment with Go-Live.

**Why this prevents pitfalls:**
- Early focus on user ID mapping (Phase 2 + 4) prevents orphaned foreign keys (P0).
- Webhook preparation before removal of Next.js endpoints prevents lead pipeline disruption (P0).
- Staging testing before Go-Live prevents breaking Eagle's production (P1).
- Communication with Eagle before maintenance window prevents session termination surprise.

---

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 2 (User Data):** Password hash import compatibility needs hands-on testing. Research says "both use bcrypt" but exact format compatibility unverified. **Action:** Obtain sample Supabase password hashes, test import on 5 real users in staging Clerk before bulk import.
- **Phase 3 (Data Migration):** Exact number + schemas of remaining Supabase tables not confirmed. Research lists 14 but doesn't verify which are still in use. **Action:** Run SQL query on Supabase production to confirm current table inventory.
- **Phase 5 (n8n Integration):** Full n8n workflow audit not yet done. Assumes multiple webhooks but doesn't document exact URLs, payloads, or error handling. **Action:** SSH into home server (100.113.96.25:5678), document all active workflows and their webhook endpoints before planning implementation.
- **Phase 6 (Kapso):** Exact Kapso component prop interface not detailed. Architecture doc describes wrapper pattern but doesn't provide full type signatures. **Action:** During implementation, check current @kapso/whatsapp-cloud-inbox version on npm and document exact props.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Clerk Auth):** Official Clerk + Convex integration guide exists, pattern well-documented, no domain-specific gotchas.
- **Phase 4 (ID Mapping):** Standard migration pattern, research provided enough detail for implementation to proceed.
- **Phase 7 (Go-Live):** Standard production deployment with verification checklist. No exotic patterns.
- **Phase 8 (v2.1 Features):** Standard SaaS features (ticketing, landing pages). Expect feature-level research during Phase 8 planning (security copy details, support queue priorities, landing page positioning), but architectural approach is clear from FEATURES.md research.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | Verified against npm registry (v6.36.8 published 2026-01-20, v1.84.1 published 2026-01-05), official Clerk + Convex integration docs (updated 2026-01-14), codebase already uses most components. |
| **Features** | **MEDIUM-HIGH** | Based on cross-referenced SaaS landing page practices (Unbounce, Genesys Growth, Storylane, Caffeine Marketing 2025 research), ticketing system standards (Intercom, DevRev, Zendesk, LiveAgent), Bahasa Indonesia SME market research (ControlHippo, WhatsApp Business Summit Indonesia 2024). Complexity estimates derived from detailed component analysis. |
| **Architecture** | **HIGH** | Verified against live codebase (196k LOC TypeScript analyzed), Kapso official GitHub repo + docs, Convex official migration guides, current middleware patterns, Clerk webhook implementation guide. SSR issue observed in actual Settings page code. |
| **Pitfalls** | **HIGH** | Drawn from Clerk official migration guide (https://clerk.com/docs/guides/development/migrating/overview), Convex migration best practices (stack.convex.dev), current schema analysis (10+ tables with user_id references), n8n webhook configuration (documented in WEBHOOK-MIGRATION-STEPS.md), production safety patterns (Dev.to, SanjayGoraniya blog on zero-downtime migrations). Phase-specific warnings cross-validated across multiple sources. |

**Overall confidence: HIGH**

Research quality is strong because:
- **Stack:** Checked against official npm, GitHub, and vendor docs (freshest: 2026-01-20)
- **Features:** Multiple SaaS research sources (2025) cross-referenced, local market expertise validated
- **Architecture:** Analyzed actual codebase + official library docs + existing integration documentation
- **Pitfalls:** Drew from vendor migration guides + observed issues in live code + production safety patterns

---

## Gaps to Address

1. **n8n Workflow Audit Missing** — Research assumes n8n workflows exist on home server (100.113.96.25:5678) but doesn't have full inventory. Impacts Phase 5 planning. **Action during planning:** SSH to server, export all active workflows, document webhook endpoints and payloads.

2. **Remaining Supabase Tables Unconfirmed** — STACK.md lists 14 tables to migrate (ari_appointments, consultant_slots, etc.) but doesn't verify which are actually still in Supabase vs already migrated in v3.0. **Action during planning:** Run SQL `SELECT table_name FROM information_schema.tables WHERE table_schema='public'` in Supabase production to confirm current state.

3. **Eagle Workspace Structure Unknown** — User ID mapping assumes simple 1:N user:workspace. If Eagle has multi-workspace setup or complex role hierarchies, migration becomes more complex. **Action during planning:** Analyze Eagle workspace in production database (how many workspaces, members per workspace, ticket ownership patterns).

4. **Kapso Component Props Unspecified** — Architecture doc describes wrapper pattern but doesn't document exact prop interface. **Action during implementation:** Check @kapso/whatsapp-cloud-inbox on npm for current version, read component props documentation, add type definitions to KapsoInbox wrapper.

5. **Email System Status Unknown** — v2.1 features require Hostinger SMTP for ticket notifications. Current setup status not verified. **Action during Phase 8 planning:** Confirm Hostinger credentials available and SMTP is working in dev/staging.

6. **Convex Rate Limits Not Stress-Tested** — Webhook bulk imports and ID mapping script behavior under load not verified. Convex rate limits vary by plan. **Action during Phase 4 planning:** Create ID mapping script, test with sample data, monitor execution time and rate limit responses.

---

## Sources

### Stack Research (HIGH confidence)
- **Clerk official docs:** https://clerk.com/docs/guides/development/integrations/databases/convex (updated 2026-01-14)
- **Convex + Clerk:** https://docs.convex.dev/auth/clerk + https://clerk.com/blog/webhooks-data-sync-convex
- **npm registry:** @clerk/nextjs v6.36.8 (published 2026-01-20), convex v1.31.5 (published 2026-01-20), svix v1.84.1 (published 2026-01-05)
- **Current codebase:** Convex schema verified (196k LOC analyzed)

### Features Research (MEDIUM-HIGH confidence)
- **SaaS Landing Pages:** Unbounce, Genesys Growth (conversion statistics 2025), Storylane, Caffeine Marketing (20 B2B SaaS examples 2025)
- **Ticketing Systems:** Intercom SaaS ticketing research, DevRev ticket management (2025), Zendesk ticket lifecycle, LiveAgent best practices
- **Security Pages:** SoftwareFinder SaaS security report (2025), CrazyEgg trust signals, Webstacks B2B SaaS websites
- **Indonesian Market:** ControlHippo WhatsApp API Indonesia, ADA Global customer support, WhatsApp Business Summit Indonesia 2024
- **Roles & Permissions:** Frontegg, EnterpriseReady RBAC guide, SaaSRock documentation

### Architecture Research (HIGH confidence)
- **Kapso:** https://github.com/gokapso/whatsapp-cloud-inbox, https://kapso.ai/
- **Convex migrations:** https://stack.convex.dev/intro-to-migrations, https://stack.convex.dev/zero-downtime-migrations
- **Current repo:** WEBHOOK-MIGRATION-STEPS.md (existing documentation), codebase analysis

### Pitfalls Research (HIGH confidence)
- **Clerk Migration:** https://clerk.com/docs/guides/development/migrating/overview (official guide)
- **Clerk Webhooks:** https://clerk.com/blog/webhooks-data-sync-convex
- **Convex Safety:** https://stack.convex.dev/zero-downtime-migrations, https://stack.convex.dev/lightweight-zero-downtime-migrations
- **Production Patterns:** Dev.to zero-downtime database migration guide, SanjayGoraniya database migration strategies (2025)
- **Codebase analysis:** 10+ tables with user_id references confirmed, Settings page SSR issue observed

---

*Research completed: 2026-01-27*
*Ready for roadmap creation: yes*
*Synthesized by: Claude Code research synthesizer*
