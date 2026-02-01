# Project Research Summary

**Project:** my21staff v2.0.1 - Kapso Workflow Integration & Lead Automation
**Domain:** WhatsApp CRM with workflow automation and AI-powered lead management
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

This milestone integrates Kapso workflow automation with the my21staff CRM, focusing on automatic lead creation and daily activity summaries. Critical research finding: Kapso workflows cannot be edited via API — they must be managed manually through the Kapso Dashboard. This fundamentally changes the milestone's original goal of "workflow management UI that edits Kapso workflows from dashboard."

The recommended approach is to build a workflow configuration UI that stores settings in Convex and generates setup instructions for manual Kapso Dashboard configuration, rather than attempting direct API integration. The existing webhook infrastructure already handles automatic lead creation reliably (v2.0 foundation), so the main work is adding lead activity tracking, implementing daily AI summaries using Grok 4.1-fast, and creating the workflow settings UI with read-only sync from Kapso.

Key risks include webhook flood duplicates (solved via idempotency), phone number normalization inconsistencies (requires libphonenumber-js), and AI cost explosion from daily summaries (mitigated by batch processing and sampling). The architecture is webhook-first with async processing, avoiding race conditions between webhook and sync jobs by making webhooks the single source of truth for lead creation.

## Key Findings

### Recommended Stack

**No new packages required** — the existing stack handles all available Kapso capabilities. The current integration points are already proven in production:

**Core technologies:**
- **Kapso Webhook API v24.0**: Inbound message delivery — already integrated at `/webhook/kapso`, delivers message events with conversation context
- **Kapso REST API v1**: Send messages, list conversations — custom client (`src/lib/kapso-client.ts`) handles all messaging operations
- **Convex HTTP Endpoints**: Webhook receiver and state storage — already receiving webhooks and storing in contacts/conversations/messages tables
- **Next.js API Routes 15**: Proxy layer for Kapso calls — existing routes at `/api/kapso/conversations`, `/api/kapso/send` handle auth and CORS

**Critical limitation discovered:** Kapso does NOT provide workflow editing endpoints. Workflow prompts, AI model selection, and trigger conditions must be configured via Dashboard UI, not API. The codebase shows evidence of this in Phase 3 documentation: "Status: BLOCKED - Kapso API authentication failing" with "Workaround: Manual setup via Kapso Dashboard."

**Recommended additions:**
- **libphonenumber-js**: Phone number normalization to E.164 format — prevents duplicate contacts from format variations (+62813 vs 0813)
- **Zod**: Validate webhook payloads — add schema validation before processing (currently using `v.any()`)
- **Grok 4.1-fast**: AI summary generation — already integrated in `brainAnalysis.ts`, reuse for daily activity summaries

### Expected Features

**Must have (table stakes):**
- **Workflow status visibility** — On/off toggle with visual indicator, users expect to control automation
- **Bot persona editing** — Name, tone, language customization for brand alignment
- **Integration status indicators** — Kapso connection badge to prevent "why isn't it working" support tickets
- **Activity monitoring** — Real-time dashboard showing message counts, leads created (users need transparency)
- **Lead scoring configuration** — Weight sliders for scoring factors (already exists in Brain settings)

**Should have (competitive differentiators):**
- **Daily activity auto-summaries** — AI-generated narrative summaries of lead interactions (high perceived value)
- **One-click workflow sync to Kapso** — Core value prop: simpler than Kapso native UI (though limited by API)
- **Preview mode for workflow changes** — Test configuration before pushing to live (safety net)
- **Response template editing** — Rich text with variable placeholders (wait until users request)

**Defer to v2+ (anti-features to avoid):**
- **Visual workflow builder** — Too complex for SMEs, creates analysis paralysis
- **Real-time workflow editing** — Live changes can break active conversations
- **Advanced scheduling (cron expressions)** — SMEs don't understand cron syntax
- **Custom JavaScript for workflow logic** — Security risk, maintainability nightmare

