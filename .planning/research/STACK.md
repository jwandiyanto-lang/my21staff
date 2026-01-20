# Stack Research: Performance Optimization (v3.0)

**Project:** my21staff
**Researched:** 2026-01-20
**Overall Confidence:** HIGH
**Focus:** Convex vs Optimized Supabase for sub-500ms P95 latency

---

## Executive Summary

**Recommendation: Optimized Supabase, not Convex migration.**

For a 43k-line production CRM with multi-tenant workspaces, Supabase Auth, and existing RLS policies, migrating to Convex would cost 4-8 weeks with high risk for marginal performance gains. The current 2-6 second response times stem from identifiable Supabase anti-patterns (sequential queries, missing indexes, `select('*')`) that can achieve sub-500ms P95 through optimization alone.

---

## Current Architecture Analysis

### Observed Anti-Patterns (from codebase review)

1. **Sequential Queries in Server Components**
   - `/dashboard/page.tsx` executes 7-8 sequential queries
   - Each query waits for prior query: auth check -> membership check -> profile -> workspace -> etc.
   - Fix: Parallel execution with `Promise.all()` or consolidated queries

2. **Over-fetching with `select('*')`**
   - `/api/contacts/route.ts`: `.select('*')` returns all columns
   - Network overhead and parsing time for unused fields
   - Fix: Explicit column selection

3. **Missing Nested Relations**
   - Multiple queries to fetch related data (workspace -> members -> profiles)
   - Could be single query with Supabase nested relations syntax
   - Fix: Use `.select('*, members(*), profiles(*)')` pattern

4. **Realtime as Invalidation Trigger**
   - `use-conversations.ts` subscribes to changes, then invalidates TanStack Query cache
   - This triggers a refetch (polling behavior with extra steps)
   - Fix: Use realtime payload directly or optimistic updates

---

## Convex

### Why Convex

- **Built-in Reactivity**: All queries automatically subscribe to changes. No polling, no manual cache invalidation. Real-time is the default, not an add-on.
- **End-to-End Type Safety**: TypeScript types flow from database schema through queries to React components. No type generation step or runtime mismatches.
- **Transactional Document Store**: Flexibility of documents with ACID guarantees. No N+1 queries because data access patterns are explicit in functions.
- **Serverless Functions at Database Edge**: Backend logic runs in isolated environment within Convex, eliminating cold starts and network round-trips.

### When Convex Wins

| Scenario | Why Convex Excels |
|----------|-------------------|
| Greenfield real-time apps | Zero setup for live sync, collaboration features |
| Chat/messaging products | Built for exactly this use case |
| TypeScript-heavy teams | Unmatched DX with auto-generated types |
| Rapid prototyping | Ship features in hours, not days |
| Multiplayer/collaborative | Conflict-free state sync built-in |

### Convex for Next.js 15

**SDK Version:** `convex@1.31.5` (latest as of 2025-01)

**Setup Pattern:**
```typescript
// src/app/ConvexClientProvider.tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

// src/app/layout.tsx
import ConvexClientProvider from "./ConvexClientProvider";
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

**Query Pattern:**
```typescript
// convex/conversations.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(50);
  },
});

