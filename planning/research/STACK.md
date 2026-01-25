# Stack Research: v3.1 Convex + Clerk Migration

**Project:** my21staff
**Researched:** 2026-01-23
**Confidence:** HIGH (verified with official docs)

---

## Current Stack

### Already in Place (Keep These)

| Package | Current Version | Purpose |
|---------|-----------------|---------|
| `convex` | 1.31.5 | Data layer, real-time subscriptions |
| `@convex-dev/auth` | 0.0.90 | Auth utilities (will change usage pattern) |
| `next` | 16.1.1 | App framework |
| `react` | 19.2.3 | UI library |

### To Remove

| Package | Current Version | Reason |
|---------|-----------------|--------|
| `@supabase/ssr` | 0.8.0 | Replacing auth with Clerk |
| `@supabase/supabase-js` | 2.90.1 | Replacing data with Convex |

### Convex Schema (Already Migrated in v3.0)

Tables already in Convex:
- `workspaces`
- `workspaceMembers`
- `contacts`
- `conversations`
- `messages`
- `contactNotes`
- `ariConfig`
- `ariConversations`
- `ariMessages`
- `tickets`
- `ticketComments`
- `ticketStatusHistory`

---

## Required Changes

### 1. ADD: Clerk Packages

```bash
npm install @clerk/nextjs@^6.36.8 svix@^1.84.1
```

| Package | Version | Purpose | Why This Version |
|---------|---------|---------|------------------|
| `@clerk/nextjs` | ^6.36.8 | Clerk integration for Next.js 15 | Current stable (published 2026-01-20), compatible with Next.js 15 + React 19 |
| `svix` | ^1.84.1 | Webhook signature verification | Required for Clerk user sync webhooks |

**DO NOT INSTALL:**
- `@clerk/clerk-react` - Redundant, `@clerk/nextjs` includes all React components
- `@clerk/backend` - Redundant, included in `@clerk/nextjs`
- `@clerk/themes` - Use Shadcn styling instead

### 2. UPDATE: Convex Auth Config

Replace `convex/auth.config.ts`:

```typescript
// BEFORE (Supabase JWT):
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "",
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      jwks: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/jwks.json`,
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;

// AFTER (Clerk JWT):
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

### 3. ADD: Convex Users Table

New schema addition for storing Clerk user data:

```typescript
// convex/schema.ts - ADD to existing schema
users: defineTable({
  clerkId: v.string(),          // Clerk user ID (user_xxx format)
  email: v.string(),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"]),
```

**Why:** Clerk user data must be stored in Convex for:
- Displaying user names/avatars across the app
- Looking up other users (not just current user)
- Avoiding rate limits on Clerk's backend API

### 4. ADD: Remaining Supabase Tables to Convex

Tables still in Supabase that need migration:

| Table | Priority | Notes |
|-------|----------|-------|
| `profiles` | HIGH | Replace with `users` table synced from Clerk |
| `ari_appointments` | HIGH | Booking system for Eagle |
| `consultant_slots` | HIGH | Scheduling availability |
| `workspace_invitations` | HIGH | Team invite flow |
| `user_todos` | MEDIUM | Task management |
| `ari_knowledge_categories` | MEDIUM | Knowledge base structure |
| `ari_knowledge_entries` | MEDIUM | Knowledge base content |
| `knowledge_base` | MEDIUM | FAQ matching |
| `ari_destinations` | MEDIUM | Eagle-specific university data |
| `ari_payments` | LOW | Payment records (deferred feature) |
| `ari_ai_comparison` | LOW | AI model analytics |
| `flows` | LOW | Automation (future) |
| `form_templates` | LOW | Forms (future) |

### 5. REMOVE: Supabase Packages (After Migration)

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

---

## Environment Variables

### ADD (Clerk)

```env
# Clerk API Keys (from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx  # or pk_test_xxx for dev
CLERK_SECRET_KEY=sk_live_xxx                    # or sk_test_xxx for dev

# Clerk JWT Issuer for Convex (from Clerk JWT template)
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-instance.clerk.accounts.dev

# Clerk Webhook Secret (from Clerk webhooks dashboard)
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### Convex Dashboard Environment Variables

Add to Convex dashboard (Settings > Environment Variables):
- `CLERK_JWT_ISSUER_DOMAIN` - Same as above
- `CLERK_WEBHOOK_SECRET` - For webhook verification in HTTP actions

### REMOVE (After migration complete)

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Integration Points

### 1. Clerk + Convex Provider Setup

Create `src/app/ConvexClientProvider.tsx`:

```typescript
"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**Key points:**
- `ConvexProviderWithClerk` must be inside `ClerkProvider`
- Uses `convex/react-clerk` (built into convex package)
- Pass Clerk's `useAuth` hook to the provider

### 2. Middleware Migration

Replace Supabase middleware with Clerk:

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/pricing",
  "/articles/(.*)",
  "/webinars/(.*)",
  "/api/webhook/(.*)",  // Webhooks must be public
  "/api/leads",         // Public lead capture
  "/portal/(.*)",       // Public support portal
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 3. Clerk Webhook HTTP Action

Add to Convex HTTP router (`convex/http.ts`):

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";

const http = httpRouter();

