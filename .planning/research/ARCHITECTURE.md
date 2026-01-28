# Architecture: Dev Mode to Production Migration

**Project:** my21staff v3.5 Production Go-Live
**Researched:** 2026-01-28
**Confidence:** HIGH
**Focus:** Safe migration from dev mode (mock data, bypassed auth) to production (real auth, real data)

---

## Executive Summary

Your current dev mode architecture uses environment-based bypasses (`NEXT_PUBLIC_DEV_MODE=true`) to skip authentication and serve mock data locally. Moving to production requires:

1. **Environment-based code paths** that remain safe in production (dev mode cannot activate in production builds)
2. **Build-time separation** of development and production code
3. **Runtime validation** ensuring dev bypasses are unreachable in production
4. **Graceful auth layering** that works offline during development, real during production

**The good news:** Your current patterns are sound. The migration is _removing the dev code from production builds_, not rewriting architecture.

---

## Current Architecture (v3.4)

### Development Flow (localhost:3000/demo)

```
User Request → /demo route
         ↓
Middleware (skips auth on localhost)
         ↓
Page Component
         ↓
isDevMode() check = true → shouldUseMockData()
         ↓
Return MOCK_CONVEX_WORKSPACE (src/lib/mock-data.ts)
         ↓
Render UI with mock data (ZERO network calls)
```

### Production Flow (my21staff.com/[workspace])

```
User Request → /<workspace> route
         ↓
Middleware (enforces auth on production domain)
         ↓
Clerk auth (real JWT tokens)
         ↓
Page Component
         ↓
isDevMode() check = false → Query Convex (real)
         ↓
Convex validates JWT via Clerk auth config
         ↓
Return real data
         ↓
Render UI with real data
```

### Component Boundaries

| Component | Current Role | Production Role | Dependency |
|-----------|--------------|-----------------|------------|
| `.env.local` | Enables dev mode | Not used in prod | NEXT_PUBLIC_DEV_MODE |
| `middleware.ts` | Skips auth on localhost | Enforces auth on production domain | Clerk + NODE_ENV |
| `src/lib/mock-data.ts` | Mock workspace/contacts/messages | Bundled but unreachable (dev code) | isDevMode() guard |
| `src/app/providers.tsx` | Conditional Convex auth | Always uses ClerkProvider + Convex | NODE_ENV check |
| API routes (`/api/contacts`, etc.) | Return mocks if dev | Always query Convex | isDevMode() guard |
| Server components | Use `shouldUseMockData()` | Always query Convex | Convex queries |

---

## Data Flow: Development vs Production

### Development (localhost:3000/demo)

```
Request Flow:
  Request → Middleware (skips auth) → Page loads

Data Sources:
  Mock workspace? → src/lib/mock-data.ts
  Mock contacts? → src/lib/mock-data.ts (or API route with isDevMode check)
  Mock messages? → src/lib/mock-data.ts

Network Calls:
  ZERO to Convex (offline)
  ZERO to Clerk auth
  ZERO to Kapso (no real webhooks)

Storage:
  In-memory (lost on refresh)
  No persistence
```

### Production (my21staff.com/eagle-overseas)

```
Request Flow:
  Request → Middleware (validates Clerk JWT) → Page loads

Data Sources:
  Workspace? → Convex query (auth-protected)
  Contacts? → Convex query (workspace-scoped)
  Messages? → Convex subscription (real-time)

Network Calls:
  ALL to Convex (via Clerk JWT auth)
  Clerk JWT validation on every request
  Kapso webhooks → Convex mutations

Storage:
  Persistent in Convex Cloud
  Scoped by workspace ID
  Accessed via authenticated users
```

---

## Development to Production Safety Strategy

### 1. Environment Variable Layer

**How it works:**
- Dev mode is **NOT** an environment (development vs production)
- Dev mode is a **feature flag** controlled by `NEXT_PUBLIC_DEV_MODE`
- In production, this variable is ALWAYS false or unset

**File Strategy:**

```
.env.local (local machine only, gitignored)
  NEXT_PUBLIC_DEV_MODE=true         ← Dev only, enables offline testing
  NEXT_PUBLIC_CONVEX_URL=...
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... (test keys ok locally)

.env.production (source control, used for `npm run build`)
  # NEXT_PUBLIC_DEV_MODE is NOT set (defaults to undefined → falsy)
  NEXT_PUBLIC_CONVEX_URL=...
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... (production keys)

Production deployment (Vercel/hosting)
  # NEXT_PUBLIC_DEV_MODE is NOT set
  NEXT_PUBLIC_CONVEX_URL=... (production)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=... (production)
  CLERK_SECRET_KEY=... (server-side, not accessible to browser)
```

