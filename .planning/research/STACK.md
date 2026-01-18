# Stack Research: v2.1 Client Launch Ready

**Project:** my21staff
**Researched:** 2026-01-18
**Focus:** Email system, Support ticketing, Performance optimization

---

## Executive Summary

For v2.1, use **Resend** (already installed) with **React Email** for transactional emails - this solves the Vercel SMTP DNS issues by using HTTP API instead of SMTP. For support ticketing, **Tawk.to** provides free unlimited ticketing and live chat - perfect for early-stage SaaS. For performance, leverage Next.js 16's built-in caching with `use cache` directive plus **TanStack Query** with Supabase Cache Helpers for client-side data caching.

---

## Email System

### Recommended: Resend + React Email

| Component | Version | Purpose |
|-----------|---------|---------|
| `resend` | ^6.7.0 | Email API (already installed) |
| `@react-email/components` | ^0.0.31 | Email templates |

**Why Resend over Hostinger SMTP:**
- **Solves DNS issue:** Resend uses HTTP API, not SMTP. No DNS resolution problems on Vercel.
- **Vercel-native:** Built by ex-Vercel engineers, first-class Next.js support
- **React Email integration:** Build emails with JSX/TSX components, not HTML tables
- **Free tier:** 3,000 emails/month (100/day) - sufficient for early traction

**Implementation pattern:**
```typescript
// src/lib/email/send.ts
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: 'My21Staff <noreply@my21staff.com>',
    to,
    subject: 'Selamat datang di my21staff!',
    react: WelcomeEmail({ name }),
  });
}
```

**Pricing (Resend):**
| Tier | Cost | Emails/month | Daily limit |
|------|------|--------------|-------------|
| Free | $0 | 3,000 | 100 |
| Pro | $20 | 50,000 | None |
| Scale | $90 | 100,000 | None |

**Confidence:** HIGH - Resend already installed, verified Vercel compatibility via official docs.

### Alternatives Considered

| Provider | Pros | Cons | When to use |
|----------|------|------|-------------|
| **Postmark** | Best deliverability (22% better than SendGrid), 45-day log retention | $15/month minimum, no generous free tier | When deliverability is critical (e.g., auth emails) |
| **SendGrid** | 100 emails/day free | 7-day log retention, complex pricing | Legacy choice, not recommended for new projects |
| **Nodemailer + Hostinger SMTP** | Already configured | DNS resolution fails on Vercel serverless | Only for local development/testing |

### NOT Recommended

| Approach | Why Avoid |
|----------|-----------|
| **Direct SMTP from Vercel** | DNS resolution issues (EBADNAME), unreliable in serverless |
| **AWS SES directly** | Complex setup, requires AWS account, no React Email support |
| **MailChimp/Mailgun** | Overkill for transactional, designed for marketing campaigns |

---

## Support Ticketing

### Recommended: Tawk.to (Free Tier)

**Why Tawk.to:**
- **100% free:** Unlimited agents, chats, ticketing, and knowledge base
- **Integrated ticketing:** Chat conversations automatically convert to tickets
- **Indonesian support:** Common in Indonesian SME market, familiar to users
- **No seat limits:** Unlike Crisp/Intercom, no per-agent fees

**What's included free:**
- Live chat widget
- Ticketing system
- Knowledge base
- Mobile apps (iOS/Android)
- CRM basics
- Unlimited chat history

**Optional paid add-ons:**
| Add-on | Cost | Need it? |
|--------|------|----------|
| Remove branding | $29/month | Later (brand polish) |
| AI Assist | $29/month | Later (scale) |
| Video + Voice | $29/month | Not needed for CRM support |

**Implementation:**
```html
<!-- Add to src/app/layout.tsx or landing page -->
<Script
  id="tawk-to"
  strategy="lazyOnload"
  dangerouslySetInnerHTML={{
    __html: `
      var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
      (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
      })();
    `
  }}
/>
```

**Confidence:** HIGH - Verified free tier includes ticketing, widely used.

### Alternatives Considered

| Solution | Pros | Cons | When to use |
|----------|------|------|-------------|
| **Crisp** | Beautiful UI, good DX | Ticketing only on $295/month Plus plan | When budget allows premium UX |
| **Chatwoot (self-hosted)** | Open source, full control | Requires server infrastructure | When data sovereignty is critical |
| **Freshdesk** | Free for 2 agents, robust ticketing | Limited free tier, per-agent scaling | When formal SLA/escalation needed |
| **Build custom** | Full control | Development time, maintenance burden | Only if support is core differentiator |

### NOT Recommended

| Approach | Why Avoid |
|----------|-----------|
| **Intercom** | $0.99/resolution AI fees, $39-139/seat minimum, unpredictable costs |
| **Zendesk** | Enterprise pricing, overkill for early-stage SaaS |
| **Crisp Free** | No ticketing on free/basic tiers, misleading pricing |

---

## Performance Optimization

### Database Query Caching: TanStack Query + Supabase Cache Helpers

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.x | Client-side data caching |
| `@supabase-cache-helpers/postgrest-react-query` | ^1.x | Supabase integration |

