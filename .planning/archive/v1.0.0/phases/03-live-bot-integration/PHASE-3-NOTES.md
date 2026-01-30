# Phase 3: Live Bot Integration - Pre-Planning Notes

**Date:** 2026-01-29
**Status:** Awaiting Phase 2.1 completion

## Critical Issue Identified During Phase 2.1

### ARI Config API 500 Errors (Issues #1, #2, #7)

**Current Status:** NOT RESOLVED - Deferred to Phase 3

**Root Cause Investigation:**
The ARI Config API (`/api/workspaces/[id]/ari-config`) returns 500 errors in production. During Phase 2.1 verification, we discovered:

1. **Authentication Issue:** The `requireWorkspaceMembership()` function expects a Convex workspace ID, but the API route passes the workspace slug ("eagle-overseas")

2. **Attempted Fix:** Modified the route to fetch workspace first, then pass `workspace._id` to auth function

3. **Result:** Fix broke Settings page, was reverted

**Why This Belongs in Phase 3:**
- This API is specifically for "Your Intern" bot configuration
- Phase 3 is "Live Bot Integration" - the proper time to fix bot-related APIs
- Phase 2.1 focuses on production bugs that block core CRM functionality
- The ARI Config is for bot features, not core CRM

**Action Required for Phase 3:**
1. Properly fix the auth flow for ARI Config API
2. Ensure workspace slug vs ID is handled correctly across all endpoints
3. Test Your Intern configuration save/load functionality
4. Verify all 5 Your Intern tabs work (Persona, Flow, Database, Scoring, Slots)

**Related Issues:**
- Issue #1: ARI Config API returns 500
- Issue #2: Your Intern Persona tab "Failed to load persona settings"
- Issue #7: Your Intern configuration saves not persisting

**Technical Details:**
- File: `src/app/api/workspaces/[id]/ari-config/route.ts`
- Auth helper: `src/lib/auth/workspace-auth.ts`
- Convex query: `convex/ari.ts` - `getAriConfig()`
- Problem: Route param `[id]` is slug, but auth expects Convex ID

---

*This note was created during Phase 2.1 execution when we discovered ARI Config issues are bot-specific and should be handled in Phase 3 (Live Bot Integration), not Phase 2.1 (Production Bug Remediation).*
