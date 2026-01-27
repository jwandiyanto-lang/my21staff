# Phase 02: Supabase Optimization - Research

**Researched:** 2026-01-21
**Domain:** Supabase/PostgreSQL Query Optimization
**Confidence:** HIGH

## Summary

This phase focuses on applying known optimization patterns to reduce latency on hot path queries in the existing Supabase-backed Next.js application. The primary optimization levers are: query parallelization with Promise.all(), composite indexes on frequent query patterns, explicit column selection replacing `select('*')`, and RLS policy optimization via function wrapping.

The existing codebase already has instrumentation infrastructure (from Phase 01) that measures query count and timing. Current hot paths (`/api/contacts/by-phone` and `/api/conversations`) execute 4 sequential queries each, with response times of 2-6 seconds (sometimes 9+ seconds). The optimization patterns documented here are standard Supabase/PostgreSQL practices that should reduce query count by 50%+ and bring P95 response times under 1 second.

**Primary recommendation:** Apply the four optimization levers in parallel: add composite indexes, refactor sequential queries to Promise.all(), replace `select('*')` with explicit columns, and optimize RLS policies with SELECT-wrapped function calls.

## Standard Stack

The Supabase/PostgreSQL optimization ecosystem for this stack:

### Core
| Library/Tool | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| `@supabase/supabase-js` | Latest | Database client | Official Supabase JS SDK |
| PostgreSQL | 14+ | Database engine | Supabase runs on Postgres 14+ |
| B-tree indexes | Built-in | Default index type | Most efficient for equality/range queries |
| `pg_stat_statements` | Built-in extension | Query statistics | Standard for tracking query performance |

### Built-in Tools
| Tool | Purpose | Usage |
|------|---------|-------|
| `EXPLAIN ANALYZE` | Query plan verification | Check if indexes are being used |
| `CREATE INDEX CONCURRENTLY` | Non-blocking index creation | Add indexes without downtime |

### Measurement Infrastructure (Already in Codebase)
| Location | Purpose |
|----------|---------|
| `src/lib/instrumentation/with-timing.ts` | Request timing and query count logging |

**No additional installation needed** - all required tools are built into Supabase.

## Architecture Patterns

### Recommended Project Structure (for This Phase)
```
supabase/migrations/
├── 43_optimization_indexes.sql    # New composite indexes
```

### Pattern 1: Parallel Queries with Promise.all()

**What:** Execute multiple independent Supabase queries concurrently instead of sequentially.

**When to use:** When queries don't depend on each other's results.

**Example (refactoring contacts/by-phone):**
```typescript
// Source: Based on existing pattern in codebase
// BEFORE (sequential - ~2-6 seconds):
const { data: contact } = await supabase.from('contacts').select('...').single()
const { data: notes } = await supabase.from('contact_notes').select('...').eq('contact_id', contact.id)
const { data: conversation } = await supabase.from('conversations').select('...').single()

// AFTER (parallel - sub-1 second target):
const [contactResult, notesResult, conversationResult] = await Promise.all([
  supabase.from('contacts').select('id, name, phone, email, lead_status, lead_score, tags, metadata, created_at')
    .eq('workspace_id', workspaceId).eq('phone', normalizedPhone).single(),
  supabase.from('contact_notes').select('content, created_at')
    .eq('contact_id', contactId).order('created_at', { ascending: false }).limit(5),
  supabase.from('conversations').select('id, last_message_preview, last_message_at')
    .eq('contact_id', contactId).single().then(r => ({ ...r, contactId })) // Pass contactId
])
```

**Key insight:** When a query depends on data from another query, you must still structure carefully. For `/api/contacts/by-phone`, the contact lookup must happen first, but subsequent queries for notes/conversations/messages can be parallelized.

### Pattern 2: Composite Indexes with Leftmost Prefix Rule

**What:** Create indexes on multiple columns to support common query patterns.

**When to use:** When queries consistently filter on the same column combinations.

**Leftmost Prefix Rule (CRITICAL):**
- Queries must match the leading (leftmost) columns with equality conditions for efficient index use
- Example: Index on `(workspace_id, phone)` efficiently supports `WHERE workspace_id = X AND phone = Y`
- Same index does NOT efficiently support `WHERE phone = Y` alone (without workspace_id)

**Example (for contacts lookup):**
```sql
-- Source: PostgreSQL documentation on CREATE INDEX
-- Pattern: workspace_id first (low cardinality), then phone (high cardinality)
CREATE INDEX idx_contacts_workspace_phone ON contacts(workspace_id, phone);

-- Pattern: workspace_id first, then timestamp DESC for ordering
CREATE INDEX idx_conversations_workspace_time ON conversations(workspace_id, last_message_at DESC);

-- Pattern: conversation_id first, then timestamp DESC for message pagination
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at DESC);
```

