# Phase 7: Landing Page & CRM Design - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

Two parts working together:

**1. Landing Page (Public)**
A marketing page at the root that sells the "21 Digital Staff" concept. Visitors should immediately understand:
- This isn't software, it's hiring a digital team
- The UMR anchor: "A full digital department for the price of one entry-level employee"
- Three tiers with clear value progression

The page should feel modern, clean, Notion-inspired. Sage green hero section, orange CTAs, dark section for final push. Not corporate SaaS vibes - more like a premium product page.

**2. CRM Design Refresh (Dashboard)**
Update the existing dashboard to match the PRD design system:
- Warm peach backgrounds instead of default gray
- Forest green accents
- Organic rounded corners (2.5rem)
- Plus Jakarta Sans typography
- The "Operations/Content/Engineering" sidebar structure

The CRM should feel warm and approachable - like a personal tool, not enterprise software.

</vision>

<essential>
## What Must Be Nailed

**Landing Page:**
- Hero section that communicates the "Digital Staff" concept instantly
- Pricing section with the UMR anchor prominently displayed
- Feature breakdown showing what each tier includes (the 21 staff departments)
- Clear CTA to sign up or contact

**CRM Design:**
- Color system applied consistently (peach bg, forest green, orange accents)
- Typography updated (Plus Jakarta Sans)
- Card/panel styling with organic shadows
- Sidebar navigation with the Operations/Content/Engineering groupings

</essential>

<boundaries>
## What's Out of Scope

- User authentication/signup flow (just link to contact)
- Payment/billing integration
- Blog/articles public pages (already built in Phase 5)
- Animations/Framer Motion (keep it simple for now)
- Mobile optimization (desktop-first)
- Dark mode

</boundaries>

<specifics>
## Specific Ideas

### Landing Page Design (from PRD)

**Colors:**
- Background: #FBFBFA (off-white)
- Primary: #F7931A (orange - CTA buttons)
- Hero: #B6C9BB (sage green)
- Text: #37352F (primary), #37352F99 (muted)

**Typography:**
- Display: Plus Jakarta Sans (hero headings)
- Body: Inter
- Mono: JetBrains Mono (labels, stats)

**Components:**
- Buttons: rounded-notion (3px), uppercase tracking-widest
- Hero: sage green bg with notion-grid pattern
- Stats: border-notion-thick boxes
- CTA section: dark bg with blur effects

### CRM Design (from PRD)

**Colors:**
- Background: #FFF1E6 (warm peach)
- Panels: #FFF8F2
- Sidebar: #FCE9D9
- Primary: #2D4B3E (forest green)
- Accent: #F7931A (orange)
- Text: #2D2A26 (main), #8C7E74 (muted)

**Typography:**
- Font: Plus Jakarta Sans
- Headings: font-extrabold, tracking-tight
- Body: font-medium
- Mono: JetBrains Mono (labels, status)

**Components:**
- Buttons: rounded-2xl, shadow-lg
- Cards: rounded-[2.5rem], organic-shadow
- Tables: hover:bg-white/40 rows
- Status badges: Hot (orange), Converted (green), Nurturing (gray)

### Pricing (from debate PRD)

| Tier | Monthly | Staff | Target |
|------|---------|-------|--------|
| Core | Rp2.500.000 | 5 | Solo founders |
| Pro | Rp5.730.000 | 10 | Growing SMBs (UMR anchor) |
| Max | Rp10.500.000 | 21 | Established businesses |

Setup fees: Rp7.5M (Basic) / Rp15M (Enterprise)

### 21 Digital Staff Departments

- THE BRAIN (1): Executive Assistant
- SALES (5): Lead Greeter, Qualifier, Follow-up Agent, Proposal Sender, Deal Closer
- MARKETING (4): Content Publisher, Campaign Broadcaster, Social Scheduler, Promo Announcer
- OPERATIONS (4): Appointment Scheduler, Document Collector, Task Router, Status Updater
- FINANCE (3): Invoice Sender, Payment Logger, Payment Reminder
- SERVICE (3): FAQ Responder, Complaint Handler, Feedback Collector
- ANALYTICS (1): ROI Analyst

</specifics>

<notes>
## Additional Context

Reference files:
- `~/AI/ideas/2026-01-14-my21staff-eagle-debate.md` - Full pricing model and 21 staff breakdown
- `~/AI/ideas/2026-01-14-my21staff-v2-prd.md` - Design system tokens and components

The landing page should work standalone at the root `/` route. The CRM dashboard is at `/[workspace]/`.

</notes>

---

*Phase: 07-landing-page*
*Context gathered: 2026-01-14*
