# Production Deployment Stack

**Project:** my21staff v3.5
**Researched:** 2026-01-28
**Overall confidence:** HIGH

## Executive Summary

my21staff is production-ready for deployment to a custom domain (not Vercel due to billing freeze). The application uses Next.js 15 with Clerk authentication and Convex database — both services already deployed and configured. Deployment requires:

1. **Domain pointing to manual hosting** (Docker, cloud provider, or self-hosted)
2. **Environment variable configuration** for production Clerk instance, Convex credentials, and API keys
3. **Disabling dev mode** (NEXT_PUBLIC_DEV_MODE must be false in production)
4. **Webhook configuration** for Kapso incoming messages and Clerk user sync events
5. **Build optimization** and build secrets management

The validated tech stack is already in place. No new libraries needed. Focus is on environment setup and deployment mechanics.

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1.1 | Web framework & routing | Validates in v3.4 localhost. API routes handle webhooks (Kapso, Clerk, n8n). Server actions for workspace mutations. |
| React | 19.2.3 | UI framework | Validated in v3.4. Shipping with Error Boundaries and Suspense for resilience. |
| TypeScript | ^5 | Type safety | Complete typed codebase (47,745 lines). Production safety. |

### Authentication & Authorization
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Clerk | 6.36.9 (production keys) | User auth & organizations | Live instance with Eagle Overseas org. JWT template configured. svix webhooks for user sync. |
| Next.js Middleware | 16.1.1 | Route protection | Clerk middleware guards dashboard routes. Public routes: `/`, `/sign-in`, `/sign-up`, `/pricing`, `/articles`, webhooks. |

### Database & Real-time
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Convex | 1.31.6 | Database + subscriptions | Production deployment: `intent-otter-212.convex.cloud`. Schema complete with RLS. Achieves 37ms P95 (25.4x faster than Supabase). |
| Convex HTTP Actions | 1.31.6 | Webhook endpoints | Kapso webhooks, n8n lead creation, Clerk user sync — all via `convex/http.ts` |

### UI & Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Shadcn/ui | latest | Component library | Pre-built, styled components for dashboard. Dark mode via next-themes. |
| Tailwind CSS | 4 | Utility CSS | Single source of styling. Validated in v3.4. |
| Framer Motion | 12.26.2 | Animations | Smooth UI transitions (inbox, compose). |

### External Services
| Service | API Version | Purpose | Status |
|---------|------------|---------|--------|
| Kapso (WhatsApp) | v1 (Meta/WhatsApp Business API) | Incoming & outgoing messages | Webhooks: `POST /api/webhook/kapso`, `GET /api/webhook/kapso` for verification |
| Resend | v1 (HTTP) | Transactional email | Invitation emails, support notifications. RESEND_API_KEY required. |
| Grok (x.ai) | OpenAI-compatible | AI responses | GROK_API_KEY required. |
| Sea-Lion (Ollama) | Local HTTP | AI fallback | OLLAMA_BASE_URL = http://100.113.96.25:11434 (optional) |

### Supporting Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.90.19 | Data caching (stale-while-revalidate) |
| @tanstack/react-table | 8.21.3 | Table rendering (contacts, leads, tickets) |
| libphonenumber-js | 1.12.34 | Indonesian E.164 phone normalization |
| date-fns | 4.1.0 | WIB timezone (UTC+7), appointment scheduling |
| zod | 4.3.5 | Schema validation (forms, API requests) |
| react-hook-form | 7.71.1 | Form state management |
| papaparse | 5.5.3 | CSV import/export |
| sonner | 2.0.7 | Toast notifications (user feedback) |

## Environment Variables (Production) 

### CRITICAL: Must Set Before Deployment

**Dev Mode - MUST BE FALSE:**
```
NEXT_PUBLIC_DEV_MODE=false
```

**Clerk Authentication (Production Keys):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_JWT_ISSUER_DOMAIN=https://my21staff.clerk.accounts.dev
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Convex (Production):**
```
NEXT_PUBLIC_CONVEX_URL=https://intent-otter-212.convex.cloud
CONVEX_DEPLOYMENT=prod:intent-otter-212
CONVEX_DEPLOY_KEY=prod:intent-otter-212|...
```

