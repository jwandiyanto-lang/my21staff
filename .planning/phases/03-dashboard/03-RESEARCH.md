# Phase 3: Dashboard - Research

**Researched:** 2026-01-24
**Domain:** Convex real-time dashboard with stats, activity feed, infinite scroll
**Confidence:** HIGH

## Summary

This research investigates how to build a real-time CRM dashboard using Convex with Next.js 15. The dashboard needs to display workspace statistics (contact counts, conversation counts, status breakdown), an activity feed with infinite scroll, quick actions, and onboarding state for empty workspaces.

The standard approach for Convex dashboards is to use `useQuery` for real-time stats (which are automatically reactive) and `usePaginatedQuery` for the infinite scroll activity feed. For counting documents, Convex recommends collecting documents and counting client-side for moderate datasets, or using the Aggregate component for high-scale scenarios. Since this is a CRM with moderate contact/conversation volumes per workspace, direct collection with `.collect()` followed by filtering is appropriate.

The codebase already has established patterns: skeleton loading states, Indonesian locale formatting via `date-fns`, and Convex queries with workspace membership checks. The dashboard will follow these patterns.

**Primary recommendation:** Build dashboard with direct Convex queries for stats (avoiding premature optimization with Aggregate component), use `usePaginatedQuery` for activity feed with infinite scroll, and implement skeleton loading via `loading.tsx` convention.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.31.6 | Real-time data layer | Already configured, provides reactive `useQuery` and `usePaginatedQuery` |
| @clerk/nextjs | 6.36.9 | Auth context | User identity for activity attribution |
| date-fns | 4.1.0 | Date formatting | Indonesian locale support, already used in timezone utils |
| lucide-react | 0.562.0 | Icons | Consistent with existing UI |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tabs | 1.1.13 | Time filter tabs | Weekly/Monthly/All time toggle |
| framer-motion | 12.26.2 | Animations | Subtle entry animations for cards |
| shadcn/ui components | latest | UI primitives | Card, Skeleton, Button already available |

### Not Needed
| Library | Why Not |
|---------|---------|
| @convex-dev/aggregate | Overkill for CRM scale; adds complexity; direct queries suffice for < 10k contacts per workspace |
| react-virtualized | Not needed; activity feed uses pagination, not virtualization |
| recharts | No charts in v3.2 dashboard; stats are simple number cards |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/[workspace]/
│   ├── page.tsx              # Dashboard route (server component)
│   └── loading.tsx           # DashboardSkeleton via loading.tsx convention
├── components/dashboard/
│   ├── dashboard-client.tsx  # Client component with useQuery hooks
│   ├── stats-cards.tsx       # Stats grid with time filter
│   ├── activity-feed.tsx     # Infinite scroll activity list
│   ├── quick-actions.tsx     # Action buttons
│   └── onboarding-checklist.tsx # Empty state checklist
convex/
├── dashboard.ts              # Dashboard-specific queries
```

### Pattern 1: Server Component + Client Component Split
**What:** Dashboard page is a server component that validates workspace, then renders a client component for real-time data
**When to use:** All authenticated dashboard pages
**Example:**
```typescript
// app/(dashboard)/[workspace]/page.tsx
// Source: Existing inbox pattern in codebase
import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: workspaceSlug } = await params

  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <DashboardClient workspaceId={workspace._id} />
}
```

### Pattern 2: Real-Time Stats via useQuery
**What:** Use Convex `useQuery` for stats that auto-update when underlying data changes
**When to use:** Dashboard counts, status breakdowns
**Example:**
```typescript
// Source: Convex React docs
// https://docs.convex.dev/client/react
'use client'

import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function StatsCards({ workspaceId, timeFilter }: Props) {
  const stats = useQuery(api.dashboard.getStats, {
    workspace_id: workspaceId,
    time_filter: timeFilter, // 'week' | 'month' | 'all'
  })

  if (stats === undefined) {
    return <StatsCardsSkeleton />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Kontak" value={stats.totalContacts} />
      <StatCard label="Percakapan" value={stats.totalConversations} />
      {/* ... */}
    </div>
  )
}
```

### Pattern 3: Infinite Scroll with usePaginatedQuery
**What:** Use Convex `usePaginatedQuery` for activity feed with "load more" functionality
**When to use:** Activity feed, any list that grows over time
**Example:**
```typescript
// Source: Convex Pagination docs
// https://docs.convex.dev/database/pagination
'use client'

