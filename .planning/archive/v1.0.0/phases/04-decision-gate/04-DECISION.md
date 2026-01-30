# Decision: Convex Migration (Supabase Auth + Convex Data)

**Date:** 2026-01-21
**Decision:** Migrate to Convex for data layer, keep Supabase for auth only

---

## Executive Summary

- **Approach Selected:** Hybrid architecture — Supabase for authentication only, Convex for all data operations
- **Rationale:** 25.4x performance improvement at P95 (96% latency reduction)
- **Scope:** IMPL-01 through IMPL-06 (Convex migration only)
- **Excluded:** IMPL-07 through IMPL-10 (Supabase enhancement)

---

## Performance Comparison Table

| Approach | P50 | P95 | P99 | Target (500ms) | Verdict |
|----------|------|------|------|----------------|---------|
| Supabase Direct (DB) | 306ms | 416ms | 857ms | NO | Reject |
| Supabase API (Full Stack) | 504ms | **926ms** | 1,446ms | NO (85% over) | Reject |
| Convex API (Full Stack) | **23ms** | **37ms** | 2,303ms | YES (93% under) | Accept |

*Data source: Phase 2 Supabase optimization and Phase 3 Convex spike benchmarks*

---

## Decision Criteria

| Criteria | Convex | Supabase | Outcome |
|----------|---------|-----------|---------|
| **P95 < 500ms** | 37ms ✓ | 926ms ✗ | Convex wins |
| **Performance margin** | 93% under target | 85% over target | Convex wins |
| **Speedup vs current** | 25.4x faster | Baseline | Convex wins |
| **Real-time subscriptions** | Built-in | Requires polling | Convex wins |
| **Type safety** | Generated types | Manual definitions | Convex wins |
| **Deployment model** | Serverless, auto-scale | Managed PostgreSQL | Equal |
| **Auth integration** | JWT hybrid validated | Native | Equal |

**Convex wins 5 of 6 criteria** (only auth is native to Supabase)

---

## Webhook Reliability Assessment

**Status:** HTTP actions require deployment to be accessible

**Phase 3 Finding:**
- Direct HTTP action tests failed with 10+ second responses
- Root cause: HTTP actions need `npx convex deploy` to be publicly accessible
- This is expected behavior during spike phase

**Migration Action:**
- Deploy HTTP actions as part of Phase 5 IMPL-05 (Kapso webhook)
- Standard Convex deployment workflow
- Risk Level: Low

**Verification:**
- Webhook signature validation already implemented (HMAC-SHA256)
- Async processing via `ctx.scheduler.runAfter` prevents Kapso retries
- Error handling with proper logging

---

## Implementation Path

### Phase 5 Scope: IMPL-01 through IMPL-06

1. **IMPL-01:** Complete Convex schema with all Supabase fields
2. **IMPL-02:** Create Convex mutations and query functions
3. **IMPL-03:** Create conversation query functions with filters
4. **IMPL-04:** Implement Kapso webhook HTTP action
5. **IMPL-05:** Update Next.js API routes to use Convex
6. **IMPL-06:** Update inbox to use Convex real-time subscriptions

### Rollout Strategy

- **Big-bang migration** — burn the bridge, no dual-mode
- **Auth:** Keep Supabase for auth operations (profiles, workspace_members, ari_* tables)
- **Data:** All CRM data in Convex (contacts, conversations, messages, contacts notes)
- **Fallback:** No rollback to Supabase data layer (fresh data)

### Data Migration Decision

- **Fresh start** — no data migration from Supabase
- Existing data is trial/test data only
- Production data will be clean state in Convex

---

## Benefits of Chosen Approach

1. **Performance:** 37ms P95 vs 926ms = 25.4x speedup
2. **Real-time:** Built-in subscriptions eliminate polling overhead
3. **Type Safety:** Auto-generated TypeScript types for all data access
4. **Scalability:** Serverless architecture with automatic scaling
5. **Developer Experience:** Convex console for debugging and data inspection
6. **Cost:** Competitive pricing, usage-based

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|-------|-------------|----------|------------|
| Learning curve | Medium | Medium | Spike completed, patterns established |
| Deployment complexity | Low | Low | Standard `npx convex deploy` |
| Webhook reliability | Low | Medium | Async processing, retry handling |
| Auth integration | Low | Low | JWT hybrid already validated |
| Vendor lock-in | Low | High | Standard TypeScript API, migration path exists |

**Overall Risk Level:** Low — mitigations in place for all identified risks

---

## Excluded Alternatives

### Supabase Enhancement (IMPL-07 through IMPL-10)

**Why not:**
- P95 (926ms) still 85% over 500ms target
- Additional optimization would yield diminishing returns
- Real-time still requires polling
- No fundamental architecture improvement

**Estimated outcome:** Best-case ~40% improvement → ~555ms P95, still over target

---

## References

- **Phase 2 Optimization:** `.planning/phases/02-supabase-optimization/02-04-SUMMARY.md`
- **Phase 3 Spike:** `.planning/phases/10-convex-spike/03-convex-spike-VERIFICATION.md`
- **Benchmark Script:** `scripts/benchmark.ts`

---

*Decision recorded: 2026-01-21*
*Approved for implementation: Phase 5 - IMPL-01 through IMPL-06*
