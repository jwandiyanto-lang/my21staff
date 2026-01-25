---
phase: 02-ari-core-conversation
plan: 02
subsystem: ai
tags: [state-machine, prompt-engineering, context-builder, indonesian-nlp]

# Dependency graph
requires:
  - phase: 02-01
    provides: ARI types, AI clients (Grok/Sea-Lion)
provides:
  - State machine for ARI conversation flow
  - Context builder for AI prompts with CRM data
  - Indonesian time-based greetings (pagi/siang/sore/malam)
  - Form data extraction utility
affects: [02-03, 02-04, 02-05, conversation-handler, ai-response-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - State machine with escape hatch (handoff always allowed)
    - Deterministic state transitions with business logic thresholds
    - Indonesian timezone handling (WIB/UTC+7)

key-files:
  created:
    - src/lib/ari/state-machine.ts
    - src/lib/ari/context-builder.ts
  modified:
    - src/lib/ari/index.ts
    - src/lib/ari/types.ts

key-decisions:
  - "STATE_TRANSITIONS moved to state-machine.ts as single source of truth"
  - "Handoff escape hatch: always allowed regardless of current state"
  - "Business thresholds: MIN_SCORE_FOR_SCORING=40, HOT_LEAD_THRESHOLD=70"
  - "Auto-handoff after 10 messages in same state to prevent loops"
  - "WIB timezone (UTC+7) for Indonesian time-based greetings"

patterns-established:
  - "State transition validation: canTransition(from, to) with escape hatch check first"
  - "Context builder pattern: PromptContext interface collecting all data needed for prompt"
  - "Form data extraction: extractFormAnswers() handles nested metadata structures"

# Metrics
duration: 5min
completed: 2026-01-20
---

# Phase 2 Plan 2: ARI State Machine and Context Builder Summary

**State machine with escape hatch for 8 ARI states plus context builder creating personalized prompts with CRM form data and Indonesian time greetings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-20T10:26:36Z
- **Completed:** 2026-01-20T10:31:38Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- State machine validating transitions between 8 ARI conversation states
- Handoff escape hatch ensuring human takeover is always possible
- Context builder creating personalized AI prompts with contact name, form data, and state-specific instructions
- Indonesian time-based greetings (pagi/siang/sore/malam) using WIB timezone
- Message history builder for OpenAI-compatible format with limit

## Task Commits

Each task was committed atomically:

1. **Task 1: Create state machine with transition validation** - `abc58f6` (feat)
2. **Task 2: Create context builder for AI prompts** - `8f648d6` (feat)
3. **Task 3: Update index.ts and add helper utilities** - `51decab` (feat)

## Files Created/Modified

- `src/lib/ari/state-machine.ts` - State transitions, canTransition(), getNextState(), shouldAutoHandoff()
- `src/lib/ari/context-builder.ts` - buildSystemPrompt(), buildMessageHistory(), getTimeBasedGreeting(), extractFormAnswers()
- `src/lib/ari/index.ts` - Updated exports for all new functions and types
- `src/lib/ari/types.ts` - Removed duplicate STATE_TRANSITIONS (now in state-machine.ts)

## Decisions Made

- **STATE_TRANSITIONS consolidation:** Moved from types.ts to state-machine.ts with enhanced rules (qualifying can stay in qualifying, payment can retry)
- **Escape hatch pattern:** canTransition() always returns true for handoff target, checked before normal transition rules
- **Business logic thresholds:** 40+ score needed to move from qualifying to scoring, 70+ score considered "hot" lead for booking
- **Auto-handoff safety:** Conversations stuck in same state >10 messages trigger auto-handoff to prevent infinite loops
- **WIB timezone:** Using UTC+7 for Indonesian time greetings since most users are in Western Indonesia Time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript path alias (@/lib/supabase/types) not resolved when running tsc on single file - fixed by using @/types/database and verifying with full project build

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- State machine ready for use in conversation handler (02-03)
- Context builder ready for generating AI responses (02-04)
- All functions exported from @/lib/ari for easy imports
- No blockers for next phase

---
*Phase: 02-ari-core-conversation*
*Completed: 2026-01-20*
