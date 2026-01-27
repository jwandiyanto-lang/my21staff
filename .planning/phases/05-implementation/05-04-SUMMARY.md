---
phase: 05-implementation
plan: 04
subsystem: [api, webhook, ai]
tags: [convex, kapso, webhook, whatsapp, ari, ai, sea-lion, grok]

# Dependency graph
requires:
  - phase: 05-02
    provides: Schema, mutations, and query functions for contacts and conversations
  - phase: 05-03
    provides: Conversation query functions for integration
provides:
  - Kapso webhook HTTP action in Convex (/webhook/kapso)
  - Scheduled webhook processor for message handling
  - ARI integration for AI responses
  - Schema extensions for Kapso credentials and ARI state
affects: [05-05, 05-06]

# Tech tracking
tech-stack:
  added: [convex-scheduler, kapso-webhook, ari-bot]
  patterns: [async webhook processing, scheduled mutations, router merging]

key-files:
  created: [convex/http/kapso.ts, convex/kapso.ts, convex/http/index.ts]
  modified: [convex/schema.ts, convex/http/contacts.ts]

key-decisions:
  - "Use ctx.scheduler.runAfter for async webhook processing to prevent Kapso retries"
  - "Store meta_access_token in workspaces table for Kapso API calls"
  - "Create separate ARI tables (ariConfig, ariConversations, ariMessages) for AI bot state"
  - "Support both Sea-Lion (local Ollama) and Grok as AI model fallback"
  - "Merge HTTP routers via http.route() pattern for modularity"

patterns-established:
  - "HTTP router merging: Each module exports router as named export, merged in index.ts"
  - "Async webhook pattern: Respond 200 immediately, schedule processing with runAfter(0)"
  - "PII masking: Phone numbers masked in logs using regex replacement"
  - "Batch processing: Group messages by workspace/phone for efficiency"

# Metrics
duration: 8min
completed: 2026-01-21
---

# Phase 5 Plan 4: Kapso Webhook HTTP Action Summary

**Kapso webhook HTTP action in Convex with async processing, contact/conversation/message creation, and ARI integration for AI responses**

## Performance

- **Duration:** 8 minutes (488 seconds)
- **Started:** 2026-01-21T16:10:41Z
- **Completed:** 2026-01-21T16:18:49Z
- **Tasks:** 5
- **Files modified:** 4

## Accomplishments

- Implemented Kapso webhook HTTP action in Convex with POST/GET endpoints
- Created scheduled webhook processor for async message handling
- Added kapso_phone_id index for efficient workspace lookup
- Integrated ARI processing with Sea-Lion and Grok AI model support
- Extended schema with ARI tables (ariConfig, ariConversations, ariMessages)
- Merged HTTP routers (kapso + contacts) into single entry point

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Kapso webhook types and HTTP router** - `ab451c3` (feat)
2. **Task 2: Create scheduled webhook processor** - `d295d72` (feat)
3. **Task 3: Add kapso_phone_id index** - `edd3dbd` (feat)
4. **Task 4: Add ARI processing function** - `5577276` (feat)
5. **Task 5: Update HTTP router** - `c0e786a` (feat)

**Plan metadata:** (to be committed with STATE.md update)

## Files Created/Modified

- `convex/http/kapso.ts` - Kapso webhook HTTP action with types (MetaWebhookMessage, MetaWebhookPayload), POST handler with signature verification, GET handler for webhook verification
- `convex/kapso.ts` - Scheduled webhook processor (processWebhook, processARI), phone normalization, contact/conversation/message upsert, ARI integration
- `convex/http/index.ts` - Main HTTP router merging kapso and contacts routers
- `convex/schema.ts` - Added by_kapso_phone index, meta_access_token field, ariConfig/ariConversations/ariMessages tables
- `convex/http/contacts.ts` - Updated to export router as named export, removed duplicate webhook route

## Decisions Made

- Used ctx.scheduler.runAfter(0) for async webhook processing to prevent Kapso retries while maintaining processing guarantees
- Stored meta_access_token directly in workspaces table (no encryption for now in Convex, unlike Supabase)
- Created separate ARI tables for bot state management (ariConfig per workspace, ariConversations per contact, ariMessages for history)
- Implemented dual AI model support: Sea-Lion (local Ollama) as primary with Grok as fallback
- Used router merging pattern for modular HTTP actions (each module exports router, merged in index.ts)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Environment variables to configure for Convex deployment:

- `KAPSO_WEBHOOK_SECRET` - HMAC secret for webhook signature verification
- `GROK_API_KEY` - API key for Grok AI model (fallback from Sea-Lion)
- `SEALION_URL` - Ollama endpoint for Sea-Lion model (defaults to http://100.113.96.25:11434)

## Next Phase Readiness

Kapso webhook HTTP action is ready for deployment:

- POST /webhook/kapso receives Meta/WhatsApp payloads and processes async
- GET /webhook/kapso returns hub.challenge for Kapso webhook verification
- Contacts, conversations, messages are created/updated in Convex
- ARI processing scheduled for text messages with enabled workspaces
- HTTP router merged and ready for deployment

The endpoint will be available at: `https://intent-otter-212.convex.cloud/webhook/kapso`

---
*Phase: 05-implementation*
*Completed: 2026-01-21*
