# Research Summary: v3.1 Full Convex + Clerk Migration

**Project:** my21staff
**Domain:** Auth provider migration + data consolidation
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

The v3.1 migration from Supabase to Clerk + Convex is a well-documented path with strong official support from both vendors. Clerk provides native Convex integration via JWT templates and `ConvexProviderWithClerk`, making the auth layer swap straightforward. The critical path is **user ID mapping**: Supabase UUIDs are embedded throughout the Convex schema (10+ tables reference `user_id`, `owner_id`, `assigned_to`), and Clerk assigns different IDs. Without a mapping strategy, workspace ownership, ticket assignments, and message attribution will break.

The recommended approach is a 7-phase migration with auth infrastructure first, followed by user sync webhooks, then data migration, and finally Supabase removal. This order minimizes blast radius: auth can be tested before touching data, and Supabase remains available as fallback until verification is complete. The n8n webhook fix for Eagle can run in parallel with auth work since it has no dependency on Clerk.

Key risks center on **session termination** (unavoidable - all users will be logged out) and **double webhook migration** (both Kapso and n8n endpoints must move to Convex HTTP actions). Eagle must be notified in advance, and a 1-2 hour maintenance window should be scheduled. Password hashes may not transfer cleanly, so plan for password resets.

## Key Findings

### Recommended Stack

The stack changes are minimal since Convex is already the primary data layer. Add `@clerk/nextjs@^6.36.8` for auth and `svix@^1.84.1` for webhook signature verification. The built-in `convex/react-clerk` integration handles the provider bridge.

**Core technologies:**
- **@clerk/nextjs ^6.36.8**: Auth provider with Organizations feature mapping directly to workspaces
- **svix ^1.84.1**: Clerk webhook signature verification (required for user sync)
- **Convex auth.config.ts update**: Switch from Supabase JWT issuer to Clerk domain-based auth

**Do NOT add:**
- `@clerk/clerk-react` (redundant - included in @clerk/nextjs)
- `@clerk/themes` (use existing Shadcn styling)
- Any new Supabase packages

### Expected Features

**Must have (table stakes):**
- Email/password authentication via Clerk components
- Multi-tenant workspace isolation via Clerk Organizations
- Team invitations with automatic email delivery (Clerk handles this)
- Role-based permissions (owner/admin/member)
- JWT validation for Convex queries/mutations

**Should have (competitive):**
- Working password reset flow (currently broken with Supabase)
- First-login password change via Clerk metadata
- Pre-built UI components (`<SignIn />`, `<UserButton />`, `<OrganizationSwitcher />`)

**Defer (v2+):**
- Custom Clerk email templates (use defaults for v3.1)
- Social login (keep email/password only)
- Custom permissions beyond role-based checks (requires Clerk B2B add-on at $100/month)

### Architecture Approach

The target architecture eliminates Supabase entirely. Clerk manages identity and sessions, issuing JWTs that Convex validates. A Convex `users` table caches Clerk user data via webhooks for efficient queries. The Convex HTTP router handles three endpoints: Clerk user sync webhook, n8n lead webhook, and Kapso message webhook.

**Major components:**
1. **ClerkProvider + ConvexProviderWithClerk** - Client-side auth context (new `src/app/providers.tsx`)
2. **clerkMiddleware** - Route protection replacing Supabase middleware
3. **convex/http.ts** - HTTP action router for all external webhooks
4. **users table** - Clerk user cache in Convex schema

### Critical Pitfalls

1. **Session termination is unavoidable** - All Supabase sessions terminate when auth switches. Schedule maintenance window with Eagle, pre-create Clerk accounts, force password resets.

2. **User ID mapping breaks foreign keys** - Supabase UUIDs referenced in 10+ tables won't match Clerk IDs. Store Supabase UUID as `external_id` in Clerk, create mapping table, run migration to update all references.

3. **Double webhook migration** - Both Kapso (WhatsApp) and n8n (Eagle leads) must move to Convex HTTP actions. Missing either breaks production traffic. Document all webhook URLs before starting.

4. **Middleware route matcher misconfiguration** - Easy to accidentally expose protected routes or block public ones. Test every route type: public pages, dashboard, API routes, webhooks.

5. **No rollback plan** - Keep Supabase active for 2 weeks post-migration. Document point-of-no-return. Test rollback procedure before production migration.

## Implications for Roadmap

Based on research, suggested 7-phase structure:

### Phase 1: Clerk Auth Infrastructure
**Rationale:** Auth is the foundation. Nothing else works until JWT validation is in place.
**Delivers:** Clerk application configured, JWT template created, Convex auth.config.ts updated
**Addresses:** JWT token validation for Convex
**Avoids:** Webhook authentication confusion (P2)

