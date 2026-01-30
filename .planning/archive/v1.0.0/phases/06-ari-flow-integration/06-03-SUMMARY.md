---
phase: 06-ari-flow-integration
plan: 03
subsystem: ai-backend
tags: [convex, ai, mouth, consultation-slots, scheduling, routing]
requires:
  - phase: 06-ari-flow-integration
    plan: 01
    provides: Hot-reload workspace configuration (consultationSlots extraction)
  - phase: 03-your-intern-configuration
    provides: Slots tab with workspace.settings.consultation_slots storage
provides:
  - Consultation slot routing integration with workspace config
  - Bot offers only available times from workspace settings
  - Graceful degradation when no slots available
  - Complete hot-reload flow for consultation availability
affects:
  - Future consultation booking flows
  - Scheduling state conversation logic
tech-stack:
  added: []
  patterns:
    - Workspace consultation_slots filter to available-only
    - Format slots for AI prompt injection
    - Graceful fallback messaging for no availability
key-files:
  created: []
  modified:
    - src/lib/ari/scheduling.ts
    - convex/ai/context.ts
    - convex/ai/mouth.ts
    - convex/kapso.ts
key-decisions:
  - "getAvailableSlotsFromConfig filters workspace slots to available: true only"
  - "formatAvailableSlots provides graceful degradation message when no slots"
  - "Consultation slots injected into routing and scheduling state prompts"
  - "Complete data flow: workspace.settings → getAriContext → processARI → Mouth → buildMouthSystemPrompt"
patterns-established:
  - "Filter workspace config arrays by boolean flags (available: true)"
  - "Format workspace data for AI prompt consumption"
  - "Inject state-specific context into system prompts"
duration: 3 minutes
completed: 2026-01-27
---

# Phase 6 Plan 03: Consultation Slots Routing Integration

**Wire routing logic to respect workspace consultation_slots config. Bot offers only available times when suggesting consultation booking.**

## Performance

- **Duration:** ~3 minutes
- **Started:** 2026-01-27T18:44:09Z
- **Completed:** 2026-01-27T18:46:57Z
- **Tasks:** 3/3
- **Files created:** 0
- **Files modified:** 4

## Accomplishments

- Created getAvailableSlotsFromConfig to filter workspace consultation_slots to available-only
- Added formatAvailableSlots helper to format slots for AI prompt consumption
- Integrated consultation slots into routing and scheduling state instructions
- Wired consultationSlots parameter through processARI → Mouth → buildMouthSystemPrompt
- Graceful degradation: Bot says "Tim kami akan menghubungi" when no slots available
- Complete hot-reload flow: Changing Slots tab in Your Intern immediately affects next consultation offer

## Task Commits

1. **Task 1: Add getAvailableSlotsFromConfig for workspace consultation_slots** - `7865f34` (feat)
2. **Task 2: Wire consultation slots into buildMouthSystemPrompt** - `5df4db0` (feat)
3. **Task 3: Wire consultationSlots from processARI to Mouth** - `866a8b9` (feat)

## Files Created/Modified

- `src/lib/ari/scheduling.ts` - Added getAvailableSlotsFromConfig to filter workspace.settings.consultation_slots to available-only; Returns formatted strings (Day HH:MM) for bot prompts
- `convex/ai/context.ts` - Added formatAvailableSlots helper; Added consultationSlots parameter to buildMouthSystemPrompt; Inject formatted slots into routing and scheduling state instructions
- `convex/ai/mouth.ts` - Added consultationSlots parameter to generateMouthResponse args; Pass consultationSlots to buildMouthSystemPrompt
- `convex/kapso.ts` - processARI passes context.consultationSlots to Mouth action

## Decisions Made

- **Workspace config precedence:** Bot offers only slots where `available: true` in workspace.settings.consultation_slots
- **Graceful degradation:** When no slots available, bot says "Tim kami akan menghubungi untuk jadwalkan konsultasi" instead of offering specific times
- **State-specific injection:** Consultation slots appear in routing state (offer consultation) and scheduling state (help choose time)
- **No caching:** consultationSlots fetched fresh on every ARI call via getAriContext (matches Plan 06-01 pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Consultation slot routing complete (Plan 06-03 ✓)
- Bot now respects workspace Slots tab configuration
- Changing available slots in Your Intern immediately affects bot behavior
- Ready for additional ARI flow enhancements (if any)
- All Phase 6 workspace config integration complete (persona, flow stages, scoring rules, consultation slots)

## Technical Notes

**Data Flow:**
1. User configures slots in Your Intern → Slots tab
2. Saved to workspace.settings.consultation_slots array
3. getAriContext fetches workspace.settings on every processARI call
4. consultationSlots extracted: `workspaceSettings.consultation_slots ?? []`
5. Passed through processARI → Mouth → buildMouthSystemPrompt
6. formatAvailableSlots filters to available: true
7. Formatted slots injected into system prompt for routing/scheduling states
8. Bot response includes only available times

**Slot Format:**
```typescript
{
  day: string,           // e.g. "Monday", "Senin"
  time: string,          // e.g. "09:00", "14:30"
  duration_minutes: number,
  available: boolean     // Only true slots offered by bot
}
```

**Prompt Injection Examples:**

*Routing state (Indonesian):*
```
Jadwal konsultasi yang tersedia: Monday 09:00 (60 menit), Tuesday 14:00 (60 menit)

HANYA tawarkan jadwal ini. Jangan kasih opsi lain.
```

*Scheduling state (Indonesian):*
```
## TUGAS SAAT INI: Bantu pilih jadwal konsultasi

Jadwal konsultasi yang tersedia: Monday 09:00 (60 menit), Tuesday 14:00 (60 menit)

HANYA tawarkan jadwal ini. Jangan kasih opsi lain.

Tanya hari mana yang cocok untuk customer.
```

*No slots available:*
```
Tidak ada jadwal konsultasi yang tersedia saat ini. Bilang ke customer: 'Tim kami akan menghubungi untuk jadwalkan konsultasi.'
```

**Verification:**
1. Change slots in Your Intern Slots tab → Save
2. Send test message asking about consultation
3. Bot response includes only currently available slots
4. No restart or cache clear needed

---

*Plan: 06-03*
*Completed: 2026-01-27*
