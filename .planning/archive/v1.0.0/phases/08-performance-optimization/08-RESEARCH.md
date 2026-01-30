# Phase 8: Performance Optimization - Research

**Researched:** 2026-01-19
**Domain:** Next.js 15 performance, TanStack Query, bundle optimization, loading states
**Confidence:** HIGH

## Summary

This phase focuses on making the my21staff dashboard feel snappy for Eagle's first-client experience. The codebase currently uses vanilla `useState`/`useEffect` for all data fetching with no client-side caching, no loading states (blank screens), and no bundle optimization. The standard approach is:

1. **TanStack Query v5** for client-side caching with stale-while-revalidate patterns
2. **Bundle analysis** using `@next/bundle-analyzer` to identify targets
3. **Dynamic imports** via `next/dynamic` for heavy, rarely-used components
4. **Skeleton loading states** using the existing Skeleton component consistently
5. **Supabase connection pooling** is already handled by Supavisor (no changes needed)

**Primary recommendation:** Install TanStack Query v5, wrap data fetching in useQuery hooks with appropriate staleTime settings, and add skeleton loading states everywhere. Bundle analysis will reveal specific optimization targets.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.x | Client-side data caching, background refetch | Industry standard, 60% API call reduction |
| @next/bundle-analyzer | ^15.x | Bundle visualization and analysis | Official Next.js tool, generates client/server/edge reports |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-loading-skeleton | ^3.x | Pre-built skeleton animations | Alternative to custom skeletons (optional - existing Skeleton works) |

### Already Optimized (No Action Needed)
| Library | Status | Notes |
|---------|--------|-------|
| lucide-react | Auto-optimized | Next.js `optimizePackageImports` handles this by default |
| date-fns | Auto-optimized | Next.js `optimizePackageImports` handles this by default |
| @supabase/ssr | Efficient | Already using proper server/client separation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | SWR | TanStack has better devtools, mutation handling; SWR simpler but less features |
| Custom skeletons | react-loading-skeleton | Package adds ~3kb but provides shimmer animation; existing Skeleton is fine |

**Installation:**
```bash
npm install @tanstack/react-query @next/bundle-analyzer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── providers/
│   └── query-provider.tsx      # TanStack Query provider (new)
├── hooks/
│   ├── use-contacts.ts         # Contact queries (new)
│   ├── use-conversations.ts    # Conversation queries (new)
│   └── use-messages.ts         # Message queries (new)
├── components/
│   └── skeletons/
│       ├── inbox-skeleton.tsx  # Inbox loading state (new)
│       ├── database-skeleton.tsx
│       └── dashboard-skeleton.tsx
└── app/
    └── (dashboard)/
        └── [workspace]/
            └── loading.tsx     # Route-level loading (new)
```

### Pattern 1: TanStack Query Provider Setup
**What:** Single QueryClient instance in a client component provider
**When to use:** Once, at root layout level
**Example:**
```typescript
// src/providers/query-provider.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create client in useState to avoid re-creating on every render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,  // 2 minutes - data considered fresh
        gcTime: 1000 * 60 * 10,    // 10 minutes - keep in cache
        refetchOnWindowFocus: false, // Disable aggressive refetch
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Pattern 2: useQuery for Data Fetching
**What:** Replace useState/useEffect data fetching with useQuery
**When to use:** Any client component that fetches data
**Example:**
```typescript
// src/hooks/use-conversations.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useConversations(workspaceId: string) {
  return useQuery({
    queryKey: ['conversations', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?workspace=${workspaceId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    staleTime: 1000 * 30, // Inbox: 30 seconds fresh (near real-time feel)
  })
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?conversation=${conversationId}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    enabled: !!conversationId, // Only fetch when conversation selected
    staleTime: 1000 * 10, // Messages: 10 seconds (critical real-time)
  })
}
```

### Pattern 3: Optimistic Updates with Mutations
**What:** Update UI immediately, sync to server in background
**When to use:** User actions like status changes, sending messages
**Example:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateContactStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, status }: { contactId: string; status: string }) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ lead_status: status }),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onMutate: async ({ contactId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts'] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(['contacts'])

      // Optimistically update
      queryClient.setQueryData(['contacts'], (old: any) =>
        old?.map((c: any) => c.id === contactId ? { ...c, lead_status: status } : c)
      )

      return { previous }
    },
    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(['contacts'], context?.previous)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
```

