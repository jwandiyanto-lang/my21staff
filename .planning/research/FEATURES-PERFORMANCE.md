# Features Research: Performance Monitoring (v3.0)

**Domain:** CRM application performance instrumentation
**Researched:** 2026-01-20
**Confidence:** HIGH (verified with official Next.js docs, Vercel docs, Supabase docs)

## Executive Summary

Performance monitoring for v3.0 needs to serve two distinct purposes:

1. **Baseline establishment** - Measure current Supabase response times before any changes
2. **A/B comparison** - Side-by-side timing of Convex vs Supabase for the spike endpoint
3. **Ongoing tracking** - Monitor production performance post-optimization

The recommended approach is layered: use Vercel Speed Insights (free) for Web Vitals, implement lightweight custom API timing for database comparison, and skip building a custom dashboard in favor of console/Vercel logging.

---

## Table Stakes

Features required to measure before/after optimization.

### 1. API Request Timing

**What to measure:**
- Total request duration (start to response)
- Database query time (extracted from request handling)
- Query count per request

**How to implement in Next.js 15:**

Create a timing wrapper utility used in API routes:

```typescript
// lib/perf/timing.ts
export function createTimer(label: string) {
  const start = performance.now()
  const queryTimes: number[] = []

  return {
    markQuery(queryMs: number) {
      queryTimes.push(queryMs)
    },
    end() {
      const total = performance.now() - start
      console.log(`[PERF] ${label}: ${total.toFixed(2)}ms (${queryTimes.length} queries, db: ${queryTimes.reduce((a,b) => a+b, 0).toFixed(2)}ms)`)
      return { total, queryCount: queryTimes.length, queryTime: queryTimes }
    }
  }
}
```

Usage in API routes (wrap existing code):

```typescript
// api/contacts/by-phone/route.ts
export async function GET(request: NextRequest) {
  const timer = createTimer('contacts/by-phone')

  // ... existing code ...

  const queryStart = performance.now()
  const { data: contact } = await supabase.from('contacts').select(...)
  timer.markQuery(performance.now() - queryStart)

  // ... more queries ...

  const perf = timer.end()
  return NextResponse.json({ ...data, _perf: perf }) // optional: include timing in response
}
```

**Complexity:** Low
**Rationale:** Essential for measuring baseline and comparing Convex vs Supabase

### 2. Database Query Instrumentation

**What to measure:**
- Individual query execution times
- Query count per page load
- Slow query identification (>100ms)

**Supabase-specific approach:**

Supabase has `pg_stat_statements` enabled by default. For application-level tracking:

```typescript
// lib/supabase/instrumented-client.ts
export function instrumentedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  label: string
): Promise<{ data: T | null; error: PostgrestError | null; duration: number }> {
  const start = performance.now()
  return queryFn().then(result => ({
    ...result,
    duration: performance.now() - start
  }))
}
```

**For Convex comparison:**

Convex dashboard provides built-in timing for every function call (queries, mutations). No custom code needed - timing visible in Convex Dashboard logs.

**Complexity:** Low
**Rationale:** Must compare database layers fairly

### 3. Web Vitals Collection

**What metrics:**
- LCP (Largest Contentful Paint) - target <2.5s
- FCP (First Contentful Paint) - target <1.8s
- TTFB (Time to First Byte) - target <200ms
- CLS (Cumulative Layout Shift) - target <0.1
- INP (Interaction to Next Paint) - target <200ms

**How to capture in production:**

Option A: Vercel Speed Insights (recommended for this milestone)

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

Option B: Custom Web Vitals hook (if need raw data)

```typescript
// components/web-vitals.tsx
'use client'
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console for now, can send to endpoint later
    console.log(`[VITAL] ${metric.name}: ${metric.value} (${metric.rating})`)

    // Optional: send to custom endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/perf/vitals', JSON.stringify(metric))
    }
  })
  return null
}
```

**Complexity:** Very Low (Vercel) / Low (custom)
**Rationale:** Web Vitals directly impact user experience and SEO

---

## Differentiators

Features that enhance decision-making but aren't strictly required.

### 4. Performance Dashboard

**What it would show:**
- P50/P90/P95 response times over time
- Query count trends
- Slow endpoint identification
- Web Vitals trends

