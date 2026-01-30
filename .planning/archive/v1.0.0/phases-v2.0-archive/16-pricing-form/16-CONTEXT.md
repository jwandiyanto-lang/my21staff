# Phase 16: Pricing Form Enhancement - Context

**Gathered:** 2026-01-16
**Status:** Ready for planning

<vision>
## How This Should Work

The pricing page modal form already exists — this is about making it actually useful. When someone clicks "Hubungi Kami" on a pricing tier, the form should capture qualifying information that helps determine if they're a good fit before the follow-up call.

Form submissions go to a Google Sheet via n8n webhook. Simple, reliable, no over-engineering.

</vision>

<essential>
## What Must Be Nailed

- **Qualified leads** — Questions that reveal if they're a good fit (business type, current pain, team size)
- **Google Sheet capture** — Submissions logged reliably via n8n webhook
- **Bahasa Indonesia copy** — Natural questions that don't feel like an interrogation

</essential>

<boundaries>
## What's Out of Scope

- No Supabase integration — Google Sheet is enough for lead capture
- No auto-reply via WhatsApp — Manual follow-up works fine
- No form redesign — Keep existing modal UI, just update the fields
- No multi-step flow — Overkill for 5-6 fields

</boundaries>

<specifics>
## Specific Ideas

Form fields to add:
1. Nama (existing)
2. WhatsApp (existing)
3. Bisnis (existing → maybe rename to "Jenis Bisnis")
4. **NEW:** Current pain — "Masalah apa yang ingin diselesaikan?"
5. **NEW:** Team size — "Berapa orang yang akan pakai sistem ini?"
6. Selected tier (auto-populated based on which card they clicked)

n8n workflow: Webhook → Append to Google Sheet

</specifics>

<notes>
## Additional Context

User already has n8n running at http://100.113.96.25:5678 via Tailscale. Google Sheets service account is configured.

The goal is qualified leads — knowing enough about the prospect to have a productive first conversation, not just collecting contact info.

</notes>

---

*Phase: 16-pricing-form*
*Context gathered: 2026-01-16*
