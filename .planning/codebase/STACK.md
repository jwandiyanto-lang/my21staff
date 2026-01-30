# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- TypeScript 5.x - Full codebase, frontend and backend
- JavaScript (es2017 target) - Build output

**Secondary:**
- JSON - Configuration
- CSS/Tailwind - Styling via Tailwind CSS 4
- Shell - Deployment scripts (`scripts/deploy-convex.js`)

## Runtime

**Environment:**
- Node.js - Version not pinned (.nvmrc not configured)
- Vercel Edge Runtime (for serverless functions)

**Package Manager:**
- npm - Latest compatible version
- Lockfile: `package-lock.json` (committed)

## Frameworks

**Core:**
- Next.js 16.1.1 - React framework with App Router, API routes, middleware
- React 19.2.3 - Component framework with hooks
- React DOM 19.2.3 - DOM rendering

**State & Data:**
- Convex 1.31.6 - Backend-as-a-service database with real-time subscriptions
- TanStack React Query 5.90.19 - Client-side query management and caching
- TanStack React Table 8.21.3 - Data table component library

**UI & Styling:**
- Shadcn/ui - Component library (Radix UI primitives + Tailwind CSS)
- Tailwind CSS 4 - Utility-first CSS framework
- Tailwind Merge 3.4.0 - Class name deduplication
- Radix UI (multiple primitives) - Accessible component primitives:
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-radio-group`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-slider`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-tooltip`
- Lucide React 0.562.0 - Icon library
- Framer Motion 12.26.2 - Animation and motion library
- Class Variance Authority 0.7.1 - Component variant management

**Authentication:**
- Clerk 6.36.9 (`@clerk/nextjs`) - User authentication, SSO, organization management
- Convex Auth 0.0.90 - JWT token validation between Clerk and Convex

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- `@hookform/resolvers` 5.2.2 - Zod validation integration
- Zod 4.3.5 - TypeScript-first schema validation

**Date & Formatting:**
- Date-fns 4.1.0 - Date manipulation and formatting
- Libphonenumber-js 1.12.34 - Phone number parsing, validation, and formatting
- PapaParse 5.5.3 - CSV parsing and generation

**UI Components & Effects:**
- Sonner 2.0.7 - Toast notification system
- React Error Boundary 6.1.0 - Error handling component
- React Textarea Autosize 8.5.9 - Auto-expanding textarea
- React Day Picker 9.13.0 - Date picker component

**Email:**
- Resend 6.7.0 - Transactional email service
- `@react-email/components` 1.0.4 - React email component library

**AI & LLM:**
- OpenAI 6.16.0 - Base SDK for Grok API (uses OpenAI-compatible endpoint)

**Utilities:**
- clsx 2.1.1 - Conditional CSS class management
- dotenv 17.2.3 - Environment variable management
- Next Themes 0.4.6 - Dark/light mode management

**Monitoring & Observability:**
- Vercel Speed Insights 1.3.1 - Performance monitoring
- `@vercel/functions` 3.3.6 - Vercel serverless utilities (for `waitUntil`)

## Build & Development Tools

**Build:**
- Webpack 5 (via Next.js) - Module bundling
- Next.js Bundle Analyzer - Build size analysis (optional via `ANALYZE=true`)

**Code Quality:**
- ESLint 9.x - Linting with `eslint-config-next` 16.1.1
- TypeScript 5.x - Type checking (`tsc --noEmit`)

**Testing:**
- Jest 30.2.0 - Test runner
- ts-jest 29.4.6 - TypeScript support for Jest

**Development Utilities:**
- tsx 4.21.0 - TypeScript execution for scripts
- Sharp 0.34.5 - Image processing (for Next.js image optimization)
- NGrok 5.0.0-beta.2 - Webhook tunneling for local development
- `@ngrok/ngrok` 1.7.0 - NGrok Node.js SDK

**Dependencies:**
- `@types/node` 20.19.30 - Node.js type definitions
- `@types/react` 19 - React type definitions
- `@types/react-dom` 19 - React DOM type definitions
- `@types/jest` 30.0.0 - Jest type definitions
- `@types/papaparse` 5.5.2 - PapaParse type definitions

**Tailwind:**
- `@tailwindcss/postcss` 4 - PostCSS plugin for Tailwind
- tw-animate-css 1.4.0 - Animation utilities

## Configuration

**TypeScript:**
- `tsconfig.json` - Strict type checking disabled (`strict: false`), target ES2017
- Path aliases: `@/*` → `./src/*`, `convex/_generated/*`
- Next.js plugin enabled

**Next.js:**
- `next.config.ts` - Bundle analyzer, security headers configuration
- Security headers:
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-XSS-Protection: 1; mode=block`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (disable browser features)

**Convex:**
- `convex.json` - Project config: `intent-otter-212` (team blank)
- Auth config: Clerk JWT integration via `convex/auth.config.ts`
- Schema: `convex/schema.ts` - Table definitions with indexes

**Vercel:**
- `vercel.json` - Cron job configuration for appointment reminders
- Cron: `/api/cron/appointment-reminders` runs every 15 minutes (0,15,30,45)
- Auto-deployment on `master` branch push

## Environment Configuration

**Required Environment Variables:**

Database:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (e.g., `https://your-deployment.convex.cloud`)
- `CONVEX_DEPLOYMENT` - Convex deployment identifier (e.g., `dev:your-deployment`)

Authentication:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key (exposed in browser)
- `CLERK_SECRET_KEY` - Clerk secret key (server-side only)
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer domain for Convex validation
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Redirect URL for sign in (default: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Redirect URL for sign up (default: `/sign-up`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` - Post-login redirect (default: `/dashboard`)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` - Post-signup redirect (default: `/dashboard`)

Messaging (Kapso/WhatsApp):
- `KAPSO_API_KEY` - Kapso WhatsApp API key
- `KAPSO_WEBHOOK_SECRET` - Webhook signature secret for verifying incoming Kapso webhooks
- `NEXT_PUBLIC_KAPSO_PHONE_NUMBER` - WhatsApp business phone number (displayed in UI)

Encryption:
- `ENCRYPTION_KEY` - Base64-encoded 32-byte key for encrypting workspace credentials (generate with `openssl rand -base64 32`)

Email:
- `RESEND_API_KEY` - Resend transactional email API key (prefix `re_`)

AI Models:
- `GROK_API_KEY` - xAI Grok API key (prefix `xai-`)
- `SEALION_URL` - Sea-Lion AI via Ollama endpoint (default: `http://100.113.96.25:11434/v1` - Tailscale private)
- `OLLAMA_BASE_URL` - Alternative Ollama endpoint (optional)

Development:
- `NEXT_PUBLIC_DEV_MODE` - Dev mode flag (`true`/`false`, default `false`) - bypasses Clerk/Convex for local testing
- `NGROK_AUTHTOKEN` - NGrok authentication token for webhook tunneling (optional)

**Environment Files:**
- `.env.local` - Development variables (gitignored)
- `.env.local.example` - Template for `.env.local`
- `.env.production` - Production overrides
- `.env.production.local` - Local production overrides (gitignored)
- `.env.vercel.current` - Vercel current environment (gitignored)
- `.env.vercel.production` - Vercel production environment (gitignored)

**Secrets Storage:**
- Environment variables passed via Vercel dashboard for production
- `.env.local` for local development (never committed)

## Platform Requirements

**Development:**
- Node.js (version not pinned, recommend 18+)
- npm with local `node_modules`
- Clerk account with published keys
- Convex project deployed

**Production:**
- Vercel deployment (primary host)
- Clerk cloud (authentication)
- Convex cloud (database)
- Kapso/Meta WhatsApp Business API access
- Resend account (email)
- Grok API (xAI) for AI features
- Ollama/Sea-Lion (via Tailscale for private network AI)

**Deployment:**
- Auto-deploys on push to `master` branch
- Vercel environment variables configured in dashboard
- Cron jobs configured in `vercel.json`

## Build & Development Scripts

```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run deploy           # Deploy Convex schema
npm run lint             # Run ESLint, fail on warnings
npm run lint:fix         # Fix ESLint violations
npm run type-check       # TypeScript type checking
npm run pre-commit       # Run lint + type-check
npm run test             # Run Jest tests
npm run analyze          # Bundle size analysis (requires ANALYZE=true)
```

---

*Stack analysis: 2026-01-30*
