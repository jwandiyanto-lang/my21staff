---
phase: 01-database-inbox-overhaul
plan: 02
subsystem: database
tags: [phone-normalization, e164, kapso, caching, webhook, contacts]

# Dependency graph
requires:
  - phase: 01-01
    provides: messages_v2 table structure (referenced but not modified)
provides:
  - Kapso metadata caching on contacts (kapso_name, kapso_profile_pic, kapso_is_online, kapso_last_seen)
  - E.164 phone normalization utility (normalizePhone, isValidPhone, formatPhoneDisplay)
  - phone_normalized column for consistent contact matching
  - Updated webhook that caches Kapso profile data on message receipt
affects: [02-ari-core, 03-scoring-engine, inbox-ui]

# Tech tracking
tech-stack:
  added: [libphonenumber-js]
  patterns: [E.164 phone normalization, metadata caching via webhook]

key-files:
  created:
    - supabase/migrations/35_contacts_cache_fields.sql
    - src/lib/phone/normalize.ts
  modified:
    - src/app/api/webhook/kapso/route.ts

key-decisions:
  - "Use libphonenumber-js for robust E.164 normalization"
  - "Default country set to Indonesia (ID) for phone parsing"
  - "Cache Kapso metadata on every message receipt for freshness"
  - "Match contacts by phone_normalized instead of raw phone for consistency"

patterns-established:
  - "Phone normalization: Always use normalizePhone() when matching or storing phones"
  - "Kapso caching: Webhook updates cache_updated_at whenever profile data changes"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 01 Plan 02: Kapso Metadata Caching Summary

**E.164 phone normalization with libphonenumber-js and Kapso profile caching on contacts for instant inbox loading**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T08:25:36Z
- **Completed:** 2026-01-20T08:28:15Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added Kapso metadata columns to contacts table (kapso_name, kapso_profile_pic, kapso_is_online, kapso_last_seen, cache_updated_at)
- Created phone_normalized column with E.164 format and backfill migration for existing contacts
- Implemented phone normalization utility using libphonenumber-js (handles 0xxx, +62, 62xxx Indonesian formats)
- Updated Kapso webhook to cache profile data and use normalized phone matching

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Kapso cache fields to contacts** - `81457b1` (feat)
2. **Task 2: Create phone normalization utility** - `6948882` (feat)
3. **Task 3: Update webhook to cache Kapso metadata** - `f812996` (feat)

## Files Created/Modified
- `supabase/migrations/35_contacts_cache_fields.sql` - Migration adding Kapso cache columns and phone_normalized
- `src/lib/phone/normalize.ts` - E.164 phone normalization utility with libphonenumber-js
- `src/app/api/webhook/kapso/route.ts` - Updated to cache Kapso metadata and use normalized phone matching
- `package.json` - Added libphonenumber-js dependency

## Decisions Made
- Used libphonenumber-js over manual regex - robust library with proper country code handling
- Default country ID (Indonesia) - matches primary user base
- Cache on every message - keeps profile data fresh without separate sync job
- Match by phone_normalized - prevents duplicates from different phone format inputs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

**Migration must be applied to Supabase:**

Run the migration in Supabase SQL Editor:
```sql
-- Run: supabase/migrations/35_contacts_cache_fields.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

## Next Phase Readiness
- Phone normalization utility ready for use across codebase
- Contacts table has all cache fields for instant inbox loading
- Webhook caches Kapso metadata automatically
- Ready for Plan 03 (Inbox UI Rebuild) which will display cached data

---
*Phase: 01-database-inbox-overhaul*
*Completed: 2026-01-20*