**Is it worth building vs using external tools?**

**Recommendation: Do NOT build a custom dashboard for v3.0.**

Reasons:
- Vercel Speed Insights provides Web Vitals dashboard free (1 project on Hobby plan)
- Convex Dashboard provides built-in function timing visualization
- Console logging + Vercel logs provide sufficient data for spike comparison
- Dashboard development time better spent on actual optimization

**When to reconsider:**
- If you need cross-customer performance comparison
- If you need automated alerting on degradation
- If you exceed Vercel free tier limits

**Complexity:** High
**Rationale:** External tools solve this problem; build only if specific needs emerge

### 5. A/B Comparison Tool for Convex vs Supabase

**What it would do:**
- Run same query against both databases
- Compare timing side-by-side
- Log results for analysis

**Implementation approach:**

```typescript
// lib/perf/compare.ts
export async function comparePerformance<T>(
  label: string,
  supabaseQuery: () => Promise<T>,
  convexQuery: () => Promise<T>
): Promise<{
  supabase: { result: T; duration: number }
  convex: { result: T; duration: number }
  winner: 'supabase' | 'convex' | 'tie'
}> {
  const supabaseStart = performance.now()
  const supabaseResult = await supabaseQuery()
  const supabaseDuration = performance.now() - supabaseStart

  const convexStart = performance.now()
  const convexResult = await convexQuery()
  const convexDuration = performance.now() - convexStart

  const diff = Math.abs(supabaseDuration - convexDuration)
  const winner = diff < 10 ? 'tie' : (supabaseDuration < convexDuration ? 'supabase' : 'convex')

  console.log(`[COMPARE] ${label}:
    Supabase: ${supabaseDuration.toFixed(2)}ms
    Convex: ${convexDuration.toFixed(2)}ms
    Winner: ${winner} (${diff.toFixed(2)}ms difference)`)

  return {
    supabase: { result: supabaseResult, duration: supabaseDuration },
    convex: { result: convexResult, duration: convexDuration },
    winner
  }
}
```

**Use case:** During spike phase, run both implementations and log comparison.

**Complexity:** Medium
**Rationale:** Useful for decision gate, but manual comparison via console logs may suffice

### 6. Request Tracing (OpenTelemetry)

**What it provides:**
- Distributed tracing across services
- Automatic span creation for Next.js operations
- Integration with observability platforms

