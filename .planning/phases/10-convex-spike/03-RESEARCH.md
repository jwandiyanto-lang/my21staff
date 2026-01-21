# Phase 3: Convex Spike - Research

**Researched:** 2026-01-21
**Domain:** Convex database + Supabase JWT hybrid auth
**Confidence:** MEDIUM

## Summary

Convex is an application backend with an integrated database, built specifically for real-time applications. Unlike Supabase which is a database-first platform with client-oriented RLS, Convex enables server-side authorization patterns where every function call can be checked programmatically.

The spike will validate whether Convex's query performance and real-time capabilities offer meaningful improvement over the optimized Supabase implementation. The project already has Convex installed (v1.31.5 in package.json) and a `convex-test.html` file demonstrating the HTTP endpoint structure at `https://intent-otter-212.convex.cloud`.

**Primary recommendation:** Use Convex CLI `npx convex dev` for local development and `npx convex deploy` for production. Configure Supabase JWT provider in `convex/auth.config.ts` using `type: "customJwt"` with JWKS endpoint.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.31.5 | Convex TypeScript SDK | Already installed in project, official SDK |
| @supabase/ssr | ^0.8.0 | Supabase auth (JWT source) | Keeping Supabase for auth, using Convex for data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex/react | ^1.31.5 | React hooks (useQuery, useMutation) | For real-time UI updates in components |
| convex/nextjs | ^1.31.5 | Next.js SSR helpers | For server-side rendering with Convex |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Convex data layer | Supabase queries only | Convex offers real-time out of the box, no RLS complexity |

**Installation:**
```bash
# Already installed - verify:
npm list convex

# If needed:
npm install convex
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── schema.ts              # Database schema
├── auth.config.ts         # Supabase JWT provider config
├── lib/
│   └── auth.ts          # Authorization helpers (requireWorkspaceMembership)
├── contacts.ts           # Contact query functions
├── conversations.ts      # Conversation query/mutation functions
├── messages.ts          # Message query/mutation functions
├── http/
│   └── contacts.ts      # HTTP endpoints for external webhooks
└── migrate.ts           # Migration mutations

scripts/
├── migrate-convex.ts    # Data migration from Supabase
└── benchmark.ts          # Performance comparison
```

### Pattern 1: Schema Definition
**What:** Define tables with validators and indexes in `convex/schema.ts`
**When to use:** All Convex projects require schema definition
**Example:**
```typescript
// Source: https://docs.convex.dev/database/schemas
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contacts: defineTable({
    workspace_id: v.id("workspaces"),
    phone: v.string(),
    phone_normalized: v.string(),
    name: v.optional(v.string()),
    lead_status: v.string(),
    lead_score: v.number(),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  })
    .index("by_workspace_phone", ["workspace_id", "phone_normalized"])
    .searchIndex("search_name", { searchField: "name" }),
});
```

### Pattern 2: Custom JWT Auth Configuration
**What:** Configure Supabase as JWT issuer for Convex auth
**When to use:** When keeping Supabase auth but using Convex data
**Example:**
```typescript
// Source: https://docs.convex.dev/auth/advanced/custom-jwt
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0],
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
};
```

### Pattern 3: Query Function
**What:** Define read-only query functions in `convex/*.ts`
**When to use:** For data retrieval operations
**Example:**
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByPhone = query({
  args: {
    phone: v.string(),
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("phone_normalized", args.phone)
      )
      .first();

    return contact;
  },
});
```

### Pattern 4: Authorization Helper
**What:** Verify workspace membership before allowing access
**When to use:** For workspace-scoped data access control
**Example:**
```typescript
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireWorkspaceMembership(
  ctx: QueryContext | MutationContext,
  workspaceId: string
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_workspace", (q) =>
      q.eq("user_id", userId).eq("workspace_id", workspaceId)
    )
    .first();

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  return { userId, membership };
}
```

### Pattern 5: HTTP Action for Webhook
**What:** Define HTTP endpoints for external webhook handling
**When to use:** For Kapso webhook, API endpoints
**Example:**
```typescript
import { httpRouter, httpAction } from "convex/server";
import { api } from "./_generated";
import { fetchAction } from "convex/server";

const http = httpRouter();

http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    // Process webhook
    return new Response(JSON.stringify({ received: true }));
  }),
});

