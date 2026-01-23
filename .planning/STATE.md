# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** The system that lets you grow
**Current focus:** v3.1 Full Convex + Clerk

## Current Position

Phase: 4 of 7 (User Migration + Organizations)
Plan: 04-02 complete - 2 of 6 plans done
Status: In progress
Last activity: 2026-01-23 - Completed 04-02-PLAN.md

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 █████░░░░░ (154 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 153
- Average duration: ~14 min
- Total execution time: ~37.8 hours

**By Milestone:**

| Milestone | Plans | Days |
|-----------|-------|------|
| v1.0 | 14 | <1 |
| v2.0 | 38 | 4 |
| v2.1 | 30 | 3 |
| v2.2 | 23 | <1 |
| v3.0 | 21 | 3 |

## Accumulated Context

### v3.1 Migration Context

**Goal:** Replace Supabase entirely with Convex + Clerk.

**Critical path:**
1. Clerk auth infrastructure (JWT validation for Convex) - DONE
2. Middleware + Provider + Auth UI (user-facing auth) - DONE
3. Users table + webhook (user data in Convex) - DONE
4. User migration + organizations (existing data) - IN PROGRESS (04-01 done)
5. Data migration (remaining Supabase tables)
6. n8n integration (Eagle lead flow)
7. Cleanup (remove Supabase)

**Key risks (from research):**
- Session termination unavoidable (all users logged out)
- User ID mapping: Supabase UUIDs referenced in 10+ tables
- Double webhook migration: Kapso + n8n must both move

### Decisions

All decisions logged in PROJECT.md Key Decisions table.

Recent v3.1 decisions:
- Eagle-only org approach: Only migrate Eagle Overseas due to Clerk free plan limit (04-02)
- My21Staff workspace stays in Supabase: Not converted to org, can add after plan upgrade (04-02)
- external_id for ID mapping: Set Supabase UUID as external_id in Clerk (04-01)
- skip_password_requirement: Migrated users use Forgot Password flow (04-01)
- Manual PATCH for existing OAuth users: Update external_id instead of failing (04-01)
- Convex HTTP endpoints use `.convex.site` domain (not `.convex.cloud`) (03-02)
- Web Crypto API for svix signature verification (Convex doesn't support Node.js crypto) (03-02)
- HTTP routes must be in `convex/http.ts` (Convex ignores `_internal/` for HTTP) (03-02)
- Use internalMutation for webhook functions (not publicly accessible) (03-01)
- Idempotent createUser handles webhook retries (03-01)
- updateUser creates if missing (handles webhook ordering) (03-01)
- ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider hierarchy (02-01)
- Clerk catch-all route pattern [[...sign-in]] for password reset and MFA flows (02-02)
- Use Clerk appearance API for brand styling (white background, my21staff logo) (02-02)
- Replace custom profile menus with Clerk UserButton (02-02)

Recent v3.0 decisions affecting v3.1:
- Convex migration (hybrid: Supabase auth + Convex data) - 25.4x faster (37ms vs 926ms P95)
- Use v.optional(v.any()) for metadata fields
- Snake_case naming in Convex to match Supabase

### User Migration Status

**Migrated users:** 2/2 (100%)

| Email | Supabase UUID | Clerk ID | Notes |
|-------|---------------|----------|-------|
| manjowan@gmail.com | e09597ff-4b0f-4e7b-b6c7-c74a47e9457e | user_38fLdL8Y1qHQIYQob1u1FtR9fEL | OAuth user updated |
| jwandiyanto@gmail.com | d7012f0e-54a7-4013-9dfa-f63057040c08 | user_38fViPWAnLiNth62ZaAJj3PQDWU | Super-admin |

**Mapping file:** `.planning/migrations/user-id-mapping.json`

### Organization Migration Status

**Migrated orgs:** 1/2 (eagle-only per user decision)

| Workspace | Supabase ID | Clerk Org ID | Status |
|-----------|-------------|--------------|--------|
| Eagle Overseas | 25de3c4e-b9ca-4aff-9639-b35668f0a48a | org_38fXP0PN0rgNQ2coi1KsqozLJYb | Migrated |
| My21Staff | 0318fda5-22c4-419b-bdd8-04471b818d17 | N/A | Not migrated (free plan limit) |

**Mapping file:** `.planning/migrations/workspace-org-mapping.json`

### Blockers/Concerns

**Convex CLI Bug:** `npx convex deploy` incorrectly reports env var not set (despite `env list` confirming it). Workaround: use Convex Dashboard to deploy or wait for CLI fix. Dev deployment works correctly.

## Session Continuity

Last session: 2026-01-23
Stopped at: Completed 04-02-PLAN.md
Resume: `/gsd:execute-phase 4` to continue Phase 4 (next: 04-03 Data Migration)

---
*Last updated: 2026-01-23 - Plan 04-02 complete*