**Setup:**

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel('my21staff')
}
```

**Recommendation:** Defer unless debugging becomes complex. Adds operational overhead for a single-service app.

**Complexity:** Medium (setup), High (understanding traces)
**Rationale:** Overkill for current needs; revisit if multi-service architecture emerges

---

## Anti-Features

Things to explicitly NOT build.

### 1. Custom Analytics Database

**Why avoid:**
- Adds infrastructure complexity
- Requires maintenance and monitoring itself
- Free tools (Vercel, Convex dashboard) provide sufficient data
- Takes time away from actual optimization work

**What to do instead:** Use console.log + Vercel logs + Convex Dashboard

### 2. Real-time Performance Alerting

**Why avoid:**
- Requires alert infrastructure (email/Slack integration)
- Need to define thresholds before understanding baseline
- Premature optimization of monitoring itself

**What to do instead:** Manual review of logs during development; add alerting post-v3.0 if needed

### 3. User Session Recording for Performance

**Why avoid:**
- Privacy considerations (CRM data)
- Significant additional cost (session replay tools)
- Overkill for database comparison spike

**What to do instead:** Focus on aggregate metrics, not individual sessions

### 4. Performance Regression Testing in CI

**Why avoid:**
- Requires stable baseline first
- CI environments differ from production
- Complex to implement reliably

**What to do instead:** Manual before/after comparison for v3.0; revisit for v3.1+

### 5. Custom Percentile Calculation

**Why avoid:**
- Vercel Speed Insights calculates P75/P90/P95 automatically
- Statistical complexity for diminishing returns
- Only useful at scale (thousands of requests)

**What to do instead:** Trust Vercel's percentile calculations

---

## Recommended Approach

Minimal viable monitoring for v3.0 milestone.

### Phase 1: Baseline Capture (Before Spike)

1. **Enable Vercel Speed Insights** (5 min)
   - Add `@vercel/speed-insights` package
   - Add `<SpeedInsights />` to root layout
   - Wait 24-48 hours for baseline data

2. **Add API timing to target endpoint** (30 min)
   - Implement `createTimer` utility
   - Wrap `/api/contacts/by-phone` with timing
   - Log to console (visible in Vercel logs)

3. **Document baseline metrics** (15 min)
   - Screenshot Vercel Speed Insights
   - Record current P95 response times from logs
   - Note current query counts

### Phase 2: Spike Comparison

4. **Implement Convex version** (spike work)
   - Convex Dashboard automatically shows timing
   - No additional instrumentation needed

5. **Run comparison** (1 hour)
   - Call both endpoints with same data
   - Log timing differences
   - Make decision based on data

### Phase 3: Post-Optimization Tracking

6. **Keep monitoring active** (ongoing)
   - Vercel Speed Insights continues tracking
   - API timing remains in place
   - Compare P95 before vs after

### What NOT to do in v3.0

- Do not build a custom dashboard
- Do not set up OpenTelemetry
- Do not implement automated alerting
- Do not add performance regression tests

---

## Tools Reference

### Vercel Speed Insights

**What it provides:**
- Real Experience Score (RES) aggregate
- All Core Web Vitals (LCP, FCP, TTFB, CLS, INP)
- P75/P90/P95/P99 percentiles
- Geographic breakdown
- Device type breakdown (mobile/desktop)
- Route-level breakdown

**Pricing:**
- Hobby (free): 1 project, limited data points per day
- Pro: $10/project/month, higher limits

**Setup:**
```bash
npm install @vercel/speed-insights
```

**Limitations:**
- Hobby tier has daily data point cap (recording pauses when exceeded)
- Only tracks real user metrics (not synthetic/CI)
- Requires JavaScript (not tracked if JS disabled)

### Vercel Logs

**What it provides:**
- All console.log output from API routes
- Request/response metadata
- Error logs with stack traces

**Access:** Vercel Dashboard > Project > Logs

**Cost:** Included in all plans

### Convex Dashboard

**What it provides:**
- Function execution time (every query/mutation/action)
- Cache hit rates
- Scheduler lag
- Error tracking
- Filter by function type

**Access:** https://dashboard.convex.dev/

**Cost:** Included with Convex

### Supabase pg_stat_statements

**What it provides:**
- Query execution statistics
- Most expensive queries
- Query frequency

**Access:** Supabase Dashboard > SQL Editor, or CLI `supabase inspect db outliers`

**Cost:** Included with Supabase

---

## Implementation Priority

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Vercel Speed Insights | P0 | 5 min | High - immediate Web Vitals visibility |
| API timing wrapper | P0 | 30 min | High - baseline for comparison |
| Query instrumentation | P1 | 1 hour | Medium - granular db timing |
| A/B comparison helper | P2 | 2 hours | Medium - nice-to-have for spike |
| OpenTelemetry | P3 | 4 hours | Low - defer |
| Custom dashboard | Skip | 2+ days | None - use existing tools |

---

## Sources

**HIGH Confidence (Official Documentation):**
- [Next.js Instrumentation Guide](https://nextjs.org/docs/app/guides/instrumentation)
- [Next.js Analytics Guide](https://nextjs.org/docs/app/guides/analytics)
- [Next.js instrumentation-client.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client)
- [Vercel Speed Insights Overview](https://vercel.com/docs/speed-insights)
- [Vercel Speed Insights Pricing](https://vercel.com/docs/speed-insights/limits-and-pricing)
- [Supabase pg_stat_statements](https://supabase.com/docs/guides/database/extensions/pg_stat_statements)
- [Supabase Debugging Performance](https://supabase.com/docs/guides/database/debugging-performance)

**MEDIUM Confidence (Verified Community Sources):**
- [Convex + Axiom Integration](https://axiom.co/blog/axiom-convex-integration)
- [web-vitals npm package](https://www.npmjs.com/package/web-vitals)
- [Convex Panel for Dashboard](https://stack.convex.dev/convex-panel-bringing-the-convex-dashboard-dev-environment)

---

*Research completed: 2026-01-20*
*Confidence: HIGH (official documentation verified)*
