---
phase: 06-ari-flow-integration
plan: 01
subsystem: ai-backend
tags: [convex, ai, mouth, hot-reload, persona, flow-stages]
requires:
  - phase: 03-your-intern-configuration
    provides: Persona and Flow tabs with workspace.settings storage
  - phase: 05-real-time-handover
    provides: Real-time sync and conversation gating
provides:
  - Hot-reload workspace configuration for ARI bot behavior
  - Mouth system prompts built from fresh workspace.settings
  - Dynamic persona injection (name, description, tone)
  - Custom flow stage instructions from workspace config
affects:
  - 06-03 (Scoring rules integration)
  - 06-04 (Consultation slots integration)
tech-stack:
  added: []
  patterns:
    - Fresh config fetch on every ARI call (no caching)
    - Fallback to hardcoded values for backward compatibility
    - Optional parameters pattern for persona and flowStages
key-files:
  created: []
  modified:
    - convex/kapso.ts
    - convex/ai/context.ts
    - convex/ai/mouth.ts
key-decisions:
  - "getAriContext fetches workspace.settings on every call (no caching)"
  - "Persona config takes precedence over ariConfig.bot_name"
  - "Flow stages fallback to hardcoded instructions if not configured"
  - "Workspace config changes affect next message immediately (no restart)"
patterns-established:
  - "Workspace config flows: getAriContext → processARI → Mouth → buildMouthSystemPrompt"
  - "Optional config parameters with fallback values for backward compatibility"
  - "Fresh database query pattern ensures hot-reload without cache invalidation"
duration: 3 minutes
completed: 2026-01-27
---

# Phase 6 Plan 01: Mouth Hot-Reload Configuration

**Wire Mouth to read latest Persona/Flow config from workspace.settings on every ARI call for immediate hot-reload behavior**

## Performance

- **Duration:** ~3 minutes
- **Started:** 2026-01-27T18:39:45Z
- **Completed:** 2026-01-27T18:42:13Z
- **Tasks:** 3/3
- **Files created:** 0
- **Files modified:** 3

## Accomplishments

- getAriContext enhanced to extract persona, flow stages, scoring rules, and consultation slots from workspace.settings
- buildMouthSystemPrompt accepts and uses workspace persona config (name, description, tone)
- Mouth generates system prompts from workspace flow stages for greeting and qualifying instructions
- processARI passes fresh workspace config to Mouth on every invocation
- No caching anywhere - config changes in Your Intern immediately visible in next ARI response

## Task Commits

1. **Task 1: Enhance getAriContext to include workspace.settings config** - `a74ff21` (feat)
2. **Task 2: Update buildMouthSystemPrompt to accept workspace config** - `ec1c473` (feat)
3. **Task 3: Wire Mouth to use workspace config from getAriContext** - `41fac1d` (feat)

## Files Created/Modified

- `convex/kapso.ts` - Enhanced getAriContext return object with persona, flowStages, scoringRules, consultationSlots from workspace.settings; Updated processARI to pass workspace config to Mouth
- `convex/ai/context.ts` - Added personaConfig and flowStages optional parameters to buildMouthSystemPrompt; Inject persona into system prompt; Use flow stages for state-specific instructions with hardcoded fallback
- `convex/ai/mouth.ts` - Added persona and flowStages optional args to generateMouthResponse; Pass workspace config to buildMouthSystemPrompt

## Decisions Made

- **No caching:** getAriContext is a mutation that runs fresh on every message, ensuring immediate hot-reload without cache invalidation complexity
- **Backward compatibility:** All workspace config parameters are optional with fallback to existing ariConfig values
- **Persona precedence:** workspace.settings.persona takes precedence over ariConfig.bot_name for bot name
- **Flow stage fallback:** If workspace flow stages not configured, use existing hardcoded greeting/qualifying instructions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Hot-reload configuration working end-to-end (workspace.settings → getAriContext → Mouth → system prompt)
- Persona changes in Your Intern immediately affect next bot response
- Flow stage changes immediately affect conversation instructions
- Ready for Plan 06-03 (Brain scoring rules integration)
- Ready for Plan 06-04 (Consultation slots routing integration)
- Architecture pattern established: optional config parameters with fallback values

## Technical Notes

**Hot-Reload Mechanism:**
- getAriContext mutation runs on every processARI invocation (not cached)
- Fetches workspace.settings from database fresh each time
- Extracts persona, flow_stages, scoring_rules, consultation_slots
- Passes config through processARI → Mouth → buildMouthSystemPrompt
- No in-memory caching at any layer

**Fallback Strategy:**
- persona.name: workspace.settings.persona?.name ?? ariConfig.bot_name ?? "Ari"
- persona.description: workspace.settings.persona?.description ?? ""
- persona.tone: workspace.settings.persona?.tone ?? "friendly"
- flow_stages: workspace.settings.flow_stages ?? []
- If flow stage not found in workspace config, use hardcoded buildGreetingInstructions/buildQualifyingInstructions

**Flow Stage Integration:**
- For state="greeting", search flowStages for stage with name="greeting"
- If found, build instructions from stage.description and stage.questions
- Same pattern for state="qualifying"
- Maintains existing routing instructions (no workspace config override yet)

**Verification:**
1. Change bot_name in Your Intern → Save
2. Send test message to bot
3. Mouth response uses new bot_name immediately
4. No restart or cache clear needed

---

*Plan: 06-01*
*Completed: 2026-01-27*
