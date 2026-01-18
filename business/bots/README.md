# Bot Personas

Bot configurations and AI personas for WhatsApp automation.

## Personas

| Persona | Client | Status |
|---------|--------|--------|
| Kia | Eagle Overseas | Phase 9 (planned) |

## Structure

Each persona file contains:
- **Name & Role** — Who they are
- **Personality** — Tone, style, approach
- **Response Guidelines** — How they communicate
- **Business Context** — What they know about the client
- **Example Interactions** — Sample conversations

## Usage

Personas are loaded into Sea Lion LLM via Kapso's sea-lion-reply function. The CRM provides contact context, persona provides response style.

---

*Add new personas as `{name}.md` files in this folder.*