### Architecture Approach

The architecture is webhook-first with async processing to avoid race conditions. All lead creation happens via webhook (single source of truth), with optional background sync only for monitoring stale contacts.

**Major components:**

1. **Webhook Enhancement** (`/api/webhooks/whatsapp/route.ts`) — Add `trackLeadActivity` call after message creation to update `lastActivityAt` timestamp. Adds ~10ms latency but stays well within 10s webhook timeout.

2. **Lead Activity Tracking** (`convex/leads.ts`) — New mutation to update contact's last activity timestamp on any interaction (message received/sent, status change). Simple patch operation with no complex aggregation.

3. **Daily Summary Generation** (`convex/crons.ts`) — New cron job at 10:00 WIB (after brain summary at 09:00) that generates per-lead activity summaries as notes. Queries contacts with activity in last 24 hours, generates AI summary using Grok 4.1-fast, stores as note in contacts.notes array.

4. **Activity Summary AI Service** (`convex/leads.ts`) — Internal mutation that aggregates message counts, topics discussed, status changes, and Sarah phase transitions, then calls Grok API for 2-3 sentence summary. Cost: $0.0002 per summary.

5. **Activity Timeline UI** (new component) — Display notes timeline in lead detail panel. Black/white theme with Geist Mono font, shows chronological activity history.

**Data flow:**
```
WhatsApp Message → Kapso Webhook → /api/webhooks/whatsapp
    ↓
findOrCreateContactWebhook (dedup by phone_normalized)
    ↓
createInboundMessageWebhook (store message)
    ↓
trackLeadActivity (update lastActivityAt) ← NEW
    ↓
processWithRules (existing rules engine)

Daily Cron (10:00 WIB) → generateDailyActivityNotes
    ↓
Query active contacts (lastActivityAt > 24h ago)
    ↓
For each contact: aggregate data → Grok summary → store in notes array
```

### Critical Pitfalls

1. **Webhook flood creating duplicate leads** — Without idempotency tracking, webhook retries (10s, 40s, 90s) create multiple contact records. Prevention: Track webhook event IDs in `webhookAudit` table with unique index, return 200 immediately, check X-Idempotency-Key header before processing.

2. **Phone number normalization hell** — Indonesian phone numbers entered inconsistently (0813, +62813, 62813) create duplicate contacts. Prevention: Use libphonenumber-js to normalize to E.164 format at write-time, store both `phone` (display) and `phone_normalized` (dedup), index on normalized field.

3. **Workflow edits breaking active automations** — Kapso rule changes apply immediately to all conversations, can orphan in-flight leads or cause duplicate responses. Prevention: Read-only sync from Kapso (edit in Kapso UI, sync to CRM), store workflow config versions in `settingsBackup` table, show diff before sync.

4. **Daily summary cron job cost explosion** — At scale (100+ workspaces × 50 messages/day), AI costs grow without revenue correlation. Prevention: Use Gemini Batch API (50% discount) for non-urgent summaries, incremental summarization (only new messages), smart sampling for high-volume workspaces (>100 messages/day).

5. **Race condition between webhook and sync job** — Webhook and background sync both writing to same contact records causes OCC errors and data overwrites. Prevention: Webhook-only lead creation (sync job only monitors), idempotent upserts using phone_normalized as natural key, timestamp-based merge for conflicts.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundation before features, avoids API limitations, and addresses pitfalls early:

### Phase 1: Webhook & Deduplication Foundation
**Rationale:** Must establish reliable lead creation before adding features. Pitfall research shows webhook idempotency and phone normalization are critical to prevent duplicate contact chaos. Stack research confirms webhook infrastructure already exists — just needs hardening.

**Delivers:**
- Idempotency tracking (webhookAudit table)
- Phone normalization with libphonenumber-js
- Lead activity tracking (update lastActivityAt on every message)
- Webhook signature verification (prevent spam floods)

