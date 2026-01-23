---
phase: 04-user-migration-organizations
plan: 03
subsystem: database
tags: [convex, migration, clerk, user-ids, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: user-id-mapping.json with Supabase UUID to Clerk ID mappings
  - phase: 04-02
    provides: workspace-org-mapping.json for organization context
provides:
  - Migration queries for listing core table records (workspaces, members, contacts, conversations, messages, notes)
  - Migration mutations for batch updating user ID fields
  - TypeScript script for automated user ID updates
  - Migration report at .planning/migrations/user-id-update-report-core.json
affects: [04-04-data-migration, 04-05-n8n-integration, 05-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: [convex-http-client-for-scripts, batch-mutation-pattern]

key-files:
  created:
    - scripts/update-convex-user-ids.ts
    - .planning/migrations/user-id-update-report-core.json
  modified:
    - convex/migrate.ts

key-decisions:
  - "Core tables empty in Convex dev - script ready for production data"
  - "Batch updates in chunks of 100 for messages to avoid payload limits"
  - "Skip non-user sender_type messages when updating sender_id"

patterns-established:
  - "ConvexHttpClient pattern: Use for scripts that run outside Next.js context"
  - "Batch update pattern: Query all records, filter client-side, batch mutations"
  - "UUID detection: Use regex pattern for Supabase UUIDs vs user_ prefix for Clerk"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 4 Plan 03: Core Table User ID Migration Summary

**Migration queries, mutations, and script for updating Supabase UUIDs to Clerk IDs in core Convex tables**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T18:08:54Z
- **Completed:** 2026-01-23T18:13:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added list queries for all 6 core tables (workspaces, workspaceMembers, contacts, conversations, messages, contactNotes)
- Added update mutations for batch user ID updates in each table
- Created comprehensive TypeScript migration script with dry-run support
- Generated migration report (tables currently empty in dev, script ready for production)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add migration queries and mutations** - Already in codebase from previous session (50cb47e added tickets, core queries/mutations pre-existing)
2. **Task 2: Create user ID update script** - `2cb8dd8` (feat)
3. **Task 3: Run user ID update migration** - `51c9292` (feat)

**Plan metadata:** Pending

## Files Created/Modified

- `convex/migrate.ts` - Added listWorkspaces, listWorkspaceMembers, listContacts, listConversations, listMessages, listContactNotes queries; added updateWorkspaceOwnerIds, updateWorkspaceMemberUserIds, updateContactAssignedTo, updateConversationAssignedTo, updateMessageSenderId, updateContactNoteUserIds mutations
- `scripts/update-convex-user-ids.ts` - TypeScript script using ConvexHttpClient to update user IDs (510 lines)
- `.planning/migrations/user-id-update-report-core.json` - Migration execution report

## Decisions Made

1. **Core tables empty in dev:** The Convex development database has 0 records in core tables. Data hasn't been migrated from Supabase yet. Script is ready for when production migration happens.

2. **Batch size for messages:** Used 100-record batches for message updates to avoid Convex payload limits (messages table can be large).

3. **Smart sender_id filtering:** Only update messages where sender_type is "user" - skip contact/bot messages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Network timeout on first run:** ConvexHttpClient fetch timed out initially. Resolved by retry with NODE_OPTIONS flag. Intermittent network issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Migration infrastructure complete for core tables
- Script ready to run against production Convex when data is migrated
- Next: 04-04 (Data Migration) will populate Convex tables, after which this script updates user IDs

---
*Phase: 04-user-migration-organizations*
*Completed: 2026-01-23*