import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function ActivityFeed({ workspaceId }: Props) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.dashboard.listActivity,
    { workspace_id: workspaceId },
    { initialNumItems: 20 }
  )

  return (
    <div className="space-y-2">
      {results.map((activity) => (
        <ActivityItem key={activity._id} activity={activity} />
      ))}
      {status === 'CanLoadMore' && (
        <Button variant="ghost" onClick={() => loadMore(10)}>
          Muat lebih banyak
        </Button>
      )}
    </div>
  )
}
```

### Pattern 4: Conditional Empty State (Onboarding)
**What:** Show onboarding checklist when workspace is empty, auto-hide when steps complete
**When to use:** First-time user experience
**Example:**
```typescript
// Check if all onboarding steps complete
const isOnboarded = stats.totalContacts > 0 &&
                    stats.totalConversations > 0 &&
                    stats.hasKapsoConnected

if (!isOnboarded) {
  return <OnboardingChecklist stats={stats} />
}

return <DashboardContent stats={stats} />
```

### Anti-Patterns to Avoid
- **Polling for stats:** Never use `setInterval` with Convex - `useQuery` is already reactive
- **Multiple separate queries for related data:** Combine into single dashboard query for efficiency
- **Client-side date filtering:** Do filtering server-side in Convex query, not after fetch
- **Blocking navigation for stats:** Use skeleton loading, never show blank screen

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time updates | WebSocket connection management | Convex `useQuery` | Convex handles all subscription logic automatically |
| Infinite scroll | Custom cursor management | `usePaginatedQuery` | Handles cursor stitching, page changes, reactivity |
| Loading states | Custom loading flags | `loading.tsx` + Skeleton | Next.js convention, automatic Suspense boundaries |
| Date formatting | Custom date logic | `date-fns` + existing timezone utils | Already standardized in codebase |
| Time filter state | Context/Redux | URL search params or local state | Simple toggle, no need for global state |

**Key insight:** Convex's reactive queries eliminate the need for most state management around data fetching. The dashboard is essentially a read-only view that auto-updates.

## Common Pitfalls

### Pitfall 1: Overcounting with Multiple Queries
**What goes wrong:** Making separate queries for each stat causes N+1 style inefficiency and inconsistent data snapshots
**Why it happens:** Seems cleaner to have `getContactCount`, `getConversationCount` separately
**How to avoid:** Single `getStats` query that returns all counts in one atomic read
**Warning signs:** Dashboard feels slow, stats update at different times

### Pitfall 2: Forgetting Workspace Scope in Queries
**What goes wrong:** Query returns all data across workspaces instead of current workspace
**Why it happens:** Missing workspace_id filter or index usage
**How to avoid:** Always use `withIndex("by_workspace", ...)` pattern from existing code
**Warning signs:** Counts seem wrong, data from other workspaces appears

### Pitfall 3: Activity Feed Memory Bloat
**What goes wrong:** Infinite scroll loads hundreds of pages, browser memory increases
**Why it happens:** `usePaginatedQuery` keeps all loaded pages subscribed
**How to avoid:** Set reasonable initialNumItems (20), loadMore in batches (10), consider "load more" button over auto-scroll
**Warning signs:** Page slows down after scrolling far

### Pitfall 4: Time Filter Causing Layout Shift
**What goes wrong:** Switching week/month/all causes skeleton flash even though data is similar
**Why it happens:** Query args change, Convex returns undefined while loading new data
**How to avoid:** Keep previous data visible while loading (use `keepPreviousData` pattern or show subtle loading indicator)
**Warning signs:** Jarring flicker when switching tabs

### Pitfall 5: Indonesian Locale Issues
**What goes wrong:** Dates display in English or wrong timezone
**Why it happens:** Forgetting to use existing WIB timezone utilities
**How to avoid:** Always use `formatWIB()` from `@/lib/utils/timezone` for display dates
**Warning signs:** "Jan 24" instead of proper WIB time, wrong time of day

## Code Examples

Verified patterns from official sources and existing codebase:

### Dashboard Stats Query (Convex)
```typescript
// convex/dashboard.ts
// Source: Pattern based on existing contacts.ts and conversations.ts

