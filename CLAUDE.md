# my21staff

WhatsApp CRM + AI team for Indonesian SMEs.

**Target Market:** Indonesia (primary), UAE (expansion)

---
S
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

---

## Quick Links

| Resource | Path |
|----------|------|
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

## Commands

| Command | Purpose |
|---------|---------|
| `/gsd:help` | GSD workflow |
| `/gsd:progress` | Check progress |

---

## Git & Deployment

**🚫 VERCEL DEPLOYMENT BLOCKED - BILLING FREEZE 🚫**

- **NEVER push to GitHub** - triggers Vercel deployment
- **NEVER deploy to Vercel** - billing is too high
- Keep all work **LOCAL ONLY** (localhost:3000)
- Make atomic commits locally as normal
- User will create a fresh Vercel project when ready

```bash
# BLOCKED - DO NOT RUN:
git push origin master   # ← NO
vercel deploy            # ← NO
```

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