// Clerk webhook endpoint for user sync
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

    const svix = new Webhook(webhookSecret);
    const headers = {
      "svix-id": request.headers.get("svix-id")!,
      "svix-timestamp": request.headers.get("svix-timestamp")!,
      "svix-signature": request.headers.get("svix-signature")!,
    };

    const body = await request.text();

    try {
      const event = svix.verify(body, headers) as any;

      switch (event.type) {
        case "user.created":
        case "user.updated":
          await ctx.runMutation(internal.users.upsertFromClerk, {
            clerkId: event.data.id,
            email: event.data.email_addresses[0]?.email_address ?? "",
            name: `${event.data.first_name || ""} ${event.data.last_name || ""}`.trim() || null,
            imageUrl: event.data.image_url || null,
          });
          break;
        case "user.deleted":
          await ctx.runMutation(internal.users.deleteByClerkId, {
            clerkId: event.data.id,
          });
          break;
      }

      return new Response(null, { status: 200 });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook verification failed", { status: 400 });
    }
  }),
});

export default http;
```

### 4. Auth in Convex Functions

Replace current auth pattern:

```typescript
// BEFORE (using @convex-dev/auth):
import { getAuthUserId } from "@convex-dev/auth/server";
const userId = await getAuthUserId(ctx);

// AFTER (using ctx.auth directly with Clerk):
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");
const clerkId = identity.subject; // This is the Clerk user ID
```

### 5. User ID Migration Strategy

**Critical consideration:** Current schema uses Supabase UUIDs for `user_id` fields (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Clerk uses different IDs (format: `user_xxxxxxxxxxxxxx`).

**Recommended approach: Use Clerk IDs directly**

1. Add new `clerk_user_id` field to affected tables
2. Update all new records to use Clerk IDs
3. Migrate existing records with mapping
4. Remove old `user_id` field

**Tables with user_id references:**
- `workspaces.owner_id`
- `workspaceMembers.user_id`
- `contacts.assigned_to`
- `conversations.assigned_to`
- `messages.sender_id`
- `contactNotes.user_id`
- `tickets.requester_id`, `tickets.assigned_to`
- `ticketComments.author_id`
- `ticketStatusHistory.changed_by`

### 6. n8n Webhook to Convex HTTP Action

For Eagle leads from n8n:

```typescript
// convex/http.ts - ADD route
http.route({
  path: "/n8n-lead",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret (simple token-based)
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.N8N_WEBHOOK_SECRET;

    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    // Create contact in Convex
    await ctx.runMutation(internal.contacts.createFromWebhook, {
      workspaceId: body.workspace_id,
      phone: body.phone,
      name: body.name,
      email: body.email,
      source: "n8n",
      metadata: body.metadata || {},
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

---

## Not Adding (And Why)

| Package | Why Not |
|---------|---------|
| `@clerk/clerk-react` | Redundant - `@clerk/nextjs` includes all React components |
| `@clerk/backend` | Redundant - `@clerk/nextjs` includes backend utilities |
| `@clerk/themes` | Not needed - use Shadcn styling for consistency |
| `@auth/core` | Wrong library - we're using Clerk, not Auth.js |
| Any Supabase package | Removing Supabase entirely |
| `@convex-dev/auth` | Keep but change usage - built-in `ctx.auth` is sufficient for Clerk |

---

## Installation Commands

### Phase 1: Add Clerk (before removing Supabase)

```bash
npm install @clerk/nextjs@^6.36.8 svix@^1.84.1
```

### Phase 2: Remove Supabase (after migration complete)

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

---

## Clerk Dashboard Setup

### 1. Create Clerk Application

1. Go to clerk.com and create new application
2. Choose "Next.js" as framework
3. Enable authentication methods:
   - Email + Password (required)
   - Optional: Google OAuth for convenience

### 2. Create JWT Template for Convex

1. Navigate to JWT Templates in Clerk dashboard
2. Click "New Template" > Select "Convex"
3. **DO NOT rename the template** - must stay as "convex"
4. Copy the Issuer URL (this is `CLERK_JWT_ISSUER_DOMAIN`)

### 3. Create Webhook Endpoint

1. Navigate to Webhooks in Clerk dashboard
2. Add endpoint URL: `https://intent-otter-212.convex.site/clerk-users-webhook`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret (this is `CLERK_WEBHOOK_SECRET`)

---

## Migration Sequence

1. Install Clerk packages (can run alongside Supabase temporarily)
2. Add `users` table to Convex schema
3. Set up Clerk webhook in Convex HTTP router
4. Update `ConvexClientProvider` to use `ClerkProvider` + `ConvexProviderWithClerk`
5. Update `middleware.ts` to use `clerkMiddleware`
6. Update `convex/auth.config.ts` for Clerk JWT
7. Migrate remaining Supabase tables to Convex schema
8. Update all Convex function auth checks (use `ctx.auth.getUserIdentity()`)
9. Update user ID references across all tables
10. Migrate existing users (script or manual)
11. Test all auth flows
12. Remove Supabase packages and environment variables

---

## Sources

- [Clerk + Convex Integration (Clerk Docs)](https://clerk.com/docs/guides/development/integrations/databases/convex) - Updated 2026-01-14
- [Convex + Clerk Guide (Convex Docs)](https://docs.convex.dev/auth/clerk)
- [Storing Users in Convex (Convex Docs)](https://docs.convex.dev/auth/database-auth)
- [Clerk Webhooks Data Sync](https://clerk.com/blog/webhooks-data-sync-convex)
- [@clerk/nextjs npm](https://www.npmjs.com/package/@clerk/nextjs) - v6.36.8 (published 2026-01-20)
- [convex npm](https://www.npmjs.com/package/convex) - v1.31.5 (published 2026-01-20)
- [svix npm](https://www.npmjs.com/package/svix) - v1.84.1 (published 2026-01-05)
