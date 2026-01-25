# Features Research: B2B SaaS Client Launch (v2.1)

**Domain:** WhatsApp CRM SaaS for Indonesian SMEs
**Researched:** 2026-01-18
**Confidence:** MEDIUM-HIGH (multiple sources cross-referenced)

## Executive Summary

For v2.1 (first paying client launch), the critical features are trust-building elements rather than functionality expansion. Support ticketing, security info, and landing page redesign all serve the same goal: convincing Indonesian SME owners that my21staff is professional, trustworthy, and worth paying for. The workspace ownership feature enables the business model (multiple team members under one subscription). Anti-features for this phase include advanced analytics, self-service onboarding, and billing systems -- these add complexity without directly enabling the first client relationship.

---

## Support/Ticketing System

### Table Stakes

These are expected in any SaaS support system. Missing any = unprofessional perception.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Ticket creation form | Basic way to report issues | Low | Simple form with issue description, priority |
| Unique ticket ID | Track issues across conversations | Low | Auto-generated, visible to user |
| Status tracking | Know if issue is being worked on | Low | New, In Progress, Resolved, Closed |
| Email notifications | Updates without checking dashboard | Medium | Requires email system (Hostinger) |
| Ticket history | See all past issues | Low | List view with filters |
| Response from team | Two-way communication | Medium | Admin replies visible to client |

### Differentiators

Features that set my21staff apart for Indonesian SME market:

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| WhatsApp notifications | Clients live in WhatsApp, not email | Medium | Leverage existing Kapso integration |
| Bahasa Indonesia interface | Comfortable for target market | Low | Already our standard |
| "Implementation" stage | Shows action taken, not just "closed" | Low | Unique 4-stage flow |
| Response time promise | "Reply dalam hitungan menit" | Low | Trust signal in UI |
| Direct escalation path | Speak to Jonathan if unresolved | Low | Personal touch for early clients |

### Typical Flow (Industry Standard)

Standard ticket lifecycle from research:

```
New → Assigned → In Progress → On Hold (optional) → Resolved → Closed
```

**my21staff v2.1 Custom Flow:**

```
Report → Discuss → Outcome → Implementation
   |         |         |           |
   v         v         v           v
User      Team      Decision   Action
submits   responds  reached    taken +
issue     & asks    (fix/no    verified
          questions fix/etc)   working
```

This 4-stage flow is unique because it includes "Implementation" - showing the client that work was actually done, not just ticket closed.

### Ticket Data Model

Based on research, minimum viable ticket includes:

| Field | Type | Purpose |
|-------|------|---------|
| ticket_id | UUID | Unique identifier |
| workspace_id | UUID | Multi-tenant isolation |
| created_by | UUID | User who reported |
| title | String | Brief summary |
| description | Text | Full issue details |
| priority | Enum | Low, Medium, High, Critical |
| status | Enum | Report, Discuss, Outcome, Implementation |
| assigned_to | UUID (nullable) | Admin handling ticket |
| created_at | Timestamp | For sorting, SLA tracking |
| updated_at | Timestamp | Last activity |
| resolution_notes | Text | What was done |

---

## Security Info Page

### Table Stakes

What Indonesian SME clients expect to see (minimum trust requirements):

| Element | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Data storage location | Know where their data lives | Low | "Supabase servers (Singapore region)" |
| Encryption statement | Basic security assurance | Low | "Data encrypted at rest and in transit" |
| Access control explanation | Who can see their data | Low | Explain RLS, workspace isolation |
| Password handling | Common concern | Low | "Passwords hashed with bcrypt" |
| No data selling | Trust concern | Low | "We never sell your data" |
| Contact for questions | Accessibility | Low | WhatsApp number for security questions |

### Trust Signals

Elements that build confidence beyond minimum requirements:

| Signal | Impact | Complexity | Implementation |
|--------|--------|------------|----------------|
| Security badges/icons | Visual trust | Low | SSL, encrypted icons |
| Clear Bahasa Indonesia | Accessibility | Low | Not technical jargon |
| API key encryption detail | Technical credibility | Low | "AES-256-GCM encryption" |
| Webhook verification | Shows diligence | Low | "HMAC-SHA256 signature verification" |
| Regular backups | Data safety | Low | Supabase automatic backups |
| Admin contact | Personal accountability | Low | Direct line to Jonathan |

