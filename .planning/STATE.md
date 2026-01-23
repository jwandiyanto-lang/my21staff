# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** The system that lets you grow
**Current focus:** v3.1 Full Convex + Clerk

## Current Position

Phase: 3 of 7 (Users Table Webhook)
Plan: 03-01 complete
Status: In progress - 1 of 2 plans complete
Last activity: 2026-01-23 — Completed 03-01-PLAN.md

Progress: v1.0 ██████████ | v2.0 ██████████ | v2.1 ██████████ | v2.2 ██████████ | v3.0 ██████████ | v3.1 ███░░░░░░░ (151 plans shipped)

## Performance Metrics

**Velocity:**
- Total plans completed: 151
- Average duration: ~14 min
- Total execution time: ~37.4 hours

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
3. Users table + webhook (user data in Convex) - IN PROGRESS (1/2)
4. User migration + organizations (existing data)
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
- Use internalMutation for webhook functions (not publicly accessible) (03-01)
- Idempotent createUser handles webhook retries (03-01)
- updateUser creates if missing (handles webhook ordering) (03-01)
- ClerkProvider -> ConvexProviderWithClerk -> QueryClientProvider hierarchy (02-01)
- Clerk catch-all route pattern [[...sign-in]] for password reset and MFA flows (02-02)
- Use Clerk appearance API for brand styling (white background, my21staff logo) (02-02)
- Replace custom profile menus with Clerk UserButton (02-02)
- Convex mutations co-located with queries in domain files (e.g., tickets.ts has both queries + mutations)
- Use Id<'tickets'> casting for Convex types from string route params

Recent v3.0 decisions affecting v3.1:
- Convex migration (hybrid: Supabase auth + Convex data) — 25.4x faster (37ms vs 926ms P95)
- Use v.optional(v.any()) for metadata fields
- Snake_case naming in Convex to match Supabase

### Blockers/Concerns

**Convex CLI Bug:** `npx convex deploy` incorrectly reports env var not set (despite `env list` confirming it). Workaround: use Convex Dashboard to deploy or wait for CLI fix. Dev deployment works correctly.

## Session Continuity

Last session: 2026-01-23
Stopped at: Completed 03-01-PLAN.md
Resume: `/gsd:execute-phase 3 --plan 02` to execute Plan 02 (Clerk webhook endpoint)

---
*Last updated: 2026-01-23 — Phase 3 Plan 01 complete*