**Note on DESC:** PostgreSQL B-tree indexes support reverse scan, so `DESC` specification in index is optional but documents intent. The query planner can use an ascending index for descending sorts via reverse scan.

### Pattern 3: Explicit Column Selection

**What:** Specify exact columns instead of using `select('*')` wildcard.

**When to use:** In all hot path queries. Keep for non-hot paths only if convenience outweighs performance cost.

**Why:** Two performance benefits:
1. **Network overhead:** Reduces data transferred over network
2. **Index-only scans:** Enables planner to skip heap access when all needed columns are in index

**Example:**
```typescript
// Source: Based on existing pattern in codebase
// BEFORE:
const { data } = await supabase.from('contacts').select('*')

// AFTER:
const { data } = await supabase.from('contacts').select('id, name, phone, email, lead_status, lead_score, tags')
```

### Pattern 4: Nested Relations for Reduced Query Count

**What:** Use Supabase's nested select syntax to fetch related data in a single query.

**When to use:** When you need data from related tables (joins).

**Syntax patterns found in codebase:**
```typescript
// Pattern 1: Left join (all rows, null if no match)
.select('*, profile:profiles(*)')

// Pattern 2: Inner join (only matching rows)
.select('*, contact:contacts!inner(*)')

// Pattern 3: Nested with specific columns (best practice)
.select('id, name, contact:contacts(id, name, phone)')
```

**Example refactoring `/api/conversations`:**
```typescript
// Source: Existing pattern in src/app/api/conversations/route.ts
// Can combine conversations + contacts fetch:
const { data: conversations, count: totalCount } = await supabase
  .from('conversations')
  .select(`
    id,
    status,
    assigned_to,
    unread_count,
    last_message_at,
    last_message_preview,
    contact:contacts!inner(id, name, phone, lead_status, tags)
  `, { count: 'exact' })
  .eq('workspace_id', workspaceId)
  .order('last_message_at', { ascending: false })
```

### Pattern 5: RLS Policy Optimization with SELECT Wrapping

**What:** Wrap `auth.uid()` or function calls in `SELECT` subqueries to trigger PostgreSQL's initPlan caching.

**When to use:** In RLS policies where the same value is checked repeatedly.

**Performance impact:** 94.97% improvement demonstrated (179ms → 9ms) by caching per-statement instead of per-row.

**Example:**
```sql
-- Source: Supabase RLS performance documentation
-- BEFORE (function called per row):
CREATE POLICY "Users can view contacts" ON contacts
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()  -- Called per row
    )
  );

-- AFTER (function cached via initPlan):
CREATE POLICY "Users can view contacts" ON contacts
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = (SELECT auth.uid())  -- Cached per statement
    )
  );
```

**Note:** The codebase already uses this pattern correctly in `migration/30_fix_rls_policies.sql`:
```sql
-- Existing pattern in codebase - already optimized:
(SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
```

### Anti-Patterns to Avoid

- **Anti-pattern:** Sequential independent queries
  - **Why:** Adds network round-trip latency for each query
  - **Do instead:** Use `Promise.all()` for concurrent execution

- **Anti-pattern:** `select('*')` in hot paths
  - **Why:** Network overhead, prevents index-only scans
  - **Do instead:** Explicit column selection

- **Anti-pattern:** Index on `(phone, workspace_id)` when queries are `WHERE workspace_id = ? AND phone = ?`
  - **Why:** Violates leftmost prefix rule - phone alone can't use index efficiently
  - **Do instead:** Index on `(workspace_id, phone)` to match query pattern

- **Anti-pattern:** Creating indexes on high-cardinality columns first in composite index
  - **Why:** Reduces index effectiveness for common filtering patterns
  - **Do instead:** Low cardinality (workspace_id, status) first, high cardinality (phone, created_at) last

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query timing measurement | Custom timing code | Existing `with-timing.ts` instrumentation | Already built in Phase 01 |
| Query count tracking | Custom counters | Existing `createRequestMetrics()`/`logQuerySummary()` | Already built in Phase 01 |
| Index usage verification | Custom analysis tool | `EXPLAIN ANALYZE` | Built-in PostgreSQL |
| Concurrent query execution | Custom batching | `Promise.all()` | Native JavaScript |
| Column selection | Dynamic wildcard parser | Explicit column lists | Simpler, faster |
| Function caching | Custom cache layer | `SELECT` wrapper in SQL | PostgreSQL built-in initPlan |

**Key insight:** PostgreSQL's query planner and B-tree indexes are highly optimized. Don't try to outsmart the planner with manual query rewriting beyond the patterns documented here.

