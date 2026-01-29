# my21staff

WhatsApp CRM + AI team for Indonesian SMEs.

**Target Market:** Indonesia (primary), UAE (expansion)

---

## Folders

| Folder | Purpose |
|--------|---------|
| `business/` | Business knowledge (not code) |
| `business/brand/` | BRAND.md, logos, docs |
| `business/brainstorm/` | Feature ideas, product thinking |
| `business/bots/` | Bot personas for WhatsApp AI |
| `business/clients/` | Client reference files |
| `src/` | Next.js webapp code |
| `public/` | Static assets |
| `.planning/` | GSD workflow |
| `docs/` | Deployment & migration guides |

---

## Quick Links

| Resource | Path |
|----------|------|
| Development Rules | [docs/DEVELOPMENT-RULES.md](docs/DEVELOPMENT-RULES.md) ⚠️ |
| Brand Guidelines | [business/brand/docs/BRAND.md](business/brand/docs/BRAND.md) |
| Business Plan | [business/brand/docs/BUSINESS-PLAN.md](business/brand/docs/BUSINESS-PLAN.md) |
| Pricing | [business/brand/docs/PRICING.md](business/brand/docs/PRICING.md) |
| Project | [.planning/PROJECT.md](.planning/PROJECT.md) |
| Roadmap | [.planning/ROADMAP.md](.planning/ROADMAP.md) |

---

## Kapso is Hidden

**Never mention "Kapso" to customers.** It's our backend tech.

| Don't Say | Say Instead |
|-----------|-------------|
| Kapso | WhatsApp integration |
| Kapso API | Messaging system |
| Bot | Integration |

---

## Tech Stack

```
Next.js 15 + React 19 + TypeScript
Convex (database + real-time)
Clerk (auth + organizations)
Shadcn/ui + Tailwind CSS
Kapso API for WhatsApp
```

---

## ⚠️ Architecture: Database as Single Source of Truth

**THE DATABASE IS THE SOURCE OF EVERYTHING.**

```
Database (Contact List) → Dashboard, Inbox, All Features
```

**Rules:**
- Dashboard MUST read from Database (no separate contact storage)
- Inbox MUST link to Database contacts (no standalone conversations)
- All new features MUST query Database API for contact data
- NEVER create parallel data stores

**Full details:** [docs/DEVELOPMENT-RULES.md](docs/DEVELOPMENT-RULES.md)

---

## Commands

| Command | Purpose |
|---------|---------|
| `/gsd:help` | GSD workflow |
| `/gsd:progress` | Check progress |

---

## TEST LOCAL BEFORE DEPLOYMENT (HARD RULE)

**Always test at `localhost:3000/demo` before any deployment.**

```bash
# 1. Ensure dev mode is enabled
cat .env.local | grep DEV_MODE
# Must show: NEXT_PUBLIC_DEV_MODE=true

# 2. Start dev server
npm run dev

# 3. Test ALL pages work without errors:
http://localhost:3000/          # Landing page
http://localhost:3000/demo      # Dashboard
http://localhost:3000/demo/inbox
http://localhost:3000/demo/database
http://localhost:3000/demo/settings
```

**Why this matters:**
- `/demo` uses **offline mock data** - no Convex/Clerk calls
- Tests UI without internet dependency
- Catches missing dev mode checks before they reach production
- Footer shows "Offline Mode" (orange dot) = working correctly

**If you see errors:** The component is missing a dev mode check. Fix it before proceeding.

---

## Local Development

**Dev mode bypasses Clerk auth and Convex for local testing.**

| Route | Mode | Description |
|-------|------|-------------|
| `/demo` | Offline | Mock data, no network calls |
| `/eagle-overseas` | Online | Real Convex data (needs internet) |

**Key files:**
- `.env.local` has `NEXT_PUBLIC_DEV_MODE=true`
- `src/lib/mock-data.ts` - mock workspace and helper functions
- `src/app/providers.tsx` - skips ClerkProvider in dev mode
- `src/app/api/contacts/route.ts` - returns mock contacts in dev mode

**When adding new features:** Always add dev mode check:
```tsx
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// For Clerk components:
{isDevMode ? <DevFallback /> : <ClerkComponent />}

// For Convex queries:
const data = useQuery(api.something, isDevMode ? 'skip' : { args })
if (isDevMode) return MOCK_DATA
```

**Full guide:** [docs/LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md)

---

## Code Quality & Best Practices

**IMPORTANT:** Before committing code, run:

```bash
npm run pre-commit  # Runs lint + type-check
```

**Common errors and solutions:** [docs/DEVELOPMENT-RULES.md](docs/DEVELOPMENT-RULES.md)

This document contains:
- How to prevent "Cannot access before initialization" errors
- Hydration mismatch solutions
- Pre-commit workflow
- ESLint rules explained

---

## Git & Deployment

**Vercel deployment enabled** - automatic deployments on push to master.

```bash
# Standard workflow:
git add [files]
git commit -m "message"
git push origin master   # Triggers Vercel deployment
```

**Production URL:** TBD (will be set after initial deployment)

---

## Language

| Context | Language |
|---------|----------|
| Code & docs | English |
| App UI | English |

---

## n8n

**URL:** http://100.113.96.25:5678 (via Tailscale)

```bash
ssh 100.113.96.25
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false npx n8n start
```

---

## Logo Script

Generate logo PNGs from SVG sources:

```bash
node business/brand/scripts/generate-logos.js
```

---

*Details in each folder's README or main file.*
