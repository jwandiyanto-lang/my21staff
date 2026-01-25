---
phase: 02-ari-core-conversation
plan: 01
subsystem: ai
tags: [openai, grok, sealion, ollama, typescript, ab-testing]

# Dependency graph
requires:
  - phase: 01-database-inbox-overhaul
    provides: ARI database tables (ari_config, ari_conversations, ari_messages, etc.)
provides:
  - ARI TypeScript type definitions matching database schema
  - Multi-LLM AI clients (Grok + Sea-Lion)
  - Deterministic A/B model selection for contacts
affects: [02-02, 02-03, 02-04, 02-05, 02-06, 02-07, 02-08, 02-09]

# Tech tracking
tech-stack:
  added: [openai@6.16.0]
  patterns: [OpenAI SDK for multi-LLM, hash-based A/B routing]

key-files:
  created:
    - src/lib/ari/types.ts
    - src/lib/ari/clients/grok.ts
    - src/lib/ari/clients/sealion.ts
    - src/lib/ari/ai-router.ts
    - src/lib/ari/index.ts

key-decisions:
  - "Use OpenAI SDK for both Grok and Sea-Lion (both support OpenAI-compatible API)"
  - "Hash-based A/B selection: same contact always gets same model (prevents test contamination)"
  - "Fallback to Indonesian error message on API failure"

patterns-established:
  - "AIResponse interface: standardized response with content, tokens, responseTimeMs, model"
  - "Client pattern: generateXResponse(messages, options) for each AI model"
  - "Deterministic A/B: hash contactId to 0-99, compare against weight threshold"

# Metrics
duration: 5min
completed: 2026-01-20
---

# Phase 02 Plan 01: ARI Foundation - Types and AI Clients Summary

**Multi-LLM foundation with OpenAI SDK, Grok/Sea-Lion clients, and hash-based A/B routing for deterministic model selection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-20T10:19:46Z
- **Completed:** 2026-01-20T10:25:16Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- Installed OpenAI SDK for multi-LLM API access
- Created comprehensive ARI TypeScript types matching database schema
- Built Grok client connecting to x.ai API
- Built Sea-Lion client connecting to Ollama via Tailscale
- Implemented deterministic A/B model selection (same contact always gets same model)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OpenAI SDK and create ARI types** - `6fbbc84` (feat)
2. **Task 2: Create Grok and Sea-Lion AI clients** - `01a7993` (feat)
3. **Task 3: Create AI router with deterministic A/B selection** - `e077509` (feat)

## Files Created

- `src/lib/ari/types.ts` - ARI TypeScript interfaces matching database schema (ARIState, ARIContext, ARIConversation, etc.)
- `src/lib/ari/clients/grok.ts` - Grok AI client using OpenAI SDK with x.ai endpoint
- `src/lib/ari/clients/sealion.ts` - Sea-Lion AI client using OpenAI SDK with Ollama endpoint
- `src/lib/ari/ai-router.ts` - AI router with selectModel() and generateResponse() functions
- `src/lib/ari/index.ts` - Clean public API re-exporting all types and functions

## Decisions Made

1. **OpenAI SDK for both models** - Both Grok (x.ai) and Sea-Lion (Ollama) support OpenAI-compatible API, simplifying client code
2. **Hash-based A/B selection** - Using contact ID hash ensures deterministic model assignment, preventing A/B test contamination where a lead experiences both models
3. **Indonesian fallback messages** - On API error, return friendly Indonesian message: "Maaf, saya sedang mengalami kesalahan teknis..."
4. **Default 50/50 split** - Equal traffic distribution between Grok and Sea-Lion, configurable via grokWeight parameter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Environment variables needed for AI models:**

| Variable | Description | Example |
|----------|-------------|---------|
| `GROK_API_KEY` | x.ai API key for Grok | `xai-xxx...` |
| `SEALION_URL` | Ollama endpoint (optional, defaults to Tailscale IP) | `http://100.113.96.25:11434/v1` |

Note: Sea-Lion via Ollama doesn't require an API key.

## Next Phase Readiness

- ARI types and AI clients ready for use
- State machine types defined (greeting -> qualifying -> ... -> completed)
- A/B model selection ready for conversation creation
- Ready for 02-02: Prompt Templates & Persona System

---
*Phase: 02-ari-core-conversation*
*Plan: 01*
*Completed: 2026-01-20*