## Common Pitfalls

### Pitfall 1: Ignoring Leftmost Prefix Rule

**What goes wrong:** Creating a composite index on columns in wrong order, resulting in Seq Scan instead of Index Scan.

**Why it happens:** Intuition suggests indexing "most selective" columns first, but PostgreSQL requires matching leading columns.

**How to avoid:**
1. Match index column order to query WHERE clause order
2. Put equality condition columns first, range/order columns last
3. Verify with `EXPLAIN ANALYZE` - look for "Index Scan" not "Seq Scan"

**Warning signs:**
- `EXPLAIN ANALYZE` shows "Seq Scan" when you expected index use
- Query time doesn't improve after index creation

### Pitfall 2: Promise.all() with Dependent Queries

**What goes wrong:** Trying to parallelize queries that depend on each other's results, causing race conditions or missing data.

**Why it happens:** Misidentifying independent queries.

**How to avoid:**
1. Analyze data dependencies before refactoring
2. Only parallelize truly independent queries
3. If Query B needs Query A's ID, Query A must complete first

**Example of correct approach:**
```typescript
// First: get contact (sequential)
const { data: contact } = await supabase.from('contacts').select('id').single()

// Then: parallelize dependent queries
const [notes, conversation, messages] = await Promise.all([
  supabase.from('contact_notes').select('...').eq('contact_id', contact.id),
  supabase.from('conversations').select('...').eq('contact_id', contact.id),
  // ... other queries that only need contact.id
])
```

### Pitfall 3: SELECT * in Nested Relations

**What goes wrong:** Using `select('*, related:table(*)')` defeats the purpose of column selection.

**Why it happens:** Habit of using wildcard syntax carries over to nested relations.

**How to avoid:**
- Always specify columns in nested selects: `related:table(id, name, email)`
- Use template literals for cleaner multi-line nested selects

### Pitfall 4: Forgetting to Create Index on Production

**What goes wrong:** Optimization works in dev but fails in production due to missing indexes.

**Why it happens:** Indexes created manually in Supabase dashboard not tracked in migrations.

**How to avoid:**
- Always create indexes via SQL migration files
- Use `CREATE INDEX CONCURRENTLY` to avoid downtime
- Commit migration files to git

**Warning signs:** Different query times between dev and production.

### Pitfall 5: Over-indexing

**What goes wrong:** Creating indexes that aren't used, wasting storage and slowing INSERT/UPDATE.

**Why it happens:** Indexing every WHERE clause without measuring actual usage.

**How to avoid:**
- Create only indexes needed for hot paths
- Verify usage with `EXPLAIN ANALYZE` on actual queries
- Consider dropping unused indexes periodically

**Warning signs:** Query times don't improve after index creation.

## Code Examples

### Composite Index Creation (Migration)
```sql
-- Source: PostgreSQL CREATE INDEX documentation
-- Pattern: Composite index matching query pattern

-- For /api/contacts/by-phone: workspace_id + phone lookup
CREATE INDEX idx_contacts_workspace_phone ON contacts(workspace_id, phone);

-- For /api/conversations: workspace_id + time ordering
CREATE INDEX idx_conversations_workspace_time ON conversations(workspace_id, last_message_at DESC);

-- For messages: conversation_id + time pagination
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, created_at DESC);
```

### Parallel Query Pattern
```typescript
// Source: Existing codebase pattern with timing instrumentation
const metrics = createRequestMetrics()

// Parallel independent queries
const [contactsResult, notesResult, conversationsResult] = await Promise.all([
  supabase.from('contacts')
    .select('id, name, phone, email, lead_status, lead_score, tags, created_at')
    .eq('workspace_id', workspaceId)
    .eq('phone', normalizedPhone)
    .single(),
  supabase.from('contact_notes')
    .select('content, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(5),
  supabase.from('conversations')
    .select('id, last_message_preview, last_message_at')
    .eq('contact_id', contactId)
    .single()
])

// Log individual timings if needed
logQuery(metrics, 'contacts', 15)
logQuery(metrics, 'contact_notes', 8)
logQuery(metrics, 'conversations', 12)
logQuerySummary('/api/contacts/by-phone', metrics)
```

### Verifying Index Usage with EXPLAIN ANALYZE
```sql
-- Source: PostgreSQL EXPLAIN documentation
-- Run in Supabase SQL Editor

-- Check if index is being used
EXPLAIN ANALYZE
SELECT id, name, phone
FROM contacts
WHERE workspace_id = 'xxx' AND phone = '628xxx';

-- Look for: "Index Scan using idx_contacts_workspace_phone"
-- Not: "Seq Scan on contacts"

-- Check nested relation query
EXPLAIN ANALYZE
SELECT c.id, c.name, cnt.id, cnt.content
FROM contacts c
LEFT JOIN contact_notes cnt ON cnt.contact_id = c.id
WHERE c.workspace_id = 'xxx';
```

