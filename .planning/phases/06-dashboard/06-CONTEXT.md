# Phase 6: Dashboard - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Build CRM dashboard with four main components:
1. **Lead List** - Display leads from Kapso with qualification stages
2. **Filter & Search** - Real-time filtering and search capabilities
3. **AI Insights** - Dedicated page for Grok's daily summaries and analysis
4. **Analytics** - Top-level metrics with conversational stat cards

**Important:** This phase builds the **Leads** list (people in qualification). A separate **Clients** list (converted leads with detailed features) will be a future phase.

</domain>

<decisions>
## Implementation Decisions

### Lead List Layout & Interaction

**Two separate lists:**
- **Leads list** (this phase) - People coming through Kapso, in qualification stages
- **Clients list** (future phase) - Converted leads with more detailed approach and features

**Stages displayed:**
- New → Warm → Hot → Converted (temperature-based progression)
- Matches Grok's scoring system (cold/warm/hot from Phase 5)

**Detail view:**
- Slide-out panel from right side
- List stays visible while panel shows lead details
- Good for quick scanning multiple leads

**Lead card content:**
- Contact basics (name, phone, avatar)
- Stage badge (New/Warm/Hot/Converted)
- Activity metrics (last message time, message count)
- **AI notes from Grok**
- **Chat summary for the day**

### Filter & Search Experience

**Filter placement:**
- Claude's discretion - pick most CRM-appropriate position

**Stage filtering:**
- Multi-select dropdown
- User can select multiple stages to view simultaneously

**Search scope:**
- Name and phone number only
- Does NOT search: business type, pain points, conversation content, AI notes

**Filter behavior:**
- Real-time (instant as you type)
- No submit button required
- Leverages Convex real-time queries

### AI Insights Presentation

**Display location:**
- Dedicated Insights tab/page
- Separate view for deep focus on AI analysis

**Action recommendations:**
- Claude's discretion on format (priority list, kanban, or calendar)
- Should be actionable for follow-ups

**Lead quality visualization:**
- Color-coded badges (red/orange/blue)
- Corresponds to hot/warm/cold classification

**Refresh behavior:**
- **No refresh button**
- Insights generated once daily at 01:00 UTC / 09:00 WIB (Phase 5 cron)
- Display shows latest available daily summary

### Analytics Visualization

**Chart types:**
- **Stat cards with big numbers** (primary)
- **Conversational highlights** (e.g., "23 new leads this week - up 15% from last week")
- Keep it simple and non-technical

**Display location:**
- Dashboard overview (top metrics)
- Quick glance at key performance indicators

**Time range controls:**
- Claude's discretion on date filtering approach

**Mobile responsiveness:**
- Desktop-first (mobile not a priority)
- Optimize for laptop/desktop viewing
- Mobile can scroll/zoom if needed

### Claude's Discretion

- Filter positioning (sidebar, top bar, or collapsible)
- Action recommendation format (list, kanban, or calendar)
- Time range controls for analytics (presets, custom picker, or both)
- Exact spacing, typography, and visual polish
- Loading states and error handling

</decisions>

<specifics>
## Specific Ideas

- Lead stages should match **temperature metaphor** (New → Warm → Hot) instead of traditional CRM stages (new → qualified → contacted)
- This aligns with Grok's scoring from Phase 5 (hot 70+, warm 40-69, cold 0-39)
- AI notes and chat summaries are **critical** to show on lead cards - not just buried in detail view
- Analytics should use **conversational language** - avoid technical jargon, make insights readable at a glance

</specifics>

<deferred>
## Deferred Ideas

**Clients List (Future Phase):**
- Separate list for converted leads (moved beyond "Converted" stage)
- More detailed features and capabilities
- Different UI/UX approach than Leads list

**Advanced Analytics (Future Phase):**
- Line charts for trends over time
- Bar charts for comparisons
- Pie/donut charts for distribution
- Full Analytics tab with deep-dive metrics

**Mobile-Optimized UI (Future Phase):**
- Mobile-responsive layouts
- Touch gestures and swipe actions
- Simplified mobile charts

</deferred>

---

*Phase: 06-dashboard*
*Context gathered: 2026-01-31*