### Pattern 4: Skeleton Loading States
**What:** Show content placeholders while data loads
**When to use:** Every page/component that fetches data
**Example:**
```typescript
// src/components/skeletons/inbox-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

export function InboxSkeleton() {
  return (
    <div className="flex h-full">
      {/* Conversation list skeleton */}
      <div className="w-80 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" /> {/* Search */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Message area skeleton */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 w-full" /> {/* Header */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
              <Skeleton className={`h-16 ${i % 2 ? 'w-48' : 'w-64'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Pattern 5: Dynamic Import for Heavy Components
**What:** Lazy-load components that are not needed on initial render
**When to use:** Modals, sheets, charts, PDF generators
**Example:**
```typescript
'use client'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the contact detail sheet (heavy with many sub-components)
const ContactDetailSheet = dynamic(
  () => import('./contact-detail-sheet').then(mod => mod.ContactDetailSheet),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false, // Sheet is client-only
  }
)
```

### Pattern 6: Route-Level Loading with loading.tsx
**What:** Automatic Suspense boundary for route segments
**When to use:** Dashboard routes that fetch server-side data
**Example:**
```typescript
// src/app/(dashboard)/[workspace]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Creating QueryClient outside useState:** Causes re-creation on every render
- **staleTime: 0 everywhere:** Defeats the purpose of caching, causes excessive refetches
- **gcTime: 0:** Causes hydration errors, data removed before render completes
- **Forgetting enabled option:** Queries run even when data not needed
- **Dynamic import in Server Components:** ssr: false not allowed in RSC

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client-side caching | Custom cache with Map/localStorage | TanStack Query | Handles stale-while-revalidate, background refetch, deduplication |
| Optimistic updates | Custom rollback logic | TanStack Query mutations | Built-in rollback, retry, invalidation |
| Loading state management | isLoading flags per component | TanStack Query status + Skeleton | Consistent patterns, automatic state tracking |
| Bundle analysis | Manual inspection | @next/bundle-analyzer | Visual treemap, identifies large chunks |
| Real-time + caching | Custom subscription + cache sync | TanStack Query + Supabase realtime | invalidateQueries on subscription events |

**Key insight:** The codebase currently has 26 files with manual loading state management (Loader2 imports). TanStack Query eliminates this boilerplate with consistent isLoading/isPending states.

## Common Pitfalls

### Pitfall 1: Double Fetching with Supabase + TanStack Query
**What goes wrong:** useQuery fetches, then Supabase realtime subscription also triggers refetch
**Why it happens:** Both systems try to keep data fresh
**How to avoid:** Use staleTime to prevent immediate refetch; invalidate on subscription events instead of refetching in the subscription handler
**Warning signs:** Network tab shows duplicate requests for same data

### Pitfall 2: QueryClient in Component Body
**What goes wrong:** New QueryClient created on every render, cache lost
**Why it happens:** `const queryClient = new QueryClient()` outside useState
**How to avoid:** Always wrap in useState: `const [client] = useState(() => new QueryClient())`
**Warning signs:** Data refetches on every navigation, devtools show empty cache

### Pitfall 3: Missing Error Boundaries
**What goes wrong:** Query error crashes entire app
**Why it happens:** No error handling for failed queries
**How to avoid:** Use useQuery's isError/error states to show friendly messages + retry button
**Warning signs:** Blank screens or full-page errors on network issues

### Pitfall 4: Framer Motion Bundle Size
**What goes wrong:** 34kb added to initial bundle for simple animations
**Why it happens:** Full motion import, not using LazyMotion
**How to avoid:** Use `m` component with `LazyMotion` OR keep animations minimal
**Warning signs:** Bundle analyzer shows large framer-motion chunk

### Pitfall 5: Aggressive refetchOnWindowFocus
**What goes wrong:** Data refetches every time user switches tabs
**Why it happens:** TanStack Query default is true
**How to avoid:** Set `refetchOnWindowFocus: false` in defaultOptions for dashboard apps
**Warning signs:** Unexpected loading states when returning to tab

## Code Examples

Verified patterns from official sources:

### Error Handling with Retry Button
```typescript
// Source: TanStack Query best practices
function ConversationList({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading, isError, error, refetch } = useConversations(workspaceId)

  if (isLoading) return <InboxSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">
          Gagal memuat percakapan
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba lagi
        </Button>
      </div>
    )
  }

  return <div>{/* render conversations */}</div>
}
```

### Combining Real-time with Query Cache
```typescript
// Source: Supabase + TanStack Query integration patterns
function useRealtimeConversations(workspaceId: string) {
  const queryClient = useQueryClient()
  const query = useConversations(workspaceId)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conversations:${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        // Invalidate instead of manually updating cache
        queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, queryClient])

  return query
}
```

### Bundle Analyzer Configuration
```typescript
// Source: Next.js official docs
// next.config.ts
import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