### Explicit Column Selection Pattern
```typescript
// Source: Based on existing codebase pattern
// BEFORE:
const { data: contact } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId)
  .single()

// AFTER:
const { data: contact } = await supabase
  .from('contacts')
  .select(`
    id,
    name,
    phone,
    email,
    lead_status,
    lead_score,
    tags,
    created_at
  `)
  .eq('workspace_id', workspaceId)
  .eq('phone', normalizedPhone)
  .single()
```

### Nested Relations with Explicit Columns
```typescript
// Source: Existing pattern in codebase (conversations route)
// Combines conversations + contacts fetch into single query

const { data: conversations, count: totalCount } = await supabase
  .from('conversations')
  .select(`
    id,
    status,
    assigned_to,
    unread_count,
    last_message_at,
    last_message_preview,
    contact:contacts!inner(
      id,
      name,
      phone,
      lead_status,
      tags,
      assigned_to
    )
  `, { count: 'exact' })
  .eq('workspace_id', workspaceId)
  .order('last_message_at', { ascending: false })
  .range(from, to)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential queries | Parallel with Promise.all() | JavaScript Promise API | Latency ≈ sum of all queries → max of all queries |
| SELECT * wildcard | Explicit column selection | Database fundamentals | Network overhead reduced, index-only scans enabled |
| Single-column indexes | Composite indexes | PostgreSQL B-tree | Fewer indexes, better performance for multi-column queries |
| RLS functions per row | SELECT-wrapped functions (initPlan) | PostgreSQL planner | 94%+ performance improvement shown in Supabase docs |

**Deprecated/outdated:**
- Manual query batching: Use Promise.all() instead
- SELECT * in production hot paths: Always use explicit columns
- Ignoring index order: Must follow leftmost prefix rule

## Open Questions

1. **DESC vs ASC in index creation for reverse scan**
   - What we know: PostgreSQL B-tree supports reverse scan since version 8.3, so ASC index can serve DESC ORDER BY
   - What's unclear: Whether there's any measurable difference when explicitly specifying DESC
   - Recommendation: Include DESC in index definition for clarity, but performance should be equivalent

2. **Current baseline query counts**
   - What we know: Code review shows 4 queries in `/api/contacts/by-phone` and 4 in `/api/conversations`
   - What's unclear: Actual production query counts from real traffic
   - Recommendation: Use existing instrumentation to measure actual baseline before optimization

## Sources

### Primary (HIGH confidence)

- [PostgreSQL CREATE INDEX Documentation](https://www.postgresql.org/docs/current/sql-createindex.html) - Composite index syntax, DESC support, INCLUDE columns, concurrent creation
- [PostgreSQL EXPLAIN Documentation](https://www.postgresql.org/docs/current/using-explain.html) - Query plan verification, index scan detection
- [Supabase Select Usage](https://supabase.com/docs/reference/javascript/select) - Column selection, nested relations syntax, count queries
- [PostgreSQL Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html) - Leftmost prefix rule, when composite indexes are useful
- [Supabase RLS Performance Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - initPlan caching, function wrapping benchmarks (179ms → 9ms)
- [Supabase Database Inspect Guide](https://supabase.com/docs/guides/database/inspect) - pg_stat_statements for query tracking, EXPLAIN ANALYZE usage

### Secondary (MEDIUM confidence)

- [PostgreSQL Index Types Documentation](https://www.postgresql.org/docs/current/indexes-types.html) - B-tree characteristics, operator support
- Existing codebase analysis:
  - `/src/app/api/contacts/by-phone/route.ts` - Current sequential query pattern
  - `/src/app/api/conversations/route.ts` - Current sequential query pattern
  - `/src/lib/instrumentation/with-timing.ts` - Existing measurement infrastructure
  - `/supabase/schema.sql` - Current indexes
  - `/supabase/migrations/26_tickets.sql` - Example of composite indexes in migrations
  - `/supabase/migrations/30_fix_rls_policies.sql` - Example of optimized RLS pattern

### Tertiary (LOW confidence - marked for validation)

- Web search results for DESC/ASC performance (official docs confirm reverse scan capability)
- Web search results for Promise.all() patterns (standard JavaScript, widely documented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase/PostgreSQL documentation
- Architecture patterns: HIGH - Verified with official docs and existing codebase
- Pitfalls: HIGH - Documented in official sources and verified patterns

**Research date:** 2026-01-21
**Valid until:** 2026-02-20 (30 days - stable PostgreSQL/Supabase features)
