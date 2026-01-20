---
phase: 02-ari-core-conversation
plan: 03
subsystem: ari-webhook
tags: [ari, webhook, kapso, ai, whatsapp, integration]
dependency-graph:
  requires: [02-01, 02-02]
  provides: [ari-processor, webhook-integration, message-logging]
  affects: [02-04, 02-05]
tech-stack:
  added: []
  patterns: [fire-and-forget-async, service-role-db-access]
key-files:
  created:
    - src/lib/ari/processor.ts
  modified:
    - src/app/api/webhook/kapso/route.ts
    - src/lib/ari/index.ts
    - src/types/database.ts
decisions:
  - key: async-non-blocking
    choice: Fire-and-forget pattern for ARI processing
    rationale: Webhook must return 200 immediately; AI processing runs in background
  - key: meta-access-token
    choice: Use meta_access_token column for Kapso API key
    rationale: Database schema uses this column for encrypted credentials
metrics:
  duration: 7m
  completed: 2026-01-20
---

# Phase 2 Plan 3: ARI Webhook Integration and Message Processing Summary

ARI message processor wired into Kapso webhook with fire-and-forget async pattern.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Create ARI message processor | bed3d28 | processor.ts with processWithARI(), getOrCreateARIConversation(), logMessage() |
| 2 | Integrate ARI into webhook handler | 87401c8 | Added ARI processing after message save in processWorkspaceMessages() |
| 3 | Update exports and add workspace ARI check | d03ebdf | Exported processWithARI, isARIEnabledForWorkspace, triggerARIGreeting |

## What Was Built

### ARI Message Processor (src/lib/ari/processor.ts)

Main entry point for AI message handling:

```typescript
export async function processWithARI(params: ProcessParams): Promise<ProcessResult>
```

Flow:
1. Get/create ARI conversation state
2. Load contact data with form answers
3. Get ARI config (or use defaults)
4. Build AI context with prompt builder
5. Check for auto-handoff (>10 messages in same state)
6. Generate AI response via router
7. Log user message + AI response to ari_messages
8. Update conversation state if changed
9. Send response via Kapso

Helper functions:
- `getOrCreateARIConversation()` - State management
- `getARIConfig()` - Config with defaults fallback
- `getRecentMessages()` - History for context
- `logMessage()` - Database logging
- `countMessagesInState()` - Auto-handoff detection
- `isARIEnabledForWorkspace()` - Workspace check
- `triggerARIGreeting()` - Manual testing

### Webhook Integration (src/app/api/webhook/kapso/route.ts)

Added after message save in `processWorkspaceMessages()`:

```typescript
// === ARI PROCESSING (async, non-blocking) ===
for (const messageData of newMessages) {
  // Check if workspace has ARI enabled
  const { data: ariConfig } = await supabase
    .from('ari_config')
    .select('id')
    .eq('workspace_id', workspaceId)
    .single()

  if (!ariConfig) continue // No ARI for this workspace

  // Fire-and-forget: process without awaiting
  processWithARI({...}).catch(err => {
    console.error('[Webhook] ARI processing error:', err)
  })
}
```

Key behaviors:
- Only text messages processed (media skipped)
- Checks ari_config existence before processing
- Credentials decrypted via safeDecrypt
- Errors don't affect webhook 200 response

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Database types missing ARI tables**

- **Found during:** TypeScript compilation
- **Issue:** Generated types didn't include ari_* tables from Phase 01 migrations
- **Fix:** Regenerated types with `npx supabase gen types typescript`, restored convenience aliases
- **Files modified:** src/types/database.ts
- **Commit:** 49c3e62

**2. [Rule 1 - Bug] Wrong column name for Kapso API key**

- **Found during:** TypeScript compilation after type regen
- **Issue:** triggerARIGreeting used `kapso_api_key` but schema uses `meta_access_token`
- **Fix:** Changed to `meta_access_token` and added safeDecrypt import
- **Files modified:** src/lib/ari/processor.ts
- **Commit:** 49c3e62

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Async pattern | Fire-and-forget | Webhook must return 200 fast; AI takes seconds |
| Error handling | Fallback message | "Maaf, ada gangguan teknis. Bentar ya." on failure |
| Message logging | Both user + AI | Full history in ari_messages for context |
| Auto-handoff | 10 message threshold | Prevents infinite loops in stuck conversations |
| Non-text skip | Continue silently | Media support deferred; don't break flow |

## Requirements Addressed

- **ARI-01**: Phone number matching to pull CRM data (via contact lookup)
- **ARI-02**: Greet by name (form data in prompt context)
- **ARI-06**: Maintain context (ari_messages logging, history passed to AI)

## Files Changed

| File | Changes |
|------|---------|
| src/lib/ari/processor.ts | NEW: Main ARI processing logic (597 lines) |
| src/app/api/webhook/kapso/route.ts | +71 lines: ARI integration and credentials helper |
| src/lib/ari/index.ts | +12 lines: Export processor functions |
| src/types/database.ts | Regenerated with ARI tables + aliases |

## Next Phase Readiness

**Ready for 02-04 (Form Validation):**
- processWithARI provides entry point for validation
- Context builder ready for form field extraction
- State machine handles qualifying → scoring flow

**Dependencies complete:**
- AI router (02-01) for model selection
- State machine (02-02) for progression
- Context builder (02-02) for prompts
