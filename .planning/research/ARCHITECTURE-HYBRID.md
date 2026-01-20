# Architecture Research: Hybrid Supabase Auth + Convex Data

**Domain:** Multi-tenant CRM with WhatsApp integration
**Researched:** 2026-01-20
**Overall Confidence:** MEDIUM-HIGH (verified with official documentation)

---

## Executive Summary

A hybrid Supabase Auth + Convex Data architecture is a well-documented pattern that Convex explicitly supports through their Custom JWT provider. The integration works by having Convex verify Supabase-issued JWTs, allowing you to keep your existing auth system while gaining Convex's real-time reactive database.

**Key insight:** Convex does not require its own auth system. It accepts any OpenID Connect-compatible JWT, and Supabase exposes a JWKS endpoint (`/.well-known/jwks.json`) that Convex can use to verify tokens. This is a "bring your own auth" architecture, not a migration of auth.

**Recommendation:** This is a viable architecture for my21staff. The migration can be incremental (table by table) with both systems running in parallel during transition.

---

## Auth Flow

### Current Architecture (Supabase Only)

```
+-------------+     +-------------+     +-------------+
|   Browser   |---->|  Next.js    |---->|  Supabase   |
|   Client    |     |  API Routes |     |  PostgreSQL |
+-------------+     +-------------+     +-------------+
       |                   |                   |
       | 1. Login          | 3. requireWorkspace| 4. RLS enforced
       |                   |    Membership()    |    via workspace_id
       v                   |                    |
+-------------+            |                    |
|  Supabase   |            |                    |
|    Auth     |------------+                    |
+-------------+                                 |
       | 2. JWT issued                          |
       |    (stored in cookie)                  |
       +----------------------------------------+
```

**Current flow:**
1. User logs in via Supabase Auth (email/password)
2. Supabase issues JWT, stored in HTTP-only cookie via `@supabase/ssr`
3. API routes call `requireWorkspaceMembership(workspaceId)` which:
   - Gets user from `supabase.auth.getUser()`
   - Verifies membership in `workspace_members` table
   - Returns `{ user, workspaceId, role }`
4. RLS policies enforce `workspace_id` scoping at database level

**Code pattern (current):**
```typescript
// src/lib/auth/workspace-auth.ts
export async function requireWorkspaceMembership(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return { user, workspaceId, role: membership.role }
}
```

### Hybrid Architecture (Supabase Auth + Convex Data)

```
+-------------+                    +-------------+
|   Browser   |--- WebSocket ----->|   Convex    |
|   Client    |    (real-time)    |   Backend   |
+-------------+                   +-------------+
       |                                 |
       | 1. Login via Supabase           | 4. Verify JWT via
       |                                 |    Supabase JWKS
       v                                 |
+-------------+                          |
|  Supabase   |                          |
|    Auth     |--------------------------+
+-------------+
       | 2. JWT issued
       |
       v
+-------------------+     3. Pass JWT to Convex
| ConvexProvider    |------------------------->
| + useAuth()       |
+-------------------+
```

**Hybrid flow:**
1. User logs in via Supabase Auth (unchanged from current)
2. Supabase issues JWT with `sub` (user ID), `iss` (issuer), `exp` (expiry)
3. React app passes JWT to Convex via `ConvexProviderWithAuth`
4. Convex verifies JWT using Supabase's JWKS endpoint
5. Convex queries/mutations access `ctx.auth.getUserIdentity()` for user info
6. Authorization logic runs in Convex functions (replaces RLS)

### Convex Configuration for Supabase JWT

**convex/auth.config.ts:**
```typescript
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "authenticated", // Supabase audience claim
      issuer: "https://[project-id].supabase.co/auth/v1",
      jwks: "https://[project-id].supabase.co/auth/v1/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
};
```

**Client-side provider setup:**
```typescript
// app/ConvexClientProvider.tsx
import { ConvexProviderWithAuth } from "convex/react";
import { createClient } from "@supabase/supabase-js";

function useSupabaseAuth() {
  const supabase = createClient(URL, ANON_KEY);

  const fetchAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  return useMemo(() => ({
    isLoading: false,
    isAuthenticated: !!session,
    fetchAccessToken,
  }), [session]);
}

export function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useSupabaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
```

