# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** The system that lets you grow — lead management, follow-up automation, guided by real business experience.
**Current focus:** v2.2 ARI & User Flow — End-to-end journey from social media leads to paid consultations

## Current Position

Phase: 3 of 7 — Lead Scoring & Routing
Plan: 1 of 3 (03-01-PLAN complete)
Status: In progress
Last activity: 2026-01-20 — Completed 03-01-PLAN (Scoring Engine)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ████░░░░░░ (11/28 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 93 (14 in v1.0 + 38 in v2.0 + 30 in v2.1 + 11 in v2.2)
- v2.1 timeline: 3 days (Jan 18 → Jan 20)
- Commits: 325 in v2.0, 282 in v2.1

**Codebase:**
- Lines: ~35,800 TypeScript
- Phases completed: 26 total (v1.0: 5, v2.0: 16, v2.1: 9, v2.2: 2 + 03-01)

## Accumulated Context

### Roadmap Evolution

**v1.0 (Phases 1-5):** Foundation, Database, Inbox, Send, Website Manager
**v2.0 (Phases 6-22):** Kapso Live, Landing, AI, Deployment, Admin, Lead Polish, Security, Dashboard, Settings
**v2.1 (Phases 1-9):** Brand, Email, Roles, Support, Central Hub, Security Page, Landing Redesign, Performance, Kapso Bot
**v2.2 (Phases 1-7):** Database/Inbox, ARI Core, Scoring, Payment, Scheduling, Admin, AI Models

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Key v2.2 decisions:
- Multi-tenant ARI infrastructure (workspace_id on all tables) - IMPLEMENTED 01-01
- User-initiated WhatsApp trigger (form shows WA CTA, user starts conversation)
- Phone number matching for CRM contact identification
- Midtrans payment gateway for Indonesian payments
- Manual consultant slots (calendar integration deferred to v2.3)
- Both Grok + Sea-Lion from day 1 for A/B testing - Schema ready (ari_ai_comparison table)
- Kapso metadata caching for instant inbox loading - IMPLEMENTED 01-02
- E.164 phone normalization with libphonenumber-js - IMPLEMENTED 01-02
- ARI state machine: greeting -> qualifying -> scoring -> booking -> payment -> scheduling -> handoff -> completed
- One ARI conversation per contact per workspace (UNIQUE constraint)
- Realtime subscriptions enabled for all ARI tables - IMPLEMENTED 01-03
- Active view as default inbox filter (unread only) - IMPLEMENTED 01-04
- Server-side filtering for conversations API - IMPLEMENTED 01-04
- Filter presets stored in workspace_members.settings JSONB (max 10) - IMPLEMENTED 01-04
- Typing indicators via Supabase Broadcast (ephemeral, no database) - IMPLEMENTED 01-05
- Idempotent real-time updates with ID deduplication (prevents INBOX-07) - IMPLEMENTED 01-05
- OpenAI SDK for both Grok and Sea-Lion (both support OpenAI-compatible API) - IMPLEMENTED 02-01
- Hash-based A/B selection: same contact always gets same model (prevents contamination) - IMPLEMENTED 02-01
- State machine with escape hatch: handoff always allowed regardless of current state - IMPLEMENTED 02-02
- Business thresholds: MIN_SCORE_FOR_SCORING=40, HOT_LEAD_THRESHOLD=70 - IMPLEMENTED 02-02
- Auto-handoff after 10 messages in same state to prevent loops - IMPLEMENTED 02-02
- WIB timezone (UTC+7) for Indonesian time-based greetings - IMPLEMENTED 02-02
- Fire-and-forget webhook pattern: processWithARI() not awaited, webhook returns 200 immediately - IMPLEMENTED 02-03
- ARI only for text messages (media skipped), check ari_config before processing - IMPLEMENTED 02-03
- Required fields for qualification: name, email, english_level, budget, timeline, country - IMPLEMENTED 02-04
- Document tracking: passport, cv, english_test, transcript - IMPLEMENTED 02-04
- Indonesian yes/no parsing for document responses - IMPLEMENTED 02-04
- Knowledge base query functions for ari_destinations with country mapping - IMPLEMENTED 02-05
- University question detection (Indonesian + English keywords) triggers destination lookup - IMPLEMENTED 02-05
- Document response tracking via conversationContext.pendingDocumentQuestion - IMPLEMENTED 02-05
- Lead scoring weights: basic 25pts, qualification 35pts, documents 30pts, engagement 10pts - IMPLEMENTED 03-01
- Timeline penalty (-10 points) for 2+ year timelines - IMPLEMENTED 03-01
- IELTS 6.5+ bonus (+3 points) - IMPLEMENTED 03-01
- Temperature thresholds: hot >= 70, warm >= 40, cold < 40 - IMPLEMENTED 03-01
- Jest test infrastructure added for unit testing - IMPLEMENTED 03-01

### Deferred Issues

- Forgot password email uses Supabase email, not Resend (P1)
- Resend/delete invitation auth bug
- In-memory rate limiting won't scale multi-instance

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 03-01-PLAN (Scoring Engine)
Resume file: None
Next: 03-02-PLAN (Routing Logic)

## Deployment Info

**Production URL:** https://my21staff.com
**Vercel CLI:** Installed and linked
**Supabase Project:** my21staff (tcpqqublnkphuwhhwizx)

**Environment Variables (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_PRICING_WORKSPACE_ID
- ENCRYPTION_KEY
- GROK_API_KEY (needed for ARI)

**Workspaces:**
- My21Staff: `0318fda5-22c4-419b-bdd8-04471b818d17` (for pricing form leads)
- Eagle Overseas: `25de3c4e-b9ca-4aff-9639-b35668f0a48e` (first paying client, ARI pilot)

**AI Models:**
- Sea-Lion: http://100.113.96.25:11434 (Ollama, via Tailscale)
- Grok: API access available (requires GROK_API_KEY)

---
*Last updated: 2026-01-20 — Completed 03-01-PLAN (Scoring Engine)*