**Kapso WhatsApp:**
```
KAPSO_API_KEY=your-kapso-api-key
KAPSO_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_KAPSO_PHONE_NUMBER=+1234567890
```

**Encryption:**
```
ENCRYPTION_KEY=<openssl rand -base64 32>
```

**Email & AI:**
```
RESEND_API_KEY=re_...
GROK_API_KEY=xai-...
SEALION_API_KEY=sk-... (optional)
OLLAMA_BASE_URL=http://100.113.96.25:11434 (optional)
```

**Deployment:**
```
NODE_ENV=production
NEXTAUTH_URL=https://my21staff.com
```

### Environment Variable Safety Rules

1. **NEVER commit secrets to git** — use platform secrets (Vercel, GitHub, Docker)
2. **ENCRYPTION_KEY must be unique per environment** — generate fresh
3. **CLERK_WEBHOOK_SECRET enables Clerk→Convex sync** — missing = broken user registration
4. **NEXT_PUBLIC_ variables are public** (browser) — safe for Clerk publishable key
5. **All other variables are private** (server-only) — never exposed to browser
6. **NEXT_PUBLIC_DEV_MODE=false is the production safety gate**

## Deployment Architecture

### Build & Deploy Flow
```
Source Code (git)
    ↓
npm run build (generates .next/)
    ↓
Docker build OR direct platform deploy
    ↓
Environment variables injected
    ↓
npm start (NODE_ENV=production)
    ↓
Next.js listens on port 3000
    ↓
Reverse proxy/load balancer → your domain
    ↓
HTTPS TLS termination at edge
```

### Webhook Flow in Production

**Incoming WhatsApp Message:**
```
Kapso detects message
    ↓
POST https://my21staff.com/api/webhook/kapso (signature verified)
    ↓
Next.js API route processes message
    ↓
ConvexHttpClient creates Contact/Conversation/Message records
    ↓
ARI processor queries Grok for bot response
    ↓
Kapso API sends reply to WhatsApp
    ↓
User sees bot response
```

**Clerk User Sync:**
```
Clerk event (user.created, user.updated, user.deleted)
    ↓
POST to Convex webhook (signed with svix, verified)
    ↓
Convex creates/updates user record
    ↓
App can read user on next login
```

## Build & Deployment Steps

### Pre-Deployment Checklist

- [ ] **Disable dev mode**
  ```bash
  grep NEXT_PUBLIC_DEV_MODE .env.production
  # Must output: false or empty
  ```

- [ ] **Verify all required env vars**
  ```bash
  for var in CLERK_SECRET_KEY CONVEX_DEPLOYMENT ENCRYPTION_KEY KAPSO_WEBHOOK_SECRET RESEND_API_KEY GROK_API_KEY; do
    [ -z "${!var}" ] && echo "MISSING: $var"
  done
  ```

- [ ] **Test build locally**
  ```bash
  npm run build  # Must succeed
  npm start
  # Visit http://localhost:3000/sign-in — should show Clerk login, NOT mock data
  ```

- [ ] **Verify webhook endpoints**
  ```bash
  curl https://my21staff.com/api/webhook/kapso
  curl -X POST https://my21staff.com/api/webhook/kapso
  ```

- [ ] **Clerk configuration**
  - Dashboard: https://dashboard.clerk.com → my21staff → Production
  - Add domain to Allowed Origins
  - Copy Webhook Signing Secret to CLERK_WEBHOOK_SECRET

- [ ] **Kapso webhook config**
  - Update webhook URL: `https://my21staff.com/api/webhook/kapso`
  - Copy signing secret to KAPSO_WEBHOOK_SECRET
  - Test GET verification

- [ ] **Verify Convex accessibility**
  ```bash
  curl https://intent-otter-212.convex.cloud
  ```

### Build Command

```bash
npm run build
```

Generates `.next/static/`, `.next/server/`, `.next/standalone/`

### Start Command

```bash
NODE_ENV=production npm start
```

