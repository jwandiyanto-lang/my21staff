# Phase 6: Dashboard - Research

**Researched:** 2026-01-31
**Domain:** CRM Dashboard with Real-Time Data, AI Insights, and Analytics
**Confidence:** HIGH

## Summary

This phase builds a CRM dashboard with four core components: Lead List with real-time filtering, AI Insights display, Analytics visualization, and WhatsApp Inbox integration. The standard approach leverages Convex's built-in real-time subscriptions for instant updates, TanStack Table for powerful data table functionality, shadcn/ui components for consistent UI, and the open-source whatsapp-cloud-inbox for messaging.

The architecture follows established CRM dashboard patterns: stat cards for top-level metrics, filterable lead lists with detail panels, and modular card-based layouts. Convex eliminates the need for manual state synchronization since queries automatically update when underlying data changes. TanStack Table provides headless UI flexibility for custom filtering and sorting implementations. The key is avoiding premature optimization—start with simple client-side filtering and only add complexity (virtualization, URL state management) when needed.

**Primary recommendation:** Build a reactive dashboard using Convex's useQuery hook for automatic updates, TanStack Table with shadcn/ui for the lead list, simple stat cards for analytics, and integrate whatsapp-cloud-inbox with custom styling to match the my21staff brand.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | 1.31.6+ | Real-time database + queries | Built-in reactivity, automatic caching, WebSocket subscriptions without manual setup |
| TanStack Table | 8.21.3+ | Headless table UI | Industry standard for complex tables, handles filtering/sorting/pagination with full control |
| shadcn/ui | Latest | UI component library | Pre-built accessible components (Table, Sheet, Card, Badge), built on Radix UI, full customization |
| date-fns | 4.1.0+ | Date formatting | Lightweight, tree-shakeable, built-in relative time formatting (formatDistanceToNow) |
| whatsapp-cloud-inbox | Latest | WhatsApp messaging UI | Official Kapso open-source inbox, MIT license, designed for Cloud API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-window | Latest | List virtualization | Only if rendering 1000+ lead cards simultaneously (likely not needed initially) |
| nuqs | Latest | URL state management | If filter state needs to be shareable via URLs (Claude's discretion) |
| Recharts | Latest | Charts/visualizations | If adding advanced charts beyond stat cards (deferred to future phase) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | AG Grid | AG Grid is feature-rich but proprietary/paid for advanced features; TanStack is free, headless, and flexible |
| date-fns | Day.js | Day.js is smaller (2kb) but date-fns has better TypeScript support and more comprehensive API |
| react-window | react-virtualized | react-virtualized is heavier with more features; react-window is lighter and recommended by react-virtualized maintainers |

**Installation:**
```bash
# Core dependencies already installed (verified in package.json):
# - @tanstack/react-table@^8.21.3
# - date-fns@^4.1.0
# - convex@^1.31.6
# - All shadcn/ui components and Radix UI primitives

# WhatsApp inbox integration (to be installed):
npm install @kapso/whatsapp-cloud-api@^0.1.1
# Note: whatsapp-cloud-inbox is a separate Next.js app, will be integrated as component
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/[workspace]/
│   ├── dashboard/               # Lead List & Analytics page
│   │   ├── page.tsx            # Server component wrapper
│   │   └── dashboard-client.tsx # Client component (already exists)
│   ├── insights/                # AI Insights dedicated page
│   │   ├── page.tsx
│   │   └── insights-client.tsx
│   └── inbox/                   # WhatsApp Inbox page
│       ├── page.tsx
│       └── inbox-client.tsx
├── components/
│   ├── dashboard/
│   │   ├── lead-list.tsx       # Main lead list with TanStack Table
│   │   ├── lead-card.tsx       # Individual lead card component
│   │   ├── lead-detail-sheet.tsx # Slide-out panel for lead details
│   │   ├── lead-filters.tsx    # Filter controls (status, date, search)
│   │   ├── stats-cards.tsx     # Analytics stat cards (already exists)
│   │   └── activity-feed.tsx   # Recent activity (already exists)
│   ├── insights/
│   │   ├── insights-summary.tsx # Daily AI summary display
│   │   ├── action-items.tsx    # Prioritized follow-ups
│   │   └── lead-quality-badges.tsx # Hot/warm/cold indicators
│   └── inbox/
│       └── whatsapp-inbox.tsx  # Customized whatsapp-cloud-inbox
convex/
├── dashboard.ts                 # Dashboard stats query (already exists)
├── contacts.ts                  # Contact queries (already exists)
├── leads.ts                     # Lead-specific queries (already exists)
├── brainInsights.ts            # AI insights queries (already exists)
└── brainSummaries.ts           # Daily summaries (already exists)
```

### Pattern 1: Convex Real-Time Queries
**What:** Use Convex's useQuery hook for automatic reactive updates
**When to use:** All database reads that need to stay in sync with real-time changes
**Example:**
```typescript
// Source: https://docs.convex.dev/functions/query-functions
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function LeadList({ workspaceId }: { workspaceId: Id<'workspaces'> }) {
  // Convex automatically subscribes to changes and re-renders
  const leads = useQuery(api.leads.getLeads, { workspace_id: workspaceId })

  if (leads === undefined) return <LeadListSkeleton />

  return <LeadTable data={leads} />
}

// Convex query function (convex/leads.ts)
export const getLeads = query({
  args: { workspace_id: v.id('workspaces') },
  handler: async (ctx, args) => {
    // Use indexed queries for performance
    return await ctx.db
      .query('contacts')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .collect()
  }
})
```

### Pattern 2: TanStack Table with Filtering
**What:** Headless table with client-side filtering and sorting
**When to use:** Lead lists, contact tables, any data grid with filtering needs
**Example:**
```typescript
// Source: https://tanstack.com/table/v8/docs/guide/column-filtering
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table'

export function LeadList({ data }: { data: Contact[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
  })

  return (
    <>
      <LeadFilters
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
      />
      <LeadTable table={table} />
    </>
  )
}
```

### Pattern 3: Slide-Out Detail Panel with Sheet
**What:** Right-side slide-out panel for lead details while keeping list visible
**When to use:** Viewing details without leaving list context (CRM standard pattern)
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/sheet
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function LeadDetailSheet({ lead, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>{lead.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <ContactInfo contact={lead} />
          <ActivityTimeline messages={lead.messages} />
          <AIInsights insights={lead.insights} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Pattern 4: Multi-Select Filter with Custom Checkbox Dropdown
**What:** Multi-select dropdown for stage filtering (New, Warm, Hot, Converted)
**When to use:** Filtering by multiple categorical values simultaneously
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/dropdown-menu
// Note: Radix UI doesn't have native multi-select, build custom with Popover + Checkbox
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

const STAGES = ['new', 'warm', 'hot', 'converted'] as const

export function StageFilter({ value, onChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Stage {value.length > 0 && `(${value.length})`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]">
        {STAGES.map((stage) => (
          <div key={stage} className="flex items-center space-x-2">
            <Checkbox
              id={stage}
              checked={value.includes(stage)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...value, stage]
                    : value.filter((s) => s !== stage)
                )
              }}
            />
            <label htmlFor={stage}>{capitalize(stage)}</label>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
```

### Pattern 5: Relative Time Display
**What:** Show "last active" as relative time (e.g., "3 hours ago")
**When to use:** Activity timestamps, message times, any user-facing time display
**Example:**
```typescript
// Source: https://date-fns.org/
import { formatDistanceToNow } from 'date-fns'

export function LastActive({ timestamp }: { timestamp: number }) {
  const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true })

  return (
    <time className="text-sm text-muted-foreground" dateTime={new Date(timestamp).toISOString()}>
      {relativeTime}
    </time>
  )
}

// For real-time updates, use interval hook
export function useRelativeTime(timestamp: number) {
  const [time, setTime] = useState(() => formatDistanceToNow(timestamp, { addSuffix: true }))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatDistanceToNow(timestamp, { addSuffix: true }))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [timestamp])

  return time
}
```

### Pattern 6: Stat Cards with Trend Indicators
**What:** Big numbers with conversational highlights and trend arrows
**When to use:** Dashboard overview metrics, KPI displays
**Example:**
```typescript
// Source: CRM dashboard best practices research
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'

export function StatCard({ title, value, change, period }: Props) {
  const isPositive = change > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-sm mt-2">
          {isPositive ? (
            <ArrowUp className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-red-600" />
          )}
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">from {period}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {/* Conversational highlight */}
          {change > 0 ? `Up ${change}% from last ${period}` : `Down ${Math.abs(change)}% from last ${period}`}
        </p>
      </CardContent>
    </Card>
  )
}
```

### Anti-Patterns to Avoid
- **Don't filter in code after querying:** Use Convex's `.withIndex()` or `.filter()` in queries instead of filtering arrays in React. Database-level filtering is more efficient and maintains pagination integrity.
- **Don't manually manage WebSocket subscriptions:** Convex handles this automatically via useQuery. Manual subscription management introduces bugs and complexity.
- **Don't use array indices as keys in lists:** Use stable IDs (like Convex's `_id`) to prevent re-render issues when items are added/removed.
- **Don't lift all state to top level:** Keep filter state local to components where used. Only lift to URL params if sharing/bookmarking is required (Claude's discretion).
- **Don't start with virtualization:** Client-side filtering with 100-500 items performs fine. Only add react-window if rendering 1000+ items and profiling shows performance issues.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WhatsApp messaging UI | Custom message components with read receipts, typing indicators, media handling | whatsapp-cloud-inbox (MIT) | Official Kapso component handles 24-hour window enforcement, template parameters, interactive buttons, and familiar WhatsApp UI patterns |
| Multi-select dropdown | Custom dropdown with checkboxes | Radix Popover + Checkbox components | Accessibility (keyboard navigation, screen readers), focus management, and proper ARIA attributes are complex to implement correctly |
| Data table filtering | Custom filter inputs + manual array filtering | TanStack Table's filtering APIs | Built-in support for column filters, global search, fuzzy matching, faceted values, and filter functions that maintain pagination |
| Relative time formatting | Manual date math with setInterval | date-fns formatDistanceToNow | Handles edge cases (pluralization, localization, timezone edge cases) and provides consistent formatting |
| Real-time subscriptions | Manual WebSocket connection + state sync | Convex useQuery hook | Automatic dependency tracking, caching, consistency guarantees, and error handling without manual subscription lifecycle management |
| Toast notifications | Custom toast component | shadcn/ui Sonner (already installed) | Handles stacking, auto-dismiss, action buttons, variants, and accessibility out of the box |

**Key insight:** Dashboard UIs have many subtle edge cases (loading states, error handling, accessibility, real-time sync). Using battle-tested libraries prevents bugs and speeds up development. The time saved not debugging custom implementations is significant.

## Common Pitfalls

### Pitfall 1: Excessive Re-renders with Large Lists
**What goes wrong:** Rendering 100+ lead cards with complex components causes UI lag and poor interaction responsiveness.
**Why it happens:** Every state change (filter update, sort change) triggers re-render of all rows. Without memoization, child components re-render unnecessarily.
**How to avoid:**
- Use React.memo on LeadCard components to prevent re-renders when props don't change
- Keep filter state local to table component, not lifted to page level
- Use TanStack Table's built-in filtering rather than filtering in React code
- Profile with React DevTools before adding virtualization (likely not needed for <500 items)
**Warning signs:** UI feels sluggish when typing in search box, delay between filter selection and table update, high CPU usage in browser DevTools during filtering

### Pitfall 2: Non-Deterministic Convex Queries
**What goes wrong:** Queries fail or behave inconsistently, returning different results for same arguments.
**Why it happens:** Including non-deterministic operations in query functions (Math.random(), Date.now(), fetch() to external APIs).
**How to avoid:**
- Never call external APIs from queries (use actions instead)
- Use ctx.db for all data reads
- Pass timestamps as arguments rather than calling Date.now() inside queries
- Review Convex's deterministic requirements: https://docs.convex.dev/functions/query-functions
**Warning signs:** "Query function must be deterministic" errors in console, inconsistent query results, queries not updating reactively

### Pitfall 3: Circular Imports in Convex Schema
**What goes wrong:** Validators return undefined, schema fails to compile, TypeScript errors about undefined types.
**Why it happens:** schema.ts imports from files that import from schema.ts (circular dependency).
**How to avoid:**
- Define all validators directly in schema.ts for new tables
- If splitting large schemas, use separate validator files that don't import schema.ts
- Check import chain: schema.ts should be a leaf node, not importing other business logic
**Warning signs:** undefined validators, TypeScript "Cannot access before initialization" errors, schema compilation failures

### Pitfall 4: Color-Only Status Indicators
**What goes wrong:** Users with color blindness or low contrast displays can't distinguish lead stages.
**Why it happens:** Relying solely on color (red/orange/blue badges) without text labels or icons.
**How to avoid:**
- Always include text label in badges: "Hot", "Warm", "Cold" (not just color)
- Ensure 4.5:1 contrast ratio for text on colored backgrounds (WCAG 2.1 AA)
- Use icons alongside color for additional distinction (🔥 for Hot, ⚡ for Warm, ❄️ for Cold)
- Test with browser DevTools color blindness simulator
**Warning signs:** User feedback about difficulty distinguishing stages, accessibility audit failures, low contrast warnings

### Pitfall 5: Ignoring Loading and Error States
**What goes wrong:** App shows blank screen or crashes when Convex query is loading or fails.
**Why it happens:** Not handling undefined (loading) or error states from useQuery.
**How to avoid:**
```typescript
const leads = useQuery(api.leads.getLeads, { workspace_id })

if (leads === undefined) {
  return <LeadListSkeleton /> // Loading state
}

if (leads === null) {
  return <ErrorMessage /> // Error state
}

return <LeadTable data={leads} /> // Success state
```
- Always check for undefined before rendering data
- Use skeleton screens (already implemented: DashboardSkeleton) during loading
- Handle errors gracefully with user-friendly messages
**Warning signs:** "Cannot read property of undefined" errors, blank screens during loading, crashes on network issues

### Pitfall 6: Missing Dev Mode Checks
**What goes wrong:** Local development fails because components try to call Clerk or Convex when NEXT_PUBLIC_DEV_MODE=true.
**Why it happens:** New components don't check isDevMode before making queries or using auth.
**How to avoid:**
- Always add dev mode check for new queries:
```typescript
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const data = useQuery(api.something, isDevMode ? 'skip' : { args })
if (isDevMode) return MOCK_DATA
```
- Test all new pages at /demo route before deployment
- Add mock data to src/lib/mock-data.ts for dev mode
**Warning signs:** localhost:3000/demo shows errors, "Convex client not initialized" warnings in dev mode, failing local tests

## Code Examples

Verified patterns from official sources:

### Example 1: Real-Time Lead List with Filtering
```typescript
// Source: TanStack Table + Convex patterns
'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { LeadFilters } from './lead-filters'
import { LeadTable } from './lead-table'
import { LeadDetailSheet } from './lead-detail-sheet'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function LeadList({ workspaceId }: { workspaceId: Id<'workspaces'> }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedLead, setSelectedLead] = useState<Contact | null>(null)

  // Convex automatically updates when data changes
  const leads = useQuery(
    api.contacts.list,
    isDevMode ? 'skip' : { workspace_id: workspaceId }
  )

  const data = isDevMode ? MOCK_LEADS : (leads ?? [])

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <LeadNameCell lead={row.original} />,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => <StageBadge stage={row.original.stage} />,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Active',
      cell: ({ row }) => <RelativeTime timestamp={row.original.lastActive} />,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
  })

  return (
    <>
      <LeadFilters
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        table={table}
      />
      <LeadTable table={table} onRowClick={setSelectedLead} />
      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </>
  )
}
```

### Example 2: Convex Query with Pagination (For Future Optimization)
```typescript
// Source: https://docs.convex.dev/database/pagination
import { query } from './_generated/server'
import { v } from 'convex/values'