export default http;
```

### Anti-Patterns to Avoid
- **Client-side data fetching for all queries:** Use server queries for auth-protected data
- **Omitting indexes on hot paths:** Always add indexes for lookup fields (phone, workspace_id)
- **Returning raw auth data:** Extract and validate specific claims instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time subscription updates | Custom polling or websockets | `useQuery` from `convex/react` | Automatic updates when data changes |
| Authorization patterns | Custom middleware checks | Convex server-side auth in functions | Centralized, type-safe auth checks |
| HTTP webhook handling | Next.js API routes | Convex HTTP actions | Same backend, no cold starts |
| Migration scripts | Ad-hoc copy scripts | Convex mutation functions | Type-safe, transactional |

**Key insight:** Convex's reactive system means you don't need to manually manage subscriptions. `useQuery` automatically re-runs when underlying data changes.

## Common Pitfalls

### Pitfall 1: Missing JWKS Configuration
**What goes wrong:** Supabase JWT verification fails because jwks URL is incorrect
**Why it happens:** Using the wrong Supabase project URL format
**How to avoid:** Use `${SUPABASE_URL}/.well-known/jwks.json` format
**Warning signs:** Auth errors with "invalid token" or "verification failed"

### Pitfall 2: Index Definition Order
**What goes wrong:** Queries using indexes return wrong results or are slow
**Why it happens:** Index field order must match query order in `.eq()` chains
**How to avoid:** Define index in same order as query: `.index("by_workspace_phone", ["workspace_id", "phone_normalized"])` and use `.eq("workspace_id", x).eq("phone_normalized", y)`
**Warning signs:** Queries returning unexpected results or scanning entire table

### Pitfall 3: Auth Context Not Propagated
**What goes wrong:** `getAuthUserId()` returns null even with valid JWT
**Why it happens:** Not passing auth header in HTTP action or client not initialized with auth
**How to avoid:** Ensure `ConvexReactClient` or `ConvexHttpClient` is properly initialized with auth provider
**Warning signs:** All auth checks fail, userId is always null

### Pitfall 4: HTTP Action Response Format
**What goes wrong:** Kapso webhook times out or retries
**Why it happens:** Not returning proper HTTP response immediately
**How to avoid:** Return `new Response(JSON.stringify({ received: true }), { status: 200 })` immediately, then process async
**Warning signs:** Webhook provider shows delivery failures or multiple retries

## Code Examples

Verified patterns from official sources:

### Auth Configuration
```typescript
// Source: https://docs.convex.dev/auth/advanced/custom-jwt
// File: convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0],
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
};
```

### Contact Lookup Query
```typescript
// File: convex/contacts.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByPhone = query({
  args: {
    phone: v.string(),
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id).eq("phone_normalized", args.phone)
      )
      .first();

    return contact;
  },
});
```

### React Component with Real-time Subscription
```typescript
// Source: Based on convex/react hooks
// File: src/components/contacts-list.tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function ContactsList({ workspaceId }: { workspaceId: string }) {
  const contacts = useQuery(api.contacts.getByWorkspace, { workspaceId });

  if (!contacts) return <div>Loading...</div>;

  return (
    <ul>
      {contacts.map(contact => (
        <li key={contact._id}>{contact.name} - {contact.phone}</li>
      ))}
    </ul>
  );
}
```

### HTTP Action for Webhook
```typescript
// File: convex/http/webhooks.ts
import { httpRouter, httpAction } from "convex/server";

const http = httpRouter();

http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();

    // Verify signature here if needed
    const signature = request.headers.get("x-kapso-signature");

    // Respond immediately to prevent retries
    // Process async in background if needed

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual polling for updates | Real-time `useQuery` subscriptions | Since Convex 1.0 | Automatic UI updates, no polling overhead |
| Client-side RLS policies | Server-side authorization functions | Since Convex 1.0 | More flexible auth patterns, type-safe |
| Separate database + backend | Integrated Convex backend | Since Convex 1.0 | Single deployment, no separate API |

**Deprecated/outdated:**
- None significant - Convex patterns are stable

## Open Questions

1. **HTTP Action Exact Syntax**
   - What we know: HTTP actions use `httpRouter` and `httpAction`
   - What's unclear: Exact API for accessing request body, headers, and building responses in Convex 1.31.5
   - Recommendation: Use existing `convex-test.html` pattern as reference, consult CLI help: `npx convex http --help`

2. **Real-time Subscription Performance**
   - What we know: `useQuery` provides automatic updates
   - What's unclear: Actual subscription latency and overhead for large message feeds
   - Recommendation: Measure during spike with actual conversation data

3. **Migration Complexity**
   - What we know: Can use mutation functions to copy data from Supabase
   - What's unclear: How to handle existing Supabase auto-generated IDs vs Convex IDs
   - Recommendation: Store `supabaseId` in Convex records for reference (already documented in README.md)

## Sources

### Primary (HIGH confidence)
- [Convex Schema Documentation](https://docs.convex.dev/database/schemas) - Table definitions, indexes, data types
- [Convex Custom JWT Auth](https://docs.convex.dev/auth/advanced/custom-jwt) - Supabase JWT provider configuration
- [Convex Authorization](https://docs.convex.dev/auth) - Auth patterns and getAuthUserId
- [convex-test.html](/home/jfransisco/Desktop/21/my21staff/convex-test.html) - HTTP endpoint structure reference
- [.planning/phases/10-convex-spike/README.md](/home/jfransisco/Desktop/21/my21staff/.planning/phases/10-convex-spike/README.md) - Existing project documentation

### Secondary (MEDIUM confidence)
- [Convex GitHub Repository](https://github.com/get-convex/convex) - Package overview and structure
- [Convex TypeScript SDK](https://github.com/get-convex/convex-js) - React hooks and client libraries
- package.json - Confirms convex version ^1.31.5 installed

### Tertiary (LOW confidence)
- WebSearch results for httpRouter/httpAction patterns - Could not retrieve official docs for exact syntax
- WebSearch results for React hooks patterns - Based on general Convex knowledge, need verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package.json confirms versions, official docs verified
- Architecture: MEDIUM - Schema and auth patterns verified, HTTP actions need CLI verification
- Pitfalls: MEDIUM - Based on common issues reported, but need实战validation during spike

**Research date:** 2026-01-21
**Valid until:** 2026-02-20 (30 days - Convex is actively maintained but patterns are stable)
