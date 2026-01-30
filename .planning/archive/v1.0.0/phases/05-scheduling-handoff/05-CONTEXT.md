# Phase 5: Scheduling & Handoff - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Book consultations and hand off to consultants. Admin manages available slots via CRM, ARI presents slots to hot leads, books appointments after payment, and notifies consultants with context. Lives in the Knowledge Base section alongside persona settings.

</domain>

<decisions>
## Implementation Decisions

### Location in CRM
- Part of Knowledge Base section (alongside persona editing)
- Scheduler management accessible from same area as bot configuration

### Slot Management
- List view interface (simple table with add/edit/delete)
- Weekly calendar pattern — admin blocks off times they want bot to use
- Configurable booking window (admin sets how many days ahead leads can book)
- Configurable slot duration (admin sets duration per slot)

### Booking Flow
- ARI asks day preference first ("Hari apa yang cocok?")
- Then shows available times for that day
- Repeat-back confirmation ("Senin jam 10 pagi ya?") before locking
- If no match, offer alternatives ("Hari itu penuh, bagaimana dengan Rabu?")
- **Payment required before booking confirmed** — slot reserved only after payment

### Handoff Context
- AI-generated summary added to contact notes (3-5 sentences)
- Full conversation history already in Activity tab (existing feature)
- Handoff happens after payment confirmed
- Lead status auto-updates to hot_lead
- Tag added based on consultation type: 1on1, webinar-free, or community

### Notifications
- Lead reminders: configurable timing (admin sets)
- Meeting link sent 1 hour before meeting only (not at booking time)
- Consultant notified via CRM notification (in-app)
- Meeting link source: auto-generate Google Meet if feasible, otherwise defer to Phase 6

### Claude's Discretion
- Exact table layout for slot list
- Indonesian phrasing for booking conversation
- How to handle booking conflicts/race conditions
- CRM notification UI design

</decisions>

<specifics>
## Specific Ideas

- Weekly calendar where admin "blocks off" available times feels intuitive
- Payment gates the booking — no free riders
- AI summary in notes keeps consultant focused (not overwhelmed by full chat)
- Tag system distinguishes consultation types (1on1 vs webinar vs community)

</specifics>

<deferred>
## Deferred Ideas

- Auto-generate Google Meet links — try if easy, otherwise Phase 6
- Email/WhatsApp notifications for consultants — start with CRM-only
- Calendar integration (Google Calendar sync) — v2.3

</deferred>

---

*Phase: 05-scheduling-handoff*
*Context gathered: 2026-01-20*
