# Features Research: v3.1 Auth & Data Migration

**Domain:** WhatsApp CRM auth migration (Supabase to Clerk) + data migration (remaining tables to Convex)
**Researched:** 2026-01-23
**Confidence:** HIGH (based on Clerk official docs, Convex official docs, existing codebase analysis)

---

## Auth Feature Mapping

Current Supabase auth features mapped to Clerk equivalents:

| Supabase Feature | Clerk Equivalent | Migration Notes | Complexity |
|-----------------|------------------|-----------------|------------|
| `signInWithPassword()` | `<SignIn />` component or `signIn()` SDK | Direct replacement, pre-built UI available | Low |
| `signUp()` | `<SignUp />` component or `signUp()` SDK | Direct replacement | Low |
| `getUser()` | `useUser()` hook / `currentUser()` server-side | Different API shape, need to update all 77 files | Medium |
| `auth.users` table | Clerk user management | Users stored in Clerk, sync to Convex via webhooks | Medium |
| `profiles` table | Clerk user metadata + Convex `users` table | Split: metadata in Clerk, app data in Convex | Medium |
| `workspace_members` table | Clerk Organizations + memberships | **Direct mapping** - Organizations = Workspaces | Low |
| `workspace_invitations` | Clerk Organization invitations | **Built-in** - Clerk handles email sending | Low |
| Session cookies (SSR) | Clerk `clerkMiddleware()` | Simpler middleware, no manual cookie handling | Low |
| `auth.uid()` in RLS | `ctx.auth.getUserIdentity()` in Convex | Different pattern - auth checked in functions | Medium |
| Password reset flow | Clerk `<UserButton />` + email flow | **Built-in** - no custom `/forgot-password` needed | Low |
| First-login password change | Clerk onboarding flow with metadata | Use `publicMetadata.needsOnboarding` pattern | Medium |
| Role-based permissions | Clerk Organization roles | Default `admin`/`member` + custom roles available | Low |
| JWT for Convex | Clerk JWT template named "convex" | Official integration, well-documented | Low |

---

## Table Stakes

Features that **must** work after migration. Missing = broken app.

### 1. Email/Password Authentication
| Aspect | Current (Supabase) | Target (Clerk) | Complexity |
|--------|-------------------|----------------|------------|
| Sign in | `signInWithPassword()` | `<SignIn />` or `signIn()` | Low |
| Sign up | `createUser()` admin API | Clerk admin `users.createUser()` | Low |
| Password reset | Supabase email (broken) | Clerk built-in (working) | Low |
| Session persistence | Cookies via `@supabase/ssr` | Cookies via `clerkMiddleware()` | Low |

**Migration action:** Replace all Supabase auth calls (77 files identified).

### 2. Multi-Tenant Workspace Isolation
| Aspect | Current (Supabase) | Target (Clerk + Convex) | Complexity |
|--------|-------------------|------------------------|------------|
| Workspace = tenant | `workspaces` table with RLS | Clerk Organization | Low |
| Membership check | RLS policies on `auth.uid()` | Convex `ctx.auth.getUserIdentity()` | Medium |
| Workspace context | URL param + cookie | Clerk active organization | Low |

**Migration action:**
- Create Clerk Organization for each workspace
- Map Supabase `workspace_id` to Clerk `org_id`
- Update `requireWorkspaceMembership()` to use Clerk identity

### 3. Team Invitations
| Aspect | Current (Supabase) | Target (Clerk) | Complexity |
|--------|-------------------|----------------|------------|
| Create invitation | Custom API + admin SDK | `organizations.createOrganizationInvitation()` | Low |
| Email sending | Resend HTTP API | Clerk built-in email | **Simpler** |
| Accept flow | Custom `/set-password` page | Clerk Account Portal | **Simpler** |
| Token management | Custom token in DB | Clerk managed | **Simpler** |

**Migration action:**
- Remove custom invitation API route (200+ lines)
- Remove `workspace_invitations` table
- Use Clerk's invitation API directly

### 4. Role-Based Permissions
| Aspect | Current (Supabase) | Target (Clerk) | Complexity |
|--------|-------------------|----------------|------------|
| Roles | `owner`, `admin`, `member` | Same - Clerk default roles | Low |
| Permission checks | `requirePermission()` helper | Clerk `has()` method | Low |
| Custom permissions | `Permission` type | Clerk custom permissions | Medium |

**Current permissions (from types.ts):**
```typescript
'leads:delete' | 'leads:view_all' | 'leads:export' |
'team:invite' | 'team:remove' | 'team:change_role' |
'workspace:settings' |
'tickets:assign' | 'tickets:transition' | 'tickets:skip_stage'
```

**Migration action:**
- Map current permissions to Clerk custom permissions
- Requires B2B SaaS Add-on ($100/month) for custom permissions OR
- Use role-based checks only (free tier)

