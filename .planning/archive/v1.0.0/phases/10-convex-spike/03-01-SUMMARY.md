---
phase: 03-convex-spike
plan: 01
subsystem: backend
tags: [convex, jwt, supabase, typescript, schema]

# Dependency graph
requires: []
provides:
  - Convex project initialized with matching schema to Supabase
  - Supabase JWT auth provider configured for hybrid architecture
  - Generated TypeScript types for Convex data model
affects: 03-02 (Convex functions for performance comparison)

# Tech tracking
tech-stack:
  added: [convex, @convex-dev/cli]
  patterns: [custom-jwt-auth, schema-matching, hybrid-architecture]

key-files:
  created: [convex/schema.ts, convex/auth.config.ts, convex/_generated/server.d.ts]
  modified: [convex.json]

key-decisions:
  - "Supabase JWT provider using customJwt for auth integration"
  - "Schema matching Supabase tables for fair performance comparison"
  - "Timestamps stored as numbers (Unix ms) in Convex vs timestamptz in Supabase"

patterns-established:
  - "Custom JWT auth with JWKS endpoint verification"
  - "Schema migration patterns with supabaseId field for reference"
  - "Type-safe queries via Convex codegen"

# Metrics
duration: 15min
completed: 2026-01-21
---

# Phase 3 Plan 1: Convex Initialization Summary

**Convex backend initialized with Supabase JWT hybrid auth and schema matching core tables for performance spike**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-21T18:00:00Z
- **Completed:** 2026-01-21T18:15:00Z
- **Tasks:** 3
- **Files modified:** 3 created, 1 modified

## Accomplishments

- Convex project `intent-otter-212` initialized and connected to Next.js 15 app
- Database schema created with 6 tables matching Supabase structure (workspaces, workspaceMembers, contacts, conversations, messages, contactNotes)
- Supabase customJwt provider configured for hybrid authentication using JWKS endpoint
- TypeScript types generated via `npx convex codegen` for type-safe database access

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Convex schema matching core Supabase tables** - `2a0c972` (feat)
2. **Task 2: Configure Supabase JWT provider in auth.config.ts** - `098b3a8` (feat)
3. **Task 3: Initialize Convex project and generate types** - `133f861` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `convex/schema.ts` - Database schema with 6 tables and indexes matching Supabase structure
- `convex/auth.config.ts` - CustomJwt provider configuration for Supabase JWT verification
- `convex.json` - Convex project configuration (modified to add functions/origin)
- `convex/_generated/server.d.ts` - Generated TypeScript types for queries/mutations/actions
- `convex/_generated/dataModel.d.ts` - Generated data model types
- `convex/_generated/api.d.ts` - Generated API client types

## Decisions Made

- **JWT Verification Pattern**: Used customJwt provider with JWKS endpoint from Supabase for token verification, eliminating need to sync secrets
- **Schema Migration Strategy**: Added `supabaseId` fields to all tables to maintain reference to original Supabase records during migration testing
- **Timestamp Format**: Stored as numbers (Unix milliseconds) in Convex vs timestamptz in Supabase - consistent with Convex best practices

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added NEXT_PUBLIC_SUPABASE_URL to Convex environment variables**
- **Found during:** Task 3 (Generating types via codegen)
- **Issue:** Convex codegen required NEXT_PUBLIC_SUPABASE_URL but it wasn't set in Convex env
- **Fix:** Used `npx convex env set NEXT_PUBLIC_SUPABASE_URL` to add the variable
- **Files modified:** Convex environment (not version-controlled)
- **Verification:** Codegen succeeded after env var was set
- **Committed in:** Not committed (env vars are deployment-specific)

**2. [Rule 3 - Blocking] Updated convex.json to suppress warnings**
- **Found during:** Task 3 (Codegen)
- **Issue:** Warning about unknown properties `project` and `team` in convex.json
- **Fix:** Added `functions` and `origin` properties to match current Convex v1.31.5 format
- **Files modified:** convex.json
- **Verification:** Warning eliminated, codegen proceeds cleanly
- **Committed in:** Will be committed as part of Task 3

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for Convex CLI to work. No scope creep.

## Issues Encountered

- **Authentication Gate**: User needed to authenticate with Convex CLI via `npx convex login` - this was expected and documented in the checkpoint
- **Non-interactive Terminal**: Convex CLI couldn't prompt for input in non-interactive mode, required using `CONVEX_DEPLOYMENT` env var and `npx convex env set` instead of `npx convex dev --once`

## User Setup Required

None - authentication completed by user and Convex project already exists.

## Next Phase Readiness

- Convex project initialized with schema matching Supabase
- JWT auth configured for Supabase token verification
- TypeScript types generated for type-safe queries
- Ready for 03-02: Create Convex functions for performance comparison

---
*Phase: 03-convex-spike*
*Completed: 2026-01-21*
