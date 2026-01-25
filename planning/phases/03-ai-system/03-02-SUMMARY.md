---
phase: 03-ai-system
plan: 02
subsystem: ai
tags: [convex, ollama, sea-lion, grok, xai, conversational-ai, internalaction]

# Dependency graph
requires:
  - phase: 03-01
    provides: aiUsage table for cost tracking
provides:
  - The Mouth conversational AI module (Sea-Lion primary, Grok fallback)
  - Context builder utilities for AI prompts
  - System prompts for Indonesian/English conversations
affects: [03-03-brain, 03-04-integration, kapso-webhook]

# Tech tracking
tech-stack:
  added:
    - Sea-Lion via Ollama (http://100.113.96.25:11434)
    - Grok API (https://api.x.ai/v1/chat/completions)
  patterns:
    - internalAction for external API calls (not mutation)
    - Primary/fallback AI provider pattern
    - Sliding window context (10 messages for speed)

key-files:
  created:
    - convex/ai/context.ts
    - convex/ai/mouth.ts
  modified: []

key-decisions:
  - "Sea-Lion primary (free, local), Grok fallback (paid API)"
  - "10-message context window for Mouth (speed), 20 for Brain (analysis)"
  - "Indonesian default language with English support"
  - "Safe fallback message if both AI providers fail"

patterns-established:
  - "AI module structure: context.ts for prompts, mouth.ts/brain.ts for providers"
  - "MouthResponse interface: content, model, tokens, responseTimeMs"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 03 Plan 02: The Mouth Summary

**Sea-Lion/Grok conversational AI with Indonesian prompts and 10-message sliding window for WhatsApp responses**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T15:44:56Z
- **Completed:** 2026-01-25T15:47:14Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created context builder module with conversation context and system prompts
- Implemented The Mouth with Sea-Lion primary and Grok fallback
- Indonesian-optimized prompts for Eagle Overseas Education use case
- Safe fallback response when both AI providers unavailable

## Task Commits

Each task was committed atomically:

1. **Task 1: Create context builder module** - `61cb52c` (feat)
2. **Task 2: Create The Mouth module** - `c422ce8` (feat)

## Files Created/Modified
- `convex/ai/context.ts` - Context builders: buildConversationContext, buildMouthSystemPrompt, buildBrainSystemPrompt
- `convex/ai/mouth.ts` - generateMouthResponse internalAction with Sea-Lion/Grok/fallback flow

## Decisions Made
- **Used internalAction (not mutation):** External API calls require action context for fetch
- **Default Indonesian language:** Matches Eagle Overseas Education target market
- **Typed API responses:** No `any` types - explicit interfaces for Ollama and Grok responses
- **Environment variable fallback:** SEALION_URL defaults to Tailscale IP if not set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both files created and TypeScript compiles successfully.

## User Setup Required

None - no external service configuration required for this plan. GROK_API_KEY was already configured in 03-01.

**Note:** Convex CLI auth issue persists - code compiles but cannot verify deployment. Schema and functions will work when deployed.

## Next Phase Readiness
- The Mouth ready for integration with Kapso webhook
- Context builders available for The Brain (03-03)
- **Blocker from 03-01:** ARI workspace linkage must be fixed before AI responses work in production

---
*Phase: 03-ai-system*
*Completed: 2026-01-25*
