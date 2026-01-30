# Phase 2: Your Intern Debug - Research

**Researched:** 2026-01-27
**Domain:** Next.js 16 + React 19 production error debugging
**Confidence:** HIGH

## Summary

Phase 2 fixes production crashes on the Your Intern configuration page (`/demo/your-intern`). The page currently fails to load due to server-side authentication errors when fetching Convex data during SSR, preventing admins from configuring bot behavior (P0 blocker).

Research identifies three primary error patterns in the existing codebase:
1. **SSR auth crashes** - Server components calling auth-protected Convex queries without client context
2. **Hydration mismatches** - Client/server rendering inconsistencies
3. **Missing error boundaries** - No graceful error handling around tab components

The project uses Next.js 16.1.1 with React 19.2.3, Radix UI Tabs 1.1.13, Clerk auth, and Convex database. Standard approach is: move auth-dependent queries to client components, add React 19 error boundaries, use Next.js --inspect debugging.

**Primary recommendation:** Audit errors systematically (group by type), fix SSR auth issues by moving queries to client wrappers, add error boundaries at tab level, verify with localhost:3000/demo testing.

## Standard Stack

The established tools for Next.js 16 + React 19 debugging:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React DevTools | 6.1.1+ | Component inspection | Official React debugging tool, built-in error tracking |
| Next.js --inspect | 16.1+ | Server-side debugging | Native Node.js debugger integration in Next.js 16.1 |
| react-error-boundary | 4.x | Error boundaries | Hooks-based error boundaries (class components not needed) |
| Browser Console | Native | Client-side errors | Standard JS error tracking, shows hydration mismatches |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| OpenTelemetry | Latest | Server component tracing | Production monitoring, server-side data fetching performance |
| Sentry | Latest | Production error tracking | Post-deployment error monitoring, SSR exception capture |
| VS Code Debugger | Native | Local debugging | Breakpoints in server/client code, step-through debugging |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-error-boundary | Class-based error boundaries | Manual implementation vs hooks API (more code, less maintainable) |
| Browser Console | console.log debugging | Better for quick checks but less structured than DevTools |
| Next.js --inspect | Manual console.log | Debugger allows breakpoints and step-through vs passive logging |

**Installation:**
```bash
npm install react-error-boundary
# DevTools and --inspect are built-in
```

## Architecture Patterns

### Recommended Error Isolation Structure
```
src/
├── components/
│   └── error-boundaries/
│       ├── tab-error-boundary.tsx      # Wraps individual tabs
│       └── page-error-boundary.tsx     # Wraps entire page
├── app/(dashboard)/[workspace]/
│   └── your-intern/
│       ├── page.tsx                    # Server component (minimal, no queries)
│       └── your-intern-client.tsx      # Client component (queries here)
```

### Pattern 1: Client-Side Data Fetching for Auth-Protected Queries
**What:** Move Convex queries requiring authentication from server components to client components wrapped with 'use client' directive

**When to use:** When server component calls Convex query that uses `requireWorkspaceMembership()` or any auth helper that needs Clerk context

**Root cause:** Next.js SSR context has no Clerk auth session. Convex queries using `@convex-dev/auth` call `getAuthUserId(ctx)` which returns null in SSR, throwing "Unauthorized" error.

**Example:**
```typescript
// ❌ BAD: Server component calling auth-protected query
// src/app/(dashboard)/[workspace]/your-intern/page.tsx
export default async function YourInternPage({ params }) {
  const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: params.workspace })
  const ariConfig = await fetchQuery(api.ari.getAriConfig, { workspace_id: workspace._id })
  // ↑ This crashes because getAriConfig requires auth unavailable in SSR
  return <YourInternClient workspace={workspace} ariConfig={ariConfig} />
}

// ✅ GOOD: Client component fetches data with auth context
// src/app/(dashboard)/[workspace]/your-intern/page.tsx
export default async function YourInternPage({ params }) {
  const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: params.workspace })
  // Only fetch data that doesn't require auth in server component
  return <YourInternClient workspace={workspace} />
}

// src/app/(dashboard)/[workspace]/your-intern/your-intern-client.tsx
'use client'
import { useQuery } from 'convex/react'

export function YourInternClient({ workspace }) {
  // Client component has Clerk context via ConvexProviderWithClerk
  const ariConfig = useQuery(api.ari.getAriConfig, { workspace_id: workspace._id })
  if (!ariConfig) return <LoadingSpinner />
  // Now query has access to authenticated user context
}
```