// React component
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function ConversationList({ workspaceId }) {
  const conversations = useQuery(api.conversations.list, { workspaceId });
  // Automatically re-renders on database changes
}
```

**Auth Integration with External Provider (Supabase Auth):**
```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "my21staff",
      issuer: "https://your-project.supabase.co/auth/v1",
      jwks: "https://your-project.supabase.co/auth/v1/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
};
```

**Required JWT claims from Supabase Auth:**
- Header: `kid`, `alg`, `typ`
- Payload: `sub`, `iss`, `exp`, `iat` (recommended)

### Convex Pricing (2025)

| Resource | Free Tier | Pro ($25/dev/mo) |
|----------|-----------|------------------|
| Function calls | 1M/month | 25M/month |
| Database storage | 0.5 GB | 50 GB |
| Database bandwidth | 1 GB/month | 50 GB/month |
| Query concurrency | 16 | 256+ |

### Migration Complexity: Supabase to Convex

**Estimated effort:** 4-8 weeks for 43k LOC codebase

| Task | Effort | Risk |
|------|--------|------|
| Schema conversion (SQL -> document) | 1-2 weeks | Medium |
| Rewrite queries as Convex functions | 2-3 weeks | High |
| Auth migration (RLS -> Convex auth) | 1 week | High |
| Real-time refactoring | 1 week | Low |
| Testing and validation | 1-2 weeks | High |

**Key risks:**
- RLS policies must be reimplemented as Convex function logic
- Multi-tenant isolation patterns differ significantly
- Existing Supabase Storage/Auth dependencies
- No rollback path once committed

---

## Supabase Optimizations

### Query Optimizations

**1. Parallel Query Execution**

Before (sequential):
```typescript
const { data: user } = await supabase.auth.getUser()
const { data: membership } = await supabase.from('workspace_members').select('role')...
const { data: profile } = await supabase.from('profiles').select('is_admin')...
const { data: workspaces } = await supabase.from('workspaces').select('slug')...
```

After (parallel):
```typescript
const [
  { data: { user } },
  { data: membership },
  { data: profile },
  { data: workspaces }
] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('workspace_members').select('role')...,
  supabase.from('profiles').select('is_admin')...,
  supabase.from('workspaces').select('slug')...
])
```

**2. Nested Relations Syntax**

Before (3 queries):
```typescript
const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', id)
const { data: members } = await supabase.from('workspace_members').select('*').eq('workspace_id', id)
const { data: profiles } = await supabase.from('profiles').select('*').in('id', memberIds)
```

After (1 query):
```typescript
const { data: workspace } = await supabase
  .from('workspaces')
  .select(`
    id,
    name,
    slug,
    workspace_members (
      id,
      role,
      user_id,
      profiles:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    )
  `)
  .eq('id', id)
  .single()
```

**Multi-foreign-key disambiguation:**
```typescript
// When a table has multiple FKs to the same table
const { data } = await supabase.from('shifts').select(`
  *,
  start_scan:scans!scan_id_start (id, badge_scan_time),
  end_scan:scans!scan_id_end (id, badge_scan_time)
`)
```

**3. Explicit Column Selection**

Before:
```typescript
.select('*')  // Returns 20+ columns
```

After:
```typescript
.select('id, name, phone, status, created_at')  // Only what's needed
```

**4. Database Functions (RPC) for Complex Operations**

```sql
-- Create function for dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = p_user_id),
    'memberships', (SELECT json_agg(row_to_json(m)) FROM workspace_members m WHERE m.user_id = p_user_id),
    'workspaces', (SELECT json_agg(row_to_json(w)) FROM workspaces w
                   WHERE w.id IN (SELECT workspace_id FROM workspace_members WHERE user_id = p_user_id))
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Usage:
```typescript
const { data } = await supabase.rpc('get_dashboard_data', { p_user_id: user.id })
```

### Index Recommendations

**Critical indexes for this codebase:**

```sql
-- Contacts: Most queried table
CREATE INDEX idx_contacts_workspace_created
  ON contacts(workspace_id, created_at DESC);

CREATE INDEX idx_contacts_workspace_phone
  ON contacts(workspace_id, phone);

CREATE INDEX idx_contacts_workspace_status
  ON contacts(workspace_id, status);

-- Conversations: Real-time list
CREATE INDEX idx_conversations_workspace_updated
  ON conversations(workspace_id, updated_at DESC);

CREATE INDEX idx_conversations_workspace_unread
  ON conversations(workspace_id, unread_count)
  WHERE unread_count > 0;  -- Partial index for active filter

-- Workspace members: Auth check on every request
CREATE INDEX idx_workspace_members_user_workspace
  ON workspace_members(user_id, workspace_id);

-- Messages: Conversation threads
CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);
```

**Index types for specific use cases:**

| Index Type | Use Case | Benefit |
|------------|----------|---------|
| B-tree (default) | Equality, range queries | General purpose |
| BRIN | `created_at` on append-only tables | 10x smaller than B-tree |
| Partial | Filtered subsets (`WHERE unread > 0`) | Index only relevant rows |
| Composite | Multi-column filters | Avoid multiple index lookups |

**Use index_advisor:**
```sql
-- In Supabase SQL Editor
SELECT * FROM index_advisor('
  SELECT * FROM contacts
  WHERE workspace_id = $1
  ORDER BY created_at DESC
  LIMIT 25
');
```

