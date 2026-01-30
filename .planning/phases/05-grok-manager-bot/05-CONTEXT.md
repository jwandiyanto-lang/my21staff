# Phase 5: Grok Manager Bot - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Brain (Grok 2) analyzes leads, generates summaries, scores quality, and suggests actions for business owners. This is a decision support system that helps owners understand lead patterns, prioritize follow-ups, and take the right actions at the right time.

**What this phase delivers:**
- Daily summary generation (dashboard + !summary command)
- Lead quality scoring with hot/warm/cold classification
- Action recommendations (follow-ups, templates, handoff alerts)
- Pattern insights (trending topics, rejection analysis)

**What this phase does NOT deliver:**
- Lead capture (Phase 3 - Sarah)
- Database storage (Phase 4)
- Dashboard UI (Phase 6)
- Handoff workflow execution (Phase 7)

</domain>

<decisions>
## Implementation Decisions

### Summary Format & Delivery

**Dashboard:**
- Summary shows on dashboard daily according to Brain settings
- Brain is configurable (not hardcoded "Grok") - follows bot naming from settings
- Dashboard layout: Claude's discretion (optimal UX for multi-section summary)

**!summary Command:**
- Hidden WhatsApp command: customer sends `!summary` via Kapso WhatsApp
- Grok/Brain notified, chatbot sends summary over WhatsApp
- Tone: Conversational assistant (friendly but focused)
  - Example: "Here's what happened today - you've got 3 hot ones!"
  - NOT formal ("Today's summary: 5 new leads...") or executive brief ("5 new | 3 need attention")

**Default Metrics to Track:**
1. Lead count & source (new leads + where they came from)
2. Response rate & timing (Sarah's response speed, conversation completion)
3. Qualification progress (leads moving through stages: new → qualified → contacted)
4. Common questions/topics (what leads ask about most)
5. Hot leads today (any hot leads + highest score achieved)
6. Rejection feedback (why leads went cold, objection patterns)

**Configurability:**
- Summary metrics are adjustable in Brain settings
- Start from recommended defaults above
- Owner can customize what they need to track
- Brain settings define which metrics appear in summary

### Lead Scoring Logic

**Thresholds:**
- Use same thresholds as Sarah for consistency:
  - 70+ = Hot
  - 40-69 = Warm
  - 0-39 = Cold

**Score Calculation:**
- Hybrid approach:
  1. Read Sarah's existing score (from conversation state)
  2. Show both Sarah's score AND Brain's logic/reasoning
  3. Re-calculate if Brain sees additional factors Sarah missed
  4. Final score can differ from Sarah's if justification is clear

**Score Factors:**
- Reference existing business_21/03_bots/E-handoff-to-human.md for scoring logic
- Engagement level, data completeness, business fit, behavioral patterns
- All documented in handoff triggers and lead temperature thresholds

**Score Trending:**
- Claude's discretion on whether to track score changes over time
- If implemented: show trending up/down indicators ("Ahmad went from 45 to 72 this week")

### Action Recommendations

**Action Types to Include:**
1. Follow-up priorities ("Contact these 3 leads today" with reasons and urgency)
2. Response templates (personalized message drafts using lead's name, business, pain points)
3. Handoff readiness ("These leads are ready for human contact" with context)
4. Opportunity alerts ("This lead mentioned budget" or "Competitor comparison needed")

**Priority Ranking:**
- Weighted algorithm combining:
  - Lead score (hottest first)
  - Response timing (longest time since last contact)
  - Engagement decay (previously hot leads going cold)
  - Urgency signals (budget mention, competitor comparison, explicit request)

**Response Templates:**
- Personalized, not generic
- Brain writes custom message drafts using:
  - Lead's name
  - Business type
  - Specific pain points mentioned
  - Conversation context

**Opportunity Alert Strategy:**
- Claude's discretion on notification approach:
  - Dashboard alert only vs WhatsApp ping vs both
  - Consider: hot opportunities might need immediate WhatsApp notification
  - Lower priority alerts stay in dashboard only

### Insight Presentation

**Format:**
- Hybrid approach:
  - Conversational summary ("I noticed 3 leads asked about API integration this week")
  - Data visualizations (charts, graphs, trend lines)
  - Action bullets (structured lists of findings and recommendations)

**Topic Insights:**
- Claude's discretion on detail level
- Options: topic labels only, topic + sample quotes, or topic + pattern analysis
- Choose optimal balance between brevity and actionability

**Rejection Analysis:**
- Yes, analyze rejection patterns
- Show why leads went cold:
  - "3 leads said pricing was too high"
  - "5 went silent after demo request"
- Help owner understand where to improve

**Dashboard Integration:**
- Sidebar shows Brain insights (confirmed by user)
- All summaries, scores, actions, and insights accessible via dashboard
- Brain settings control what metrics/insights are tracked and displayed

### Claude's Discretion

- Dashboard layout for multi-section summary (single card vs sections vs timeline)
- Score trending implementation (if/how to show score changes over time)
- Opportunity alert notification strategy (dashboard only, WhatsApp, or hybrid)
- Topic insight detail level (labels, quotes, or pattern analysis)
- Exact visualization designs for data trends

</decisions>

<specifics>
## Specific Ideas

**From business documentation:**
- Lead scoring logic and handoff triggers already defined in business_21/03_bots/E-handoff-to-human.md
- Score thresholds: 70-100 hot, 40-69 warm, 0-39 cold
- Handoff notification schema includes suggested actions (call_immediately, send_demo_link, reply_within_15min, reply_within_2hr)

**User preferences:**
- "Brain" not "Grok" - configurable bot name from settings
- Conversational tone for summaries, not formal or overly brief
- Personalized response templates using lead context
- Rejection feedback is valuable - include in insights
- Dashboard as central hub for all Brain outputs

**Example summary tone:**
- Good: "Here's what happened today - you've got 3 hot ones!"
- Not: "Today's summary: 5 new leads, 3 hot leads, 2 conversions"
- Not: "5 new | 3 need attention | 2 went cold"

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope. All Brain functionality fits within Phase 5 boundaries (analysis, scoring, insights, recommendations). Dashboard UI implementation is Phase 6 as planned.

</deferred>

---

*Phase: 05-grok-manager-bot*
*Context gathered: 2026-01-31*
