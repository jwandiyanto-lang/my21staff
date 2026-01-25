# Architecture Research: v3.1 Full Convex + Clerk Migration

**Project:** my21staff
**Researched:** 2026-01-23
**Overall confidence:** HIGH (based on official Clerk and Convex documentation)

---

## Current Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT HYBRID STATE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │
│   │   Browser    │────▶│   Next.js    │────▶│      Supabase Auth       │   │
│   │   Client     │     │   App Router │     │  (JWT, sessions, users)  │   │
│   └──────────────┘     └──────────────┘     └──────────────────────────┘   │
│          │                    │                         │                   │
│          │                    │                         ▼                   │
│          │                    │              ┌──────────────────────────┐   │
│          │                    │              │    Supabase PostgreSQL   │   │
│          │                    │              │  ┌────────────────────┐  │   │
│          │                    │              │  │ workspace_members  │  │   │
│          │                    │              │  │ workspace_invites  │  │   │
│          │                    │              │  │ profiles           │  │   │
│          │                    │              │  │ ARI tables (7)     │  │   │
│          │                    │              │  │ tickets (3)        │  │   │
│          │                    │              │  │ knowledge_base     │  │   │
│          │                    │              │  │ flows              │  │   │
│          │                    │              │  │ consultant_slots   │  │   │
│          │                    │              │  │ articles/webinars  │  │   │
│          │                    │              │  └────────────────────┘  │   │
│          │                    │              └──────────────────────────┘   │
│          │                    │                                             │
│          ▼                    ▼                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                         Convex Cloud                                  │ │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │ │
│   │   │   Schema    │    │   Queries   │    │     HTTP Actions        │  │ │
│   │   │ (contacts,  │    │ (real-time  │    │ (Kapso webhooks)        │  │ │
│   │   │  messages,  │    │  subscrip)  │    │                         │  │ │
│   │   │  convs)     │    │             │    │                         │  │ │
│   │   └─────────────┘    └─────────────┘    └─────────────────────────┘  │ │
│   │                                                                       │ │
│   │   Auth: Supabase JWT verification via auth.config.ts                 │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌──────────────┐                         ┌─────────────────────────────┐  │
│   │   n8n        │─── (BROKEN) ──────────▶│ Supabase contacts table     │  │
│   │   Automation │     Google Sheets       │ (Eagle leads not syncing)   │  │
│   └──────────────┘                         └─────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Auth Flow (Supabase)

1. User visits protected route
2. Next.js middleware checks Supabase session via `createServerClient`
3. JWT validated server-side, user redirected if not authenticated
4. Convex auth.config.ts verifies Supabase JWT for Convex function calls
5. `getAuthUserId(ctx)` returns Supabase user UUID in Convex functions

### Current Data Distribution

**In Convex (migrated in v3.0):**
- `contacts` (leads)
- `conversations`
- `messages`
- `contactNotes`
- `workspaces` (partial)
- `workspaceMembers` (partial)
- `ariConfig`
- `ariConversations`
- `ariMessages`
- `tickets`
- `ticketComments`
- `ticketStatusHistory`

**Still in Supabase (needs migration):**
- `ari_ai_comparison` - AI model performance tracking
- `ari_appointments` - Consultation bookings
- `ari_destinations` - Study abroad destinations
- `ari_knowledge_categories` - Knowledge base categories
- `ari_knowledge_entries` - Knowledge base content
- `ari_payments` - Payment records (deferred feature)
- `consultant_slots` - Booking slot availability
- `flows` - Automation workflows
- `form_templates` - Dynamic form schemas
- `user_todos` - User task management
- `articles` - CMS content
- `webinars` - Webinar management
- `profiles` - User profiles (linked to Supabase auth.users)
- `workspace_invitations` - Team invite system

---

## Target Architecture