### 5. First-Login Password Change
| Aspect | Current (Supabase) | Target (Clerk) | Complexity |
|--------|-------------------|----------------|------------|
| Flag | `must_change_password` in `workspace_members` | `publicMetadata.needsOnboarding` | Medium |
| Redirect | Middleware checks flag | Middleware checks metadata | Medium |
| Flow | Custom `/change-password` page | Custom onboarding component | Medium |

**Migration action:**
- Add `needsOnboarding: true` to user metadata on invitation accept
- Update middleware to check Clerk metadata
- Create Clerk-compatible onboarding flow

### 6. JWT Token for Convex
| Aspect | Current (Supabase) | Target (Clerk) | Complexity |
|--------|-------------------|----------------|------------|
| Token format | Supabase JWT | Clerk JWT template | Low |
| Convex config | `auth.config.ts` with Supabase issuer | `auth.config.ts` with Clerk issuer | Low |
| Client provider | Custom provider | `<ConvexProviderWithClerk>` | Low |

**Migration action:**
- Create JWT template named "convex" in Clerk Dashboard
- Update `convex/auth.config.ts` with Clerk issuer domain
- Replace Convex provider with Clerk-integrated version

---

## Differentiators

Clerk advantages over current Supabase auth implementation.

### 1. Pre-Built UI Components
**Current state:** 189 lines of custom login page (`/app/(auth)/login/page.tsx`)

**With Clerk:**
- `<SignIn />` - complete sign-in with Google/social optional
- `<SignUp />` - complete sign-up
- `<UserButton />` - account menu with password change, sign out
- `<OrganizationSwitcher />` - workspace switching
- `<OrganizationProfile />` - team management UI

**Benefit:** Remove 500+ lines of auth UI code.

### 2. Working Email Delivery
**Current state:** Forgot password uses Supabase email (broken per PROJECT.md known issues)

**With Clerk:**
- All auth emails handled by Clerk
- Custom email templates available
- Reliable delivery

**Benefit:** Fix broken password reset without maintaining email infrastructure.

### 3. Built-in Organization Invitations
**Current state:** 214 lines of custom invitation API (`/api/invitations/route.ts`)

**With Clerk:**
- `createOrganizationInvitation()` API
- Email sent automatically
- Redirect URL customizable
- Metadata preserved to membership

**Benefit:** Remove custom invitation code, reduce security surface.

### 4. Session Management
**Current state:** Complex middleware with Supabase cookie handling

**With Clerk:**
- `clerkMiddleware()` handles everything
- Automatic token refresh
- Multi-device session management

**Benefit:** Simpler middleware, fewer edge cases.

### 5. Real-Time User Sync via Webhooks
**With Clerk:**
- User created/updated/deleted webhooks
- Organization membership webhooks
- Sync to Convex `users` table automatically

**Benefit:** Single source of truth for user identity.

### 6. Better Developer Experience
**Current state:**
- Check auth in every API route
- Manual error handling
- RLS debugging

**With Clerk + Convex:**
- `ctx.auth.getUserIdentity()` in Convex functions
- Type-safe identity access
- No RLS - explicit auth checks (more debuggable)

---

## Anti-Features

Things to deliberately NOT build during migration.

### 1. Do NOT Migrate User Passwords
**Why:** Supabase hashes passwords with bcrypt. Clerk uses different hashing.

**Instead:**
- Invite users to re-set passwords via Clerk
- Send "Welcome to new system" email with password reset link
- Mark accounts as requiring password reset on first Clerk login

### 2. Do NOT Build Custom Social Login
**Why:** Current app is email/password only. Adding social login adds complexity.

**Instead:**
- Keep email/password only (matches current behavior)
- Social login is future enhancement, not migration requirement

### 3. Do NOT Preserve Supabase Session Tokens
**Why:** Session format incompatible. Users must re-login.

**Instead:**
- Plan for all users to re-authenticate post-migration
- Communicate clearly about login change

### 4. Do NOT Build Custom Email Templates Initially
**Why:** Clerk default templates work. Custom templates add time.

**Instead:**
- Use Clerk defaults for v3.1
- Custom branding is v3.2 polish

### 5. Do NOT Migrate `profiles` Table As-Is
**Why:** Clerk stores user profile data. Duplicate storage is waste.

**Instead:**
- `email`, `full_name` go to Clerk user object
- `is_admin` (platform admin) goes to Clerk user metadata
- `avatar_url` optional - Clerk can use Gravatar

### 6. Do NOT Keep Supabase RLS Policies
**Why:** Moving to Convex which has no RLS concept.

**Instead:**
- Auth checks happen in Convex mutations/queries
- `requireWorkspaceMembership()` pattern (already exists in Convex)

---

## Data Migration Features

### Tables Requiring Migration to Convex

From Supabase schema analysis:

