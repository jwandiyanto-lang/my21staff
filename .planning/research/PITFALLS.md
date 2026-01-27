# Pitfalls Research: v3.1 Migration (Supabase to Clerk + Convex)

**Domain:** Auth provider migration (Supabase -> Clerk) + data migration (remaining Supabase tables -> Convex)
**Researched:** 2026-01-23
**Project context:** my21staff (196k LOC TypeScript), production at my21staff.com, first paying client (Eagle Overseas Education), active WhatsApp leads flowing through system
**Migration scope:** Complete removal of Supabase from stack, full migration to Clerk + Convex

---

## Executive Summary

**Top 3 Risks to Watch:**

1. **User Session Disruption** - Switching auth providers terminates ALL existing sessions. Every user (including Eagle's team) will be logged out. Password hashes may not transfer cleanly, forcing password resets.

2. **User ID Mapping Breaks Foreign Keys** - Supabase user IDs (UUIDs) are referenced throughout Convex schema (`owner_id`, `user_id`, `assigned_to`, `requester_id`). New Clerk user IDs won't match, breaking workspace membership, ticket ownership, and message attribution.

3. **n8n Webhook Double-Migration** - You have TWO webhook migrations: (1) Next.js API -> Convex HTTP actions (Kapso), (2) Update n8n workflows for new Convex endpoints. Missing either leaves Eagle's leads orphaned.

---

## Auth Migration Pitfalls (Supabase -> Clerk)

### P0: Session Termination Without Warning

**What goes wrong:** Switching to Clerk terminates ALL existing Supabase sessions immediately. Users get logged out mid-session. If this happens during business hours, Eagle's team can't access their CRM when leads are coming in.

**Why it happens:** Clerk manages sessions independently from Supabase. There's no session handoff mechanism. Once you remove Supabase auth middleware, all Supabase JWTs become invalid.

**Warning signs:**
- Planning to switch auth "over the weekend" without user communication
- No migration timeline shared with Eagle team
- Assuming users can "just log in again"

**Prevention:**
1. **Schedule migration window with Eagle** - Get explicit approval for a 1-2 hour maintenance window
2. **Pre-create Clerk accounts** - Import users with same email BEFORE switching auth
3. **Force password reset for all users** - Password hashes may not transfer (bcrypt vs scrypt compatibility)
4. **Send email notification** - "We're upgrading security, please reset your password by [date]"

**Phase:** Pre-migration communication phase

**Confidence:** HIGH - [Clerk migration docs](https://clerk.com/docs/guides/development/migrating/overview) explicitly state sessions are not preserved

---

### P0: Password Hash Incompatibility

**What goes wrong:** Supabase stores passwords using bcrypt. Clerk also uses bcrypt, BUT the import process may not accept raw password hashes directly. Users can't log in with their existing passwords.

**Why it happens:** Password hash format includes algorithm identifier, cost factor, and salt. Even if both use bcrypt, the exact format may differ. Clerk's user import API requires specific `password_hasher` parameter.

**Warning signs:**
- Assuming "both use bcrypt so it'll work"
- Not testing password import on a single user first
- Users reporting "wrong password" after migration

**Prevention:**
1. **Export Supabase password hashes** - Query `auth.users` table directly (requires Supabase admin access)
2. **Test import with one user** - Create a test user in Clerk with exported hash before bulk import
3. **Have password reset flow ready** - If hash import fails, all users need password reset
4. **Use `external_id` for mapping** - Store Supabase UUID as Clerk external_id for data correlation

**Phase:** User data export/import phase

**Confidence:** MEDIUM - [Clerk CreateUser API](https://clerk.com/docs/guides/development/migrating/overview) shows password_hasher support but exact Supabase compatibility needs testing

---

### P1: User ID Mismatch in Convex Data

**What goes wrong:** Current Convex schema stores Supabase UUIDs everywhere:
- `workspaces.owner_id` (string - Supabase UUID)
- `workspaceMembers.user_id` (string - Supabase UUID)
- `contacts.assigned_to` (string - Supabase UUID)
- `tickets.requester_id` (string - Supabase UUID)
- `ticketComments.author_id` (string - Supabase UUID)

Clerk assigns NEW user IDs. All these references become orphaned.

**Why it happens:** You're replacing the identity provider, but the data layer still references old identity format. Convex doesn't have "foreign key constraints" - these are just strings that no longer map to real users.

**Warning signs:**
- "User not found" errors in workspace member queries
- Tickets showing "Unknown requester"
- Assigned contacts appearing unassigned
- Ownership checks failing (workspace owner can't access workspace)

**Prevention:**
1. **Store Supabase UUID as Clerk external_id** - This is the bridge between old and new
2. **Create user mapping table in Convex:**
   ```typescript
   userMappings: defineTable({
     supabase_id: v.string(),
     clerk_id: v.string(),
     email: v.string(),
   }).index("by_supabase", ["supabase_id"]).index("by_clerk", ["clerk_id"])
   ```
3. **Update all user_id references during migration** - Run migration that looks up new Clerk ID and updates all documents
4. **Preserve original IDs temporarily** - Add `legacy_user_id` field during transition

**Phase:** Post-Clerk-import migration phase

**Confidence:** HIGH - Analyzed current Convex schema (lines 11, 26-27, 47, 171, 194, 206)

---

### P1: Middleware Migration Breaks Protected Routes

**What goes wrong:** Current Next.js middleware (`src/middleware.ts`) uses Supabase session checking:
```typescript
const supabase = createServerClient(...)
const { data: { user } } = await supabase.auth.getUser()
```
Replacing with Clerk middleware has different API. Misconfiguration exposes protected routes or blocks public routes.

**Why it happens:** Clerk middleware uses `clerkMiddleware()` with route matchers. Different pattern from Supabase's cookie-based session. Easy to misconfigure public vs protected routes.

**Warning signs:**
- Login page redirecting to itself (loop)
- Protected pages accessible without auth
- API routes failing with 401 when they shouldn't
- Public pages (/, /pricing, /articles) requiring login

**Prevention:**
1. **Map current public routes explicitly:**
   ```typescript
   // Current public routes in middleware.ts line 47
   const publicRoutes = ['/', '/login', '/signup', '/change-password', '/pricing', '/set-password', '/forgot-password', '/reset-password']
   ```
2. **Use Clerk's `createRouteMatcher`** for clarity:
   ```typescript
   const isPublicRoute = createRouteMatcher([
     '/',
     '/login',
     '/signup',
     '/pricing(.*)',
     '/articles(.*)',
     '/api/webhook(.*)', // Critical: webhooks are public!
   ])
   ```
3. **Test EVERY route type** - Public pages, protected pages, API routes, webhooks
4. **Keep old middleware during transition** - Comment out, don't delete

**Phase:** Middleware migration phase

**Confidence:** HIGH - [Clerk middleware migration guide](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-2/nextjs) documents route matcher pattern

---

### P2: Webhook Authentication Confusion

**What goes wrong:** Current Convex auth config (`convex/auth.config.ts`) validates Supabase JWTs:
```typescript
issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
```
Clerk JWTs have different issuer and structure. Convex auth layer rejects valid Clerk sessions.

**Why it happens:** Convex validates JWTs against configured issuer. Changing auth provider requires updating Convex auth config to validate Clerk JWTs instead.

**Warning signs:**
- "Unauthorized" errors in Convex queries after Clerk migration
- `getAuthUserId()` returning null for logged-in users
- Frontend showing authenticated, backend rejecting requests

**Prevention:**
1. **Update Convex auth.config.ts for Clerk:**
   ```typescript
   export default {
     providers: [
       {
         domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
         applicationID: "convex",
       },
     ],
   } satisfies AuthConfig;
   ```
2. **Deploy Convex auth config BEFORE frontend migration**
3. **Test with a single endpoint** before full rollout
4. **Set up Clerk webhook to Convex** for user data sync

**Phase:** Convex + Clerk integration phase

**Confidence:** HIGH - [Clerk Convex integration](https://clerk.com/blog/webhooks-data-sync-convex) documents auth config pattern

---

## Data Migration Pitfalls (Supabase -> Convex)

### P0: Remaining Supabase Tables Not Migrated

**What goes wrong:** v3.0 migrated core tables to Convex, but some tables may still be in Supabase:
- Knowledge base entries (`ari_knowledge`)
- Flow stages configuration
- Scoring configuration
- Consultation slots

If these aren't migrated, app breaks when Supabase is removed.

**Why it happens:** Incremental migration leaves "forgotten" tables. The app works until someone accesses a feature that reads from unmigrated table.

**Warning signs:**
- "Your Intern" admin pages failing after migration
- Knowledge base empty
- Consultation booking broken
- ARI responses using outdated config

**Prevention:**
1. **Audit ALL Supabase tables:**
   ```bash
   # In Supabase SQL editor
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
2. **Cross-reference with Convex schema** - Every Supabase table needs a Convex equivalent
3. **Test EVERY feature** - Not just the main inbox flow
4. **Create migration checklist** by table

**Phase:** Data audit phase (before migration)

**Confidence:** HIGH - Current Convex schema shows some tables but needs verification against Supabase

---

### P1: ID Format Change (UUID -> Convex ID)

**What goes wrong:** Supabase uses UUIDs (`25de3c4e-b9ca-4aff-9639-b35668f0a48e`). Convex uses its own ID format (`j57g3kz9h8g0c0cxz8f6s3hb`). All `supabaseId` fields become orphaned references.

**Why it happens:** You're moving between two different data stores with incompatible ID systems. The `supabaseId` field in current Convex schema was meant for migration tracking, not permanent use.

**Warning signs:**
- Joins/lookups by supabaseId failing
- URL parameters containing old UUIDs not resolving
- "Contact not found" errors for bookmarked URLs
- External integrations (n8n) still sending Supabase IDs

**Prevention:**
1. **Keep supabaseId for backward compatibility** - Don't remove during migration
2. **Add index on supabaseId** - For efficient lookup during transition
3. **Update external systems gradually** - n8n, bookmarked URLs, etc.
4. **Implement ID translation layer:**
   ```typescript
   // In Convex query
   async function getContactByAnyId(ctx, id: string) {
     // Try as Convex ID first
     const normalized = ctx.db.normalizeId("contacts", id);
     if (normalized) return ctx.db.get(normalized);
     // Fall back to supabaseId lookup
     return ctx.db.query("contacts")
       .withIndex("by_supabase_id", q => q.eq("supabaseId", id))
       .first();
   }
   ```

**Phase:** Data migration phase

**Confidence:** HIGH - Current schema has `supabaseId` fields (lines 53, 72, 93, etc.) that need preservation

---

### P1: Real-time Subscription Breaks During Migration

**What goes wrong:** Frontend uses Convex subscriptions for real-time updates. During migration, schema changes may invalidate existing subscriptions. Users see stale data or errors.

**Why it happens:** Convex validates schema at deployment time. If migration adds required fields or changes types, existing data may not conform, causing query failures.

**Warning signs:**
- "Schema validation failed" during deployment
- Real-time updates stopping silently
- Console errors about "undefined" fields
- Inbox not updating when new messages arrive

**Prevention:**
1. **Use optional fields during transition:**
   ```typescript
   // Instead of: newField: v.string()
   newField: v.optional(v.string())
   // Then migrate data, then make required
   ```
2. **Deploy schema changes in phases:**
   - Phase 1: Add optional fields
   - Phase 2: Run data migration
   - Phase 3: Make fields required (if needed)
3. **Monitor Convex dashboard** during migration for subscription errors
4. **Have rollback plan** - Keep previous schema version

**Phase:** Schema evolution phase

**Confidence:** HIGH - [Convex migration guide](https://stack.convex.dev/intro-to-migrations) emphasizes phased schema changes

---

### P2: Data Volume Limits

**What goes wrong:** Convex has different performance characteristics than Postgres. Large batch imports (100k+ records) may timeout or hit rate limits.

**Why it happens:** Convex mutations have execution time limits. Bulk imports need to be chunked. No direct SQL equivalent for mass updates.

**Warning signs:**
- Import mutations timing out
- "Too many requests" errors
- Migration taking hours instead of minutes
- Incomplete imports (partial data)

**Prevention:**
1. **Chunk imports** - 100-500 records per mutation
2. **Use Convex migrations component** for large datasets
3. **Track progress** - Store migration cursor to resume if interrupted
4. **Off-hours migration** - Less read traffic competing with writes

**Phase:** Data migration execution phase

**Confidence:** MEDIUM - [Convex data import](https://stack.convex.dev/migrate-data-postgres-to-convex) recommends chunking

---

## Integration Pitfalls (n8n, Webhooks, Production Traffic)

### P0: n8n Webhook URLs Still Point to Old Endpoints

**What goes wrong:** Eagle's leads come through n8n workflows that POST to Next.js API routes. These routes use Supabase. After migration, n8n continues sending to old endpoints that no longer work.

**Why it happens:** n8n workflows are stored externally (on your home server). Changing the codebase doesn't update n8n configuration. Leads silently fail.

**Warning signs:**
- New leads stop appearing in CRM
- n8n workflow executions showing errors
- Eagle asking "where are my leads?"
- Kapso showing messages delivered but not in system

**Prevention:**
1. **Document ALL n8n webhook URLs currently in use:**
   - Kapso webhook forwarding
   - Lead creation endpoints
   - Any other integrations
2. **Create Convex HTTP action equivalents** BEFORE removing old endpoints
3. **Update n8n workflows** with new Convex URLs
4. **Keep old endpoints as redirects** temporarily:
   ```typescript
   // Old endpoint becomes redirect
   export async function POST(request: NextRequest) {
     return NextResponse.redirect(
       'https://intent-otter-212.convex.site/api/leads',
       307 // Temporary redirect, keeps POST method
     );
   }
   ```
5. **Test n8n workflows** after updating URLs

**Phase:** Integration migration phase

**Confidence:** HIGH - n8n runs on separate server (100.113.96.25:5678), manual update required

---

### P1: Kapso Webhook URL Change

**What goes wrong:** Current Kapso webhook points to Next.js API route (`/api/webhook/kapso`). v3.0 already has Convex webhook handler, but Kapso dashboard may still point to old URL.

**Why it happens:** Kapso webhook configuration is external. Must be manually updated in Kapso dashboard.

**Warning signs:**
- WhatsApp messages not appearing in CRM
- Webhook handler logs showing no traffic
- Kapso dashboard showing delivery failures

**Prevention:**
1. **Verify current Kapso webhook URL** in Kapso dashboard
2. **Update to Convex URL:** `https://intent-otter-212.convex.site/api/webhook/kapso`
3. **Keep BOTH endpoints live temporarily** - Route traffic to same handler
4. **Monitor both endpoints** for traffic during transition
5. **WEBHOOK-MIGRATION-STEPS.md** already documents this - follow it!

**Phase:** External integration update phase

**Confidence:** HIGH - WEBHOOK-MIGRATION-STEPS.md exists in repo with instructions

---

### P1: Webhook Signature Verification Key Mismatch

**What goes wrong:** Kapso webhook signature verification uses `KAPSO_WEBHOOK_SECRET`. If this env var isn't set in Convex, webhooks fail signature validation and are rejected.

**Why it happens:** Environment variables don't automatically transfer between Vercel and Convex. Must be explicitly set in both.

**Warning signs:**
- Webhook returning 401 "Invalid signature"
- Logs showing "signature verification failed"
- Messages from WhatsApp not being processed

**Prevention:**
1. **Copy webhook secret to Convex:**
   ```bash
   npx convex env set KAPSO_WEBHOOK_SECRET "your-secret-here"
   ```
2. **Verify in Convex dashboard** - Settings > Environment Variables
3. **Test webhook verification** before switching traffic

**Phase:** Environment configuration phase

**Confidence:** HIGH - Current webhook handler in `route.ts` lines 101-110 checks signature

---

### P2: Rate Limiting Differences

**What goes wrong:** Current rate limiting is in-memory in Vercel function. Convex has different rate limiting characteristics. High-volume webhook bursts may be handled differently.

**Why it happens:** Convex functions have built-in rate limiting and queuing. Behavior under load may differ from Vercel `waitUntil` pattern.

**Warning signs:**
- Webhooks being throttled unexpectedly
- Message processing delays during high volume
- Duplicate message processing (retry storms)

**Prevention:**
1. **Understand Convex rate limits** - Check current plan limits
2. **Implement idempotency** - Current `kapso_message_id` dedup is good, verify it works in Convex
3. **Use Convex scheduler for queuing** - Instead of immediate processing:
   ```typescript
   await ctx.scheduler.runAfter(0, api.kapso.processMessage, { payload });
   ```
4. **Monitor during high-traffic periods**

**Phase:** Production hardening phase

**Confidence:** MEDIUM - [Convex rate limits](https://docs.convex.dev/production/state/limits) vary by plan

---

## Production Safety

### P0: No Rollback Plan

**What goes wrong:** Migration fails mid-way. Supabase is partially deprecated, Convex has partial data, Clerk has some users. No clear path to recover.

**Why it happens:** "We'll figure it out if something goes wrong" mentality. Complex migrations need explicit rollback procedures.

**Warning signs:**
- "We've already deleted the old data"
- "Supabase subscription was cancelled"
- No backup before migration
- "We can't go back now"

**Prevention:**
1. **Keep Supabase active** for 2 weeks post-migration (read-only fallback)
2. **Document point-of-no-return** - What actions can't be undone?
3. **Create rollback scripts:**
   - Revert Convex schema to previous version
   - Re-enable Supabase auth in middleware
   - Redirect webhooks back to Next.js
4. **Test rollback procedure** in staging before production

**Phase:** Migration planning phase

**Confidence:** HIGH - Standard migration safety practice

---

### P1: Zero-Downtime Not Actually Zero

**What goes wrong:** Plan for "zero downtime" but:
- Users get logged out (session termination)
- Real-time subscriptions disconnect during deploy
- Webhooks queue during switchover

**Why it happens:** True zero-downtime requires dual-write/dual-read patterns. Simple "flip the switch" migration has inherent downtime.

**Warning signs:**
- Claiming "zero downtime" without dual-write implementation
- Users reporting "lost connection" during migration
- Webhook queue building up

**Prevention:**
1. **Define acceptable downtime** with Eagle team - 10 minutes? 1 hour?
2. **Schedule maintenance window** - Don't surprise users
3. **Implement staged rollout:**
   - Day 1: Add Clerk alongside Supabase (dual auth)
   - Day 2: Migrate users to Clerk
   - Day 3: Remove Supabase auth
4. **Communicate status** - Status page or email updates

**Phase:** Migration execution phase

**Confidence:** HIGH - True zero-downtime requires significant engineering effort

---

### P1: Eagle-Specific Data Verification

**What goes wrong:** Generic migration verification passes, but Eagle's specific data (their workspace, their leads, their conversations) has issues.

**Why it happens:** Eagle is your paying client with real data. Generic test data doesn't catch workspace-specific issues.

**Warning signs:**
- "Migration successful" but Eagle can't see their leads
- Message history partially missing
- ARI configuration not migrated correctly

**Prevention:**
1. **Create Eagle-specific verification checklist:**
   - [ ] Eagle workspace accessible
   - [ ] All Eagle contacts present (count check)
   - [ ] Message history complete (spot check 5 random conversations)
   - [ ] ARI configuration intact (check "Your Intern" page)
   - [ ] Eagle team members can log in
   - [ ] New WhatsApp messages flowing through
2. **Do a test migration** with Eagle's data in staging
3. **Have Eagle verify** after migration before declaring success

**Phase:** Post-migration verification phase

**Confidence:** HIGH - First paying client deserves special attention

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| User export from Supabase | Password hash format incompatibility | Test single user import first |
| Clerk user import | Missing external_id mapping | Store Supabase UUID as external_id |
| Middleware migration | Route matcher misconfiguration | Test every route type manually |
| Convex auth config | Wrong JWT issuer | Deploy Convex config before frontend |
| Data migration | Timeout on large tables | Chunk into 100-500 record batches |
| n8n webhook update | Forgetting to update | Document ALL webhook URLs in use |
| Kapso webhook switch | Signature verification failure | Copy env var to Convex |
| Go-live | No rollback plan | Keep Supabase active 2 weeks post-migration |
| Post-migration | Eagle data not verified | Create Eagle-specific verification checklist |

---

## Quick Reference Checklist

### Before Starting Migration
- [ ] Eagle team informed of maintenance window
- [ ] All Supabase tables documented for migration
- [ ] All webhook URLs documented (Kapso, n8n, any others)
- [ ] Rollback procedure documented
- [ ] Supabase password hashes exported
- [ ] Clerk environment set up and tested

### Before Switching Auth
- [ ] All users imported to Clerk
- [ ] Password import tested on single user
- [ ] external_id set to Supabase UUID for all users
- [ ] Convex auth.config.ts updated for Clerk
- [ ] Middleware migrated and tested
- [ ] Clerk webhook to Convex set up

### Before Switching Webhooks
- [ ] Convex HTTP action handlers deployed
- [ ] Environment variables set in Convex
- [ ] n8n workflows updated with new URLs
- [ ] Kapso webhook URL updated
- [ ] Old endpoints kept as redirects

### After Migration
- [ ] Eagle workspace verified
- [ ] Eagle contact count matches
- [ ] Message history spot-checked
- [ ] New WhatsApp messages flowing
- [ ] ARI configuration intact
- [ ] All team members can log in
- [ ] Supabase kept read-only for 2 weeks

---

## Sources

### Clerk Migration
- [Clerk Migration Overview](https://clerk.com/docs/guides/development/migrating/overview) - Official migration guide
- [Supabase to Clerk Guide](https://felixvemmer.com/en/blog/migrate-user-authentication-supabase-clerk-dev) - Step-by-step with Python script
- [Clerk Webhooks with Convex](https://clerk.com/blog/webhooks-data-sync-convex) - User data sync pattern

### Convex Migration
- [Intro to Migrations](https://stack.convex.dev/intro-to-migrations) - Core concepts
- [Migrate from Postgres to Convex](https://stack.convex.dev/migrate-data-postgres-to-convex) - Data migration patterns
- [Zero-Downtime Migrations](https://stack.convex.dev/zero-downtime-migrations) - Production safety
- [Lightweight Migrations](https://stack.convex.dev/lightweight-zero-downtime-migrations) - Phased approach

### n8n
- [n8n Webhook URL Change](https://mpiresolutions.com/blog/how-to-change-webhook-url-in-n8n/) - URL migration steps

### Production Safety
- [Zero-Downtime Database Migration](https://dev.to/ari-ghosh/zero-downtime-database-migration-the-definitive-guide-5672) - General patterns
- [Database Migration Strategies](https://sanjaygoraniya.dev/blog/2025/10/database-migration-strategies) - Zero-downtime deployments

---

*Last updated: 2026-01-23*
