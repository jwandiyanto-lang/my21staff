# Phase 3 Plan 1: Sarah Chat Bot - Prompts & Configuration Summary

**Plan:** 03-01
**Phase:** Sarah Chat Bot (Phase 3)
**Subsystem:** Kapso Agent Node Configuration
**Tags:** gemini, kapso, prompts, lead-qualification, whatsapp-crm

---

## Overview

Created comprehensive prompt documentation for Sarah's conversational AI persona, enabling the Kapso Agent node to handle natural WhatsApp conversations with Indonesian business owners, extract structured lead data, and route qualified leads to consultants.

**One-liner:** Sarah persona prompts with 5-field extraction, scoring rules, and Gemini API configuration for Kapso Agent node

---

## Dependency Graph

| Relationship | Target |
|--------------|--------|
| **Requires** | Phase 2.5 - Settings & Configuration (Kapso API integration) |
| **Provides** | Complete Sarah prompt templates for Plan 03-02 (Convex schema) |
| **Affects** | Phase 4 - Lead Database (data structure for Kapso→Convex sync) |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **AI Model** | Gemini 2.5 Flash |
| **Workflow Platform** | Kapso |
| **Configuration Type** | Agent Node System Prompts |
| **Structured Output** | JSON Schema (5 fields) |

### Patterns Established

- **State Machine Pattern:** greeting → qualifying → scoring → handoff/completed
- **One-Question-Per-Message:** Conversational data collection
- **Empathy-First Responses:** Indonesian casual tone with validation
- **Lead Scoring Algorithm:** 0-100 scale with urgency detection

---

## Key Files Created

| File | Purpose |
|------|---------|
| `business_21/03_bots/sarah-kapso-prompts.md` | Complete Sarah prompt templates for Kapso Agent node |

---

## Decisions Made

### 1. System Prompt Structure ( Indonesian-First )

**Decision:** Default to Indonesian casual language with auto-switch to English

**Rationale:** Target market is Indonesian SMEs; casual tone ("Halo", "Sip", "Kakak") builds rapport

**Impact:** All conversation templates include both Indonesian and English variants

---

### 2. Scoring Algorithm Components

**Decision:** 100-point scale with weighted components

| Component | Points | Rationale |
|-----------|--------|-----------|
| Basic Data (name + business + goals) | 25 | Minimum viable information |
| Team Size | 20 | Indicates business maturity |
| Pain Points (urgency-based) | 30 | Highest weight - shows intent |
| Engagement | 15 | Responsive behavior |

**Impact:** Hot leads (70+) get immediate consultant handoff

---

### 3. State-Specific Prompts

**Decision:** Append state-specific instructions to base system prompt

**States:** greeting → qualifying → scoring → handoff → completed

**Impact:** Each state has clear task, message templates, and exit conditions

---

### 4. Edge Case Handling

**Decision:** Inline handling for common scenarios

| Scenario | Handling |
|----------|----------|
| Price questions | Deflect to consultant ("Nanti konsultan kita yang jelasin...") |
| Image messages | Acknowledge and continue conversation |
| Human request | Immediate handoff regardless of score |
| Not interested | Close politely, tag as "not_interested" |

---

## Implementation Details

### SARAH_SYSTEM_PROMPT

The core persona definition includes:
- Warm, helpful personality (friendly intern)
- Indonesian by default with English auto-switch
- 140-character message limit
- Maximum 1-2 emoji per message
- One question per message pattern
- Empathy responses: "Wah paham banget..." "Betul tuh..."

### EXTRACTION_SCHEMA

5-field structured output for lead data:

```json
{
  "name": string,
  "business_type": string,
  "team_size": integer,
  "pain_points": string[],
  "goals": string
}
```

### SCORING_RULES

Point allocation with urgency detection:
- High urgency: 30 pts (kewalahan, miss message, overwhelmed)
- Medium urgency: 20 pts (sibuk, growth, manual)
- Low urgency: 10 pts (curious, checking)

### GEMINI_API_KEY Setup

**Manual setup required:**
1. Get API key from Google AI Studio (https://aistudio.google.com/apikey)
2. Add to Kapso: Settings → Secrets → GEMINI_API_KEY
3. Reference in Agent node: `{{secrets.GEMINI_API_KEY}}`

---

## Deviations from Plan

### Auto-Fixed Issues

**None** - Plan executed exactly as written.

### Authentication Gates

**None** - No authentication gates encountered during execution.

---

## Metrics

| Metric | Value |
|--------|-------|
| **Tasks Completed** | 2/2 |
| **Files Created** | 1 (528 lines, 15.9 KB) |
| **Sections Documented** | 9 (System prompt, states, schema, scoring, handoff, images, prices, setup, reference) |
| **Duration** | 190 seconds |

---

## Completion Checklist

- [x] SARAH_SYSTEM_PROMPT with persona traits
- [x] 5 state-specific prompts (greeting, qualifying, scoring, handoff, completed)
- [x] EXTRACTION_SCHEMA for 5-field extraction
- [x] SCORING_RULES with 0-100 point allocation
- [x] HANDOFF_TRIGGERS for human request keywords
- [x] IMAGE_HANDLING for photo messages
- [x] PRICE_QUESTION_HANDLING for price deflections
- [x] GEMINI_API_KEY setup documentation

---

## Next Steps

Plan 03-02 will use this documentation to:
1. Create Convex schema for SarahConversationState
2. Build HTTP endpoints for Kapso→Convex sync
3. Implement state machine logic in JavaScript

---

**Completed:** 2026-01-30
**Duration:** 3 minutes 10 seconds
**Commits:** 2 (b65e462, 742484e)