### RLS Performance Optimization

**SLOW pattern (function called per row):**
```sql
CREATE POLICY "workspace_access" ON contacts
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

**FAST pattern (wrapped in SELECT for optimizer caching):**
```sql
CREATE POLICY "workspace_access" ON contacts
  FOR SELECT USING (
    workspace_id IN (
      (SELECT workspace_id FROM workspace_members
       WHERE user_id = (SELECT auth.uid()))
    )
  );
```

**Additional RLS optimizations:**
1. Add index on RLS filter columns: `CREATE INDEX idx_contacts_user ON contacts(user_id)`
2. Use `TO authenticated` clause to skip RLS for anonymous users
3. Add explicit client-side WHERE clauses alongside RLS policies
4. Use SECURITY DEFINER functions for complex multi-table joins

### Connection Pooling Configuration

**For serverless (Vercel):**
```
# Use Supavisor transaction mode
Connection string: postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Pool size recommendations by compute tier
Small (1GB):  40% to pool = ~15 connections
Medium (2GB): 60% to pool = ~30 connections
Large (4GB):  80% to pool = ~60 connections
```

**Key settings:**
- Use transaction mode (port 6543), not session mode
- Don't use both PgBouncer and Supavisor simultaneously
- Direct connections for long-lived sessions only

### When Optimized Supabase is Enough

| Scenario | Why Supabase Wins |
|----------|-------------------|
| Existing production app | No migration cost, proven stability |
| Multi-tenant SaaS | RLS built for this use case |
| Complex SQL queries | Full PostgreSQL power |
| Self-hosting option | Zero vendor lock-in possible |
| Team knows SQL | Lower learning curve |
| Need SQL analytics | Direct psql access |

---

## Hybrid Approach

### Supabase Auth + Convex Data

**How it works:**
1. Keep Supabase Auth for authentication
2. Migrate data layer to Convex
3. Pass Supabase JWT to Convex for identity

**Configuration:**
```typescript
// convex/auth.config.ts
export default {
  providers: [{
    type: "customJwt",
    applicationID: "my21staff", // Must match JWT aud claim
    issuer: "https://[project].supabase.co/auth/v1",
    jwks: "https://[project].supabase.co/auth/v1/.well-known/jwks.json",
    algorithm: "RS256",
  }],
};