**Evidence:** Project's `planning/debug/settings-page-crash.md` documents exact same issue where Settings page crashes because server component calls `api.ari.getAriConfig` (auth-protected) during SSR.

### Pattern 2: Error Boundaries Around Independent UI Sections
**What:** Wrap each tab in Tabs component with error boundary so one tab crash doesn't break entire page

**When to use:** When UI has independent sections (tabs, panels, cards) that can fail independently

**Example:**
```typescript
// src/components/error-boundaries/tab-error-boundary.tsx
'use client'
import { ErrorBoundary } from 'react-error-boundary'

function TabErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-destructive mb-4">Failed to load this section</p>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  )
}

export function TabErrorBoundary({ children, tabName }) {
  return (
    <ErrorBoundary
      FallbackComponent={TabErrorFallback}
      onError={(error) => console.error(`${tabName} tab error:`, error)}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  )
}

// Usage in knowledge-base-client.tsx
<TabsContent value="persona">
  <TabErrorBoundary tabName="Persona">
    <PersonaTab workspaceId={workspace.id} />
  </TabErrorBoundary>
</TabsContent>
```

**Why this works:** React 19 improved error boundaries to remove duplicate error logging and provide `onCaughtError`/`onUncaughtError` hooks. Error boundaries catch rendering errors, lifecycle errors, and constructor errors (but not event handlers or async code).

**Source:** [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed)

### Pattern 3: DevMode Checks for Offline Development
**What:** Use `NEXT_PUBLIC_DEV_MODE` environment variable to skip network calls in demo mode

**When to use:** Already implemented in project - maintain pattern when fixing components

**Example from project:**
```typescript
// src/app/providers.tsx (already implemented)
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

return (
  <ClerkProvider>
    {isDevMode ? (
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ConvexProvider>
    ) : (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ConvexProviderWithClerk>
    )}
  </ClerkProvider>
)
```

**Verification:** Page must load at `/demo/your-intern` without errors, which relies on dev mode checks being present in all data-fetching components.

### Anti-Patterns to Avoid

- **Using suppressHydrationWarning without fixing root cause:** Silences errors but doesn't fix underlying SSR/client mismatch. Only use for unavoidable cases (timestamps, random IDs).

- **Calling browser APIs during SSR:** `window`, `localStorage`, `document` don't exist on server. Always wrap in `useEffect` or check `typeof window !== 'undefined'`.

- **Mixing auth-protected queries in server components:** If query uses `requireWorkspaceMembership()` or `getAuthUserId()`, it must run in client component with Clerk context.

- **Large try-catch blocks hiding errors:** Error boundaries provide better UX than silent failures. Console errors help debugging.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary components | Class components with getDerivedStateFromError | react-error-boundary | Hooks API, automatic reset handling, TypeScript support, maintained by React team contributor |
| Production error tracking | Custom console.error logging | Sentry/OpenTelemetry | Stack traces, SSR exception capture, breadcrumbs, user context, performance monitoring |
| Hydration debugging | Manual console.log in render | React DevTools + browser console | Automatic hydration error highlighting, component tree inspection, props/state tracking |
| Server debugging | console.log statements | Next.js --inspect + VS Code debugger | Breakpoints, step-through, variable inspection, network request monitoring |

