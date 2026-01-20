# Phase 1: Instrumentation & Baseline - Research

**Researched:** 2026-01-20
**Domain:** Performance monitoring, Web Vitals, API timing, Supabase query tracking
**Confidence:** HIGH

## Summary

This phase establishes performance instrumentation before any optimization work begins. The goal is to measure current performance so we can quantify improvement after optimization.

The standard approach involves:
1. **Vercel Speed Insights** for client-side Web Vitals (LCP, INP, CLS, FCP, TTFB)
2. **API timing wrappers** using higher-order functions to log response times
3. **Query counting** via a custom instrumented Supabase client wrapper
4. **Baseline metrics** extracted from Vercel logs after 24-48 hours of production traffic

**Primary recommendation:** Install `@vercel/speed-insights`, create a `withTiming` higher-order function for API routes, and wrap Supabase client calls in a counting wrapper. Baseline metrics document should capture P50/P95/P99 for the two critical endpoints.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @vercel/speed-insights | ^1.x | Web Vitals tracking (LCP, INP, CLS) | Official Vercel package, auto-integrated with dashboard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| console.log/console.time | Built-in | API timing and query count logging | Simple, no dependencies, viewable in Vercel logs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Console logging | Sentry Performance | Sentry adds full tracing with spans, but costs more and adds complexity for simple baseline |
| Console logging | OpenTelemetry | Industry standard but overkill for establishing baseline |
| Manual query count | Sentry supabaseIntegration | Auto-tracks queries but requires Sentry subscription |

**Installation:**
```bash
npm install @vercel/speed-insights
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── instrumentation/
│   │   ├── with-timing.ts       # API timing HOF (new)
│   │   └── instrumented-supabase.ts  # Query-counting wrapper (new)
│   └── supabase/
│       └── server.ts            # Existing - will import instrumented client
├── app/
│   ├── layout.tsx               # Add SpeedInsights component
│   └── api/
│       ├── contacts/by-phone/route.ts  # Wrap with withTiming
│       └── conversations/route.ts      # Wrap with withTiming
└── docs/
    └── BASELINE.md              # P50/P95/P99 baseline document (new)
```