**Key Safety Property:**

In production bundle, dev mode check is always false:

```javascript
// In source code:
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// In production build, this inlines to:
const isDevMode = false  // Because the env var doesn't exist

// Therefore, this entire block is dead code in production:
if (isDevMode) {
  return MOCK_DATA  // ← Never executed, optimizable
}

// Bundler may tree-shake this, or it remains harmless unreachable code
```

### 2. Build-Time vs Runtime Checks

**Two types of dev mode checks in your codebase:**

#### Build-Time Checks (using `process.env` directly in initializers)
```typescript
// src/app/providers.tsx
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// This is evaluated at build time, then inlined into the bundle
// In production build, inlines to: const isDevMode = false
```

**Safety:** Production bundle literally contains `isDevMode = false`, making dev code unreachable.

#### Runtime Checks (calling `isDevMode()` function)
```typescript
// src/lib/mock-data.ts
export const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// This is evaluated at runtime
// In production, NEXT_PUBLIC_DEV_MODE is undefined, so returns false
```

**Safety:** Even though the function is bundled, it always returns false in production.

**Recommendation:** Use build-time checks (`const isDevMode = process.env...`) in critical paths for strongest guarantees.

### 3. Middleware-Level Protection

**Current middleware (needs one improvement):**
```typescript
// src/middleware.ts - CURRENT
const isLocalhost = (request: Request) => {
  const url = new URL(request.url)
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

export default clerkMiddleware(async (auth, request) => {
  // Skips auth on localhost - GOOD for dev
  // But should also check NODE_ENV to be absolutely safe
  if (isLocalhost(request)) {
    return  // Skip auth check
  }
  if (!isPublicRoute(request)) {
    await auth.protect()  // Real auth in production
  }
})
```

**Improved middleware (RECOMMENDED):**
```typescript
// src/middleware.ts - RECOMMENDED
const isLocalhost = (request: Request) => {
  const url = new URL(request.url)
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

const isDevelopment = process.env.NODE_ENV === 'development'

export default clerkMiddleware(async (auth, request) => {
  // Only skip auth on localhost AND in development
  // In production (NODE_ENV=production), always require auth
  if (isDevelopment && isLocalhost(request)) {
    return
  }
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
```

**Why this matters:** Even if a production deployment somehow ended up on a localhost-like hostname, it can't bypass auth because `NODE_ENV=production`.

### 4. API Route Pattern

**Current pattern (found in `/api/contacts`):**
```typescript
function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function GET(request: NextRequest) {
  // Check dev mode FIRST, before any auth
  if (isDevMode()) {
    return NextResponse.json({ contacts: MOCK_CONTACTS, total: MOCK_CONTACTS.length })
  }

  // Auth required for everything after this point
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query Convex
  const contacts = await fetchQuery(api.contacts.listByWorkspaceInternal, {...})
  return NextResponse.json({ contacts })
}
```

**Why this is safe:**
- Dev mode returns early, skipping auth check (intended for offline dev)
- In production: `isDevMode()` always returns false, execution reaches auth check
- If someone manages to hit endpoint in production without auth, Clerk blocks them
- Auth failures happen before any data access

---

## Authentication Architecture

### Convex + Clerk Integration