| Table | Already in Convex? | Migration Pattern | Priority |
|-------|-------------------|-------------------|----------|
| `workspaces` | Yes | Sync `owner_id` to Clerk org admin | High |
| `workspace_members` | Yes | Replace with Clerk memberships | High |
| `workspace_invitations` | No | Delete - Clerk handles this | High |
| `profiles` | No | Merge into Clerk user + Convex `users` | High |
| `contacts` | Yes | Already migrated | Done |
| `conversations` | Yes | Already migrated | Done |
| `messages` | Yes | Already migrated | Done |
| `contact_notes` | Yes | Already migrated | Done |
| `tickets` | Yes | Already migrated | Done |
| `ticketComments` | Yes | Already migrated | Done |
| `ticketStatusHistory` | Yes | Already migrated | Done |
| `ariConfig` | Yes | Already migrated | Done |
| `ariConversations` | Yes | Already migrated | Done |
| `ariMessages` | Yes | Already migrated | Done |

### New Tables Needed in Convex

| Table | Purpose | Fields |
|-------|---------|--------|
| `users` | Cache of Clerk users for queries | `clerk_id`, `email`, `name`, `avatar_url`, `created_at` |

**Note:** This table is populated via Clerk webhooks, not migration.

### n8n Webhook Integration Pattern

**Current state:** n8n sends leads to Supabase API

**Target state:** n8n sends leads to Convex HTTP action

| Aspect | Current | Target | Notes |
|--------|---------|--------|-------|
| Endpoint | `/api/contacts` (Next.js) | `https://<deployment>.convex.site/leads` | Convex HTTP action |
| Auth | Supabase service key | API key in header | Simple auth for n8n |
| Payload | Contact data | Same contact data | No change needed |
| Response | JSON with contact ID | JSON with contact ID | Compatible |

**Convex HTTP Action Pattern:**
```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/leads",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify API key
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey !== process.env.N8N_API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    // Call internal mutation
    const contact = await ctx.runMutation(internal.mutations.createContactFromWebhook, body);
    return new Response(JSON.stringify(contact), { status: 200 });
  }),
});
```

**n8n Configuration:**
- Update webhook URL to Convex endpoint
- Add `X-API-Key` header with secret
- Same payload format as current

---

## Migration Complexity Summary

| Feature Area | Complexity | Effort Estimate | Risk |
|--------------|------------|-----------------|------|
| Auth provider swap | Medium | 2-3 days | Low - well documented |
| Workspace to Organization | Low | 1 day | Low - direct mapping |
| Invitation flow | Low | 0.5 days | Low - Clerk handles it |
| Middleware update | Low | 0.5 days | Low |
| First-login flow | Medium | 1 day | Medium - custom logic |
| API route updates (77 files) | High | 2-3 days | Medium - many files |
| Convex provider update | Low | 0.5 days | Low - documented |
| n8n webhook update | Low | 0.5 days | Low |
| User data sync | Medium | 1 day | Low |

**Total estimate:** 8-11 days

---

## Dependencies Identified

```
Clerk Organization setup
    |
    +-- Workspace migration (link org_id)
    |       |
    |       +-- Membership migration (from Supabase to Clerk)
    |       |
    |       +-- Invitation system (use Clerk)
    |
    +-- JWT template setup
    |       |
    |       +-- Convex auth config
    |       |
    |       +-- Provider update
    |
    +-- Webhook endpoints
            |
            +-- User sync to Convex
            |
            +-- n8n lead endpoint
```

---

## Sources

### Official Documentation
- [Clerk Organizations Overview](https://clerk.com/docs/guides/organizations/overview)
- [Clerk Organization Invitations](https://clerk.com/docs/guides/organizations/add-members/invitations)
- [Clerk + Convex Integration](https://clerk.com/docs/guides/development/integrations/databases/convex)
- [Convex Clerk Authentication](https://docs.convex.dev/auth/clerk)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Clerk Roles and Permissions](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)

### Comparison Articles
- [Clerk vs Supabase Auth](https://clerk.com/articles/clerk-vs-supabase-auth)
- [Authentication Best Practices: Convex, Clerk and Next.js](https://stack.convex.dev/authentication-best-practices-convex-clerk-and-nextjs)

### Codebase Analysis
- `/home/jfransisco/Desktop/21/my21staff/src/lib/auth/workspace-auth.ts` - Current auth pattern
- `/home/jfransisco/Desktop/21/my21staff/src/app/api/invitations/route.ts` - Invitation logic to replace
- `/home/jfransisco/Desktop/21/my21staff/src/middleware.ts` - Current middleware
- `/home/jfransisco/Desktop/21/my21staff/convex/schema.ts` - Existing Convex schema
- `/home/jfransisco/Desktop/21/my21staff/convex/mutations.ts` - Existing Convex mutations with auth pattern