### Workspace Isolation Pattern in Convex

**Supabase RLS equivalent in Convex:**

```typescript
// convex/lib/auth.ts
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireWorkspaceMembership(
  ctx: QueryCtx | MutationCtx,
  workspaceId: string
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const userId = identity.subject; // Supabase user ID from JWT sub claim

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_workspace_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique();

  if (!membership) throw new Error("Not authorized for this workspace");

  return { userId, workspaceId, role: membership.role };
}
```

**Using in queries/mutations:**
```typescript
// convex/contacts.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

export const list = query({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    const { workspaceId } = await requireWorkspaceMembership(ctx, args.workspaceId);

    return ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    workspaceId: v.string(),
    name: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspaceId, userId } = await requireWorkspaceMembership(ctx, args.workspaceId);

    return ctx.db.insert("contacts", {
      workspaceId,
      name: args.name,
      phone: args.phone,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});
```

---

## Data Layer Migration

### Tables to Migrate (Priority Order)

Based on the current schema, here's the recommended migration order:

| Priority | Table | Records (Est.) | Dependencies | Rationale |
|----------|-------|----------------|--------------|-----------|
| 1 | `contacts` | High | None | Core entity, used by everything |
| 2 | `conversations` | High | contacts | Depends on contacts |
| 3 | `messages` | Very High | conversations | Highest volume, biggest perf impact |
| 4 | `contact_notes` | Medium | contacts | Simple, low risk |
| 5 | `workspaces` | Low | None | Core but rarely written |
| 6 | `workspace_members` | Low | workspaces | Auth-related, keep close to Supabase |
| 7 | `ari_*` (7 tables) | Medium | contacts, conversations | AI feature tables |
| 8 | `tickets` | Low | profiles | Support feature |

**Phase 1 (Spike):** `contacts` only - validates the architecture
**Phase 2 (Core):** `conversations`, `messages` - biggest performance gains
**Phase 3 (Complete):** Everything else

### Convex Schema Design

**Document-based thinking:**

Supabase (relational):
```sql
-- Normalized with foreign keys
contacts (id, workspace_id, name, phone, ...)
conversations (id, contact_id, workspace_id, ...)
messages (id, conversation_id, workspace_id, content, ...)
```

Convex (document-based with references):
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(), // Supabase user ID
    settings: v.optional(v.any()),
    kapsoPhoneId: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(), // Supabase user ID
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  contacts: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    phone: v.string(),
    phoneNormalized: v.optional(v.string()),
    email: v.optional(v.string()),
    leadStatus: v.optional(v.string()),
    leadScore: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    assignedTo: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_phone", ["workspaceId", "phone"]),

  conversations: defineTable({
    workspaceId: v.id("workspaces"),
    contactId: v.id("contacts"),
    status: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    unreadCount: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_contact", ["contactId"])
    .index("by_workspace_lastMessage", ["workspaceId", "lastMessageAt"]),

  messages: defineTable({
    workspaceId: v.id("workspaces"),
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    direction: v.string(), // "inbound" | "outbound"
    senderType: v.string(), // "user" | "contact" | "bot"
    senderId: v.optional(v.string()),
    messageType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    kapsoMessageId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_workspace", ["workspaceId"]),
});
```

### Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `workspaceMembers` | `by_workspace_user` | Fast membership lookups (auth) |
| `contacts` | `by_workspace_phone` | Phone lookup for webhooks |
| `conversations` | `by_workspace_lastMessage` | Inbox sorting |
| `messages` | `by_conversation` | Thread loading |

**Key difference from Supabase:** In Convex, you explicitly define indexes. There's no automatic foreign key indexing.

---

## API Route Changes

### Current Pattern (Next.js + Supabase)

```typescript
// src/app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace')

  // Auth check
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) return authResult

  // Database query
  const supabase = await createClient()
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ contacts })
}
```

### Convex Pattern (Direct from Client)

**No API route needed.** Convex queries are called directly from React components:

```typescript
// convex/contacts.ts
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspaceId);

    return ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

