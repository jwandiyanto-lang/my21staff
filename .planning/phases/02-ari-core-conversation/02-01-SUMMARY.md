---
phase: 02-ari-core-conversation
plan: 01
subsystem: ai
tags: [openai, grok, sea-lion, ollama, typescript, a-b-testing]

# Dependency graph
requires:
  - phase: 01-agent-skills-setup
    provides: MCP server for Kapso agent skills
provides:
  - ARI TypeScript types with STATE_TRANSITIONS
  - Grok AI client using OpenAI SDK (x.ai endpoint)
  - Sea-Lion AI client via Ollama (Tailscale)
  - Deterministic A/B model routing (50/50 default split)
affects: [02-02, 02-03, 02-04, ARI-integration]

# Tech tracking
tech-stack:
  added: [openai@6.16.0]
  patterns:
    - OpenAI-compatible SDK pattern for multi-LLM support
    - Deterministic A/B testing using contact_id hash
    - Fallback error handling with Indonesian messages

key-files:
  created: []
  modified:
    - src/lib/ari/types.ts
    - src/lib/ari/clients/sealion.ts
    - src/lib/ari/ai-router.ts

key-decisions:
  - "Use OpenAI SDK for both Grok and Sea-Lion (OpenAI-compatible API)"
  - "Sea-Lion via Ollama on Tailscale (http://100.113.96.25:11434/v1) not hosted API"
  - "50/50 A/B split default between Grok and Sea-Lion"
  - "Deterministic hash function prevents A/B test contamination"

patterns-established:
  - "OpenAI SDK client pattern: single SDK, different baseURL per provider"
  - "A/B routing: hash(contactId) % 100 < grokWeight ? grok : sealion"
  - "AI response interface: { content, tokens, responseTimeMs, model }"

# Metrics
duration: 4min
completed: 2026-01-27
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