const nextConfig: NextConfig = {
  // existing config...
}

export default withBundleAnalyzer(nextConfig)
```

### staleTime Configuration by Use Case
```typescript
// Source: TanStack Query documentation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Default: 2 minutes
      gcTime: 1000 * 60 * 10,   // Keep unused data 10 minutes
    },
  },
})

// Override per-query based on data freshness needs:
// - Messages (critical real-time): staleTime: 1000 * 10 (10 seconds)
// - Conversations list: staleTime: 1000 * 30 (30 seconds)
// - Contacts/leads: staleTime: 1000 * 60 * 2 (2 minutes, background refresh)
// - Dashboard stats: staleTime: 1000 * 60 * 5 (5 minutes)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SWR | TanStack Query v5 | 2024 | Better TypeScript, mutations, devtools |
| cacheTime option | gcTime option | TanStack v5 | Renamed for clarity |
| Manual useState/useEffect | useQuery hooks | Ongoing | Less boilerplate, consistent patterns |
| modularizeImports | optimizePackageImports | Next.js 13.5 | Automatic, no config needed for common libs |
| Webpack bundle analysis | @next/bundle-analyzer + Turbopack | Next.js 16+ | Built-in Turbopack analyzer (experimental) |

**Deprecated/outdated:**
- `cacheTime`: Renamed to `gcTime` in TanStack Query v5
- `modularizeImports`: Superseded by `optimizePackageImports` (auto for lucide, date-fns)
- Manual Supabase pooling config: Supavisor handles this automatically

## Open Questions

Things that couldn't be fully resolved:

1. **Framer Motion optimization scope**
   - What we know: Using LazyMotion can reduce from 34kb to 4.6kb
   - What's unclear: How much framer-motion is actually used in this codebase
   - Recommendation: Run bundle analyzer first, then decide if worth optimizing

2. **Supabase Cache Helpers**
   - What we know: @supabase-cache-helpers package exists for auto query key generation
   - What's unclear: Whether complexity is worth it for this codebase size
   - Recommendation: Start with manual TanStack Query, evaluate helpers later

3. **Server Component prefetching**
   - What we know: Can prefetch and dehydrate in server components
   - What's unclear: Whether dashboard pages should migrate to this pattern
   - Recommendation: Keep current server-side fetching, add TanStack for client-side only

## Sources

### Primary (HIGH confidence)
- [TanStack Query Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) - Provider setup, hydration patterns
- [TanStack Query Important Defaults](https://tanstack.com/query/v5/docs/react/guides/important-defaults) - staleTime/gcTime best practices
- [Next.js Bundle Analyzer](https://nextjs.org/docs/app/guides/package-bundling) - Installation and usage
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports) - Pre-configured libraries
- [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading) - Dynamic import patterns
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres) - Supavisor configuration

### Secondary (MEDIUM confidence)
- [Motion Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size) - LazyMotion patterns
- [Next.js Streaming Guide](https://nextjs.org/learn/dashboard-app/streaming) - loading.tsx patterns

### Tertiary (LOW confidence)
- Community blog posts on TanStack Query + Supabase integration
- Medium articles on skeleton loading UX

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation verified
- Architecture patterns: HIGH - Based on TanStack/Next.js official guides
- Pitfalls: MEDIUM - Mix of official docs and community experience
- Bundle optimization specifics: MEDIUM - Requires running analyzer on actual codebase

**Research date:** 2026-01-19
**Valid until:** 30 days (stable libraries, patterns unlikely to change)