// src/app/(dashboard)/[workspace]/database/page.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function DatabasePage({ workspaceId }) {
  const contacts = useQuery(api.contacts.list, { workspaceId });

  // contacts is reactive - updates automatically when data changes
  // No need for TanStack Query, no polling, no manual refetch

  if (contacts === undefined) return <Loading />;
  return <ContactsTable contacts={contacts} />;
}
```

### Hybrid Pattern (During Migration)

During migration, you may need API routes that call both systems:

```typescript
// src/app/api/contacts/route.ts (hybrid)
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const workspaceId = searchParams.get('workspace')

  // Auth still via Supabase
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) return authResult

  // Data from Convex (server-side)
  const contacts = await convex.query(api.contacts.list, {
    workspaceId
  });

  return NextResponse.json({ contacts })
}
```

### Webhook Pattern (Kapso)

Webhooks need special handling since they don't have user context:

```typescript
// convex/webhooks/kapso.ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const handleMessage = httpAction(async (ctx, request) => {
  // Verify webhook signature
  const signature = request.headers.get("x-kapso-signature");
  const body = await request.text();

  if (!verifyKapsoSignature(body, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(body);

  // Call internal mutation (no user auth needed)
  await ctx.runMutation(internal.messages.createFromWebhook, {
    phone: payload.from,
    content: payload.text,
    kapsoMessageId: payload.message_id,
  });

  return new Response("OK", { status: 200 });
});
```

---

## Migration Phases

### Phase 1: Spike Test (1-2 days)
**Goal:** Validate Convex works for my21staff's use case

- [ ] Set up Convex project
- [ ] Configure Supabase JWT provider in Convex
- [ ] Implement `contacts` table + basic queries
- [ ] Convert `/api/contacts/by-phone` to Convex
- [ ] Benchmark: Compare response times Supabase vs Convex
- [ ] Decision gate: Proceed if > 50% improvement

**Effort:** 8-12 hours
**Risk:** Low (isolated spike, no production impact)

### Phase 2: Core Migration (1-2 weeks)
**Goal:** Move high-traffic tables to Convex

- [ ] Migrate `contacts` table with full CRUD
- [ ] Migrate `conversations` table
- [ ] Migrate `messages` table
- [ ] Update inbox to use Convex subscriptions (real-time)
- [ ] Dual-write period: Write to both Supabase + Convex
- [ ] Validate data consistency
- [ ] Cut over reads to Convex

**Effort:** 40-60 hours
**Risk:** Medium (production data involved)

### Phase 3: Complete Migration (1-2 weeks)
**Goal:** All data in Convex, Supabase auth only

- [ ] Migrate remaining tables (`contact_notes`, `ari_*`, etc.)
- [ ] Update all API routes to use Convex
- [ ] Remove Supabase PostgreSQL queries
- [ ] Keep Supabase only for: Auth, Storage (if used)
- [ ] Update TanStack Query usage to Convex hooks

**Effort:** 40-60 hours
**Risk:** Medium

### Phase 4: Cleanup (3-5 days)
**Goal:** Remove Supabase data layer entirely

- [ ] Archive Supabase data
- [ ] Remove RLS policies (no longer needed)
- [ ] Remove `workspace_id` from Supabase tables
- [ ] Update documentation
- [ ] Simplify deployment (Supabase becomes auth-only)

**Effort:** 16-24 hours
**Risk:** Low

---

## Risk Assessment

### Data Migration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Dual-write period, Supabase as backup |
| ID format mismatch | Medium | High | Use `v.union()` pattern for transitional IDs |
| Relationship integrity | Medium | High | Migrate in dependency order, validate counts |
| Performance regression | Low | Medium | A/B test before cutover |

### Rollback Strategy

**Dual-write period ensures rollback is always possible:**

```typescript
// During migration: write to both
async function createContact(data) {
  // Primary: Convex
  const convexId = await convex.mutation(api.contacts.create, data);

  // Backup: Supabase (async, don't block)
  supabase.from('contacts').insert(data).catch(console.error);

  return convexId;
}
```

**Rollback steps:**
1. Update client to read from Supabase
2. Stop dual-writes
3. Convex data can be archived or deleted
4. No data loss because Supabase has everything

### Downtime Requirements

**Zero downtime possible with this approach:**

1. **Phase 1 (Spike):** No production impact
2. **Phase 2 (Core):** Dual-write means both systems have data
3. **Phase 3 (Complete):** Gradual feature flag rollout
4. **Phase 4 (Cleanup):** Supabase data archival can happen offline

---

## Component Boundaries Summary

```
+-------------------------------------------------------------+
|                        Browser                              |
|  +-------------------+  +-------------------------------+   |
|  |  Supabase Auth    |  |     Convex React Hooks        |   |
|  |  (login/logout)   |  |  (useQuery, useMutation)      |   |
|  +---------+---------+  +---------------+---------------+   |
|            |                            |                   |
|            | JWT                        | WebSocket         |
|            v                            v                   |
+-----------+|----------------------------+|------------------+
             |                            |