**Why TanStack Query:**
- Automatic caching and background refetching
- Optimistic updates for smooth UX
- Built-in pagination support
- Reduces Supabase API calls (lower costs)

**Implementation pattern:**
```typescript
// src/lib/query-client.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// src/hooks/use-leads.ts
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query';

export function useLeads(tenantId: string) {
  const supabase = createBrowserClient();
  return useQuery(
    supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
  );
}
```

**Confidence:** HIGH - Official Supabase blog recommends this pattern.

### Server-Side Caching: `use cache` Directive

Next.js 16 introduces the `use cache` directive (replacing `unstable_cache`).

**Enable in next.config.ts:**
```typescript
const nextConfig = {
  experimental: {
    cacheComponents: true,
  },
};
```

**Usage pattern:**
```typescript
// src/lib/data/get-leads.ts
'use cache';
import { unstable_cacheLife, unstable_cacheTag } from 'next/cache';

export async function getLeads(tenantId: string) {
  unstable_cacheLife('minutes'); // Cache for a few minutes
  unstable_cacheTag(`leads-${tenantId}`);

  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId);

  return data;
}

// Invalidate on mutation
import { revalidateTag } from 'next/cache';
revalidateTag(`leads-${tenantId}`);
```

**Confidence:** MEDIUM - `use cache` is stable in Next.js 16 but API may evolve.

### Bundle Size Optimization

| Tool | Version | Purpose |
|------|---------|---------|
| `@next/bundle-analyzer` | ^16.0.1 | Analyze bundle size |
| `next/dynamic` | Built-in | Code splitting |

**Setup bundle analyzer:**
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Run analysis:**
```bash
ANALYZE=true npm run build
```

**Dynamic imports pattern:**
```typescript
// For heavy components not needed on initial load
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(
  () => import('@/components/analytics/chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PDFViewer = dynamic(
  () => import('@/components/proposals/pdf-viewer'),
  { ssr: false }
);
```

**Quick wins for bundle reduction:**
- Use `next/dynamic` for modals, charts, PDF viewers
- Use `optimizePackageImports` for lucide-react icons
- Review large dependencies with bundle analyzer

**Confidence:** HIGH - Official Next.js documentation patterns.

### Edge Caching (Vercel)

Vercel automatically caches static assets at edge locations. For dynamic content:

```typescript
// For API routes that can be cached
export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

**Confidence:** HIGH - Standard Vercel pattern.

---

## Installation Summary

```bash
# Email (React Email components - Resend already installed)
npm install @react-email/components

# Query caching
npm install @tanstack/react-query @supabase-cache-helpers/postgrest-react-query

# Bundle analysis (dev only)
npm install -D @next/bundle-analyzer

# Tawk.to - No npm package, uses embed script
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Email (Resend) | HIGH | Already installed, verified Vercel compatibility, official docs |
| Email (React Email) | HIGH | Official integration with Resend |
| Ticketing (Tawk.to) | HIGH | Verified free tier includes ticketing, widely adopted |
| Query Caching (TanStack) | HIGH | Official Supabase blog recommendation |
| Server Caching (`use cache`) | MEDIUM | Stable in Next.js 16 but API evolving |
| Bundle Analyzer | HIGH | Official Next.js package |

---

## Sources

**Email:**
- [Resend + Next.js](https://resend.com/docs/send-with-nextjs)
- [Resend Pricing](https://resend.com/pricing)
- [Vercel Email Guide](https://vercel.com/kb/guide/sending-emails-from-an-application-on-vercel)
- [Postmark vs SendGrid Comparison](https://postmarkapp.com/compare/sendgrid-alternative)

**Ticketing:**
- [Tawk.to Official](https://www.tawk.to/)
- [Tawk.to Ticketing](https://www.tawk.to/software/ticketing/)
- [Crisp Pricing Analysis](https://www.featurebase.app/blog/crisp-pricing)
- [Chatwoot](https://www.chatwoot.com/)

**Performance:**
- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Supabase + React Query](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers)
- [Next.js Bundle Analyzer](https://nextjs.org/docs/app/guides/package-bundling)
- [Bundle Size Optimization](https://dev.to/maurya-sachin/reducing-javascript-bundle-size-in-nextjs-practical-guide-for-faster-apps-h0)

---

## Roadmap Implications

1. **Email Phase:** Can start immediately - Resend already installed, just add React Email templates
2. **Ticketing Phase:** Quick win - Tawk.to is embed-only, no backend work
3. **Performance Phase:**
   - TanStack Query requires refactoring existing data fetching hooks
   - Bundle analysis should run first to identify quick wins
   - `use cache` can be added incrementally to slow queries

**Phase ordering recommendation:**
1. Email system (Resend templates) - foundation for notifications
2. Tawk.to integration - quick customer support win
3. Bundle analysis - identify optimization targets
4. TanStack Query - refactor data fetching
5. `use cache` - optimize critical server queries