Starts server on port 3000. Use with Docker, Railway, Render, or reverse proxy.

### Docker Example

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY .next .next/
COPY public public/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Deployment Platform Options

| Platform | Effort | Cost | Notes |
|----------|--------|------|-------|
| Vercel | Low | ~$0-20/mo | Best for Next.js, but blocked (billing freeze) |
| Railway | Low | ~$5-50/mo | Simple, good for single instance |
| Render | Low | ~$7-50/mo | Similar to Railway, free tier available |
| Fly.io | Low | $0-50/mo | Global edge, excellent for WhatsApp scale |
| Docker + Self-Hosted | High | Server cost | Full control, most complex |
| AWS Lambda + CloudFront | High | ~$10-200/mo | Serverless, infinite scale |
| Google Cloud Run | Medium | $0-50/mo | Serverless, pay-per-request |

**Recommendation:** Use **Railway** or **Render** for simplicity.

## Security Checklist

- [ ] **Secrets in platform, not in code**
  - [ ] ENCRYPTION_KEY → Platform secrets
  - [ ] CLERK_SECRET_KEY → Platform secrets
  - [ ] CONVEX_DEPLOY_KEY → Platform secrets
  - [ ] KAPSO_WEBHOOK_SECRET → Platform secrets
  - [ ] RESEND_API_KEY → Platform secrets
  - [ ] GROK_API_KEY → Platform secrets

- [ ] **HTTPS enforced**
  - [ ] Domain uses HTTPS
  - [ ] Webhooks accept HTTPS only
  - [ ] Clerk production keys require HTTPS

- [ ] **Webhook signature verification enabled**
  - [ ] Kapso: `verifyKapsoSignature()` validates every message
  - [ ] Clerk: `verifySvixSignature()` validates events

- [ ] **Dev mode disabled**
  - [ ] `NEXT_PUBLIC_DEV_MODE=false`
  - [ ] Mock data only on localhost
  - [ ] Clerk auth enforced for dashboard

- [ ] **Middleware authentication active**
  - [ ] `middleware.ts` checks localhost only
  - [ ] Production domain protected by Clerk

- [ ] **Security headers set** (in `next.config.ts`)
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin

## Troubleshooting

### "Production Keys are only allowed for domain..."
- Clerk keys restricted to domain
- **Fix:** Verify NEXTAUTH_URL matches your domain (case-sensitive)

### "Invalid signature" on Kapso webhook
- Webhook signature validation failed
- **Fix:** Verify KAPSO_WEBHOOK_SECRET matches Kapso dashboard

### "CLERK_WEBHOOK_SECRET not set"
- Clerk user sync disabled
- **Fix:** Get secret from https://dashboard.clerk.com → Webhooks

### "No workspace for phone_number_id"
- Webhook received but workspace not found
- **Fix:** Verify Eagle Overseas workspace has kapso_phone_id set

### "ENCRYPTION_KEY not set"
- Can't decrypt workspace credentials
- **Fix:** Generate: `openssl rand -base64 32`, set in platform secrets

### Messages not appearing
- Check: Webhook logs, Convex mutations, Frontend subscriptions
- **Fix:** Enable debug logs, test with curl

## Ready for Production?

- [ ] All env vars set (use .env.example)
- [ ] Dev mode explicitly disabled
- [ ] Build succeeds: `npm run build`
- [ ] Production build starts: `npm start`
- [ ] Clerk domain whitelisted
- [ ] Kapso webhook URL updated
- [ ] Clerk webhook secret configured
- [ ] All secrets in platform (not git)
- [ ] HTTPS enforced
- [ ] Health check passes
- [ ] First user can signup/login
- [ ] First message triggers bot response

## Sources

**Verified in Codebase:**
- Project codebase (47,745 lines TypeScript)
- Current Clerk instance (production keys exist)
- Convex deployment (intent-otter-212.convex.cloud active)
- Kapso webhooks (v3.4 localhost verified)
- Environment variables (.env.example complete)

---

**Last Updated:** 2026-01-28 (v3.5 production deployment research)
