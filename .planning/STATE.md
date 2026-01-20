# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** The system that lets you grow — lead management, follow-up automation, guided by real business experience.
**Current focus:** v2.2 ARI & User Flow — End-to-end journey from social media leads to paid consultations

## Current Position

Phase: 5 of 7 — Scheduling & Handoff (COMPLETE)
Plan: 4 of 4 (05-04-PLAN complete)
Status: Phase complete
Last activity: 2026-01-20 — Completed 05-04-PLAN (Handoff & Notifications)

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████░░░░ (18/28 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 100 (14 in v1.0 + 38 in v2.0 + 30 in v2.1 + 18 in v2.2)
- v2.1 timeline: 3 days (Jan 18 -> Jan 20)
- Commits: 325 in v2.0, 282 in v2.1

**Codebase:**
- Lines: ~37,500 TypeScript
- Phases completed: 27 total (v1.0: 5, v2.0: 16, v2.1: 9, v2.2: 3)

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
- Routing triggers after qualification complete (all required fields + all documents) - IMPLEMENTED 03-02
- Score synced to contacts.lead_score for CRM visibility - IMPLEMENTED 03-02
- Lead status maps: hot -> hot_lead, warm -> prospect, cold -> cold_lead - IMPLEMENTED 03-02
- Cold leads receive community link (if configured) with 30-day follow-up note - IMPLEMENTED 03-02
- ScoreBreakdown component with temperature badges (Hot/Warm/Cold) - IMPLEMENTED 03-03
- Expandable score details showing category breakdown - IMPLEMENTED 03-03
- ARI score fetched from ari_conversations on conversation selection - IMPLEMENTED 03-03
- Falls back to manual slider when no ARI data - IMPLEMENTED 03-03
- Hot leads get handoff with consultation offer context message - IMPLEMENTED 03-04
- Cold leads receive community link before handoff message - IMPLEMENTED 03-04
- Warm leads continue ARI nurturing (stay in scoring state) - IMPLEMENTED 03-04
- State machine accepts routing action for transition decisions - IMPLEMENTED 03-04
- AI receives explicit prohibitions in scoring state - IMPLEMENTED 03-04
- consultant_slots table with weekly patterns (day_of_week, start_time, end_time) - IMPLEMENTED 05-01
- ConsultantSlot and AvailableSlot types for scheduling - IMPLEMENTED 05-01
- Knowledge Base nav item in Admin section - IMPLEMENTED 05-02
- Tabbed interface with disabled placeholders for Phase 6 - IMPLEMENTED 05-02
- Indonesian day labels (Senin, Selasa, etc.) in Slot Manager - IMPLEMENTED 05-02
- Slot Manager CRUD UI (add, toggle active, delete) - IMPLEMENTED 05-02
- Direct booking -> scheduling transition (payment skipped in v2.2) - IMPLEMENTED 05-03
- Scheduling sub-states: asking_day -> showing_slots -> confirming -> booked - IMPLEMENTED 05-03
- Indonesian day/time parsing for booking (Senin, pagi, siang, etc.) - IMPLEMENTED 05-03
- Slot selection by number or time keyword - IMPLEMENTED 05-03
- Explicit confirmation required (ya/oke/betul) before booking finalizes - IMPLEMENTED 05-03
- Booking creates ari_appointments with auto-handoff - IMPLEMENTED 05-03
- Handoff module generates AI summary from messages and context - IMPLEMENTED 05-04
- Contact notes updated with summary, tags, lead_status=hot_lead after booking - IMPLEMENTED 05-04
- Consultant notifications stored in workspace_members.settings JSONB - IMPLEMENTED 05-04
- Appointment reminder cron (45-75 min window, every 15 min) - IMPLEMENTED 05-04
- AppointmentCard component with status actions (Selesai/No Show) - IMPLEMENTED 05-04

### Deferred Issues

- Forgot password email uses Supabase email, not Resend (P1)
- Resend/delete invitation auth bug
- In-memory rate limiting won't scale multi-instance

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 05-04-PLAN (Handoff & Notifications)
Resume file: None
Next: 06-01-PLAN (Admin Dashboard)

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
*Last updated: 2026-01-20 — Completed 05-04-PLAN (Handoff & Notifications)*
