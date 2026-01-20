# Phase 3: Lead Scoring & Routing - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Calculate lead scores (0-100) based on form data and conversation signals. Route leads automatically based on thresholds: hot leads (70+) hand off to human for consultation push, cold leads (<40) receive community link then hand off with notes, warm leads (40-69) continue ARI nurturing.

</domain>

<decisions>
## Implementation Decisions

### Scoring Factors
- All form fields contribute equally to base score
- Long timeline (2+ years) reduces score (penalty)
- Document readiness has big impact (passport, CV, test scores, transcript)
- Conversation signals: Claude's discretion (response quality, engagement, question depth)

### Threshold Actions
- **Hot (70+):** Hand off to human consultant — human sends consultation offer, not ARI
- **Warm (40-69):** ARI continues nurturing, tries to qualify further
- **Cold (<40):** ARI sends community link with "stay connected" tone, then hands off to human with "cold lead" notes
- Routing only triggers after qualification is complete (all required fields gathered)

### Score Visibility
- Score visible in lead list view
- Score visible in lead detail view
- Score included in ARI notes
- Display format: "ARI Score: [number] — [reasons a, b, c]"
- Show detailed breakdown of contributing factors
- No score history tracking — current score only

### Community Routing
- Platform: WhatsApp Group
- Link: Hardcoded for Eagle Overseas (configurable in future phase)
- Message tone: "Stay connected" — "Tetap terhubung dengan kami di grup WhatsApp ini..."
- No click tracking — send raw WhatsApp group link

### Claude's Discretion
- Exact conversation signal weighting
- Score calculation formula/algorithm
- Specific wording for community invite message
- UI placement and styling of score display

</decisions>

<specifics>
## Specific Ideas

- Score should clearly show WHY the lead got that score (detailed breakdown)
- Cold leads still hand off to human — they're not abandoned, just lower priority
- Qualification must complete before any routing happens

</specifics>

<deferred>
## Deferred Ideas

- Per-workspace community link configuration — Phase 6 (Admin Interface)
- Community link click tracking — out of scope for now
- Score history/timeline — not needed for MVP

</deferred>

---

*Phase: 03-lead-scoring-routing*
*Context gathered: 2026-01-20*