Your current setup uses Convex with Clerk authentication:

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig
```

### Production Auth Flow

```
1. User signs in via Clerk at my21staff.com
2. Clerk issues JWT token with issuer domain
3. Token sent to browser in Clerk cookie
4. Next.js client sends JWT to Convex via ConvexProviderWithClerk
5. Convex validates:
   - JWT signature (using Clerk's public key)
   - Issuer domain matches CLERK_JWT_ISSUER_DOMAIN
   - Token not expired
6. If valid → auth.userId available in mutations/queries
7. If invalid → request blocked before data access
```

**Convex Environment Variables Needed:**

Production Convex deployment must have:
```
CLERK_JWT_ISSUER_DOMAIN = https://clerk.<your-domain>.com
(or the Clerk accounts.dev URL for testing)
```

Set this via Convex Dashboard → Production Deployment → Environment Variables.

---

## Migration Decision Tree

```
Ready to deploy to production?
    │
    ├─ NO: Keep .env.local with NEXT_PUBLIC_DEV_MODE=true
    │       Continue local development with mock data
    │       Visit http://localhost:3000/demo
    │
    └─ YES:
        │
        ├─ STEP 1: Prepare environment files
        │   ├─ Create .env.production with production values
        │   ├─ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_live_...)
        │   ├─ CLERK_SECRET_KEY (sk_live_...)
        │   ├─ NEXT_PUBLIC_CONVEX_URL (production)
        │   └─ DO NOT set NEXT_PUBLIC_DEV_MODE
        │
        ├─ STEP 2: Test production build locally
        │   ├─ npm run build
        │   ├─ npm run start (test prod build)
        │   ├─ Verify routes redirect to login (expected)
        │   └─ Verify settings changes fail without auth (expected)
        │
        ├─ STEP 3: Configure Convex production
        │   ├─ Set CLERK_JWT_ISSUER_DOMAIN environment variable
        │   ├─ Create JWT Template in Clerk dashboard
        │   ├─ Run npx convex deploy
        │   └─ Verify auth.config.ts deployed
        │
        ├─ STEP 4: Deploy to production
        │   ├─ Build app: npm run build
        │   ├─ Push to Vercel or server
        │   ├─ Verify env vars set in deployment platform
        │   └─ Monitor deployment logs
        │
        └─ STEP 5: Verify production
            ├─ /eagle-overseas redirects to login (good)
            ├─ After login, real data loads from Convex (good)
            ├─ No 500 errors from missing mocks (good)
            └─ WhatsApp webhooks create real messages (good)
```

---

## Local Development After Production Deploy

**Scenario:** You've deployed to production. Now you want to continue developing locally.

### Option 1: Use `/demo` (Recommended for rapid iteration)

```bash
# In .env.local (already set up)
NEXT_PUBLIC_DEV_MODE=true
npm run dev
# Visit http://localhost:3000/demo
# Uses mock data, ZERO network calls
# Perfect for: UI work, testing component logic, feature development
```

### Option 2: Connect to Production (Real data testing)

```bash
# In .env.local
NEXT_PUBLIC_CONVEX_URL=https://intent-otter-212.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
npm run dev
# Visit http://localhost:3000/eagle-overseas
# Redirects to Clerk login
# After login, uses real Convex data from production
# Perfect for: integration testing, data-dependent features, bug reproduction
```

**Both workflows coexist.** You can use `/demo` for UI work during the day, then test real integrations with `/eagle-overseas` when needed.

---

## Component Architecture

### Safe Pattern: Conditional Data Sources

```typescript
// app/(dashboard)/[workspace]/dashboard-client.tsx
'use client'

import { useQuery } from 'convex/react'
import { shouldUseMockData, MOCK_CONVERSATIONS } from '@/lib/mock-data'