**Key insight:** Debugging in Next.js 16 requires different tools for server vs client. Server issues need --inspect debugger, client issues need React DevTools. Mixing these up wastes time.

## Common Pitfalls

### Pitfall 1: Assuming Clerk Auth is Available in SSR Context

**What goes wrong:** Server component calls Convex query that uses `requireWorkspaceMembership()` or `getAuthUserId()`. Query throws "Unauthorized" error because Clerk session doesn't exist in SSR context. Page crashes before hydration.

**Why it happens:** Next.js server components run on Node.js server before being sent to browser. Clerk auth session is browser-only (JWT in cookies). Convex `@convex-dev/auth` expects auth context that isn't available server-side.

**Warning signs:**
- Error digest in production (e.g., "Digest: 2181255606")
- "Unauthorized" error in server logs
- Page crashes on initial load, not after user interaction
- Error happens in production but dev mode (localhost:3000/demo) works fine

**How to avoid:**
1. **Audit all server components** - Search for `async function` components that call `fetchQuery` with auth-protected queries
2. **Check Convex query auth requirements** - If query calls `requireWorkspaceMembership`, `getAuthUserId`, or any auth helper, it needs client context
3. **Move auth queries to client components** - Use 'use client' directive, fetch with `useQuery` hook inside component
4. **Keep public queries in server components** - Queries without auth checks (like `getBySlug`) are safe in SSR

**Detection early:** Run `grep -r "fetchQuery.*api\." src/app` and check each query in convex/ folder for auth helpers.

**Evidence source:** Project's own debug notes at `planning/debug/settings-page-crash.md` documents this exact issue.

**Confidence:** HIGH - directly observed in codebase and documented in official Convex docs.

### Pitfall 2: Hydration Mismatches from Client-Only Data

**What goes wrong:** Component renders different content on server vs browser first render, causing "Text content does not match server-rendered HTML" error. React throws warning and does client-side re-render, causing layout flash.

**Why it happens:** Server renders with default/empty data, client hydrates with real data from Convex/API. React expects identical HTML structure.

**Warning signs:**
- Console warning: "Hydration failed because the initial UI does not match what was rendered on the server"
- Layout shift or flash on page load
- Different element counts between SSR and client
- Using `Date.now()`, `Math.random()`, or `window` in initial render

**How to avoid:**
1. **Use useEffect for client-only logic** - Wrap browser API calls in useEffect which only runs after hydration
2. **Match server and client initial state** - Start with loading state on both server and client
3. **Disable SSR for problematic components** - Use `dynamic(() => import('./Component'), { ssr: false })` as escape hatch
4. **Suppress warnings only when unavoidable** - Add `suppressHydrationWarning={true}` to timestamp/random ID elements only

**Example fix:**
```typescript
// ❌ BAD: Different content on server vs client
function UserGreeting() {
  const user = useUser() // null on server, populated on client
  return <div>Welcome {user?.name || 'Guest'}</div>
  // Server renders "Welcome Guest", client renders "Welcome John" → mismatch
}

// ✅ GOOD: Same initial state, update after hydration
function UserGreeting() {
  const [mounted, setMounted] = useState(false)
  const user = useUser()

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div>Welcome Guest</div> // Same on server and client
  return <div>Welcome {user?.name || 'Guest'}</div> // Client-only update
}
```

