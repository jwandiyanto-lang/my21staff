# Phase 9: Kapso Bot Setup (Eagle) - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Get Ari persona working on Eagle's WhatsApp — first client bot. Includes contact lookup API, CRM context integration, and end-to-end testing with Eagle's number.

**Client:** Eagle Overseas Education (education consulting for students wanting to study abroad)
**Bot serves:** Prospective students and parents inquiring about overseas education

</domain>

<decisions>
## Implementation Decisions

### Ari's Persona
- Rename persona from "Kia" to "Ari"
- Keep role as intern ("intern di Eagle Overseas Indonesia")
- Use 'kak' for everyone (safe, works for students and parents)
- Pronouns: saya/kamu (more polite than aku/kamu, less formal than saya/Anda)
- Language: Mirror customer (if they write English, reply in English)
- Keep existing style: 1-2 sentences, no emoji, one question per message

### Education Context
- University recommendations: **configurable list** — Eagle can set which universities to promote, Ari recommends from that list
- Cost estimates: **ranges only** — general ballpark ("Australia sekitar 300-500jt per tahun"), no detailed breakdowns
- Scholarships: **detailed info** — can discuss LPDP, AAS, Chevening, Fulbright with deadlines, requirements, and tips
- Visa process: **general steps only** — explain typical flow (apply uni → get CoE → apply visa), not detailed doc requirements

### CRM Integration
- Known contacts: Greet as "Hai kak [nama]" if contact exists in CRM
- Conversation history: Reference previous topics ("Terakhir kita bahas soal Australia kan?")
- Lead status: Adapt tone — new lead gets full intro flow, hot lead skips basics and goes to next steps
- Team notes: Ari has access to notes added by Eagle's team to inform responses

### Handover Triggers
- Always hand off for: booking consultation, complaints/issues, pricing questions (all three)
- Signal: "Saya connect-kan ke tim kita ya" (generic, no specific consultant name)
- Action on handoff: Update contact notes with context + create task with due date so team is notified

### Technical Stack
- AI Model: Sea Lion (`aisingapore/Gemma-SEA-LION-v4-27B-IT`)
- API: Contact lookup at `/api/contacts/by-phone/[phone]`
- Kapso function: Update existing `sea-lion-reply` function

### Claude's Discretion
- Exact wording for handoff messages
- How to structure conversation history context in prompts
- Task due date timing (e.g., 1 hour, 24 hours)
- How to handle edge cases (unknown country, unclear intent)

</decisions>

<specifics>
## Specific Ideas

- Current bot file: `business/bots/eagle-studenthub-bot.md` (has working Kia persona code)
- 3-phase conversation flow already defined: intro → documents → closing
- Time-based greeting already implemented: pagi/siang/sore/malam based on WIB
- Sea Lion API already integrated in existing function

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-kapso-bot-setup*
*Context gathered: 2026-01-19*