+------------+----------------------------+-------------------+
|                       Next.js Server                        |
|  +------------------------------------------------------+  |
|  |              API Routes (Webhooks Only)               |  |
|  |  - POST /api/webhook/kapso (-> Convex httpAction)    |  |
|  |  - Public endpoints (leads form, etc.)               |  |
|  +------------------------------------------------------+  |
+-------------------------------------------------------------+
                           |
     +---------------------+---------------------+
     |                                           |
     v                                           v
+-----------------+                    +---------------------+
|  Supabase Auth  |                    |   Convex Backend    |
|  (auth only)    |                    |   (all data)        |
|                 |                    |                     |
|  - User CRUD    |    JWT Verify      |  - contacts         |
|  - Sessions     |<------------------>|  - conversations    |
|  - Password     |    via JWKS        |  - messages         |
|    reset        |                    |  - workspaces       |
+-----------------+                    |  - ari_* tables     |
                                       |  - tickets          |
                                       |  - Real-time subs   |
                                       +---------------------+
```

---

## Suggested Build Order

1. **Convex project setup + Supabase JWT integration**
2. **`workspaces` + `workspaceMembers` tables** (foundational for auth)
3. **`requireWorkspaceMembership()` helper in Convex**
4. **`contacts` table + CRUD operations**
5. **`/api/contacts/by-phone` spike conversion + benchmark**
6. **Decision gate: proceed or optimize Supabase**
7. **`conversations` table + inbox queries**
8. **`messages` table + real-time subscriptions**
9. **Webhook handler migration (Kapso)**
10. **Remaining tables (`ari_*`, `tickets`, etc.)**
11. **Remove Supabase data layer**

---

## RLS Equivalent Comparison

| Supabase RLS | Convex Equivalent |
|--------------|-------------------|
| `auth.uid()` | `ctx.auth.getUserIdentity().subject` |
| `workspace_id = (SELECT ...)` | `requireWorkspaceMembership()` helper |
| Policy on table | Check in query/mutation handler |
| Automatic enforcement | Manual but explicit |
| SQL-based | TypeScript-based |

**Key insight:** Convex's approach is more explicit but also more flexible. You write the auth check once in a helper function and call it at the start of each query/mutation. No hidden SQL magic, but also no surprise policy failures.

---

## Sources

- [Convex Authentication Overview](https://docs.convex.dev/auth) - Official docs on auth integration options
- [Convex Custom JWT Provider](https://docs.convex.dev/auth/advanced/custom-jwt) - How to configure external JWT providers
- [Supabase JWT Documentation](https://supabase.com/docs/guides/auth/jwts) - JWKS endpoint and verification
- [Convex Schema Documentation](https://docs.convex.dev/database/schemas) - Schema definition syntax
- [Migrating PostgreSQL to Convex](https://stack.convex.dev/migrate-data-postgres-to-convex) - Migration strategy guide
- [Convex Authorization Patterns](https://stack.convex.dev/authorization) - Multi-tenant patterns
- [Convex Row-Level Security](https://stack.convex.dev/row-level-security) - RLS equivalent patterns
- [Convex Query Functions](https://docs.convex.dev/functions/query-functions) - Query patterns and reactivity

---
*Last updated: 2026-01-20*