import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

export const getStats = query({
  args: {
    workspace_id: v.string(),
    time_filter: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const timeFilter = args.time_filter || "all";
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all contacts for workspace
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Get all conversations for workspace
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .collect();

    // Apply time filter
    const filterByTime = (items: { created_at: number }[]) => {
      if (timeFilter === "all") return items;
      const cutoff = timeFilter === "week" ? weekAgo : monthAgo;
      return items.filter(item => item.created_at >= cutoff);
    };

    const filteredContacts = filterByTime(contacts);
    const filteredConversations = filterByTime(conversations);

    // Calculate status breakdown
    const statusBreakdown = filteredContacts.reduce((acc, c) => {
      acc[c.lead_status] = (acc[c.lead_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check onboarding status
    const workspace = await ctx.db.get(args.workspace_id as any);

    return {
      totalContacts: filteredContacts.length,
      totalConversations: filteredConversations.length,
      activeConversations: filteredConversations.filter(c => c.unread_count > 0).length,
      statusBreakdown,
      hasKapsoConnected: !!workspace?.kapso_phone_id,
      hasContacts: contacts.length > 0,
      hasConversations: conversations.length > 0,
    };
  },
});
```

### Activity Feed Query with Pagination
```typescript
// convex/dashboard.ts
// Source: Convex pagination docs

import { paginationOptsValidator } from "convex/server";

export const listActivity = query({
  args: {
    workspace_id: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    // Activity feed combines:
    // 1. Contact creations (form fills)
    // 2. Notes added by users
    // 3. Daily chat summaries (if implemented)

    // For v3.2, start with contact notes as activity
    const notes = await ctx.db
      .query("contactNotes")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspace_id as any))
      .order("desc")
      .paginate(args.paginationOpts);

    // Fetch associated contacts for display
    const contactIds = [...new Set(notes.page.map(n => n.contact_id))];
    const contacts = await Promise.all(
      contactIds.map(id => ctx.db.get(id))
    );
    const contactMap = new Map(contacts.map(c => c ? [c._id, c] : []).filter(([k]) => k));

    return {
      ...notes,
      page: notes.page.map(note => ({
        ...note,
        type: 'note' as const,
        contact: contactMap.get(note.contact_id) || null,
      })),
    };
  },
});
```

### Stats Cards Component
```typescript
// src/components/dashboard/stats-cards.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MessageSquare, UserCheck, UserX } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalContacts: number
    totalConversations: number
    activeConversations: number
    statusBreakdown: Record<string, number>
  }
  timeFilter: 'week' | 'month' | 'all'
  onTimeFilterChange: (filter: 'week' | 'month' | 'all') => void
}

export function StatsCards({ stats, timeFilter, onTimeFilterChange }: StatsCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Statistik</h2>
        <Tabs value={timeFilter} onValueChange={(v) => onTimeFilterChange(v as any)}>
          <TabsList>
            <TabsTrigger value="week">7 Hari</TabsTrigger>
            <TabsTrigger value="month">30 Hari</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Kontak"
          value={stats.totalContacts}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Percakapan"
          value={stats.totalConversations}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Hot Leads"
          value={stats.statusBreakdown.hot || 0}
          icon={<UserCheck className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          title="Cold Leads"
          value={stats.statusBreakdown.cold || 0}
          icon={<UserX className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString('id-ID')}</div>
      </CardContent>
    </Card>
  )
}
```

### Onboarding Checklist Component
```typescript
// src/components/dashboard/onboarding-checklist.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OnboardingChecklistProps {
  workspaceSlug: string
  stats: {
    hasKapsoConnected: boolean
    hasContacts: boolean
    hasConversations: boolean
  }
}

