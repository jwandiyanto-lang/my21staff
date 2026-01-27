# Phase 6: Kapso Live - Context

**Gathered:** 2026-01-14
**Status:** Ready for research

<vision>
## How This Should Work

Open the inbox and see all conversations as they exist in Kapso right now — always up to date, no stale data. The existing inbox UI stays the same, but instead of mock data, it's pulling real conversations from my Kapso account.

Full history should be available — when I click on a contact, I see every message we've ever exchanged. When I send a message, it actually goes through to WhatsApp via Kapso. When they reply, it shows up in the inbox.

It should feel like the inbox is a window into Kapso, not a separate system that needs syncing.

</vision>

<essential>
## What Must Be Nailed

- **Send works reliably** — When I hit send, message goes through to WhatsApp
- **See all conversations** — Every contact in Kapso shows up with their full history
- **Fresh data always** — No stale messages, inbox reflects reality

All three are equally important — this is about making the inbox actually work with real data.

</essential>

<boundaries>
## What's Out of Scope

- No new UI features — just make existing inbox work with real data
- No offline support or complex caching — internet required
- No multi-device/tab sync complexity

</boundaries>

<specifics>
## Specific Ideas

- Use existing v1 patterns for Kapso integration — reference ~/Desktop/21/my21staff/ for how it's done
- The v1 codebase already has working Kapso integration that can be referenced

</specifics>

<notes>
## Additional Context

This is about replacing the dev mode mock with real Kapso API calls. The UI is already built (Phase 3 and 4), now it needs to connect to the real thing.

</notes>

---

*Phase: 06-kapso-live*
*Context gathered: 2026-01-14*
