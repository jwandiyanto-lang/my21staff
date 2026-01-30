---
phase: 05-central-support-hub
plan: 02
subsystem: storage
tags: [supabase-storage, ticket-attachments, file-upload, rls]

# Dependency graph
requires:
  - phase: 05-01
    provides: tickets table schema
provides:
  - Supabase Storage bucket for ticket attachments
  - Upload helper functions (uploadTicketAttachment, deleteTicketAttachment)
  - POST /api/tickets/[id]/attachments endpoint
affects: [05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-storage, storage-bucket-rls, file-upload-api]

key-files:
  created:
    - supabase/migrations/29_ticket_attachments_storage.sql
    - src/lib/storage/ticket-attachments.ts
    - src/app/api/tickets/[id]/attachments/route.ts
  modified:
    - src/types/database.ts

key-decisions:
  - "Private bucket with RLS policies (not public bucket)"
  - "5MB file size limit, images only (JPEG, PNG, GIF, WebP)"
  - "Path format: {ticket_id}/{timestamp}-{filename}"
  - "Sanitize filename to alphanumeric, dot, dash, underscore"

patterns-established:
  - "Storage bucket RLS: Extract ticket_id from path folder, check ticket access"
  - "File upload API: FormData parsing, type/size validation, return public URL"

# Metrics
duration: 35min
completed: 2026-01-19
---

# Phase 05 Plan 02: Image Attachments Summary

**Supabase Storage bucket for ticket image attachments with RLS policies, upload helpers, and API endpoint**

## Performance

- **Duration:** 35 min
- **Started:** 2026-01-19T06:32:28Z
- **Completed:** 2026-01-19T07:07:00Z
- **Tasks:** 2
- **Files modified:** 15 (3 created, 12 modified for type fixes)

## Accomplishments

- Created 'ticket-attachments' storage bucket with 5MB limit
- RLS policies for upload, view, and delete based on ticket access
- TypeScript upload/delete helpers in src/lib/storage/
- API endpoint for server-side file uploads
- Regenerated database types with admin_workspace_id column

## Task Commits

Each task was committed atomically:

1. **Task 1: Create storage bucket migration** - `b1f59f9` (feat)
2. **Task 2: Create upload helpers and API endpoint** - `dd08c5a` (feat)

**Deviation fix:** `a89369c` (fix: regenerate database types and fix null handling)

## Files Created/Modified

- `supabase/migrations/29_ticket_attachments_storage.sql` - Storage bucket and RLS policies
- `src/lib/storage/ticket-attachments.ts` - Client-side upload/delete helpers
- `src/app/api/tickets/[id]/attachments/route.ts` - Server-side upload API

## Decisions Made

1. **Private bucket with RLS** - Images are not publicly accessible without authentication. RLS policies enforce ticket access.
2. **5MB limit, images only** - Reasonable size for support screenshots. Prevents abuse.
3. **Path format {ticket_id}/{timestamp}-{filename}** - Groups files by ticket, prevents collisions with timestamp.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated database types for admin_workspace_id**
- **Found during:** Task 2 (API endpoint creation)
- **Issue:** `admin_workspace_id` column from 05-01 not in TypeScript types - build failed
- **Fix:** Ran `npx supabase gen types typescript` to regenerate types
- **Side effect:** Regeneration exposed ~20 null-safety issues in existing code that needed fixing
- **Files modified:** src/types/database.ts + 11 component files
- **Verification:** Build passes
- **Committed in:** a89369c

**2. [Rule 3 - Blocking] Fixed null handling across codebase**
- **Found during:** Task 2 build verification
- **Issue:** Regenerated types are stricter (fields like created_at, role, etc. now `string | null`)
- **Fix:** Added null coalescing (`??`), optional chaining (`?.`), and type guards across affected files
- **Files modified:** Multiple dashboard pages, inbox components, contact components
- **Committed in:** a89369c (same commit)

**3. [Rule 3 - Blocking] Added manual Article/Webinar types**
- **Found during:** Task 2 build verification
- **Issue:** articles and webinars tables not in remote database (migration 05 not fully applied)
- **Fix:** Added manual type definitions for Article and Webinar to maintain existing functionality
- **Files modified:** src/types/database.ts
- **Note:** Website content tables need to be created in remote DB (separate issue)
- **Committed in:** a89369c

---

**Total deviations:** 3 auto-fixed (all blocking)
**Impact on plan:** Database type regeneration was necessary for build. Side effects were pre-existing type-safety issues that needed fixing anyway. No scope creep.

## Issues Encountered

- Migration 29 was already applied but bucket needed verification
- Type regeneration revealed that articles/webinars tables don't exist in remote DB (known issue, deferred)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Storage bucket ready for ticket attachments
- Upload API endpoint functional
- Ready for 05-03: Tawk.to Widget Integration
- Note: Website content tables (articles, webinars) should be created in remote DB at some point

---
*Phase: 05-central-support-hub*
*Completed: 2026-01-19*