### Clerk + Convex Full Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TARGET STATE: v3.1                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────────────────────────────────────────┐ │
│   │   Browser    │────▶│                  Clerk                           │ │
│   │   Client     │     │  ┌─────────────┐   ┌─────────────────────────┐  │ │
│   └──────────────┘     │  │ ClerkProvider│   │    Clerk Dashboard      │  │ │
│          │             │  │ + Middleware │   │  - User management      │  │ │
│          │             │  │              │   │  - SSO (optional)       │  │ │
│          │             │  └─────────────┘   │  - Webhooks to Convex    │  │ │
│          │             │                     └─────────────────────────┘  │ │
│          │             └──────────────────────────────────────────────────┘ │
│          │                         │                                        │
│          │                         │ JWT (Clerk issues, Convex validates)   │
│          ▼                         ▼                                        │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                         Convex Cloud                                  │ │
│   │                                                                       │ │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │ │
│   │   │   Schema    │    │   Queries   │    │     HTTP Actions        │  │ │
│   │   │ (ALL data)  │    │ (real-time) │    │ - Kapso webhook         │  │ │
│   │   │             │    │             │    │ - n8n lead sync         │  │ │
│   │   │ users       │    │             │    │ - Clerk user webhook    │  │ │
│   │   │ workspaces  │    │             │    │                         │  │ │
│   │   │ contacts    │    │             │    │                         │  │ │
│   │   │ messages    │    │             │    │                         │  │ │
│   │   │ ARI tables  │    │             │    │                         │  │ │
│   │   │ tickets     │    │             │    │                         │  │ │
│   │   │ CMS content │    │             │    │                         │  │ │
│   │   └─────────────┘    └─────────────┘    └─────────────────────────┘  │ │
│   │                                                                       │ │
│   │   Auth: Clerk JWT verification via auth.config.ts (domain-based)     │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌──────────────┐                         ┌─────────────────────────────┐  │
│   │   n8n        │────────────────────────▶│ Convex HTTP Action          │  │
│   │   Automation │     Google Sheets       │ POST /n8n-leads             │  │
│   └──────────────┘                         └─────────────────────────────┘  │
│                                                                              │
│   Supabase: REMOVED (no longer needed)                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Target Auth Flow (Clerk + Convex)

1. User visits protected route
2. Clerk middleware (`clerkMiddleware`) validates session
3. ClerkProvider provides auth context to app
4. `ConvexProviderWithClerk` passes Clerk JWT to Convex
5. Convex validates JWT using Clerk JWKS endpoint
6. `ctx.auth.getUserIdentity()` returns Clerk user info in Convex functions

---

## Integration Points

### 1. Clerk + Convex Auth Integration

**Configuration needed:**

```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!, // e.g., "https://your-clerk-domain.clerk.accounts.dev"
      applicationID: "convex", // MUST be "convex" for Clerk JWT template
    },
  ],
} satisfies AuthConfig;
```

**Clerk Dashboard setup:**
1. Create JWT template named "convex"
2. Copy Issuer URL to `CLERK_JWT_ISSUER_DOMAIN`
3. Set up webhook for user sync (user.created, user.updated, user.deleted)

**Provider hierarchy (Next.js App Router):**

```tsx
// src/app/providers.tsx (new Client Component)
"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### 2. n8n Webhook Integration

**Current state:** n8n pushes to Supabase `contacts` table (broken)

**Target state:** n8n pushes to Convex HTTP Action

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/n8n-leads",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate shared secret
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.N8N_WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Call internal mutation to create contact
    await ctx.runMutation(internal.contacts.createFromWebhook, {
      workspace_id: data.workspace_id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      lead_score: data.lead_score,
      metadata: data.metadata,
      source: "google_form",
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

**n8n configuration change:**
- Old URL: `https://supabase.co/rest/v1/contacts`
- New URL: `https://intent-otter-212.convex.site/n8n-leads`
- Auth: Bearer token (shared secret)

### 3. Clerk User Sync Webhook

**Purpose:** Keep Convex `users` table in sync with Clerk

