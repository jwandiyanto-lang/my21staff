# Pitfalls Research: Performance Migration

**Domain:** Performance optimization and potential Supabase-to-Convex migration for production CRM
**Researched:** 2026-01-20
**Project context:** my21staff (43k lines TypeScript), production at my21staff.com, first client (Eagle Overseas) onboarding, 2-6s response times

## Executive Summary

**Top 3 Risks to Watch:**

1. **Data Migration Breaks Production** - Migrating 43k LOC with live webhook traffic and a paying client. One bad migration = downtime during critical onboarding period. Zero-downtime migration patterns are complex but mandatory.

2. **Convex Lock-in Without Validation** - Convex offers compelling real-time features but introduces significant architectural changes (document store vs relational, TypeScript-only, different auth model). A spike without clear success criteria leads to sunk cost fallacy.

3. **Measuring Wrong Metrics** - Current "2-6s response times" is vague. Is it P50? P99? Cold start? Database? Without proper instrumentation, optimization efforts target the wrong bottleneck.

---

## P0 (Critical)

### Data Loss During Migration

- **Risk:** Production data corrupted or lost during migration to Convex. With a live client and webhook traffic, any data inconsistency breaks trust and operations.

- **Warning signs:**
  - Running migration scripts without backup verification
  - Migrating during peak hours (Indonesia business hours)
  - No rollback plan documented
  - "It works on staging" without production-like data volume

- **Prevention:**
  - **Backup before every migration step** - Supabase point-in-time recovery is not instant rollback
  - **Dual-write pattern** - Write to both Supabase and Convex during transition, read from Supabase
  - **Verification queries** - After migration, compare record counts and checksums
  - **Migration during off-hours** - 2-4 AM WIB when webhook traffic is lowest
  - **Staged migration** - Migrate read-only tables first (articles, webinars), critical tables last (contacts, messages)

- **Phase:** Must address in migration planning phase, before any production changes