const steps = [
  {
    id: 'connect',
    title: 'Hubungkan WhatsApp',
    description: 'Integrasikan nomor WhatsApp bisnis Anda',
    check: (s: any) => s.hasKapsoConnected,
    href: (slug: string) => `/${slug}/team`, // Settings/team page
  },
  {
    id: 'contacts',
    title: 'Tambah Kontak',
    description: 'Impor atau tambah kontak pertama Anda',
    check: (s: any) => s.hasContacts,
    href: (slug: string) => `/${slug}/database`,
  },
  {
    id: 'conversation',
    title: 'Mulai Percakapan',
    description: 'Kirim pesan pertama ke kontak',
    check: (s: any) => s.hasConversations,
    href: (slug: string) => `/${slug}/inbox`,
  },
]

export function OnboardingChecklist({ workspaceSlug, stats }: OnboardingChecklistProps) {
  const completedCount = steps.filter(s => s.check(stats)).length
  const allComplete = completedCount === steps.length

  if (allComplete) return null // Auto-hide when complete

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mulai dengan my21staff</CardTitle>
        <CardDescription>
          Selesaikan langkah-langkah berikut untuk memulai ({completedCount}/{steps.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => {
          const isComplete = step.check(stats)
          return (
            <Link
              key={step.id}
              href={step.href(workspaceSlug)}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                ${isComplete
                  ? 'bg-green-50 border-green-200'
                  : 'hover:bg-muted/50 border-transparent hover:border-border'
                }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${isComplete ? 'text-green-700' : ''}`}>
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {!isComplete && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for real-time data | Convex reactive queries | Already using | Simpler code, automatic updates |
| Redux/Context for dashboard state | Local component state + useQuery | React 19 patterns | Less boilerplate |
| Separate loading.tsx everywhere | Streaming with Suspense boundaries | Next.js 15 | Better perceived performance |
| Custom infinite scroll | usePaginatedQuery | Convex standard | Handles edge cases automatically |

**Deprecated/outdated:**
- Supabase real-time subscriptions: Removed in v3.0, replaced by Convex
- TanStack Query for dashboard data: Not needed when using Convex directly (TanStack kept for other purposes)

## Open Questions

Things that couldn't be fully resolved:

1. **Activity Feed Event Types**
   - What we know: CONTEXT.md specifies form fills, chat summaries, and notes
   - What's unclear: How to generate "chat summaries" - is this an existing feature or new?
   - Recommendation: Start with contact notes only, add chat summaries in future iteration

2. **Stats Card Visual Design**
   - What we know: User wants simple cards with number + label
   - What's unclear: Exact colors, whether to show trend arrows
   - Recommendation: Follow existing DashboardSkeleton layout, no trend arrows for v3.2

## Sources

### Primary (HIGH confidence)
- Existing codebase: `/convex/*.ts` - Established patterns for workspace-scoped queries
- Existing codebase: `/src/components/skeletons/dashboard-skeleton.tsx` - Loading state pattern
- Existing codebase: `/src/lib/utils/timezone.ts` - Date formatting for Indonesian locale
- [Convex React Docs](https://docs.convex.dev/client/react) - useQuery patterns
- [Convex Pagination Docs](https://docs.convex.dev/database/pagination) - usePaginatedQuery patterns

### Secondary (MEDIUM confidence)
- [Convex Aggregate Component](https://stack.convex.dev/efficient-count-sum-max-with-the-aggregate-component) - Alternative for high-scale counting
- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) - loading.tsx convention
- [CRM Dashboard Best Practices](https://blog.coupler.io/crm-dashboards/) - Dashboard design patterns

### Tertiary (LOW confidence)
- [Onboarding UX Patterns](https://whatfix.com/blog/onboarding-ux/) - Checklist design inspiration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Follows established patterns in codebase (inbox pattern)
- Pitfalls: MEDIUM - Based on Convex documentation and general React patterns
- Code examples: HIGH - Derived from existing codebase patterns

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable stack, established patterns)