```typescript
// convex/http.ts (add to existing router)
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify Clerk webhook signature using Svix
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    // Validate signature (implementation needed)

    const payload = await request.json();
    const eventType = payload.type;

    switch (eventType) {
      case "user.created":
        await ctx.runMutation(internal.users.create, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address,
          name: `${payload.data.first_name} ${payload.data.last_name}`.trim(),
        });
        break;
      case "user.updated":
        await ctx.runMutation(internal.users.update, {
          clerkId: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address,
          name: `${payload.data.first_name} ${payload.data.last_name}`.trim(),
        });
        break;
      case "user.deleted":
        await ctx.runMutation(internal.users.delete, {
          clerkId: payload.data.id,
        });
        break;
    }

    return new Response("OK", { status: 200 });
  }),
});
```

### 4. Middleware Migration

**From Supabase:**
```typescript
// Current: src/middleware.ts
const supabase = createServerClient(url, key, { cookies });
const { data: { user } } = await supabase.auth.getUser();
```

**To Clerk:**
```typescript
// New: src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/(.*)/inbox(.*)",
  "/(.*)/database(.*)",
  // ... all protected routes
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
```

---

## Component Changes

### New Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `Providers` | `src/app/providers.tsx` | Client component wrapping ClerkProvider + ConvexProviderWithClerk |
| `convex/http.ts` | `convex/http.ts` | HTTP router for webhooks (n8n, Clerk) |
| `users` table | `convex/schema.ts` | User profile storage (synced from Clerk) |

### Modified Components

| Component | Change |
|-----------|--------|
| `src/middleware.ts` | Replace Supabase middleware with Clerk middleware |
| `src/app/layout.tsx` | Wrap with new `Providers` component |
| `convex/auth.config.ts` | Change from Supabase JWT to Clerk JWT |
| `convex/lib/auth.ts` | Use `ctx.auth.getUserIdentity()` instead of `getAuthUserId()` |
| All API routes using Supabase auth | Replace with Clerk auth helpers |
| All components using `createClient()` for auth | Replace with Clerk hooks |

### Components to Remove

| Component | Reason |
|-----------|--------|
| `src/lib/supabase/server.ts` | No longer needed (Clerk handles auth) |
| `src/lib/supabase/client.ts` | No longer needed |
| `src/lib/supabase/config.ts` | No longer needed |
| Supabase env vars | Remove SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY |

### Schema Additions (Convex)

