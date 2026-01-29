# Phase 3: Live Bot Integration - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete Kapso platform integration focused on Inbox - making my21staff Inbox show exactly what Kapso shows with full chat feature parity. Bot persona configuration deferred to Phase 3.1.

**Scope:** Kapso Inbox integration ONLY, not bot setup.

</domain>

<decisions>
## Implementation Decisions

### Inbox Interface Parity
- Keep existing my21staff Inbox UI layout and branding
- Sync message content exactly from Kapso (full conversation history via webhooks)
- Display contact metadata: name, phone, tags, custom fields from Kapso
- Show conversation status (Open/Closed/Archived) from Kapso
- Show assignment info (team member handling conversation)

### Message Sync Strategy
- Webhook-only (no historical import)
- Start fresh from Phase 3 activation forward
- Real-time instant UI updates (Convex real-time sync)

### Chat Features (Complete Kapso Parity)
- Send/receive messages (two-way messaging)
- Media support: text, images, documents, voice notes - all WhatsApp types
- Message metadata: delivery status, read receipts, timestamps
- All other Kapso Inbox chat capabilities

### Data Migration
- Replace existing Inbox data with Kapso as source of truth
- Archive old data (preserve in backup table, not shown in UI)
- Migration mode: show old data until Kapso sync verified, then hide

### Claude's Discretion
- Active conversation scroll behavior (new message auto-scroll vs indicator)
- Webhook failure recovery mechanism (retry vs polling fallback)
- Offline message queuing (queue for sending vs require connection)
- Your Intern UI visibility during Phase 3 (keep visible with "Coming Soon" vs hide completely)
- Data archival implementation details

</decisions>

<specifics>
## Specific Ideas

**Reference previous work:**
- Phase 6 (v2.0): Kapso live integration patterns in `.planning/phases-v2.0-archive/06-kapso-live/`
- Phase 18 (v2.0): Bot setup context in `.planning/phases-v2.0-archive/18-kapso-bot-setup/`
- Phase 2 (v3.x): Recent Kapso credentials work in `.planning/phases/02-kapso-integration/`

**Use Kapso agents/tools as implementation helpers:**
- Leverage Kapso's agent features to accelerate Phase 3 development
- Kapso API skills already installed (`kapso-api`, `kapso-ops`, `whatsapp-messaging`)

**Keep planning minimal:**
- Extensive prior work exists - reference archives
- Focus on what's NEW vs rehashing solved problems

</specifics>

<deferred>
## Deferred Ideas

- Bot persona configuration → Phase 3.1
- Your Intern tabs fate (Persona, Flow, Database, Scoring, Slots) → Phase 3.1 planning
- AI on/off toggle and bot behavior controls → Phase 3.1
- Manual handover and agent takeover → Phase 3.1

</deferred>

---

*Phase: 03-ai-system*
*Context gathered: 2026-01-29*
