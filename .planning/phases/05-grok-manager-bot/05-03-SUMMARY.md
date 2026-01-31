---
phase: 05-grok-manager-bot
plan: 03
subsystem: ai
tags: [grok, ai, action-recommendations, lead-analysis, priority-scoring]

# Dependency graph
requires:
  - phase: 05-01
    provides: Brain analytics data layer (brainActions table, CRUD operations)
  - phase: 04-04
    provides: Lead query functions (getLeadsNeedingFollowUp, getLeadsByStatus)
provides:
  - Action recommendation engine with weighted priority scoring
  - Personalized WhatsApp message templates via Grok
  - Follow-up, handoff, and opportunity detection logic
affects: [06-dashboard, 07-handoff-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Weighted scoring algorithm (4 factors: leadScore 40%, timeSinceContact 30%, engagementDecay 20%, urgencySignals 10%)"
    - "Grok API for template generation with fallback to generic templates"
    - "Action deduplication by contact (highest priority wins)"
    - "Cost control: limit template generation to top 5 follow-ups"

key-files:
  created: []
  modified:
    - convex/brainAnalysis.ts

key-decisions:
  - "Use api.leads queries (not internal.leads) - leads.ts exports regular queries"
  - "Generate templates for top 5 follow-ups only to control Grok API costs"
  - "Deduplicate actions by contact - one action per lead (highest priority)"
  - "Store top 20 recommendations in database for dashboard display"
  - "Fallback to generic template if Grok API fails (graceful degradation)"

patterns-established:
  - "Priority scoring: calculateActionPriority with configurable weights"
  - "Urgency detection: hasUrgencySignal checks notes for budget/competitor/urgency keywords"
  - "Opportunity detection: detectOpportunityType returns specific signal types"
  - "Template personalization: uses lead name, business type, pain points, language"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 05 Plan 03: Action Recommendation Engine Summary

**Weighted priority scoring algorithm with Grok-powered personalized WhatsApp message templates for follow-up recommendations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-31T01:30:32Z
- **Completed:** 2026-01-31T01:32:32Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Action recommendation engine generates prioritized follow-ups, handoffs, and opportunity alerts
- Weighted scoring algorithm balances lead score (40%), time since contact (30%), engagement decay (20%), and urgency signals (10%)
- Grok-powered template generation creates personalized WhatsApp messages under 200 characters
- Deduplication ensures one action per contact with highest priority

## Task Commits

Each task was committed atomically:

1. **Task 1: Add action recommendation types and scoring algorithm** - `61a9fd2` (feat)
   - Added ContactLead, ActionRecommendation, ScoringWeights types
   - Implemented calculateActionPriority with configurable weights
   - Added urgency signal detection (budget, competitor, urgency keywords)
   - Added opportunity type detection from conversation patterns
   - Added determineUrgency function for priority-based urgency levels

2. **Task 2: Implement generateActionRecommendations action** - `77bd0c1` (feat)
   - Added generateActionRecommendations internalAction
   - Queries leads.ts using api.leads (regular queries, not internal)
   - Generates follow-up recommendations with priority scoring
   - Generates handoff-ready alerts for hot leads (score >= 70)
   - Generates opportunity alerts from conversation patterns
   - Deduplicates by contact (highest priority wins)
   - Stores top 20 recommendations in brainActions table

3. **Task 3: Add personalized template generation** - `cf0382c` (feat)
   - Added TEMPLATE_SYSTEM_PROMPT for WhatsApp follow-up messages
   - Implemented generatePersonalizedTemplate function using Grok
   - Generates templates for top 5 follow-ups (cost control)
   - Fallback to generic template if Grok API fails
   - Templates under 200 chars, personalized with name/business/pain points
   - Language-aware (Indonesian or English based on sarahLanguage)

## Files Created/Modified
- `convex/brainAnalysis.ts` - Action recommendation engine with scoring, opportunity detection, and template generation (185 lines added)

## Decisions Made

**1. Use api.leads queries (not internal.leads)**
- Rationale: leads.ts exports regular query functions, not internal queries. Using api.leads correctly references public API.

**2. Generate templates for top 5 follow-ups only**
- Rationale: Control Grok API costs. Top 5 provides sufficient personalization without excessive API calls.

**3. Deduplicate actions by contact**
- Rationale: One action per lead prevents overwhelming users. Highest priority action wins.

**4. Store top 20 recommendations in database**
- Rationale: Limit dashboard display to actionable recommendations. Top 20 covers immediate/today urgency.

**5. Fallback to generic template on Grok API failure**
- Rationale: Graceful degradation. Better to have generic message than no suggestion.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compiled successfully on first attempt.

## User Setup Required

None - no external service configuration required. Grok API key already configured from plan 05-02.

## Next Phase Readiness

**Ready for Phase 6 (Dashboard):**
- Action recommendations generated and stored in brainActions table
- Priority-sorted actions with urgency levels (immediate/today/this_week)
- Personalized message templates available for one-click sending
- Query functions ready: getActionsByWorkspace, getActionsByPriority

**Implementation notes:**
- Dashboard can display top actions filtered by urgency
- Action cards can show suggestedMessage for preview
- markActionActioned mutation available to track follow-up completion
- dismissAction mutation for user-dismissed recommendations

---
*Phase: 05-grok-manager-bot*
*Completed: 2026-01-31*