```typescript
// convex/schema.ts additions

// Users table (synced from Clerk)
users: defineTable({
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  isAdmin: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"]),

// Additional ARI tables
ariAppointments: defineTable({
  workspace_id: v.id("workspaces"),
  ari_conversation_id: v.id("ariConversations"),
  consultant_id: v.optional(v.string()),
  scheduled_at: v.number(),
  duration_minutes: v.number(),
  status: v.string(), // 'scheduled', 'completed', 'cancelled', 'no_show'
  meeting_link: v.optional(v.string()),
  notes: v.optional(v.string()),
  reminder_sent_at: v.optional(v.number()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_conversation", ["ari_conversation_id"]),

ariDestinations: defineTable({
  workspace_id: v.id("workspaces"),
  country: v.string(),
  city: v.optional(v.string()),
  university_name: v.string(),
  programs: v.optional(v.array(v.string())),
  requirements: v.optional(v.any()),
  is_promoted: v.boolean(),
  priority: v.number(),
  notes: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_country", ["workspace_id", "country"]),

ariKnowledgeCategories: defineTable({
  workspace_id: v.id("workspaces"),
  name: v.string(),
  description: v.optional(v.string()),
  display_order: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"]),

ariKnowledgeEntries: defineTable({
  workspace_id: v.id("workspaces"),
  category_id: v.optional(v.id("ariKnowledgeCategories")),
  title: v.string(),
  content: v.string(),
  is_active: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_category", ["category_id"]),

consultantSlots: defineTable({
  workspace_id: v.id("workspaces"),
  consultant_id: v.optional(v.string()),
  day_of_week: v.number(), // 0-6 (Sunday-Saturday)
  start_time: v.string(), // "09:00"
  end_time: v.string(), // "10:00"
  duration_minutes: v.number(),
  is_active: v.boolean(),
  max_bookings_per_slot: v.number(),
  booking_window_days: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_day", ["workspace_id", "day_of_week"]),

// CMS tables
articles: defineTable({
  workspace_id: v.id("workspaces"),
  title: v.string(),
  slug: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  cover_image_url: v.optional(v.string()),
  status: v.string(), // 'draft', 'published'
  published_at: v.optional(v.number()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_slug", ["workspace_id", "slug"]),

webinars: defineTable({
  workspace_id: v.id("workspaces"),
  title: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  cover_image_url: v.optional(v.string()),
  scheduled_at: v.number(),
  duration_minutes: v.number(),
  meeting_url: v.optional(v.string()),
  max_registrations: v.optional(v.number()),
  status: v.string(), // 'draft', 'published', 'completed', 'cancelled'
  published_at: v.optional(v.number()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_slug", ["workspace_id", "slug"]),

// Other tables
userTodos: defineTable({
  workspace_id: v.id("workspaces"),
  user_id: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  due_date: v.optional(v.number()),
  priority: v.string(), // 'low', 'medium', 'high'
  status: v.string(), // 'pending', 'completed'
  completed_at: v.optional(v.number()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_user", ["workspace_id", "user_id"])
  .index("by_status", ["workspace_id", "status"]),

workspaceInvitations: defineTable({
  workspace_id: v.id("workspaces"),
  email: v.string(),
  name: v.optional(v.string()),
  role: v.string(), // 'admin', 'member'
  token: v.string(),
  invited_by: v.string(),
  status: v.string(), // 'pending', 'accepted', 'expired'
  expires_at: v.number(),
  accepted_at: v.optional(v.number()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_workspace", ["workspace_id"])
  .index("by_token", ["token"])
  .index("by_email", ["email"]),
```

---

## Suggested Phase Order

Based on dependency analysis and risk assessment:

### Phase 1: Clerk Auth Setup (Foundation)

**Rationale:** Auth is the foundation. Everything else depends on it working correctly.

**Tasks:**
1. Create Clerk account, configure application
2. Set up JWT template named "convex"
3. Update `convex/auth.config.ts` for Clerk
4. Create `src/app/providers.tsx` with ConvexProviderWithClerk
5. Update `src/app/layout.tsx` to use Providers
6. Deploy Convex with new auth config

**Critical path:** Must complete before any other work.

**Risk:** Low - well-documented integration pattern.

### Phase 2: Middleware Migration

**Rationale:** Route protection must work before UI changes.

**Tasks:**
1. Install `@clerk/nextjs`
2. Replace `src/middleware.ts` with Clerk middleware
3. Configure protected route patterns
4. Test all route protection scenarios
5. Handle `must_change_password` flow (migrate to Clerk user metadata or separate table)

**Dependencies:** Phase 1 complete.

**Risk:** Medium - need to handle the `must_change_password` flag that currently lives in `workspace_members`.

### Phase 3: Users Table + Clerk Webhook

**Rationale:** User data must be in Convex before we can remove Supabase auth.

**Tasks:**
1. Add `users` table to Convex schema
2. Create Clerk webhook HTTP action (`/clerk-webhook`)
3. Configure webhook in Clerk dashboard
4. Migrate existing Supabase users to Convex
5. Update all user lookups to use Convex `users` table

**Dependencies:** Phase 1 complete.

**Risk:** Medium - need careful user migration to preserve workspace memberships.

### Phase 4: Convex Auth Helpers Migration

**Rationale:** Internal auth functions must use new Clerk identity.

**Tasks:**
1. Update `convex/lib/auth.ts` to use `ctx.auth.getUserIdentity()`
2. Update all mutations/queries that check user identity
3. Map Clerk user ID to workspace membership
4. Test all workspace-scoped operations

**Dependencies:** Phase 3 complete (users table exists).

**Risk:** Low - straightforward code changes.

### Phase 5: n8n Webhook Migration (Critical for Eagle)