// Client-side token bridging
const { data: { session } } = await supabase.auth.getSession()
const accessToken = session?.access_token
// Pass to Convex client for authenticated requests
```

**Complexity estimate:** HIGH

| Challenge | Impact |
|-----------|--------|
| Two systems to maintain | Operational complexity doubles |
| Session sync issues | Auth state can drift between systems |
| RLS reimplementation | Security model must be rebuilt |
| File storage migration | Supabase Storage != Convex Files |

**When to choose hybrid:**
- Immediate need for reactive features (chat, presence)
- Plan to fully migrate eventually
- Team has capacity for dual-system maintenance

**Recommendation for my21staff:** Avoid hybrid. Either commit to full Convex migration or optimize Supabase. Hybrid adds complexity without proportional benefit.

---

## Performance Comparison

### Expected Latency by Approach

| Approach | P50 Latency | P95 Latency | Effort |
|----------|-------------|-------------|--------|
| Current (unoptimized) | 2-3s | 6-9s | - |
| Optimized Supabase | 100-200ms | 300-500ms | 1-2 weeks |
| Convex migration | 50-100ms | 150-300ms | 4-8 weeks |
| Hybrid | 100-150ms | 250-400ms | 3-4 weeks |

### Real-time Capabilities

| Feature | Supabase Realtime | Convex |
|---------|-------------------|--------|
| Latency | <100ms typical | <50ms typical |
| Setup | Manual subscription | Automatic |
| Filtering | WAL-based, per-table | Query-level |
| Concurrent connections | 10k+ | Scales with plan |
| Cost model | Per message + connections | Included in function calls |

---

## Recommendation

### For my21staff: Optimize Supabase

**Rationale:**
1. **ROI Analysis**: 1-2 weeks of Supabase optimization vs 4-8 weeks of Convex migration
2. **Risk Profile**: Production app with paying customers; migration risk is high
3. **Root Cause**: Performance issues are fixable anti-patterns, not platform limitations
4. **Real-time Already Working**: TanStack Query + Supabase Realtime provides adequate reactivity

**Optimization Roadmap:**

| Phase | Effort | Expected Impact |
|-------|--------|-----------------|
| 1. Parallel queries (Promise.all) | 2-3 days | 40-60% latency reduction |
| 2. Add missing indexes | 1 day | 50-100x for specific queries |
| 3. Nested relations refactor | 3-5 days | 3-5x fewer queries |
| 4. Column selection audit | 1-2 days | 20-30% payload reduction |
| 5. RLS policy optimization | 1-2 days | Variable (profile with EXPLAIN) |

**Target Metrics:**
- P95 latency: < 500ms (current: 2-6s)
- Queries per page load: 1-2 (current: 4-8)
- Database connections: Stable under load

### When to Reconsider Convex

Revisit if:
- Building new features requiring true real-time collaboration (shared cursors, live editing)
- Supabase optimization plateau (still > 1s after all fixes)
- Greenfield product/module with no migration cost
- Team composition changes (more TypeScript-native, less SQL experience)

---

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| Supabase optimization techniques | HIGH | Official docs, verified patterns |
| Convex SDK patterns | HIGH | Official docs (docs.convex.dev) |
| Convex + Supabase Auth integration | MEDIUM | Official docs, limited production examples |
| Migration effort estimate | MEDIUM | Community reports, no direct experience |
| Performance improvement predictions | MEDIUM | Standard PostgreSQL patterns, needs validation |

---

## Sources

### Convex
- [Convex Next.js App Router Docs](https://docs.convex.dev/client/nextjs/app-router/)
- [Convex Custom JWT Auth](https://docs.convex.dev/auth/advanced/custom-jwt)
- [Convex Pricing](https://www.convex.dev/pricing)
- [convex npm package](https://www.npmjs.com/package/convex)
- [Convex vs Supabase Comparison](https://www.convex.dev/compare/supabase)
- [Next.js Quickstart](https://docs.convex.dev/quickstart/nextjs)
- [Server Rendering Guide](https://docs.convex.dev/client/nextjs/app-router/server-rendering)

### Supabase
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Joins and Nested Relations](https://supabase.com/docs/guides/database/joins-and-nesting)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Connection Management](https://supabase.com/docs/guides/database/connection-management)
- [Index Advisor](https://supabase.com/docs/guides/database/extensions/index_advisor)
- [Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Performance Tuning](https://supabase.com/docs/guides/platform/performance)

### Comparisons
- [Convex vs Supabase 2025 - Makers' Den](https://makersden.io/blog/convex-vs-supabase-2025)
- [Supabase vs Convex for Next.js SaaS](https://www.nextbuild.co/blog/supabase-vs-convex-best-baas-for-next-js-saas)
- [Migrating from Postgres to Convex](https://stack.convex.dev/migrate-data-postgres-to-convex)
- [Convex vs Supabase Comparison 2026](https://openalternative.co/compare/convex/vs/supabase)

### Performance Issues
- [LATERAL JOIN Performance Issue - PostgREST #3938](https://github.com/PostgREST/postgrest/issues/3938)
- [Supabase Realtime Real-World Experience](https://medium.com/@saravananshanmugam/what-weve-learned-using-supabase-real-time-subscriptions-in-our-browser-extension-d82126c236a1)

---

## Roadmap Implications

Based on this research, the v3.0 performance milestone should:

1. **Phase 1: Quick Wins (Days 1-3)**
   - Parallel query execution with Promise.all
   - Add critical indexes identified above
   - Expected: 50-70% latency reduction

2. **Phase 2: Query Consolidation (Days 4-7)**
   - Refactor to nested relations syntax
   - Explicit column selection audit
   - Expected: 3-5x fewer database round-trips

3. **Phase 3: Advanced Optimization (Days 8-10)**
   - RLS policy optimization (wrap auth functions)
   - Database functions for complex operations
   - Connection pooling tuning

4. **Phase 4: Validation (Days 11-14)**
   - Performance benchmarking
   - P95 latency verification
   - Load testing

**Do NOT proceed with Convex migration** unless Phase 3 fails to achieve sub-500ms P95.