### What NOT to Include (v2.1)

- SOC 2 / ISO 27001 compliance (don't have it, don't claim it)
- GDPR compliance (not relevant for Indonesian SMEs, confusing)
- Penetration testing results (don't have formal audit)
- Complex security architecture diagrams (overwhelming)

### Recommended Page Structure

```markdown
1. Headline: "Data Anda, Perlindungan Kami" (Your Data, Our Protection)

2. Key Points (3-4 cards):
   - Enkripsi End-to-End
   - Server Singapore (fast, close)
   - Akses Terbatas (only your team)
   - Backup Otomatis

3. FAQ Section:
   - Siapa yang bisa akses data saya?
   - Bagaimana data disimpan?
   - Apa yang terjadi jika saya berhenti langganan?
   - Bagaimana cara hubungi tim security?

4. Contact: WhatsApp button for security questions
```

---

## Landing Page (B2B SaaS)

### Table Stakes

Must-have sections for SME-targeting B2B SaaS landing page:

| Section | Purpose | Complexity | Notes |
|---------|---------|------------|-------|
| Hero with clear value prop | Immediate understanding | Medium | "WhatsApp Automation untuk UMKM" |
| Social proof | Build trust | Low | Client logos, testimonials |
| Problem → Solution flow | Connect pain to product | Medium | "Leads dimana-mana? Butuh sistem." |
| Features overview | What they get | Medium | 3-6 key features with icons |
| Pricing preview | Qualification | Low | Link to pricing, not full table |
| CTA (single, clear) | Conversion | Low | "Mulai Sekarang" or "Hubungi Kami" |
| Footer with contact | Accessibility | Low | WhatsApp, email, location |

### Mobile Optimization (Critical)

Research shows mobile drives 83% of traffic but converts 8% lower. For Indonesian market, mobile-first is mandatory.

| Element | Best Practice | Notes |
|---------|---------------|-------|
| Load speed | < 3 seconds | Each second = -4.42% conversion |
| Touch-friendly CTAs | 44x44px minimum | Thumb-friendly buttons |
| Readable text | 16px+ body | No pinch-zoom needed |
| No pop-ups | Kill conversions on mobile | Use inline forms |
| Simplified nav | Hamburger menu | Don't overwhelm |
| Forms | 5 fields or fewer | 81% abandon long forms |
| No horizontal scroll | Breaks experience | Responsive images/videos |

### CTA Best Practices (SME Visitors)

| Approach | Why It Works | Implementation |
|----------|--------------|----------------|
| WhatsApp CTA primary | Indonesians prefer WhatsApp | "Chat via WhatsApp" button |
| Low commitment first | SMEs cautious with money | "Tanya dulu" not "Beli sekarang" |
| Single CTA per section | Decision paralysis otherwise | One button, repeated |
| Benefit language | What they get, not what it does | "Dapat leads terorganisir" |
| Urgency without pressure | Gentle nudge | "Mulai bulan ini" vs countdown timers |

### Recommended Hook

Current: General CRM messaging
Proposed: "WhatsApp Automation untuk UMKM Indonesia"

Why this works:
1. **WhatsApp** - immediate recognition, platform they live on
2. **Automation** - implies less manual work
3. **UMKM** - speaks directly to target (Indonesian SME term)
4. **Indonesia** - localized, not generic

---

## Workspace Roles

### Standard Patterns (Industry)

Most SaaS starts simple and adds complexity later:

| Pattern | Roles | When to Use |
|---------|-------|-------------|
| Binary | Admin, Member | Early stage, <10 users per workspace |
| Tiered | Owner, Admin, Member | When you need ownership transfer |
| Granular | Custom permissions per action | Enterprise, complex org structures |

### Recommended for v2.1 (SME Context)

Indonesian SMEs have simple structures. Don't over-engineer.

| Role | Permissions | Typical User |
|------|-------------|--------------|
| **Owner** | Everything + billing + delete workspace + transfer ownership | Business owner |
| **Admin** | Manage leads, settings, invite members | Office manager, senior staff |
| **Member** | View/edit leads, send messages | Sales staff, support staff |

### Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View leads | Yes | Yes | Yes |
| Edit leads | Yes | Yes | Yes |
| Send WhatsApp | Yes | Yes | Yes |
| Import/Export CSV | Yes | Yes | No |
| Manage settings | Yes | Yes | No |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Yes | No |
| Remove admins | Yes | No | No |
| View billing | Yes | No | No |
| Delete workspace | Yes | No | No |
| Transfer ownership | Yes | No | No |

### Database Considerations

Current: `workspace_users` table with `role` field
Addition needed: `owner_id` on `workspaces` table OR role = 'owner' as special case

Recommendation: Use role = 'owner' to avoid duplicate source of truth. Only one owner per workspace enforced at application level.

---

## Anti-Features (Skip for v2.1)

Features to deliberately NOT build yet:

| Feature | Why Skip | Build When |
|---------|----------|------------|
| **Self-service onboarding** | First clients need hand-holding, learn what they struggle with | v2.3+ after pattern emerges |
| **Billing/subscriptions** | Manual invoicing fine for 1-5 clients, Stripe integration overhead | v3.0 when scaling |
| **Advanced analytics** | Core value is CRM + WhatsApp, not dashboards | v2.2 after core stable |
| **Public knowledge base** | No common questions yet, create after support patterns emerge | v2.2+ |
| **Chat widget on landing page** | Adds complexity, WhatsApp CTA simpler | Never (WhatsApp is the channel) |
| **Multiple ticket queues** | Over-engineering for <10 support requests/month | v3.0+ |
| **SLA automation** | Not enough volume to need it | v3.0+ |
| **Custom roles** | 3 roles sufficient for SME teams | v3.0+ if enterprise clients |
| **Audit logs** | Nice-to-have, not critical for trust | v2.2+ |
| **Two-factor auth** | Good security, but friction for SME adoption | v2.2 as optional |
| **API access for clients** | They don't need it, you do | Never (internal only) |

### Why This Matters

Every feature you add:
1. Increases maintenance burden
2. Adds potential bugs
3. Slows down core improvements
4. Confuses users with options

For v2.1: **Minimum viable trust + minimum viable team management**

---

## Complexity Assessment

| Feature | Complexity | Dependencies | Estimate |
|---------|------------|--------------|----------|
| **Support Page** | | | |
| - Ticket form + list | Low | None | 1 day |
| - Status workflow (4 stages) | Low | None | 0.5 day |
| - Admin response interface | Medium | Admin auth | 1 day |
| - Email notifications | Medium | Hostinger email system | 1 day |
| - WhatsApp notifications | Medium | Kapso integration | 1 day |
| **Security Info Page** | | | |
| - Static content page | Low | None | 0.5 day |
| - FAQ accordion | Low | None | 0.5 day |
| - WhatsApp contact button | Low | None | 0.5 hour |
| **Landing Page Redesign** | | | |
| - Mobile-first hero | Medium | Design system | 1 day |
| - Social proof section | Low | Client testimonials (content) | 0.5 day |
| - Features grid | Medium | Design system | 1 day |
| - WhatsApp CTA integration | Low | Existing components | 0.5 day |
| **Workspace Roles** | | | |
| - Owner role addition | Low | Database migration | 0.5 day |
| - Permission checks | Medium | All protected routes | 1.5 days |
| - Transfer ownership | Medium | Business logic, notifications | 1 day |
| - Role management UI | Medium | Settings page | 1 day |

### Total Estimate: 12-14 days

This excludes:
- Design work (mockups, iterations)
- Email system setup (Hostinger configuration)
- Testing and QA
- Content creation (copy, translations)

---

## Feature Dependencies

```
                    ┌─────────────────┐
                    │ Email System    │
                    │ (Hostinger)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        v                    v                    v
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Support Page  │    │ Team Invites  │    │ Password      │
│ (email notif) │    │ (improvement) │    │ Reset Flow    │
└───────────────┘    └───────────────┘    └───────────────┘
                             │
                             v
                    ┌───────────────┐
                    │ Workspace     │
                    │ Roles         │
                    │ (who can      │
                    │  invite)      │
                    └───────────────┘

Landing Page Redesign ← Independent (can parallelize)
Security Info Page ← Independent (can parallelize)
```

### Recommended Build Order

1. **Email System** (unlocks notifications for everything)
2. **Workspace Roles** (affects who can do what in support)
3. **Support Page** (uses email, respects roles)
4. **Security Info Page** (parallel-able)
5. **Landing Page Redesign** (parallel-able)

---

## Indonesian Market Context

### Cultural Considerations

| Aspect | Implication | Implementation |
|--------|-------------|----------------|
| WhatsApp dominance | Primary communication channel | WhatsApp CTAs everywhere, notifications via WA |
| Personal relationships | Business is personal in Indonesia | Direct contact to Jonathan, not faceless support |
| Price sensitivity | SMEs watch every rupiah | Emphasize value, not features; show ROI |
| Trust through familiarity | New = risky | Testimonials from Indonesian businesses critical |
| Mobile-first | Desktop is secondary | All features must work on mobile |
| Bahasa Indonesia | Comfort and trust | No English-only features or errors |

### Competitor Context (Indonesian Market)

| Competitor | Positioning | Our Differentiator |
|------------|-------------|-------------------|
| Mekari Qontak | Enterprise, expensive | SME-focused, affordable |
| Kommo | CRM with WhatsApp, global | Local focus, Bahasa UI |
| Freshsales | Generic CRM | WhatsApp-first, not bolt-on |
| Generic CRMs | Feature-heavy, complex | Simple, opinionated, guided |

Our positioning: **"WhatsApp CRM yang dibuat untuk UMKM Indonesia"** (WhatsApp CRM made for Indonesian SMEs)

---

## Sources

### Support/Ticketing
- [Intercom - SaaS Ticketing Systems](https://www.intercom.com/learning-center/saas-ticketing-system)
- [DevRev - Ticket Management Best Practices 2025](https://devrev.ai/blog/ticket-management)
- [Zendesk - Ticket Lifecycle and Statuses](https://support.zendesk.com/hc/en-us/articles/8263915942938-About-the-ticket-lifecycle-and-ticket-statuses)
- [LiveAgent - Ticket Lifecycle Explained](https://www.liveagent.com/customer-support-glossary/ticket-lifecycle/)

### Security Pages
- [SoftwareFinder - 2025 SaaS Security Report](https://softwarefinder.com/resources/saas-security-report-2025)
- [CrazyEgg - Trust Signals That Boost Conversion](https://www.crazyegg.com/blog/trust-signals/)
- [Webstacks - Best B2B SaaS Websites 2025](https://www.webstacks.com/blog/best-b2b-saas-websites)

### Landing Pages
- [Unbounce - SaaS Landing Page Examples and Best Practices](https://unbounce.com/conversion-rate-optimization/the-state-of-saas-landing-pages/)
- [Genesys Growth - Landing Page Conversion Statistics 2025](https://genesysgrowth.com/blog/landing-page-conversion-stats-for-marketing-leaders)
- [Storylane - SaaS Landing Pages Best Practices 2025](https://www.storylane.io/blog/saas-landing-pages-best-practices)
- [Caffeine Marketing - 20 Best B2B SaaS Landing Page Examples 2025](https://www.caffeinemarketing.com/blog/20-best-b2b-saas-landing-page-examples)

### Workspace Roles
- [Frontegg - Roles and Permissions in SaaS](https://frontegg.com/guides/roles-and-permissions-handling-in-saas-applications)
- [EnterpriseReady - Role Based Access Control Guide](https://www.enterpriseready.io/features/role-based-access-control/)
- [SaaSRock - Roles and Permissions Documentation](https://saasrock.com/docs/articles/roles-and-permissions)

### WhatsApp for Indonesia
- [ControlHippo - WhatsApp API Indonesia](https://controlhippo.com/blog/whatsapp/whatsapp-api-indonesia/)
- [ADA Global - How to Use WhatsApp for Customer Support](https://www.adaglobal.com/resources/insights/how-to-use-whatsapp-for-customer-support)
- [WhatsApp Business Summit Indonesia 2024](https://business.whatsapp.com/resources/resource-library/whatsapp-business-summit-indonesia-24)

---

*Research completed: 2026-01-18*
*Confidence: MEDIUM-HIGH (web search verified with multiple sources)*
