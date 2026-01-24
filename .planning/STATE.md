# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** The system that lets you grow
**Current focus:** v3.2 (planning needed)

## Current Position

Milestone: v3.2 (planning needed)
Phase: None (new milestone)
Status: Ready for `/gsd:new-milestone`
Last activity: 2026-01-24 - v3.1 closed (API layer complete, Supabase dormant)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 █████████▒ (187 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 163
- Average duration: ~14 min
- Total execution time: ~39.60 hours

**By Milestone:**

| Milestone | Plans | Days |
|-----------|-------|------|
| v1.0 | 14 | <1 |
| v2.0 | 38 | 4 |
| v2.1 | 30 | 3 |
| v2.2 | 23 | <1 |
| v3.0 | 21 | 3 |

## Accumulated Context

### v3.1 Migration Context

**Goal:** Replace Supabase entirely with Convex + Clerk.

**Critical path:**
1. Clerk auth infrastructure (JWT validation for Convex) - DONE
2. Middleware + Provider + Auth UI (user-facing auth) - DONE
3. Users table + webhook (user data in Convex) - DONE
4. User migration + organizations (existing data) - DONE (04-05 complete)
5. Data migration (remaining Supabase tables) - DONE (05-05 complete - API layer migrated)
6. n8n integration (Eagle lead flow) - DONE (06-01 complete - webhook + workflow verified)
7. Cleanup (remove Supabase) - NEXT

**Key risks (from research):**
- Session termination unavoidable (all users logged out)
- User ID mapping: Supabase UUIDs referenced in 10+ tables
- Double webhook migration: Kapso + n8n must both move

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Recent v3.1 decisions:
- Webhook batch mutations without auth: Kapso webhook mutations skip workspace membership checks since signature already validated (07-06)
- ARI partial migration acceptable: Completed processor core functions, deferred supporting files to next plan due to interdependencies (07-06)
- Centralized credential query: getKapsoCredentials query in workspaces module used by both webhook and ARI (07-06)
- Preserved business logic in routes: Permission checks and validation stay in API routes during Convex migration, not moved to mutations (07-02)
- Clerk user creation for admin: Admin client creation uses Clerk createUser instead of Supabase admin auth (07-02)
- Type assertions for Convex queries: Added type casts to handle TypeScript union type inference from query results (07-02)
- Notes export N+1 pattern: Notes export fetches contacts first, then notes per contact - no workspace index on contactNotes (07-03)
- Public pricing form mutation: upsertPricingFormContact has no auth check - pricing form is public-facing endpoint (07-03)
- Convex contact mutations: Created dedicated upsertContactForImport and mergeContacts mutations for cleaner separation vs reusing createContact (07-03)
- Legacy Supabase auth pages deleted: signup and change-password pages were orphaned dead code with broken references - safely deleted (no incoming links) (07-01a)
- createOutboundMessage visibility: Changed from internalMutation to mutation for API route access while maintaining auth (07-04)
- Ticket attachments to Convex storage: Migrated ticket attachments to Convex file storage, chat media remains on Supabase temporarily (07-04)
- Typing indicators deferred: Stubbed out local-only implementation - requires dedicated Convex real-time table (nice-to-have feature) (07-05)
- ConvexHttpClient for server actions: Server actions use ConvexHttpClient (not React hooks) for Convex mutations (07-05)
- intent-otter-212 deployment URL: n8n webhook uses intent-otter-212.convex.site (not pleasant-antelope) (06-01)
- JSON.stringify for n8n body: n8n HTTP Request uses JSON.stringify($json) to send full payload (06-01)
- Supabase storage retention for attachments: File storage can remain on Supabase while database moves to Convex (05-05)
- ARI processor migration deferred: processor.ts is 999 lines requiring careful refactoring beyond atomic commit scope - infrastructure ready (05-05)
- Portal uses Clerk auth: Portal is client-facing, needs consistent auth with main app - uses auth() from @clerk/nextjs/server (05-05)
- Public mutations for unauthenticated endpoints: Created findOrCreateContact mutation without auth for public webinar registration (05-04)
- Registration count pattern: Fetch counts in parallel using countWebinarRegistrations query for list views (05-04)
- Timestamp conversion in API routes: Convert ISO strings to timestamps for Convex scheduled_at field (05-04)
- ARI Convex module: Single convex/ari.ts for all ARI operations (config, flow stages, knowledge, scoring, slots) (05-03)
- Simplified flow stage delete: No automatic reordering on delete - UI handles batch updates (05-03)
- Category delete behavior: Categories deletable, entries must be unlinked first (no cascade in Convex) (05-03)
- mutation vs internalMutation: Use mutation (not internalMutation) for migration functions to enable ConvexHttpClient access (05-02)
- ConvexHttpClient pattern: Use api.migrate.* for type-safe mutation calls from Node.js scripts (05-02)
- Empty table handling: Migration handles 0-record tables gracefully - ARI/CMS features not yet in production (05-02)
- v.optional(v.any()) for JSONB fields: Preserves Supabase JSONB flexibility (ariDestinations.requirements, ariPayments.gateway_response) (05-01)
- supabaseId in CMS tables: Enables migration reference tracking for articles/webinars (05-01)
- Clerk OrganizationProfile for team management: Replaces custom UI with built-in invitations (04-05)
- Deferred verification: Team page + webhook testing combined at end of phase (04-05)
- Deferred webhook config: Organization webhooks configured at end of phase, not blocking (04-04)
- Eagle-only org approach: Only migrate Eagle Overseas due to Clerk free plan limit (04-02)
- My21Staff workspace stays in Supabase: Not converted to org, can add after plan upgrade (04-02)
- external_id for ID mapping: Set Supabase UUID as external_id in Clerk (04-01)
- skip_password_requirement: Migrated users use Forgot Password flow (04-01)
- Manual PATCH for existing OAuth users: Update external_id instead of failing (04-01)
- Convex HTTP endpoints use `.convex.site` domain (not `.convex.cloud`) (03-02)
- Web Crypto API for svix signature verification (Convex doesn't support Node.js crypto) (03-02)
- HTTP routes must be in `convex/http.ts` (Convex ignores `_internal/` for HTTP) (03-02)
- Use internalMutation for webhook functions (not publicly accessible) (03-01)
- Idempotent createUser handles webhook retries (03-01)
- updateUser creates if missing (handles webhook ordering) (03-01)
- ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider hierarchy (02-01)
- Clerk catch-all route pattern [[...sign-in]] for password reset and MFA flows (02-02)
- Use Clerk appearance API for brand styling (white background, my21staff logo) (02-02)
- Replace custom profile menus with Clerk UserButton (02-02)

Recent v3.0 decisions affecting v3.1:
- Convex migration (hybrid: Supabase auth + Convex data) - 25.4x faster (37ms vs 926ms P95)
- Use v.optional(v.any()) for metadata fields
- Snake_case naming in Convex to match Supabase

### User Migration Status

**Migrated users:** 2/2 (100%)

| Email | Supabase UUID | Clerk ID | Notes |
|-------|---------------|----------|-------|
| manjowan@gmail.com | e09597ff-4b0f-4e7b-b6c7-c74a47e9457e | user_38fLdL8Y1qHQIYQob1u1FtR9fEL | OAuth user updated |
| jwandiyanto@gmail.com | d7012f0e-54a7-4013-9dfa-f63057040c08 | user_38fViPWAnLiNth62ZaAJj3PQDWU | Super-admin |

**Mapping file:** `.planning/migrations/user-id-mapping.json`

### Organization Migration Status

**Migrated orgs:** 1/2 (eagle-only per user decision)

| Workspace | Supabase ID | Clerk Org ID | Status |
|-----------|-------------|--------------|--------|
| Eagle Overseas | 25de3c4e-b9ca-4aff-9639-b35668f0a48a | org_38fXP0PN0rgNQ2coi1KsqozLJYb | Migrated |
| My21Staff | 0318fda5-22c4-419b-bdd8-04471b818d17 | N/A | Not migrated (free plan limit) |

**Mapping file:** `.planning/migrations/workspace-org-mapping.json`

### Blockers/Concerns

**Convex CLI Bug:** `npx convex deploy` incorrectly reports env var not set (despite `env list` confirming it). Workaround: use Convex Dashboard to deploy or wait for CLI fix. Dev deployment works correctly.

### Deferred Work (Supabase Dormant Strategy)

**Decision:** v3.1 closed with Supabase dormant — 24 page components still use Supabase directly. Will migrate feature-by-feature in future milestones rather than big-bang migration.

**Files still using Supabase (migrate when touching feature):**

| Category | Count | Files |
|----------|-------|-------|
| Dashboard pages | 10 | workspace page, inbox, database, settings, support, knowledge-base, integrations, website, dashboard, admin clients |
| Layouts | 3 | dashboard layout, admin layout, portal layout |
| Portal pages | 2 | portal support, portal support detail |
| Client components | 6 | sidebar, workspace-switcher, inbox-client, message-thread, appointment-card, login-modal |
| Public pages | 3 | webinar page, article page, contact-detail-sheet |

**Migration pattern when touching:**
- Server components: Replace `createClient()` with `ConvexHttpClient` or `useQuery`
- Client components: Replace Supabase hooks with `useQuery`/`useMutation` from Convex

**Full list:** See `.planning/phases/07-cleanup-verification/07-07-SUMMARY.md`

### Ticket Migration Status

**Ticket tables:** Empty (0 records) - ticketing system not yet used

| Table | Records | Status |
|-------|---------|--------|
| tickets | 0 | Migration script ready |
| ticketComments | 0 | Migration script ready |
| ticketStatusHistory | 0 | Migration script ready |

**Migration script:** `scripts/update-convex-ticket-ids.ts` (verified working)
**Report:** `.planning/migrations/user-id-update-report-tickets.json`

### Core Table Migration Status

**Core tables:** Empty (0 records) - data not yet migrated from Supabase

| Table | Field | Records | Status |
|-------|-------|---------|--------|
| workspaces | owner_id | 0 | Migration script ready |
| workspaceMembers | user_id | 0 | Migration script ready |
| contacts | assigned_to | 0 | Migration script ready |
| conversations | assigned_to | 0 | Migration script ready |
| messages | sender_id | 0 | Migration script ready |
| contactNotes | user_id | 0 | Migration script ready |

**Migration script:** `scripts/update-convex-user-ids.ts` (verified working)
**Report:** `.planning/migrations/user-id-update-report-core.json`

### Pending User Setup

**Clerk Dashboard - Organization Webhooks (deferred from 04-04):**
1. Go to Clerk Dashboard -> Webhooks
2. Edit webhook: pleasant-antelope-109.convex.site/webhook/clerk
3. Add events: organization.created, organization.updated, organization.deleted, organizationMembership.created, organizationMembership.updated, organizationMembership.deleted
4. Save changes

### Phase 4 Verification Checklist

Before proceeding to Phase 5, verify:

**Team Page (04-05):**
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to /eagle-overseas/team
- [ ] Member list shows organization members
- [ ] Invite button works (opens Clerk modal)
- [ ] Role management visible for owner

**Organization Webhooks (04-04):**
- [ ] Go to Clerk Dashboard -> Webhooks
- [ ] Edit webhook: `pleasant-antelope-109.convex.site/webhook/clerk`
- [ ] Add events: organization.created, organization.updated, organization.deleted, organizationMembership.created, organizationMembership.updated, organizationMembership.deleted
- [ ] Save changes
- [ ] Test: invite a member, check Convex organizations table

### Data Migration Status

**Remaining Supabase Tables:** 12 tables migrated (scripts ready, data empty)

| Table | Records | Status |
|-------|---------|--------|
| ari_destinations | 0 | ✓ Migration script ready |
| ari_payments | 0 | ✓ Migration script ready |
| ari_appointments | 0 | ✓ Migration script ready |
| ari_ai_comparison | 0 | ✓ Migration script ready |
| ari_flow_stages | 0 | ✓ Migration script ready |
| ari_knowledge_categories | 0 | ✓ Migration script ready |
| ari_knowledge_entries | 0 | ✓ Migration script ready |
| ari_scoring_config | 0 | ✓ Migration script ready |
| consultant_slots | 2 (test) | Network error (non-critical) |
| articles | N/A | Table not created yet (future) |
| webinars | N/A | Table not created yet (future) |
| webinar_registrations | N/A | Table not created yet (future) |

**Migration script:** `scripts/migrate-supabase-to-convex.ts` (verified working)
**Report:** `.planning/migrations/data-migration-report.json`

**Note:** All ARI extended and CMS tables are empty because these features aren't yet in production use. Migration infrastructure ready for when data exists.

## Session Continuity

Last session: 2026-01-24
Stopped at: v3.1 closed — user decision to defer Supabase removal
Resume: `/gsd:new-milestone` to plan v3.2

---
*Last updated: 2026-01-24 - v3.1 shipped (partial), ready for v3.2 planning*