### Phase 2: Middleware + Provider Migration
**Rationale:** Route protection must work before any user-facing changes.
**Delivers:** `clerkMiddleware` replacing Supabase, `providers.tsx` with ConvexProviderWithClerk
**Addresses:** Session persistence, protected routes
**Avoids:** Middleware breaks protected routes (P1)

### Phase 3: Users Table + Clerk Webhook
**Rationale:** User data must be in Convex before removing Supabase.
**Delivers:** `users` table in Convex, `/clerk-webhook` HTTP action, user sync working
**Addresses:** User data queries without hitting Clerk API rate limits
**Avoids:** Real-time subscription breaks (P1)

### Phase 4: User Migration + ID Mapping
**Rationale:** Existing data must reference valid user IDs.
**Delivers:** All existing users imported to Clerk with `external_id`, mapping table created, references updated
**Addresses:** Workspace ownership, ticket assignments, message attribution
**Avoids:** User ID mismatch breaks foreign keys (P1)

### Phase 5: n8n Webhook Migration
**Rationale:** Eagle's leads are broken now. Can run in parallel with auth work.
**Delivers:** `/n8n-leads` HTTP action in Convex, n8n workflows updated
**Addresses:** Eagle lead flow from Google Sheets
**Avoids:** n8n webhook URLs still point to old endpoints (P0)

### Phase 6: Remaining Supabase Tables
**Rationale:** Move all data to Convex before removing Supabase.
**Delivers:** 14 tables migrated (appointments, destinations, knowledge base, todos, etc.)
**Addresses:** Complete data consolidation
**Avoids:** Remaining tables not migrated (P0)

### Phase 7: Supabase Removal + Verification
**Rationale:** Clean removal only after full verification.
**Delivers:** Supabase packages removed, env vars cleaned, documentation updated
**Addresses:** Clean codebase with single data layer
**Avoids:** No rollback plan (P0) - keep Supabase read-only until this phase completes

### Phase Ordering Rationale

- **Phases 1-4 are sequential**: Each builds on the previous. Cannot migrate users until auth works, cannot update references until users exist.
- **Phase 5 is independent**: n8n fix has no dependency on Clerk, can run parallel with Phases 2-4.
- **Phase 6 requires Phase 4**: Data migration needs auth working to validate workspace access.
- **Phase 7 is terminal**: Only execute after full verification with Eagle.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 4 (User Migration):** Password hash compatibility needs testing. May require custom migration script or all users doing password reset.
- **Phase 6 (Remaining Tables):** 14 tables with various schemas. Each may have edge cases.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Clerk Setup):** Well-documented Clerk + Convex integration
- **Phase 2 (Middleware):** Standard clerkMiddleware pattern
- **Phase 3 (Webhook):** Standard svix verification pattern
- **Phase 5 (n8n):** Simple HTTP action, already proven with Kapso

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Clerk + Convex docs (2026-01), npm versions verified |
| Features | HIGH | Direct feature mapping exists, Clerk Organizations = workspaces |
| Architecture | HIGH | Official integration pattern, already proven in community |
| Pitfalls | HIGH | Based on official migration guides + codebase analysis |

**Overall confidence:** HIGH

### Gaps to Address

- **Password hash compatibility:** Supabase bcrypt format may not import cleanly to Clerk. Test with single user before bulk import. Fallback: force password reset for all users.
- **must_change_password flag:** Currently in `workspace_members` table. Needs migration to Clerk user metadata (`publicMetadata.needsOnboarding`).
- **Custom permissions:** Current app uses 11 granular permissions. Clerk free tier only has role-based. Either simplify to roles or budget for B2B add-on.

## Sources

### Primary (HIGH confidence)
- [Clerk + Convex Integration](https://clerk.com/docs/guides/development/integrations/databases/convex) - Updated 2026-01-14
- [Convex Auth with Clerk](https://docs.convex.dev/auth/clerk) - Official pattern
- [Clerk Webhooks Data Sync](https://clerk.com/blog/webhooks-data-sync-convex) - User sync to Convex
- [@clerk/nextjs npm](https://www.npmjs.com/package/@clerk/nextjs) - v6.36.8 (2026-01-20)

### Secondary (MEDIUM confidence)
- [Clerk Migration Overview](https://clerk.com/docs/guides/development/migrating/overview) - Session termination confirmed
- [Convex Migrations Guide](https://stack.convex.dev/intro-to-migrations) - Phased schema changes

### Tertiary (LOW confidence)
- [Supabase to Clerk Blog](https://felixvemmer.com/en/blog/migrate-user-authentication-supabase-clerk-dev) - Community migration, needs validation

---
*Research completed: 2026-01-23*
*Ready for roadmap: yes*