**Rationale:** Eagle's lead flow is broken. This restores it.

**Tasks:**
1. Create `convex/http.ts` with n8n endpoint
2. Implement `/n8n-leads` HTTP action
3. Add shared secret validation
4. Update n8n workflow to point to Convex URL
5. Test end-to-end: Google Form -> n8n -> Convex -> CRM

**Dependencies:** None (can run in parallel with Phase 2-4).

**Risk:** Low - simple webhook pattern, already done for Kapso.

### Phase 6: Remaining Tables Migration

**Rationale:** Move all remaining data to Convex.

**Tasks:**
1. Add remaining tables to Convex schema (see schema additions above)
2. Create migrations for each table category:
   - ARI tables (appointments, destinations, knowledge)
   - CMS tables (articles, webinars)
   - Utility tables (todos, invitations, slots)
3. Update API routes to use Convex
4. Test each feature area

**Dependencies:** Phase 4 complete (auth working in Convex).

**Risk:** Medium - many tables, many API routes to update.

### Phase 7: Supabase Removal

**Rationale:** Clean up after migration complete.

**Tasks:**
1. Remove Supabase client code (`src/lib/supabase/*`)
2. Remove Supabase environment variables
3. Remove `@supabase/*` packages from dependencies
4. Update documentation
5. Final testing of all features

**Dependencies:** All previous phases complete.

**Risk:** Low - just cleanup if everything else works.

---

## Data Migration Strategy

### User Migration (Critical)

**Problem:** Supabase user IDs (UUIDs) are referenced throughout the system in:
- `workspace_members.user_id`
- `contacts.assigned_to`
- `tickets.requester_id`, `assigned_to`
- `contact_notes.user_id`
- Various `created_by`, `updated_by` fields

**Strategy:**
1. Create Convex `users` table with both `clerkId` and legacy `supabaseId`
2. Import existing users with their Supabase UUIDs preserved
3. When user signs in with Clerk for first time, link Clerk ID to existing record
4. Gradually update references to use Clerk ID (optional - can keep using Supabase ID as internal ID)

**Migration script pattern:**
```typescript
// One-time migration mutation
export const migrateUsers = internalMutation({
  handler: async (ctx) => {
    // Fetch from Supabase (one-time, via HTTP action)
    // Insert into Convex users table
    // Preserve supabaseId for backward compatibility
  }
});
```

### Table Migration (Standard Pattern)

For each table:
1. Add table to Convex schema
2. Create internal mutation for bulk insert
3. Run migration (fetch from Supabase, insert to Convex)
4. Update API routes to read from Convex
5. Verify data integrity
6. Remove Supabase queries

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| User ID mapping errors | HIGH | Keep supabaseId in users table, validate all references |
| Downtime during migration | HIGH | Use feature flags, migrate in phases, keep Supabase running until verified |
| n8n webhook failure | MEDIUM | Test thoroughly before switching, keep old endpoint as fallback |
| Clerk free tier limits | LOW | Free tier has 10,000 MAU, well above current usage |
| Performance regression | LOW | Convex already validated 25x faster in v3.0 |

---

## Environment Variables

### Remove (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ENV
```

### Add (Clerk)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_JWT_ISSUER_DOMAIN
CLERK_WEBHOOK_SECRET
```

### Keep (Convex)
```
NEXT_PUBLIC_CONVEX_URL
CONVEX_DEPLOY_KEY (for CI/CD)
```

### Add (n8n)
```
N8N_WEBHOOK_SECRET
```

---

## Sources

- [Clerk + Convex Integration Docs](https://clerk.com/docs/guides/development/integrations/databases/convex) - Last updated Jan 14, 2026
- [Convex Auth with Clerk](https://docs.convex.dev/auth/clerk) - Official Convex docs
- [Clerk Webhooks with Convex](https://clerk.com/blog/webhooks-data-sync-convex) - User sync pattern
- [Authentication Best Practices](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs) - Next.js patterns
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) - Webhook implementation

---

*Last updated: 2026-01-23*