### Pattern 1: Vercel Speed Insights Setup
**What:** Client-side Web Vitals tracking component
**When to use:** Add once to root layout
**Example:**
```typescript
// src/app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Configuration options:**
- `sampleRate` - Percentage of events sent (default: 1.0 = 100%)
- `debug` - Auto-enabled in development
- `beforeSend` - Filter/modify events before sending
- `route` - Auto-detected in Next.js App Router

### Pattern 2: API Timing Wrapper (Higher-Order Function)
**What:** HOF that wraps route handlers to log response time
**When to use:** Wrap any API route handler to measure performance
**Example:**
```typescript
// src/lib/instrumentation/with-timing.ts
import { NextRequest, NextResponse } from 'next/server'

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withTiming(routeName: string, handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const start = performance.now()

    try {
      const response = await handler(request, context)
      const duration = performance.now() - start

      console.log(`[API] ${routeName} ${request.method} - ${duration.toFixed(0)}ms - ${response.status}`)

      return response
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[API] ${routeName} ${request.method} - ${duration.toFixed(0)}ms - ERROR`, error)
      throw error
    }
  }
}
```

**Usage in route handler:**
```typescript
// src/app/api/contacts/by-phone/route.ts
import { withTiming } from '@/lib/instrumentation/with-timing'

async function getHandler(request: NextRequest) {
  // existing implementation
}

export const GET = withTiming('/api/contacts/by-phone', getHandler)
```

### Pattern 3: Query-Counting Supabase Wrapper
**What:** Wrapper around Supabase client that counts queries per request
**When to use:** In instrumented API routes to detect N+1 queries
**Example:**
```typescript
// src/lib/instrumentation/instrumented-supabase.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export interface QueryMetrics {
  queryCount: number
  totalTime: number
  queries: { table: string; duration: number }[]
}

export function createInstrumentedClient(
  client: SupabaseClient<Database>,
  metrics: QueryMetrics
) {
  // Wrap the from() method to intercept queries
  const originalFrom = client.from.bind(client)

  client.from = ((table: string) => {
    const queryBuilder = originalFrom(table)
    const queryStart = performance.now()

    // Wrap select/insert/update/delete to track execution
    const wrapMethod = <T>(method: (...args: any[]) => T, methodName: string) => {
      return (...args: any[]) => {
        const result = method(...args)

        // If result is a promise (final execution), track it
        if (result && typeof (result as any).then === 'function') {
          return (result as any).then((data: any) => {
            const duration = performance.now() - queryStart
            metrics.queryCount++
            metrics.totalTime += duration
            metrics.queries.push({ table, duration })
            return data
          })
        }

        return result
      }
    }

    return queryBuilder
  }) as typeof client.from

  return client
}
```

**Simplified approach (recommended for baseline):**
```typescript
// Simpler: Manual logging at each query site
const queryStart = performance.now()
const { data, error } = await supabase.from('contacts').select('...')
console.log(`[Query] contacts - ${(performance.now() - queryStart).toFixed(0)}ms`)
```

### Pattern 4: Request Context for Query Counting
**What:** Track total queries per HTTP request
**When to use:** In instrumented API routes
**Example:**
```typescript
// In the API route handler:
export const GET = withTiming('/api/contacts/by-phone', async (request) => {
  const metrics = { queryCount: 0, totalTime: 0, queries: [] }

  // ... perform queries, incrementing metrics.queryCount ...

  console.log(`[API] /api/contacts/by-phone - ${metrics.queryCount} queries, ${metrics.totalTime.toFixed(0)}ms DB time`)

  return NextResponse.json(data)
})
```

### Anti-Patterns to Avoid
- **Logging in production without sampling:** High-traffic APIs should use sampleRate or conditional logging
- **Wrapping Supabase globally:** Only instrument the specific routes we're measuring
- **Blocking on logging:** Don't await log calls; let them fire-and-forget
- **Over-engineering:** For baseline, simple console.log is sufficient; fancy solutions come later

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Vitals collection | Custom PerformanceObserver | @vercel/speed-insights | Handles edge cases, auto-routes, integrates with dashboard |
| Percentile calculation | Manual P50/P95/P99 math | Vercel Speed Insights dashboard | Already calculates percentiles from collected data |
| Full APM/tracing | Custom span tracking | Sentry or Datadog (later) | For baseline, logs are sufficient; APM comes after |

**Key insight:** The goal is establishing a baseline quickly, not building a complete observability stack. Simple console logs + Vercel Speed Insights give us enough data to measure improvement.

## Common Pitfalls

### Pitfall 1: Not Enabling Speed Insights in Dashboard
**What goes wrong:** SpeedInsights component added but no data appears
**Why it happens:** Must enable in Vercel dashboard before data collection starts
**How to avoid:** Enable Speed Insights in Vercel Dashboard > Project > Speed Insights > Enable BEFORE deploying the component
**Warning signs:** `/_vercel/speed-insights/script.js` returns 404

### Pitfall 2: Forgetting to Redeploy After Enabling
**What goes wrong:** Speed Insights enabled but still no data
**Why it happens:** Enabling adds new routes at `/_vercel/speed-insights/*` which require redeployment
**How to avoid:** Redeploy after enabling in dashboard
**Warning signs:** Feature enabled in UI but routes don't exist

### Pitfall 3: Measuring in Development Instead of Production
**What goes wrong:** Baseline metrics are unrealistic (too fast or too slow)
**Why it happens:** Local dev has no network latency, cold starts differ, DB is closer
**How to avoid:** Only establish baseline from PRODUCTION data with real users
**Warning signs:** Dev shows 50ms but production shows 3000ms

### Pitfall 4: Insufficient Sample Size for Percentiles
**What goes wrong:** P95/P99 metrics are unstable or misleading
**Why it happens:** Need 100+ data points for stable P99, 20+ for stable P50
**How to avoid:** Wait 24-48 hours of production traffic before establishing baseline
**Warning signs:** Percentiles change dramatically hour-to-hour

### Pitfall 5: Not Logging Query Count Per Request
**What goes wrong:** Can't identify N+1 query problems
**Why it happens:** Total query time logged but not count
**How to avoid:** Log both count and total time: "5 queries, 2340ms total"
**Warning signs:** High response time but can't tell if it's 1 slow query or 10 fast ones

## Code Examples

Verified patterns from official sources:

### Vercel Speed Insights Integration
```typescript
// Source: https://vercel.com/docs/speed-insights/quickstart
// src/app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Complete Timing Wrapper with Query Counting
```typescript
// src/lib/instrumentation/with-timing.ts
import { NextRequest, NextResponse } from 'next/server'

interface RequestMetrics {
  queryCount: number
  queries: string[]
}

// Create metrics object for each request
export function createRequestMetrics(): RequestMetrics {
  return { queryCount: 0, queries: [] }
}

// Log a query execution
export function logQuery(metrics: RequestMetrics, table: string, durationMs: number) {
  metrics.queryCount++
  metrics.queries.push(`${table}:${durationMs.toFixed(0)}ms`)
}

// HOF wrapper
type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withTiming(routeName: string, handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const start = performance.now()

    try {
      const response = await handler(request, context)
      const duration = performance.now() - start

      // Log format: [API] /api/contacts/by-phone GET - 234ms - 200
      console.log(
        `[API] ${routeName} ${request.method} - ${duration.toFixed(0)}ms - ${response.status}`
      )

      return response
    } catch (error) {
      const duration = performance.now() - start
      console.error(
        `[API] ${routeName} ${request.method} - ${duration.toFixed(0)}ms - ERROR:`,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }
}
```

### Instrumented API Route Example
```typescript
// src/app/api/contacts/by-phone/route.ts (instrumented version)
import { withTiming, createRequestMetrics, logQuery } from '@/lib/instrumentation/with-timing'

async function getHandler(request: NextRequest) {
  const metrics = createRequestMetrics()

  // ... validation code ...

  const supabase = createApiAdminClient()

  // Query 1: Contact lookup
  let queryStart = performance.now()
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, name, phone, email, lead_status, lead_score, tags, metadata, created_at')
    .eq('workspace_id', workspaceId)
    .eq('phone', normalizedPhone)
    .single()
  logQuery(metrics, 'contacts', performance.now() - queryStart)

  // Query 2: Notes
  queryStart = performance.now()
  const { data: notes } = await supabase
    .from('contact_notes')
    .select('content, created_at')
    .eq('contact_id', contact.id)
    .order('created_at', { ascending: false })
    .limit(5)
  logQuery(metrics, 'contact_notes', performance.now() - queryStart)

  // ... more queries ...

  // Log query summary
  console.log(
    `[Queries] /api/contacts/by-phone - ${metrics.queryCount} queries: ${metrics.queries.join(', ')}`
  )

  return NextResponse.json(crmContext)
}

export const GET = withTiming('/api/contacts/by-phone', getHandler)
```

### Baseline Document Template
```markdown
<!-- docs/BASELINE.md -->
# Performance Baseline

**Captured:** 2026-01-XX
**Environment:** Production (https://my21staff.com)
**Traffic sample:** 48 hours, ~XXX requests

## Web Vitals (from Vercel Speed Insights)

| Metric | P50 | P75 | P95 | P99 | Target |
|--------|-----|-----|-----|-----|--------|
| LCP | X.Xs | X.Xs | X.Xs | X.Xs | <2.5s |
| INP | Xms | Xms | Xms | Xms | <200ms |
| CLS | X.XX | X.XX | X.XX | X.XX | <0.1 |
| FCP | X.Xs | X.Xs | X.Xs | X.Xs | <1.8s |
| TTFB | Xms | Xms | Xms | Xms | <800ms |

## API Response Times

### /api/contacts/by-phone
| Percentile | Response Time | Query Count |
|------------|---------------|-------------|
| P50 | XXXms | X queries |
| P95 | XXXms | X queries |
| P99 | XXXms | X queries |

### /api/conversations
| Percentile | Response Time | Query Count |
|------------|---------------|-------------|
| P50 | XXXms | X queries |
| P95 | XXXms | X queries |
| P99 | XXXms | X queries |

## Observations

- [ ] Observation 1
- [ ] Observation 2

## Next Steps

Based on this baseline, optimization targets are:
- Target 1
- Target 2
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Analytics for vitals | Vercel Speed Insights | 2024 | Native integration, no sampling cost |
| FID (First Input Delay) | INP (Interaction to Next Paint) | March 2024 | INP replaced FID as Core Web Vital |
| Manual performance.now() | web-vitals library | Ongoing | Used internally by Speed Insights |
| Custom percentile calculation | Dashboard analytics | Ongoing | P75/P90/P95/P99 built into Speed Insights UI |

**Deprecated/outdated:**
- `FID`: While still tracked, INP is now the primary responsiveness metric (Google Core Web Vitals change March 2024)
- `@vercel/analytics`: Separate from Speed Insights; Speed Insights is for performance, Analytics is for traffic

## Open Questions

Things that couldn't be fully resolved:

1. **Vercel Log Retention and Export**
   - What we know: Vercel logs are available in dashboard and via CLI
   - What's unclear: Exact retention period for Pro plan, best way to export for P50/P95/P99 calculation
   - Recommendation: Use Vercel CLI `vercel logs` to export, or manually sample from dashboard

2. **Query-Level Timing Accuracy**
   - What we know: `performance.now()` gives sub-millisecond accuracy
   - What's unclear: Whether Supabase client adds measurable overhead to reported times
   - Recommendation: Measure total request time AND sum of query times to identify overhead

3. **Baseline Document Automation**
   - What we know: Speed Insights dashboard shows percentiles
   - What's unclear: Whether there's an API to export Speed Insights data programmatically
   - Recommendation: Manual capture from dashboard for initial baseline; investigate API later

## Sources

### Primary (HIGH confidence)
- [Vercel Speed Insights Quickstart](https://vercel.com/docs/speed-insights/quickstart) - Setup steps
- [Vercel Speed Insights Package](https://vercel.com/docs/speed-insights/package) - Configuration options
- [Vercel Speed Insights Metrics](https://vercel.com/docs/speed-insights/metrics) - Web Vitals definitions, P75/P90/P95/P99 percentiles
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - HOF patterns

### Secondary (MEDIUM confidence)
- [Logging Route Handlers in Next.js 14](https://omiid.me/notebook/29/logging-route-handler-responses-in-next-js-14) - withLogging HOF pattern
- [Next.js Discussion #34420](https://github.com/vercel/next.js/discussions/34420) - Request timing middleware patterns
- [Sentry Supabase Integration](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/supabase/) - Query tracking approach (for reference)

### Tertiary (LOW confidence)
- Community patterns for Supabase query counting (no standard approach exists)

## Metadata

**Confidence breakdown:**
- Vercel Speed Insights setup: HIGH - Official documentation verified
- API timing wrapper: HIGH - Standard HOF pattern, verified across multiple sources
- Query counting: MEDIUM - No standard library; custom implementation required
- Baseline document format: MEDIUM - Based on industry practice, not official standard

**Research date:** 2026-01-20
**Valid until:** 60 days (stable patterns, unlikely to change)