**Addresses:**
- Automatic lead creation requirement (already working, just needs validation)
- Deduplication requirement (phone-only matching per user spec)

**Avoids:**
- Pitfall 1 (webhook flood duplicates)
- Pitfall 2 (phone normalization hell)
- Pitfall 5 (race conditions)
- Pitfall 8 (missing signature verification)

### Phase 2: Daily Activity Summaries
**Rationale:** Features research shows daily summaries are a differentiator with high perceived value. Architecture research proves this can be implemented with existing Grok integration (reuse brainAnalysis.ts). Must come after Phase 1 to ensure clean lead data.

**Delivers:**
- Daily cron job at 10:00 WIB
- Grok 4.1-fast integration for AI summaries
- Activity aggregation logic (message counts, topics, status changes)
- Notes storage in contacts.notes array
- Cost tracking in aiUsage table

**Uses:**
- Grok 4.1-fast ($0.0002 per summary, already integrated)
- Convex cron infrastructure (already exists in crons.ts)

**Implements:**
- generateDailyActivityNotes internal mutation
- Activity aggregation with smart sampling

**Avoids:**
- Pitfall 4 (AI cost explosion via batch processing and sampling)
- Pitfall 7 (spam leads diluting summaries via qualification threshold)

### Phase 3: Activity Timeline UI
**Rationale:** UI comes last after backend is proven. Notes are already stored in schema (contacts.notes array), just needs display component. Features research shows activity monitoring is table stakes for workflow automation tools.

**Delivers:**
- ActivityTimeline component (black/white theme, Geist Mono)
- Lead detail panel integration
- Notes chronological display with metadata (addedBy, addedAt)

**Addresses:**
- Activity monitoring requirement
- Notes display requirement

**Implements:**
- Simple React component (no complex state management)

### Phase 4: Workflow Settings UI (Read-Only Sync)
**Rationale:** Stack research proves Kapso workflows CANNOT be edited via API. Must reframe from "edit workflows" to "store settings + generate Kapso setup instructions." This phase deferred to last because it requires understanding what's actually editable vs locked.

**Delivers:**
- Workflow settings storage in Convex (workflowSettings table)
- Read-only sync from Kapso Dashboard (manual)
- Settings version history (settingsBackup table)
- "Sync to Kapso" button with instructions (not automatic push)
- Bot persona editing UI (name, tone, language)
- Lead scoring configuration UI (extend Brain settings)

**Addresses:**
- Workflow management UI requirement (reframed to match API limitations)
- Bot persona editing (table stakes feature)
- Lead scoring configuration (table stakes feature)

**Avoids:**
- Pitfall 3 (workflow edits breaking automations via read-only approach)
- Technical debt of building unusable workflow editor (Kapso API doesn't support it)

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Webhook idempotency and phone normalization prevent data corruption that's expensive to clean up later. Architecture research shows existing webhook handler works but needs hardening. Pitfall research proves duplicates are the #1 CRM integration failure mode.

- **Backend before UI (Phase 2 → 3):** Daily summaries backend can run independently and be validated with manual note inspection before building UI. Notes are already in schema — no schema changes needed for Phase 3.

- **Settings UI last (Phase 4):** Stack research shows workflow editing is limited by Kapso API (no programmatic access). Need to prove webhook + summaries work before tackling settings sync. This phase is most uncertain and least critical — automatic lead creation already works without it.

- **Parallel work opportunities:** Phase 2 (cron job) and Phase 3 (UI component) can be built simultaneously once Phase 1 is complete. Phase 3 can use mock data while Phase 2 is in progress.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Workflow Settings UI):** Stack research shows Kapso API limitations. Need to research alternative workflow config patterns (n8n, Make.com) to see how other tools handle read-only external systems. MEDIUM complexity.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Webhook Infrastructure):** Well-documented pattern (webhook idempotency + phone normalization). Pitfalls research provides complete implementation guide.
- **Phase 2 (Daily Summaries):** Standard cron job + AI API call pattern. Existing codebase has working example (brain-daily-summary).
- **Phase 3 (Activity Timeline UI):** Standard React component with Shadcn/ui. Notes schema already exists.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with existing codebase, Kapso SDK docs, official Convex docs. API limitation confirmed via absence of workflow endpoints in SDK and evidence in Phase 3 docs. |
| Features | MEDIUM | Based on verified WebSearch findings from workflow automation tools (n8n, Make, Zapier) and WhatsApp CRM competitors. User quote from milestone provides domain context. |
| Architecture | HIGH | Based on existing codebase analysis (webhook handler, Convex schema, Grok integration all proven in v2.0) plus official Convex docs for cron performance. |
| Pitfalls | HIGH | Verified via official docs (Convex OCC, webhook best practices) and project-specific evidence (Phase 3 RESEARCH.md shows manual workflow setup). Phone normalization patterns confirmed in multiple CRM dedup sources. |

