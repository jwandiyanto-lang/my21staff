# my21staff

**No system = Can't grow. I help you build that system.**

WhatsApp CRM + AI team for Indonesian SMEs. Not just software — guidance from real business experience.

**Target Market:** Indonesia (primary), UAE (expansion)

---

## The Message

| Element | Copy |
|---------|------|
| **Problem** | No system = Can't grow |
| **Solution** | I help you build that system |
| **Tool** | my21staff (AI + human team) |
| **Why Me** | Real business experience, not just software |

---

## The System (What They Get)

| Symptom | System |
|---------|--------|
| Leads everywhere | WhatsApp CRM + Lead Reminders |
| Forgot follow-ups | AI Follow-up + Social Reminders |
| Proposals scattered | Proposal Library + Bot Access |
| No visibility | Analytics + Weekly Reports |

---

## ⚠️ IMPORTANT: Kapso is Hidden

**Never mention "Kapso" to customers.** It's our backend tech.

| Don't Say | Say Instead |
|-----------|-------------|
| Kapso | WhatsApp integration / Telegram integration |
| Kapso API | Messaging system |
| Kapso bridge | WhatsApp connection |
| Bot | Integration |

Keep all Kapso references internal (code, docs, CLAUDE.md only).

---

## All Tiers: Human Support (24/7)

**You ask, we handle, you're unblocked.**

| Support | We Handle | You Get |
|---------|-----------|---------|
| Website Support | Setup, content, fixes | Live website ready |
| WhatsApp/Telegram Support | Messaging config, troubleshooting | Integration working 24/7 |
| CRM Support | Pipeline setup, data cleaning | Organized leads |

Contact via WhatsApp or in-app chat. Response within minutes.

---

## AI Staff by Department

**You invest, we execute, you decide.**

| Department | They Advise | They Execute | You Get |
|------------|-------------|--------------|---------|
| **Sales** | Follow-up timing, offer strategy | Chase leads, send offers, close deals | Pipeline moving, revenue growing |
| **Finance** | Budget allocation, cash flow tips | Log transactions, track expenses, generate reports | Know where every rupiah goes |
| **Operations** | Workflow optimization, automation ideas | Handle bookings, reminders, daily tasks | Business running smooth |
| **Customer** | Response templates, escalation rules | Reply inquiries, resolve complaints, collect feedback | Happy customers, fewer issues |
| **Analytics** | What metrics matter, what to watch | Track KPIs, analyze trends, spot problems | Weekly insights, clear decisions |
| **Marketing** | Content angles, posting schedule | Create posts, schedule publishing, track engagement | Content running, leads coming |
| **Ads** | Targeting, budget split, creative angles | Launch campaigns, A/B test, optimize spend | Ads profitable, CAC dropping |

---

## Pricing = More System

| Tier | Price | System You Get |
|------|-------|----------------|
| **Solo** | Rp2.5jt/bln | Lead system (WhatsApp + Reminders + Follow-up) |
| **Team** | Rp5.5jt/bln | Solo + Proposal system + Analytics |
| **Studio** | Rp10jt/bln | Team + Marketing system + Ads |

**The more system, the more growth.**

### Setup Fee (One-time)

| Package | Price | What You Get |
|---------|-------|--------------|
| **Kickstart** | Rp7.5jt | Website + WhatsApp + Business approach + Guidance |

### Future Upsells (Internal Only)

- Meta Ads integration
- Advanced analytics
- Content Creation (nano banana pro)

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

## n8n (Workflow Automation)

**URL:** http://100.113.96.25:5678 (via Tailscale)

**To start n8n:**
```bash
# SSH into the server
ssh 100.113.96.25

# Start n8n (accessible via Tailscale)
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false npx n8n start

# Or run in background
N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false nohup npx n8n start &
```

**Google Sheets Service Account:**
- Email: `n8n-integration@gen-lang-client-0607995229.iam.gserviceaccount.com`
- Key file: `~/Desktop/gen-lang-client-0607995229-eda8447acf2a.json`
- Share Google Sheets with the service account email for access

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
