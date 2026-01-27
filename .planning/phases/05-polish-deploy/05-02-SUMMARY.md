---
phase: 05-polish-deploy
plan: 02
subsystem: verification
tags:
  - webhook-testing
  - ngrok
  - kapso
  - local-verification

# Dependency graph
requires:
  - ngrok-tunnel-setup
provides:
  - local-verification-complete
affects:
  - deployment-readiness

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ConvexHttpClient for server components

# File tracking
key-files:
  created: []
  modified:
    - src/app/(dashboard)/[workspace]/layout.tsx (fixed Convex fetch)

# Metrics
duration: 45 minutes
completed: 2026-01-25
commits: 2
---

# Phase 05 Plan 02: Webhook Testing Summary

**One-liner:** Local app verification passed; ngrok tunnel testing deferred to production due to static domain issues.

## Execution Summary

### Tasks Completed

| Task | Name | Status | Notes |
| ---- | ---- | ------ | ----- |
| 1 | Start services and configure webhook | ✓ Partial | ngrok tunnel created but static domain offline |
| 2 | Update Kapso webhook URL in dashboard | ✓ Complete | User configured webhook to ngrok URL |
| 3 | Test receive direction | ⏸ Deferred | ngrok static domain not reachable |
| 4 | Verify receive works | ⏸ Deferred | Blocked by ngrok issue |
| 5 | Test send direction | ⏸ Deferred | Blocked by ngrok issue |
| 6 | Verify round-trip works | ⏸ Deferred | Blocked by ngrok issue |
| 7 | Cleanup and document results | ✓ Complete | Results documented |

**Total: 3/7 tasks completed, 4 deferred**

---

## What Was Built

### Bug Fix: Convex HTTP Client in Layout

Fixed workspace layout to use proper ConvexHttpClient instead of raw fetch:

**Before (broken):**
```typescript
const response = await fetch(`${url}/api/query`, {...})
```

**After (working):**
```typescript
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
return await convex.query(api.workspaces.getBySlug, { slug })
```

**Commit:** a3e59a6 - fix(05-02): use ConvexHttpClient in workspace layout

### ngrok Script Updates

Updated `scripts/start-ngrok.js` to support custom port via PORT environment variable.

---

## Verification Results

### Local Verification ✓

| Component | Status | Notes |
|-----------|--------|-------|
| Dev server | ✓ Pass | Running on localhost:3001 |
| Inbox page | ✓ Pass | Loads at /eagle-overseas/inbox |
| Convex connection | ✓ Pass | Queries working |
| Workspace layout | ✓ Pass | Fixed ConvexHttpClient issue |

### Webhook Testing ⏸ Deferred

| Test | Status | Notes |
|------|--------|-------|
| ngrok tunnel | ⚠ Issue | Static domain (provably-unorganizable-luanna.ngrok-free.dev) shows offline |
| Receive direction | ⏸ Deferred | Cannot test without working tunnel |
| Send direction | ⏸ Deferred | Cannot test without working tunnel |
| Round-trip | ⏸ Deferred | Cannot test without working tunnel |

**Root cause:** ngrok free tier static domain experiencing connectivity issues. The tunnel appears "active" locally but external requests return ERR_NGROK_3200 (endpoint offline).

---

## Success Criteria

- [x] Local app loads and works
- [x] Convex connection verified
- [ ] Full round-trip messaging verified — DEFERRED to production
- [x] Test results documented

---

## Recommendations

### For Production Testing

1. **Option A:** Test webhooks directly after Vercel deployment
   - Update Kapso webhook to production URL
   - Send test WhatsApp message
   - Verify in production inbox

2. **Option B:** Retry ngrok with random domain
   - Create new ngrok account for fresh domain
   - Or use `ngrok http 3001 --domain=none` to force random URL

3. **Option C:** Use alternative tunnel service
   - localtunnel: `npx localtunnel --port 3001`
   - Cloudflare Tunnel (requires setup)

### Webhook Test Results for Plan 03

For DEPLOYMENT-READY.md:
- **Receive test:** DEFERRED (ngrok static domain offline)
- **Send test:** DEFERRED (ngrok static domain offline)
- **Local verification:** PASS (app loads, Convex works)

---

## Deviations from Plan

1. **ngrok static domain issues:** Free tier permanent domain not reachable despite tunnel showing "active"
2. **Port conflict:** Dev server ran on 3001 instead of 3000 (another process using 3000)
3. **Convex fetch bug:** Discovered and fixed broken fetch in workspace layout

---

## Notes

- Kapso webhook configuration verified correct in dashboard
- Production webhook URL preserved: `intent-otter-212.convex.site/webhook/kapso`
- Webhook handler code at `src/app/api/webhook/kapso/route.ts` is complete and ready
- Local app verification confirms core functionality works

---

## Next Steps

1. Proceed to Plan 05-03 (environment cleanup + deployment docs)
2. Include deferred webhook testing in deployment readiness checklist
3. Test webhooks after production deployment when Vercel billing resolved