export function DashboardClient({ workspace_id }: { workspace_id: string }) {
  const shouldMock = shouldUseMockData(workspace_id)

  // Dev mode: use mock data
  if (shouldMock) {
    return <DashboardView conversations={MOCK_CONVERSATIONS} />
  }

  // Production: query Convex
  const conversations = useQuery(api.conversations.list, { workspace_id })
  if (conversations === undefined) return <LoadingUI />

  return <DashboardView conversations={conversations} />
}
```

**Why this is safe:**
- `shouldMock` always false in production (dev mode disabled)
- `useQuery` is conditional, never called when mocking
- Convex imports don't cause errors locally (just not called)
- Fallback to mock gracefully in dev, queries in prod

### Safe Pattern: API Routes with Dev Mode Check

```typescript
// app/api/contacts/route.ts
function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')

    // Return mock data first (dev mode)
    if (isDevMode()) {
      return NextResponse.json({ contacts: MOCK_CONTACTS, total: MOCK_CONTACTS.length })
    }

    // Production path: authenticate and query Convex
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contacts = await fetchQuery(api.contacts.list, { workspace_id: workspaceId })
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('GET /api/contacts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Production Safety Checklist

Before considering migration complete:

- [ ] `.env.production` created with all production values
- [ ] `NEXT_PUBLIC_DEV_MODE` is NOT set in `.env.production`
- [ ] `npm run build` completes without errors
- [ ] `npm run start` successfully starts prod build
- [ ] `/demo` workspace works locally with dev mode
- [ ] `npm run build` with production env vars creates proper bundle
- [ ] Production deployment environment variables are set correctly
- [ ] Middleware NODE_ENV check added for extra safety
- [ ] `/eagle-overseas` redirects to Clerk login in production (good)
- [ ] After login, real data loads from Convex
- [ ] Settings changes persist to Convex (not ignored)
- [ ] WhatsApp webhooks from Kapso create real messages
- [ ] Team member invites send real emails via Resend
- [ ] No errors in production logs about missing mocks

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|------------|
| **Dev mode checks** | No overhead | No overhead | No overhead (unreachable in prod) |
| **Mock data size** | ~1KB in-memory | Safe (not in prod) | Safe (not in prod) |
| **Middleware auth** | <1ms (Clerk cache) | Clerk handles scaling | Clerk handles scaling |
| **Convex queries** | ~37ms P95 (verified v3.0) | Convex scales horizontally | Convex scales horizontally |
| **Database growth** | All data indexed | Indexes needed | Composite indexes required |
| **Rate limiting** | In-memory (OK) | In-memory breaks | Need Redis-based rate limit |

**Action items for scale:**
- 10K+ users: Implement Redis-based rate limiting (replace in-memory)
- 10K+ users: Review Convex indexes for hot tables (contacts, messages)
- 1M+ users: Consider data archival (old messages, cold leads)

---

## Anti-Patterns to Avoid

### ❌ DO NOT: Check NODE_ENV for feature detection

```typescript
// WRONG - uses production-only check for a feature
if (process.env.NODE_ENV === 'production') {
  await sendAnalytics()  // But this feature should exist in dev too!
}
```

**Fix:** Use a feature flag (like dev mode), not NODE_ENV.

### ❌ DO NOT: Rely on typeof window !== 'undefined'

```typescript
// WRONG - leaks server data to client
const apiKey = typeof window !== 'undefined'
  ? undefined
  : process.env.SECRET_KEY  // Exposed if component renders server-side!
```

**Fix:** Keep secrets in server-only files (`.server.ts` files or server components).

### ❌ DO NOT: Create multiple dev mode variables

```typescript
// WRONG - impossible to maintain, will have gaps
const isDev = process.env.DEV_MODE === 'true'
const isDevEnv = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const mockDataEnabled = process.env.USE_MOCK_DATA === 'true'
// Three sources of truth = inconsistent behavior
```

**Fix:** Single source (`NEXT_PUBLIC_DEV_MODE`), check it everywhere.

### ❌ DO NOT: Leave secrets in dev code paths

```typescript
// Technically unreachable in prod, but bad practice
if (isDevMode()) {
  console.log('Dev server details', {
    convexDeployKey: process.env.CONVEX_DEPLOY_KEY,
  })
}
```

**Fix:** Move to a separate debug module, guard at import time.

---

## Files to Review Before Deployment

| File | Purpose | Status |
|------|---------|--------|
| `.env.local` | Dev mode enabled | Only used locally, safe |
| `.env.production` | Production values | MUST be set correctly |
| `src/middleware.ts` | Auth gate | Should check NODE_ENV |
| `src/app/providers.tsx` | Auth provider setup | Ready as-is |
| `src/lib/mock-data.ts` | Mock data | Unreachable in prod, OK |
| `convex/auth.config.ts` | Convex auth | Ready, uses env var |
| API routes | Dev mode checks | Ready as-is |

---

## Recommended Next Steps

### Phase 1: Verification (Before Deploy)
1. Set up `.env.production` with production values
2. Run `npm run build` to verify production build succeeds
3. Test `npm run start` locally (simulates production)
4. Verify `/eagle-overseas` redirects to login (auth working)
5. Verify settings changes fail without auth (expected)

### Phase 2: Deployment
1. Configure Clerk production domain in auth template
2. Set Convex production env vars via Convex dashboard
3. Deploy to production server/Vercel
4. Monitor for auth errors in production logs

### Phase 3: Post-Deployment
1. Local dev: Keep `/demo` for rapid iteration
2. Integration testing: Use `/eagle-overseas` with real data
3. Monitor: Watch for unexpected errors

---

## Convex + Clerk Production Checklist

- [ ] Clerk JWT Template created (named `convex`)
- [ ] Convex `CLERK_JWT_ISSUER_DOMAIN` set to production Clerk domain
- [ ] `npx convex deploy` executed after auth.config changes
- [ ] Production Clerk keys are `pk_live_...` and `sk_live_...`
- [ ] Test: User logs in → can access workspace data
- [ ] Test: User logs out → gets redirected to login on protected routes

---

## Sources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Convex & Clerk Authentication](https://docs.convex.dev/auth/clerk)
- [Clerk Documentation - Convex Integration](https://clerk.com/docs/guides/development/integrations/databases/convex)
- [Next.js Architecture Best Practices 2026](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-performance-first-teams/)
- [Next.js App Router Architecture](https://nextjs.org/docs/architecture)

---

*Last updated: 2026-01-28 - v3.5 Production Go-Live Phase*
