---
phase: 01-deployment
plan: 01
status: complete
completed: 2026-01-25
---

# Summary: Deployment Plan

## What Was Built

Production deployment of my21staff at https://www.my21staff.com with full authentication and database connectivity.

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Vercel project (my21staff-qyy1) | ✓ | Deployed to production |
| Production URL | ✓ | https://www.my21staff.com |
| Environment variables | ✓ | 14 variables configured via CLI |
| Clerk production mode | ✓ | Custom domain: clerk.my21staff.com |
| Google OAuth | ✓ | Configured in Google Cloud Console |
| Convex auth | ✓ | Updated to use production Clerk |
| Kapso webhook | ✓ | Updated to production URL |

## Requirements Satisfied

- **DEPLOY-01**: Fresh Vercel project created and connected ✓
- **DEPLOY-02**: Production environment variables configured ✓
- **DEPLOY-03**: Domain accessible (www.my21staff.com) ✓
- **DEPLOY-04**: Kapso webhook URL updated to production ✓

## Configuration Details

**Vercel Project:** my21staff-qyy1
**Production URL:** https://www.my21staff.com
**Clerk Domain:** https://clerk.my21staff.com
**Convex Deployment:** https://intent-otter-212.convex.cloud

**DNS Records Added (for Clerk):**
- clerk.my21staff.com → frontend-api.clerk.services
- accounts.my21staff.com → accounts.clerk.services
- clkmail.my21staff.com → mail.dxurlgy5xvib.clerk.services
- clk._domainkey.my21staff.com → dkim1.dxurlgy5xvib.clerk.services
- clk2._domainkey.my21staff.com → dkim2.dxurlgy5xvib.clerk.services

## Issues Encountered

1. **Accidental duplicate project** - CLI created new project instead of linking to existing. Fixed by deleting duplicate and linking to my21staff-qyy1.
2. **Clerk dev mode on production** - Switched to production mode with custom domain.
3. **Google OAuth missing** - Configured OAuth consent screen and credentials in Google Cloud Console.
4. **Clerk organization required** - Created Eagle Overseas Education organization in production Clerk.
5. **Convex auth mismatch** - Updated CLERK_JWT_ISSUER_DOMAIN in Convex to production domain.

## Verification

- [x] Production URL accessible (HTTP 200)
- [x] Clerk auth working (Google sign-in)
- [x] Dashboard loads with Convex data
- [x] Kapso webhook URL updated to production
