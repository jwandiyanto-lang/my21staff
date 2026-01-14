# my21staff

WhatsApp CRM SaaS for Indonesian SMEs (UMKM). Connect WhatsApp to Facebook/Meta Ads for lead generation.

**Target Market:** Indonesia (primary), UAE (expansion)

---

## Core Features

| Feature | Description |
|---------|-------------|
| Database CRM | Manage contacts & leads with status tracking |
| Kapso Messaging | Send & receive WhatsApp messages from CRM |
| Website Manager | Articles, webinars, public pages for lead gen |

---

## Free: Human Support (24/7)

Real humans available around the clock for product support:

| Support | For Feature |
|---------|-------------|
| Website Support | Website Manager setup, content help |
| Kapso/Bot Support | WhatsApp messaging, automation |
| Lead Management Support | CRM setup, data organization |

Contact via WhatsApp or in-app chat. Response within minutes.

---

## Paid: AI Staff (Telegram Bots)

4 AI departments to help run your business. Each handles a core business function.

| Department | What It Handles |
|------------|-----------------|
| **Accounting** | Finance, bookkeeping, invoices, reports |
| **Marketing** | Content, ads, social media, campaigns |
| **Customer Success** | FAQ, follow-up, retention, feedback |
| **Tech Support** | my21staff product help, integrations |

Each department has multiple specialists (totaling 21 staff) accessible via Telegram.

---

## Tech Stack

```
Next.js 15 + React 19 + TypeScript
Supabase (PostgreSQL + Auth + RLS)
Shadcn/ui + Tailwind CSS
Shadcn animation components (not Framer Motion)
Kapso API for WhatsApp
```

---

## Kapso.ai (WhatsApp Integration)

WhatsApp automation platform for messaging, conversations, and customer interactions.

**Capabilities:**
- Messaging: Text, media, buttons, lists, templates
- Conversations: History, status, routing
- Advanced: WhatsApp Flows, voice calls, broadcasts
- Integration: REST API, TypeScript SDK, Webhooks

**SDK:**
```bash
npm install @kapso/whatsapp-cloud-api
```

**Docs:**
- Introduction: https://docs.kapso.ai/docs/introduction
- API Reference: https://docs.kapso.ai/api

---

## Design System

See **[BRAND.md](./BRAND.md)** for complete brand guideline.

| Context | Palette | Font |
|---------|---------|------|
| CRM App | Peach + Forest Green (#2D4B3E) | Plus Jakarta Sans |
| Landing Page | Sage + Orange (#F7931A) | Plus Jakarta Sans + Inter |

**Logo:** my**21**staff — "21" highlighted in Orange

**Style:** Minimalist, clean, professional

---

## Folder Structure

```
src/app/          → Next.js App Router pages
src/components/   → UI components
src/lib/          → Utilities, Supabase client
.planning/        → GSD workflow files
```

---

## Language Policy

| Context | Language |
|---------|----------|
| Code & docs | English |
| App UI (CRM & Website) | Bahasa Indonesia |

WhatsApp-first approach — the dominant messaging platform in Indonesia.

---

## Commands

| Command | Purpose |
|---------|---------|
| `/gsd:help` | GSD workflow commands |
| `/gsd:progress` | Check project progress |

---

## Key Files

- `BRAND.md` — Brand guideline (colors, fonts, logo)
- `.planning/PROJECT.md` — Project overview & decisions
- `.planning/ROADMAP.md` — Development roadmap
- `src/app/page.tsx` — Landing page
- `src/app/globals.css` — Design tokens
- `src/lib/supabase/` — Database client & types

---

*Last updated: 2026-01-14*