**Overall confidence:** HIGH

Research is comprehensive with strong validation from existing codebase. The critical finding (Kapso API limitations) is backed by multiple evidence points: SDK documentation, Phase 3 documentation stating "BLOCKED - Kapso API authentication failing" with manual workaround, and absence of workflow editing endpoints in codebase.

### Gaps to Address

**Kapso workflow metadata API:** Stack research shows NO programmatic access to workflow configuration. Gap: Unknown if Kapso plans to add workflow editing API endpoints. How to handle: Build Phase 4 assuming read-only sync, architect for future API expansion if Kapso adds endpoints.

**Lead qualification threshold:** Features research recommends 2+ message threshold to prevent spam leads, but user requirement says "every message creates lead." Gap: Need user validation on spam filtering vs. capture-everything approach. How to handle: Build Phase 1 with all-message capture, add qualification filters in Phase 2 only if spam becomes problem.

**Daily summary timing:** Architecture recommends 10:00 WIB cron, but gap is multi-workspace timezone handling. How to handle: Start with fixed UTC time (02:00 UTC = 10:00 WIB for Indonesian users), add workspace-specific timezone settings in Phase 4 if expansion to UAE market requires it.

**Phone normalization edge cases:** libphonenumber-js handles most formats, but gap is WhatsApp-specific number formats (Business API vs. personal numbers). How to handle: Validate during Phase 1 implementation with real Kapso webhook payloads, adjust normalization if needed.

## Sources

### Primary (HIGH confidence)
- **Existing codebase:** `convex/kapso.ts`, `src/lib/kapso-client.ts`, `.kapso-project.env`, `convex/schema.ts`, `convex/crons.ts`, `convex/brainAnalysis.ts` — Production implementation evidence, webhook flow, Grok integration
- **Phase 3 documentation:** `.planning/phases/03-sarah-chat-bot/KAPSO-DASHBOARD-SETUP.md`, `RESEARCH.md` — Manual workflow setup guide, API limitation evidence
- **Convex official docs:** Database indexes, cron jobs, mutations, OCC — Architecture performance validation
- **Kapso SDK:** `@kapso/whatsapp-cloud-api` npm package — API methods, webhook events

### Secondary (MEDIUM confidence)
- **Workflow automation:** n8n, Make.com, Zapier documentation — Feature comparison, UI patterns for workflow management
- **WhatsApp automation:** AISensy, Chatarmin guides — Domain-specific best practices
- **Phone normalization:** libphonenumber-js docs, CRM dedup guides — Normalization patterns
- **Webhook best practices:** Integrate.io, Medium articles — Idempotency, signature verification

### Tertiary (LOW confidence)
- **AI cost optimization:** Skywork blog, HandsOnArchitects — Cost management strategies (not domain-specific)
- **Workflow versioning:** n8n Medium articles — Version control patterns (not CRM-specific)

---
*Research completed: 2026-02-01*
*Ready for roadmap: yes*
