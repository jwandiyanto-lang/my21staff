# Phase 4: Lead Database - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Kapso contacts and messages sync to Convex to create a read-replica database for instant dashboard access. Kapso remains the source of truth - Convex mirrors data to enable fast queries without hitting Kapso API repeatedly. All leads originate from WhatsApp conversations via Sarah bot, and the database is designed for **AI management with human oversight** (Claude reads, humans can edit simple fields like name/phone/notes).

</domain>

<decisions>
## Implementation Decisions

### Sync Timing & Triggers
- **Real-time webhook** for message sync (every Kapso message triggers immediate Convex update)
- **Mirror approach**: embedded inbox already displays Kapso data, database should reflect same
- **Fresh start only**: no historical data backfill - database tracks new leads from sync activation forward
- **Webhook failure handling**: Claude decides recovery strategy (retry, queue, fallback polling)

### Data Freshness vs Load
- **Contact info: < 1 second** - Any message in Kapso must show in lead list within 1 second
- **AI-extracted data: batch updates fine** - Sarah's 5 fields can update in 30-60 second batches
- **Graceful degradation under load** - During spikes, allow sync lag to increase temporarily to protect system stability
- **No sync indicator needed** - User trusts data is current, no visible sync status UI

### Custom Fields Structure
- **Fixed schema for structured data** based on Sarah's bot phases:
  - **Phase 1 (Gathering):** name, businessType, domisili, businessDuration
  - **Phase 2 (Interest):** painPoints[], priority, urgencyLevel
  - **Phase 3 (Closing):** leadScore (0-100), leadTemperature (hot/warm/lukewarm/cold)
- **Notes field for unique/unstructured updates** - Both bot and human can add notes chronologically
- **Note storage design**: Claude decides structure (single field, separate bot/user, or timeline array) for optimal readability

### Lead Status Workflow
- **Full status schema**: new → qualified → contacted → converted → archived
- **Status controlled by chat progress and Brain bot** (Phase 5 dependency):
  - Chat phase (A/B/C/D from Sarah) informs status
  - Grok Manager Bot (Phase 5) determines final status transitions
- **Flexible movement**: Status can move forwards, backwards, or skip stages (support deal fall-through, re-engagement)
- **Status history tracking**: Claude decides if audit trail needed (full history, last-changed only, or none)

### Claude's Discretion
- Webhook failure recovery strategy (retry logic, queue design, fallback polling)
- Notes storage structure (single vs separate vs timeline)
- Status history tracking implementation
- Conflict resolution when Kapso and Convex data diverge
- Timestamp fields for analytics (created, lastMessage, lastContact, lastActivity)

</decisions>

<specifics>
## Specific Ideas

**Sarah's Data Model (from business_21/03_bots/):**
- Phase 1: name, business_type, domisili, business_duration, story, language
- Phase 2: pain_points[], interest_motivation, priority, urgency_level
- Phase 3: lead_score (0-100), lead_temperature, closing_technique_used, objection_raised

**Database is AI-operated:**
- Claude AI manages the database (reads for analysis, writes for updates)
- Humans can edit simple fields: name, phone number, add notes
- Schema must be "easy enough to read for customer" - human-readable field names

**Kapso Architecture:**
- Kapso is source of truth for workflows
- Convex is read-replica for dashboard display
- Inbox already mirrors Kapso (this phase extends mirroring to lead database)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope. Phase 5 (Grok Manager Bot) will implement:
- Brain bot analysis logic for status determination
- Lead scoring algorithm refinement
- Action items prioritization

</deferred>

---

*Phase: 04-lead-database*
*Context gathered: 2026-01-30*