**Evidence source:** [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error) and [LogRocket Hydration Mismatch Guide](https://blog.logrocket.com/resolving-hydration-mismatch-errors-next-js/)

**Confidence:** HIGH - official Next.js documentation and multiple verified sources.

### Pitfall 3: Error Boundaries Don't Catch Event Handler Errors

**What goes wrong:** Developer wraps component in error boundary, assumes all errors are caught. Event handler throws error (e.g., in onClick, onSubmit), app crashes instead of showing fallback UI.

**Why it happens:** Error boundaries only catch errors during:
- Rendering (return statement execution)
- Lifecycle methods (useEffect with synchronous code)
- Constructor (class components)

They do NOT catch:
- Event handlers (onClick, onChange, onSubmit)
- Async code (setTimeout, fetch, promises)
- Errors in error boundary itself

**Warning signs:**
- Error boundary works for data fetching errors but not for button click errors
- White screen after user interaction despite having error boundary
- Errors logged to console but fallback UI not shown

**How to avoid:**
1. **Use try-catch in event handlers** - Manually handle errors in onClick/onSubmit
2. **Set error state for manual error display** - Trigger error boundary by throwing in render after state update
3. **Wrap async operations** - Use try-catch around await statements in event handlers
4. **Log event handler errors** - Add structured logging for debugging

**Example:**
```typescript
// ❌ BAD: Error boundary won't catch this
function FormComponent() {
  const handleSubmit = () => {
    throw new Error('Submission failed') // Not caught by boundary
  }
  return <form onSubmit={handleSubmit}>...</form>
}

// ✅ GOOD: Manual error handling
function FormComponent() {
  const [error, setError] = useState(null)

  const handleSubmit = () => {
    try {
      // submission logic
    } catch (e) {
      setError(e) // Set state, show error in render
      console.error('Form error:', e)
    }
  }

  if (error) throw error // Now error boundary catches it
  return <form onSubmit={handleSubmit}>...</form>
}
```

**Evidence source:** [React Error Boundaries Documentation](https://legacy.reactjs.org/docs/error-boundaries.html) and [Epic React explanation](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l)

**Confidence:** HIGH - official React documentation explicitly lists what error boundaries don't catch.

### Pitfall 4: Missing Dev Mode Checks in Components

**What goes wrong:** Component works in production (with real Convex/Clerk) but crashes at `/demo` route. Demo route requires offline mode but component makes network calls without dev mode check.

**Why it happens:** Project has `NEXT_PUBLIC_DEV_MODE=true` for offline testing but not all components respect this flag. Component assumes Convex/Clerk are always available.

**Warning signs:**
- `/eagle-overseas` route works fine
- `/demo` route shows errors or infinite loading
- Console shows Convex query errors at `/demo`
- Footer doesn't show "Offline Mode" indicator

**How to avoid:**
1. **Check existing components for pattern** - Search for `isDevMode` usage in codebase
2. **Add dev mode check before data fetching** - Return mock data when `process.env.NEXT_PUBLIC_DEV_MODE === 'true'`
3. **Skip query execution in dev mode** - Use conditional query invocation with Convex useQuery
4. **Test /demo route before deployment** - Per CLAUDE.md, ALWAYS test localhost:3000/demo

**Example from project:**
```typescript
// Pattern already exists in src/lib/mock-data.ts and other components
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// In component:
const data = useQuery(api.something.get, isDevMode ? 'skip' : { args })
if (isDevMode) return <Component data={MOCK_DATA} />
```

**Evidence source:** Project's own `CLAUDE.md` and `docs/LOCAL-DEVELOPMENT.md` document dev mode requirements.

**Confidence:** HIGH - project-specific pattern, documented in codebase.

## Code Examples

Verified patterns from official sources:

### Error Boundary Wrapper Component
```typescript
// src/components/error-boundaries/tab-error-boundary.tsx
'use client'

import { ErrorBoundary } from 'react-error-boundary'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TabErrorBoundaryProps {
  children: React.ReactNode
  tabName: string
}

function TabErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Failed to Load Tab</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try Again
      </Button>
    </div>
  )
}

export function TabErrorBoundary({ children, tabName }: TabErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={TabErrorFallback}
      onError={(error, info) => {
        console.error(`[${tabName} Tab Error]`, error)
        console.error('Component stack:', info.componentStack)
      }}
      onReset={() => {
        // Reset any state or refetch data
        console.log(`Resetting ${tabName} tab`)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```
**Source:** [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary)

### Client Wrapper for Auth-Protected Queries
```typescript
// src/app/(dashboard)/[workspace]/your-intern/your-intern-client.tsx
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Loader2 } from 'lucide-react'
import { KnowledgeBaseClient } from './knowledge-base-client'

interface YourInternClientProps {
  workspace: {
    id: string
    name: string
    slug: string
  }
  teamMembers: Array<{
    id: string
    email: string
    full_name: string
  }>
}

export function YourInternClient({ workspace, teamMembers }: YourInternClientProps) {
  // Check dev mode
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Skip query in dev mode, otherwise fetch with auth context
  const ariConfig = useQuery(
    api.ari.getAriConfig,
    isDevMode ? 'skip' : { workspace_id: workspace.id }
  )

  // Dev mode: use mock data
  if (isDevMode) {
    return (
      <KnowledgeBaseClient
        workspace={workspace}
        teamMembers={teamMembers}
        ariConfig={{ enabled: true, bot_name: 'ARI' }}
      />
    )
  }

  // Production: wait for real data
  if (ariConfig === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <KnowledgeBaseClient
      workspace={workspace}
      teamMembers={teamMembers}
      ariConfig={ariConfig}
    />
  )
}
```
**Source:** Project's existing pattern in `src/lib/mock-data.ts` and Convex React docs

### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev -- --inspect"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev", "--inspect"],
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```
**Source:** [Next.js Debugging Documentation](https://nextjs.org/docs/app/guides/debugging)

### Hydration-Safe Component Pattern
```typescript
// For components that must use browser APIs
'use client'

import { useState, useEffect } from 'react'

export function BrowserOnlyComponent() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    setMounted(true)
    // Browser-only code here
    const stored = localStorage.getItem('key')
    setData(stored)
  }, [])

  // Server and first client render return same thing
  if (!mounted) {
    return <div>Loading...</div>
  }

  // After hydration, show real data
  return <div>{data || 'No data'}</div>
}
```
**Source:** [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based error boundaries | react-error-boundary hooks | React 16.8+ (hooks), matured 2024 | Simpler API, better TypeScript support, easier testing |
| console.log debugging | Next.js --inspect debugger | Next.js 16.1 (Dec 2024) | Real breakpoints, variable inspection, step-through debugging |
| Double error logging | React 19 single error log | React 19 (Dec 2024) | Cleaner console, onCaughtError/onUncaughtError hooks |
| Manual SSR checks | dynamic() with ssr: false | Next.js 13+ App Router | Easier to disable SSR per-component, less boilerplate |
| Vercel logs only | OpenTelemetry + traces | Mainstream 2025-2026 | Server component visibility, data fetching monitoring |

**Deprecated/outdated:**
- **Class-based error boundaries** - Still work but hooks API (react-error-boundary) is standard now
- **componentDidCatch with manual state** - React 19 provides onCaughtError root hook
- **Duplicate error logs** - React 19 fixed this automatically
- **next/dynamic without ssr option** - Now default pattern for browser-only components

**React 19 compatibility notes:**
- Radix UI Tabs 1.1.13 (project version) is compatible with React 19
- Some older Radix versions had peer dependency warnings with React 19
- Project is on latest compatible versions (React 19.2.3, Next.js 16.1.1)

## Open Questions

Things that couldn't be fully resolved:

1. **Are there other pages with same SSR auth issue?**
   - What we know: Settings page had same crash, fixed in commit 40fb338 and da5d85c
   - What's unclear: Were these fixes complete? Are there other routes calling auth-protected queries in SSR?
   - Recommendation: Audit all `src/app/(dashboard)/[workspace]/*/page.tsx` files for `fetchQuery` calls and check if queries use auth helpers

2. **Should we make some Convex queries public?**
   - What we know: `api.ari.getAriConfig` requires auth, causing SSR crash
   - What's unclear: Is ARI config sensitive data? Could we remove auth check for read-only config?
   - Recommendation: Keep auth for security unless specific need identified. Client-side fetching is safer pattern.

3. **Does dev mode work correctly for all tabs?**
   - What we know: `/demo` route should work offline with mock data
   - What's unclear: Do PersonaTab, FlowTab, DatabaseTab, ScoringTab, SlotManager all have dev mode checks?
   - Recommendation: Test each tab at `/demo/your-intern` and verify no network errors in console

4. **Should error boundaries reset automatically or require user action?**
   - What we know: Error boundaries can auto-reset or show "Try Again" button
   - What's unclear: What's better UX for this project? Auto-reset might cause infinite loops, manual reset requires user action
   - Recommendation: Start with manual reset (button), add auto-reset with exponential backoff only if needed

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) - Official Next.js 16 features and updates
- [Next.js Debugging Documentation](https://nextjs.org/docs/app/guides/debugging) - Official debugging guide with --inspect patterns
- [Next.js Error.js File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/error) - Error boundary file convention
- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error) - Official hydration error explanations
- [React Error Boundaries Documentation](https://legacy.reactjs.org/docs/error-boundaries.html) - Official React error boundary docs
- [React 19 Blog Post](https://react.dev/blog/2024/12/05/react-19) - Official React 19 release notes
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) - Official library documentation
- Project's own debug notes: `planning/debug/settings-page-crash.md` - Documents exact SSR auth crash

### Secondary (MEDIUM confidence)
- [Understanding Error Boundaries in Next.js](https://dev.to/rajeshkumaryadavdotcom/understanding-error-boundaries-in-nextjs-a-deep-dive-with-examples-fk0) - DEV Community guide
- [Next.js Error Handling Patterns - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/) - Best practices compilation
- [React 19 Resilience: Retry, Suspense & Error Boundaries](https://medium.com/@connect.hashblock/react-19-resilience-retry-suspense-error-boundaries-40ea504b09ed) - React 19 error handling patterns
- [Error Handling in React with react-error-boundary](https://certificates.dev/blog/error-handling-in-react-with-react-error-boundary) - Implementation guide
- [Resolving Hydration Mismatch Errors - LogRocket](https://blog.logrocket.com/resolving-hydration-mismatch-errors-next-js/) - Hydration debugging guide
- [How to Fix Hydration Errors in Next.js](https://dev.to/georgemeka/hydration-error-4n0k) - Common fix patterns
- [Debugging Next.js Like a Pro](https://medium.com/@farihatulmaria/debugging-next-js-like-a-pro-tools-and-techniques-for-production-grade-apps-b8818c66c953) - Production debugging strategies
- [Next.js Debugging Hub - Sentry](https://sentry.io/answers/nextjs/) - Common error solutions
- [Why React Error Boundaries Aren't Just Try/Catch](https://www.epicreact.dev/why-react-error-boundaries-arent-just-try-catch-for-components-i6e2l) - Error boundary limitations

### Tertiary (LOW confidence - requires verification)
- [Radix UI React 19 Compatibility Issue](https://github.com/radix-ui/primitives/issues/3295) - Community report (project uses compatible version)
- [Next.js 16 Migration Guide](https://www.amillionmonkeys.co.uk/blog/migrating-to-nextjs-16-production-guide) - Third-party migration experience

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js/React docs, established patterns
- Architecture: HIGH - Based on project's existing code and official docs
- Pitfalls: HIGH - Directly observed in project codebase, verified with official docs
- SSR auth pattern: HIGH - Documented in project's own debug notes and Convex docs
- Error boundary patterns: HIGH - Official React 19 docs and maintained library
- Hydration patterns: HIGH - Official Next.js documentation
- Dev mode patterns: HIGH - Observed in project's existing implementation

**Research date:** 2026-01-27
**Valid until:** 30 days (stable technologies, Next.js 16 and React 19 mature)
**Next.js version:** 16.1.1 (current as of research date)
**React version:** 19.2.3 (current as of research date)