export const getLeadsPaginated = query({
  args: {
    workspace_id: v.id('workspaces'),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    // Use indexed query for performance
    const results = await ctx.db
      .query('contacts')
      .withIndex('by_workspace', (q) => q.eq('workspace_id', args.workspace_id))
      .order('desc') // Most recent first
      .paginate(args.paginationOpts)

    return {
      page: results.page,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    }
  },
})
```

### Example 3: Stage Badge with Accessibility
```typescript
// Source: shadcn/ui Badge component + WCAG best practices
import { Badge } from '@/components/ui/badge'
import { cva, type VariantProps } from 'class-variance-authority'

const stageBadgeVariants = cva(
  'inline-flex items-center gap-1',
  {
    variants: {
      stage: {
        new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        warm: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        hot: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
    },
  }
)

const STAGE_LABELS = {
  new: { label: 'New', icon: '🆕' },
  warm: { label: 'Warm', icon: '⚡' },
  hot: { label: 'Hot', icon: '🔥' },
  converted: { label: 'Converted', icon: '✅' },
}

export function StageBadge({ stage }: { stage: keyof typeof STAGE_LABELS }) {
  const config = STAGE_LABELS[stage]

  return (
    <Badge className={stageBadgeVariants({ stage })}>
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  )
}
```

### Example 4: AI Insights Display
```typescript
// Source: CRM dashboard patterns + existing brainInsights schema
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export function AIInsights({ workspaceId }: { workspaceId: Id<'workspaces'> }) {
  const insights = useQuery(
    api.brainInsights.getLatestInsights,
    isDevMode ? 'skip' : { workspace_id: workspaceId }
  )

  if (!insights) return <InsightsSkeleton />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Generated {formatDistanceToNow(insights.generated_at, { addSuffix: true })}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{insights.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.action_items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <span className="text-sm">{item.description}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual WebSocket management + Redux | Convex useQuery with built-in subscriptions | Convex release (2021+) | Eliminates boilerplate, automatic caching, consistency guarantees |
| react-virtualized for all lists | Client-side filtering first, react-window only when needed | 2023-2024 | Simpler code, better performance for typical list sizes (100-500 items) |
| Custom table components | TanStack Table headless UI | TanStack Table v8 (2022+) | Full control over UI, built-in filtering/sorting/pagination, better TypeScript support |
| Class-based styled-components | Tailwind CSS + CVA for variants | 2023+ trend | Faster development, smaller bundle size, better IDE autocomplete |
| useState for URL params | nuqs or useSearchParams | React Router v6.4+ (2022+) | Shareable URLs, better back/forward navigation, persistent state |
| Chart.js for all visualizations | Stat cards + simple metrics (charts deferred) | Modern CRM UX (2024+) | Faster load times, more readable at-a-glance insights, less cognitive overhead |

**Deprecated/outdated:**
- **react-virtualized**: Still works but react-window is the recommended successor by the same author (lighter, faster)
- **Redux for real-time data**: Convex eliminates need for Redux in this domain (queries auto-update)
- **Manual filtering with .filter()**: TanStack Table's built-in filtering is more efficient and feature-rich
- **Complex chart libraries by default**: Modern dashboards favor stat cards and conversational metrics over dense visualizations

## Open Questions

Things that couldn't be fully resolved:

1. **WhatsApp Inbox Integration Approach**
   - What we know: whatsapp-cloud-inbox is a separate Next.js app (TypeScript 95.4%, CSS 4.0%)
   - What's unclear: Whether to integrate as embedded iframe, copy components into codebase, or run as separate service
   - Recommendation: Start by copying relevant components into src/components/inbox/ and customizing styling. Maintains control over branding and avoids iframe limitations. Check MIT license compliance.

2. **Filter Placement (Claude's Discretion)**
   - What we know: CRM best practices suggest top bar or collapsible sidebar
   - What's unclear: Which fits better with existing my21staff design (black/white minimalist)
   - Recommendation: Top bar above lead list (horizontal layout) for desktop-first design. Matches existing dashboard layout patterns in dashboard-client.tsx.

3. **URL State Management for Filters**
   - What we know: nuqs provides type-safe URL state, useSearchParams is built into React Router
   - What's unclear: Whether shareable filter URLs are important enough to add complexity
   - Recommendation: Start without URL state (localStorage for persistence if needed). Add nuqs later if users request shareable filtered views. Keep it simple initially.

4. **Virtualization Necessity**
   - What we know: react-window recommended for 1000+ items, client-side filtering handles 100-500 items well
   - What's unclear: Expected typical lead count per workspace
   - Recommendation: Don't add virtualization initially. Profile performance after implementation. Only add if React DevTools shows >50ms render times during filtering.

5. **Action Recommendation Format (Claude's Discretion)**
   - What we know: Options are priority list, kanban board, or calendar view
   - What's unclear: Which format best matches workflow
   - Recommendation: Start with simple priority list (numbered 1-N with descriptions). Easiest to implement and scan. Can enhance to kanban/calendar in future phase if needed.

## Sources

### Primary (HIGH confidence)
- [Convex Query Functions Documentation](https://docs.convex.dev/functions/query-functions) - Query patterns, deterministic requirements
- [Convex Real-Time Documentation](https://docs.convex.dev/realtime) - Reactive subscriptions, consistency model
- [Convex Pagination Documentation](https://docs.convex.dev/database/pagination) - PaginationOptions, usePaginatedQuery
- [TanStack Table Column Filtering Guide](https://tanstack.com/table/v8/docs/guide/column-filtering) - Filter implementation, faceting
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - Setup with TanStack Table
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/sheet) - Slide-out panel patterns
- [shadcn/ui Badge Component](https://ui.shadcn.com/docs/components/badge) - Variant customization
- [date-fns formatDistanceToNow](https://date-fns.org/) - Relative time formatting
- [gokapso/whatsapp-cloud-inbox GitHub](https://github.com/gokapso/whatsapp-cloud-inbox) - Features, setup, MIT license

### Secondary (MEDIUM confidence)
- [10 Essential Tips for New Convex Developers](https://www.schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - Common pitfalls, best practices
- [CRM Dashboard Best Practices 2026](https://www.aufaitux.com/blog/crm-ux-design-best-practices/) - Layout patterns, customization
- [Dashboard Design Best Practices](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) - Stat cards, modular design
- [React Performance Optimization 2025-2026](https://www.debugbear.com/blog/react-rerenders) - Re-render prevention, memoization
- [React Dashboard Performance](https://medium.com/@sosohappy/react-rendering-bottleneck-how-i-cut-re-renders-by-60-in-a-complex-dashboard-ed14d5891c72) - Virtualization, profiling
- [WCAG Accessibility for Color](https://developerux.com/2025/07/28/best-practices-for-accessible-color-contrast-in-ux/) - Contrast ratios, color blindness
- [React Chart Libraries 2026](https://embeddable.com/blog/react-chart-libraries) - Unovis, Recharts, Chart.js comparison
- [react-window vs react-virtualized](https://blog.logrocket.com/react-virtualized-vs-react-window/) - Performance comparison
- [nuqs Type-Safe Search Params](https://nuqs.dev/) - URL state management for React
- [TanStack Table Sorting Guide](https://tanstack.com/table/v8/docs/guide/sorting) - Multi-column sorting

### Tertiary (LOW confidence - flagged for validation)
- WebSearch results on Radix UI multi-select patterns (no native support, need custom implementation)
- WebSearch results on Next.js 15 environment variable testing (manual setup required, not well-documented)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official documentation, versions confirmed in package.json
- Architecture: HIGH - Patterns sourced from official Convex and TanStack docs, validated with existing codebase structure
- Pitfalls: HIGH - Common issues verified through official Convex error documentation and developer community reports
- WhatsApp inbox integration: MEDIUM - Repository found and MIT license confirmed, but integration approach needs validation during implementation
- Chart library selection: MEDIUM - Multiple valid options exist, stat cards approach is design decision rather than technical requirement

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (60 days - relatively stable technologies, Convex and TanStack Table are mature)

---

*This research informs the planning phase for building the CRM dashboard with real-time lead management, AI insights display, analytics visualization, and WhatsApp inbox integration.*