**Confidence:** HIGH - Based on [zero-downtime migration patterns](https://dev.to/ari-ghosh/zero-downtime-database-migration-the-definitive-guide-5672) and [GoCardless Postgres migrations](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/)

---

### Webhook Processing Fails During Transition

- **Risk:** Kapso webhooks continue hitting `/api/webhook/kapso` during migration. If database writes fail, incoming WhatsApp messages are lost. Eagle's customer inquiries disappear.

- **Warning signs:**
  - Webhook returning 500s during migration
  - Messages in Kapso dashboard but not in CRM
  - Customer complaints about "ignored messages"
  - `waitUntil` background processing failing silently

- **Prevention:**
  - **Webhook queue** - Store raw webhook payloads in a persistent queue before processing
  - **Idempotent processing** - Current `kapso_message_id` deduplication is good; verify it works across databases
  - **Health check endpoint** - Monitor webhook handler availability separately
  - **Fallback path** - If Convex write fails, fall back to Supabase
  - **Replay capability** - Store failed webhooks for later retry

- **Phase:** Must solve before any production migration

**Confidence:** HIGH - Current webhook handler uses `waitUntil` which can fail silently if database unavailable

---

### Sequential Query Cascade Not Identified

- **Risk:** Current 2-6s response times are from sequential queries, but you don't know which queries. Optimizing the wrong path wastes time while real bottleneck remains.

- **Warning signs:**
  - "I optimized the database and nothing changed"
  - Cold start vs database latency confusion
  - RLS policies not measured separately from query time
  - Network latency between Vercel (us-east-1) and Supabase (ap-southeast-1?) unaccounted

- **Prevention:**
  - **Instrument every Supabase call** - Add timing logs to all API routes:
    ```typescript
    const start = Date.now()
    const { data } = await supabase.from('contacts').select(...)
    console.log(`[PERF] contacts query: ${Date.now() - start}ms`)
    ```
  - **Identify the actual slow paths** - `/api/contacts/by-phone` has 4 sequential queries (contact, notes, conversation, messages)
  - **Measure RLS overhead** - Compare admin client (bypasses RLS) vs user client (with RLS)
  - **Check Supabase region** - Ensure matches Vercel deployment region

- **Phase:** Phase 1 of v3.0 - before any optimization decisions

**Confidence:** HIGH - Based on codebase analysis showing multiple sequential queries in critical paths

---

## P1 (High)

### Convex Spike Without Clear Success Criteria

- **Risk:** Build Convex spike, get excited about real-time features, migrate production, then discover edge cases that don't work. By then, you've invested weeks and can't easily revert.

- **Warning signs:**
  - "Convex is faster" without specific numbers
  - Spike only tests happy path
  - No comparison with optimized Supabase baseline
  - Decision made before webhook integration tested

- **Prevention:**
  - **Define success criteria upfront:**
    - P95 response time < 500ms (vs current baseline)
    - Webhook processing time < 200ms
    - Real-time updates work with current TanStack Query patterns
    - Auth integration with Supabase works without user disruption
  - **Test the hard parts first:**
    - Webhook handler with Convex actions (not queries)
    - Supabase auth + Convex data hybrid
    - Existing RLS patterns translated to Convex validators
  - **Set a time-box:** 3 days max for spike, then decision gate
  - **Document limitations found** - What doesn't work as expected?

- **Phase:** Convex spike phase - must define criteria before starting

**Confidence:** HIGH - [Convex migration lessons](https://galaxy.ai/youtube-summarizer/lessons-learned-from-a-chaotic-database-migration-to-convex-xFVh9beupwo) emphasize planning

---

### RLS Performance Not Measured

- **Risk:** Assume slow queries are due to "Supabase" when actual issue is inefficient RLS policies. Current policies use subqueries on every row, which doesn't scale.

- **Warning signs:**
  - Same query fast with admin client, slow with user client
  - Performance degrades as workspace_members table grows
  - `EXPLAIN ANALYZE` shows sequential scans on workspace_members

- **Prevention:**
  - **Measure RLS overhead explicitly:**
    ```typescript
    // With RLS
    const userStart = Date.now()
    await userClient.from('contacts').select('*').eq('workspace_id', id)
    const userTime = Date.now() - userStart

    // Without RLS (admin client)
    const adminStart = Date.now()
    await adminClient.from('contacts').select('*').eq('workspace_id', id)
    const adminTime = Date.now() - adminStart

    console.log(`RLS overhead: ${userTime - adminTime}ms`)
    ```
  - **Apply Supabase RLS optimizations:**
    - Wrap `auth.uid()` in SELECT: `(SELECT auth.uid()) = user_id`
    - Add explicit `workspace_id` filter in queries, not just RLS
    - Index `workspace_members(user_id, workspace_id)`
  - **Consider security definer functions** for hot paths

- **Phase:** Supabase optimization phase - before comparing to Convex

**Confidence:** HIGH - [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) documents this pattern

---

### Missing Database Indexes on Hot Paths

- **Risk:** Current schema has indexes but misses composite indexes for actual query patterns. Adding indexes later requires careful planning to avoid locking tables.

- **Warning signs:**
  - Queries use `WHERE workspace_id = X AND status = Y` but only single-column indexes exist
  - `EXPLAIN` shows "Seq Scan" on large tables
  - Performance degrades with data volume

- **Prevention:**
  - **Identify missing composite indexes:**
    ```sql
    -- For conversations list (most common query)
    CREATE INDEX CONCURRENTLY idx_conversations_workspace_status_time
      ON conversations(workspace_id, status, last_message_at DESC);

    -- For contact lookup by phone (webhook path)
    CREATE INDEX CONCURRENTLY idx_contacts_workspace_phone_normalized
      ON contacts(workspace_id, phone_normalized);

    -- For messages by conversation
    CREATE INDEX CONCURRENTLY idx_messages_conversation_created
      ON messages(conversation_id, created_at DESC);
    ```
  - **Use CONCURRENTLY** - Prevents table locks during index creation
  - **Verify with EXPLAIN ANALYZE** - Confirm index is actually used
  - **Monitor index bloat** - Indexes slow down writes

- **Phase:** Supabase optimization phase - immediate win without architectural changes

**Confidence:** HIGH - [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization) documents index patterns

---

### Auth Integration Complexity Underestimated

- **Risk:** Convex uses different auth model (BYOA with Clerk, Auth0, or custom). Current Supabase auth deeply integrated with RLS, sessions, and `auth.uid()`. Migration breaks user sessions.

- **Warning signs:**
  - Users logged out unexpectedly during migration
  - Supabase sessions not recognized by Convex
  - Need to re-implement password reset, invitation flows
  - Auth state desync between Supabase and Convex

- **Prevention:**
  - **Keep Supabase for auth** - Hybrid architecture: Supabase auth + Convex data
  - **Verify hybrid pattern works:**
    - Convex action that validates Supabase JWT
    - User identity consistent across both systems
    - Session refresh works
  - **Test edge cases:**
    - What happens when Supabase session expires?
    - Can Convex validators access Supabase user ID?
    - How do existing RLS-like checks translate?

- **Phase:** Convex spike - must validate auth hybrid before committing

**Confidence:** MEDIUM - [Convex Auth docs](https://docs.convex.dev/auth) show BYOA patterns but hybrid with Supabase not well documented

---

## P2 (Medium)

### Polling Persists After "Real-time" Implementation

- **Risk:** Add Convex real-time subscriptions or Supabase Realtime, but forget to remove existing polling. Now you have both, wasting resources and causing race conditions.

- **Warning signs:**
  - `setInterval` still running alongside subscriptions
  - Duplicate updates appearing in UI
  - Higher than expected database reads
  - State flickers between poll result and subscription result

- **Prevention:**
  - **Audit all polling code before adding real-time:**
    ```typescript
    // Current polling in sidebar.tsx (line 93)
    const interval = setInterval(fetchUnreadCount, 30000)
    // Must be removed when real-time subscription added
    ```
  - **Single source of truth** - Either poll OR subscribe, never both
  - **Remove polling after subscription works** - Not "when we have time"

- **Phase:** Real-time implementation phase

**Confidence:** HIGH - Found active polling in `/home/jfransisco/Desktop/21/my21staff/src/components/workspace/sidebar.tsx`

---

### Convex Subscription Memory Leaks

- **Risk:** Convex subscriptions auto-update UI on any data change. If queries read from frequently-updating tables, subscriptions fire constantly, causing UI thrashing and memory issues.

- **Warning signs:**
  - Browser becomes sluggish after extended use
  - React DevTools shows excessive re-renders
  - Convex dashboard shows high subscription churn
  - `useQuery` results changing multiple times per second

- **Prevention:**
  - **Design queries for subscription efficiency:**
    - Don't query large document sets in subscriptions
    - Use pagination and only subscribe to visible page
    - Consider `useMutation` for updates instead of live subscription
  - **Monitor subscription counts** - Convex dashboard shows active subscriptions
  - **Debounce UI updates** - If subscription fires rapidly, batch UI updates

- **Phase:** Convex migration phase - design consideration

**Confidence:** MEDIUM - [Convex queries that scale](https://stack.convex.dev/queries-that-scale) documents subscription optimization patterns

---

### Benchmark Tool Limitations

- **Risk:** Benchmark shows Convex is faster, but benchmark tool itself is the bottleneck. Or testing on different conditions (cold start vs warm, different data volumes).

- **Warning signs:**
  - "Convex is 10x faster" but production feels the same
  - Benchmarks run on localhost, production on Vercel
  - Comparing P50 of one vs P99 of another
  - Testing with 10 records when production has 10,000

- **Prevention:**
  - **Benchmark in production-like environment:**
    - Same region as production
    - Realistic data volume
    - Include cold start scenarios
  - **Use consistent metrics:**
    - Always measure P50, P95, P99
    - Measure same operation on both systems
    - Account for network latency
  - **Multiple runs** - Single run is not statistically significant
  - **Load testing** - Performance under 10 concurrent requests, not just 1

- **Phase:** Convex spike - measurement methodology

**Confidence:** HIGH - [Benchmarking pitfalls](https://nearform.com/insights/better-benchmarking-preparing-evaluating-benchmarks/) document common mistakes

---

### N+1 Queries Hidden in API Routes

- **Risk:** API routes look clean but contain N+1 patterns. For example, `/api/contacts/by-phone` does 4 sequential queries when 1-2 would suffice with proper joins.

- **Warning signs:**
  - API response time scales linearly with result count
  - Each item in list triggers additional query
  - Nested data fetched in loop

- **Prevention:**
  - **Audit hot paths for N+1:**
    ```typescript
    // Current pattern in contacts/by-phone (lines 84-105)
    const { data: contact } = await supabase.from('contacts')...
    const { data: notes } = await supabase.from('contact_notes')...
    const { data: conversation } = await supabase.from('conversations')...
    const { data: messages } = await supabase.from('messages')...
    // 4 sequential queries!
    ```
  - **Use Supabase nested selects:**
    ```typescript
    const { data } = await supabase
      .from('contacts')
      .select(`
        *,
        notes:contact_notes(*),
        conversations(
          *,
          messages(*)
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('phone', normalizedPhone)
      .single()
    ```
  - **Parallel queries** - If joins not possible, use `Promise.all` for independent queries

- **Phase:** Supabase optimization phase - before comparing to Convex

**Confidence:** HIGH - Found in codebase analysis of `/api/contacts/by-phone/route.ts`

---

### Webhook Processing Too Slow for Convex Actions

- **Risk:** Convex actions (for side effects) have different performance characteristics than mutations. If webhook processing takes too long, Kapso retries cause duplicate messages.

- **Warning signs:**
  - Duplicate messages in conversations
  - Webhook handler returning 200 but processing fails
  - Convex action timeouts in logs
  - `waitUntil` equivalent not available in Convex

- **Prevention:**
  - **Understand Convex action model:**
    - Actions can have side effects, can't be auto-retried
    - Must handle errors explicitly
    - No direct equivalent to Vercel's `waitUntil`
  - **Validate webhook pattern in spike:**
    - Can Convex HTTP actions handle Kapso payload format?
    - Is processing time within Convex limits?
    - How to handle background work?
  - **Consider hybrid webhook handler** - Vercel receives webhook, triggers Convex mutation

- **Phase:** Convex spike - webhook handling critical path

**Confidence:** MEDIUM - [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) show limitations

---

## Supabase Optimization Pitfalls

### Optimizing Before Measuring

- **Risk:** Add indexes, nested queries, connection pooling without measuring baseline. Can't prove optimization worked.

- **Prevention:**
  - Establish baseline metrics first
  - Measure after each change
  - Document what changed and impact

### Nested Queries Performance Trap

- **Risk:** Nested selects (`select('*, related_table(*)')`) can be slower than parallel queries if relationships are complex.

- **Prevention:**
  - Test both approaches with `EXPLAIN ANALYZE`
  - Nested selects best for 1:1 or small 1:many
  - Parallel queries better for large result sets

### Index Bloat from Over-Indexing

- **Risk:** Add indexes for every slow query. Indexes slow writes and consume storage.

- **Prevention:**
  - Only index columns actually used in WHERE clauses
  - Remove unused indexes periodically
  - Monitor index usage with `pg_stat_user_indexes`

### RLS Policy Per-Row Function Calls

- **Risk:** Current RLS policies call subqueries for every row. With 1000 contacts, that's 1000 workspace_members lookups.

- **Prevention:**
  - Wrap function calls in SELECT for caching
  - Add explicit workspace_id filter in query (not just RLS)
  - Use security definer functions for hot paths

---

## Convex Migration Pitfalls

### Document Store vs Relational Mismatch

- **Risk:** Current schema uses relational patterns (foreign keys, joins). Convex is document-oriented. Migration requires schema redesign, not just data copy.

- **Prevention:**
  - Design Convex schema separately, don't 1:1 copy
  - Consider denormalization for read performance
  - Accept some data duplication in document model

### No Foreign Key Constraints

- **Risk:** Convex doesn't enforce foreign keys at database level. Orphaned records possible if mutation logic has bugs.

- **Prevention:**
  - Implement referential integrity in mutation code
  - Use Convex Ents for entity relationships (experimental)
  - Write integration tests for data integrity

### Deployment Chicken-and-Egg

- **Risk:** Vercel deployment depends on Convex schema. Convex deployment depends on Vercel env vars. Circular dependency causes failed deployments.

- **Prevention:**
  - [Known Vercel+Convex issue](https://community.vercel.com/t/problem-with-convex-migrations-to-vercel-production-environment/22396)
  - Deploy Convex schema before Vercel deployment
  - Use separate Convex projects for staging/production

### Real-time Bandwidth Costs

- **Risk:** Convex real-time subscriptions use bandwidth. High-frequency updates (typing indicators, message counts) can hit bandwidth limits.

- **Prevention:**
  - Monitor Convex dashboard for bandwidth usage
  - Debounce high-frequency subscriptions
  - Consider hybrid: Convex for critical real-time, Supabase for bulk data

---

## Performance Testing Pitfalls

### Measuring Average Instead of Percentiles

- **Risk:** Average response time is 500ms. Looks good. But P99 is 6 seconds - worst 1% of users have terrible experience.

- **Prevention:**
  - Always measure P50, P95, P99
  - P99 is what users remember
  - Set SLAs based on percentiles, not averages

### Cold Start Confused with Database Latency

- **Risk:** First request after 30 minutes is slow (Vercel cold start). Blamed on Supabase. Real issue is serverless spin-up.

- **Prevention:**
  - Measure cold start separately
  - Use Vercel Fluid Compute to reduce cold starts
  - Warm functions with periodic health checks

### Testing Locally, Deploying Globally

- **Risk:** Local tests show 50ms response. Production shows 500ms. Forgot to account for network latency between regions.

- **Prevention:**
  - Test in production-like environment
  - Account for: client -> Vercel -> Supabase round trips
  - Ensure Vercel and Supabase in same region (or close)

### Synthetic Benchmarks vs Real User Monitoring

- **Risk:** Benchmark shows 200ms. Real users experience 2 seconds. Benchmark doesn't account for: client-side rendering, hydration, network variability.

- **Prevention:**
  - Implement Real User Monitoring (RUM)
  - Use Vercel Analytics for Web Vitals
  - Measure Time to Interactive, not just API response

---

## Phase Mapping

| Pitfall | Priority | Phase to Address |
|---------|----------|------------------|
| Sequential query cascade not identified | P0 | Phase 1: Instrumentation |
| Missing database indexes | P1 | Phase 1: Supabase optimization |
| N+1 queries in API routes | P2 | Phase 1: Supabase optimization |
| RLS performance not measured | P1 | Phase 1: Supabase optimization |
| Convex spike without success criteria | P1 | Phase 2: Convex spike planning |
| Auth integration complexity | P1 | Phase 2: Convex spike |
| Webhook processing for Convex | P2 | Phase 2: Convex spike |
| Data loss during migration | P0 | Phase 3: Migration planning |
| Webhook fails during transition | P0 | Phase 3: Migration execution |
| Polling persists after real-time | P2 | Phase 4: Real-time implementation |
| Convex subscription memory leaks | P2 | Phase 4: Real-time implementation |
| Benchmark tool limitations | P2 | Throughout: measurement discipline |

---

## Quick Reference Checklist

### Before Starting Optimization
- [ ] Baseline metrics established (P50, P95, P99 for key endpoints)
- [ ] Logging added to measure individual query times
- [ ] RLS overhead measured separately
- [ ] Cold start vs warm request distinguished
- [ ] Supabase and Vercel regions verified (same or close)

### Before Convex Spike
- [ ] Success criteria defined (specific latency targets)
- [ ] Time-box set (max 3 days)
- [ ] Webhook handling approach planned
- [ ] Auth hybrid pattern validated
- [ ] Hard problems identified (not just happy path)

### Before Production Migration
- [ ] Backup verified and tested
- [ ] Rollback plan documented
- [ ] Dual-write pattern implemented
- [ ] Migration scheduled during off-hours
- [ ] Verification queries ready
- [ ] Webhook queue/fallback in place

### Before Real-time Implementation
- [ ] All existing polling code identified
- [ ] Single source of truth decided (poll OR subscribe)
- [ ] Subscription efficiency considered
- [ ] Memory monitoring in place

---

## Sources

### Zero-Downtime Migration
- [Zero-Downtime Database Migration Guide](https://dev.to/ari-ghosh/zero-downtime-database-migration-the-definitive-guide-5672)
- [GoCardless Postgres Migrations](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/)
- [ivelum: Migrating Without Downtime](https://ivelum.com/blog/zero-downtime-db-migrations/)

### Supabase Performance
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [Debugging Performance Issues](https://supabase.com/docs/guides/database/debugging-performance)

### Convex
- [How Hard to Migrate from Convex](https://stack.convex.dev/how-hard-is-it-to-migrate-away-from-convex)
- [Convex vs Supabase 2025](https://makersden.io/blog/convex-vs-supabase-2025)
- [Convex Queries That Scale](https://stack.convex.dev/queries-that-scale)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Convex Real-time](https://docs.convex.dev/realtime)

### Performance Testing
- [Better Benchmarking](https://nearform.com/insights/better-benchmarking-preparing-evaluating-benchmarks/)
- [Benchmark Tool Pitfalls](https://nearform.com/insights/better-benchmarking-benchmark-tool-lying/)
- [Performance Testing Metrics](https://www.testrail.com/blog/performance-testing-metrics/)

---

*Last updated: 2026-01-20*
