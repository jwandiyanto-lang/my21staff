# 07-07 Summary: Delete Supabase Files

## Status: BLOCKED

**Plan:** 07-07-PLAN.md
**Objective:** Remove all Supabase code, packages, and configuration from the codebase
**Duration:** N/A (blocked)
**Commits:** None

---

## Discovery

Upon attempting to execute this plan, discovered that **24 files still actively import and use `@/lib/supabase`**. The previous migration plans (07-01 through 07-06) only migrated **API routes**, not the dashboard/portal **page components** or **client components**.

Deleting Supabase files would break the build, violating the plan's must_have: "Build passes with Supabase fully removed"

---

## Files Still Using Supabase (24 total)

### Server Components (using `@/lib/supabase/server`) - 18 files

| File | Usage |
|------|-------|
| `src/app/(dashboard)/[workspace]/page.tsx` | Workspace dashboard |
| `src/app/(dashboard)/[workspace]/inbox/page.tsx` | Inbox page |
| `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx` | Contact details |
| `src/app/(dashboard)/[workspace]/settings/page.tsx` | Settings page |
| `src/app/(dashboard)/[workspace]/support/page.tsx` | Support page |
| `src/app/(dashboard)/[workspace]/support/[id]/page.tsx` | Support detail |
| `src/app/(dashboard)/[workspace]/knowledge-base/page.tsx` | Knowledge base |
| `src/app/(dashboard)/[workspace]/integrations/page.tsx` | Integrations |
| `src/app/(dashboard)/[workspace]/website/page.tsx` | Website CMS |
| `src/app/(dashboard)/[workspace]/layout.tsx` | Dashboard layout |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `src/app/(dashboard)/admin/clients/page.tsx` | Admin clients |
| `src/app/(dashboard)/admin/layout.tsx` | Admin layout |
| `src/app/portal/layout.tsx` | Portal layout |
| `src/app/portal/support/page.tsx` | Portal support |
| `src/app/portal/support/[id]/page.tsx` | Portal support detail |
| `src/app/webinars/[workspace]/[slug]/page.tsx` | Webinar page |
| `src/app/articles/[workspace]/[slug]/page.tsx` | Article page |

### Client Components (using `@/lib/supabase/client`) - 6 files

| File | Usage |
|------|-------|
| `src/components/workspace/sidebar.tsx` | Navigation sidebar |
| `src/components/workspace/workspace-switcher.tsx` | Workspace dropdown |
| `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx` | Inbox real-time |
| `src/app/(dashboard)/[workspace]/inbox/message-thread.tsx` | Message display |
| `src/components/inbox/appointment-card.tsx` | Appointment UI |
| `src/components/auth/login-modal.tsx` | Auth modal |

---

## Must-Haves Analysis

| Must-Have | Status | Reason |
|-----------|--------|--------|
| Supabase lib files deleted | ❌ BLOCKED | 24 files depend on them |
| Supabase types file deleted | ❌ BLOCKED | Types used by client components |
| @supabase packages removed | ❌ BLOCKED | Packages actively imported |
| No code imports from @/lib/supabase | ❌ BLOCKED | 24 files still import |
| Build passes with Supabase fully removed | ❌ BLOCKED | Would fail immediately |

---

## Root Cause

The migration scope in phases 07-01 through 07-06 focused on:
- ✅ API routes (`src/app/api/...`)
- ✅ ARI processor and supporting files
- ✅ Real-time query utilities

But did NOT include:
- ❌ Dashboard page components
- ❌ Portal page components
- ❌ Client-side components (sidebar, workspace switcher)
- ❌ Public pages (webinars, articles)

---

## Recommended Next Steps

### Option 1: Create Gap Closure Plan (Recommended)

Create plan 07-07a (or use `--gaps` flag on phase) to migrate the 24 remaining files:

**Task grouping:**
1. **Dashboard layouts** (2 files): layout.tsx files that set up auth context
2. **Dashboard pages** (10 files): Server components fetching workspace data
3. **Portal components** (3 files): Portal layout and support pages
4. **Client components** (6 files): Real-time components using Supabase client
5. **Public pages** (3 files): Article and webinar public pages

**Migration pattern:**
- Server components: Replace `createClient()` with `ConvexHttpClient`
- Client components: Replace Supabase hooks with `useQuery`/`useMutation` from Convex

### Option 2: Defer to v3.2

Mark v3.1 as "Convex data layer complete" but retain Supabase for:
- Legacy server-side data fetching in pages
- Real-time subscriptions in client components

Complete removal in separate milestone.

---

## Artifacts

- No files modified
- No commits created
- Build still passes (Supabase files retained)

---

## Completion

**Plan 07-07 BLOCKED** - Cannot proceed without additional migration work.

The phase goal "Remove all Supabase code" cannot be achieved with current plan set. Gap closure plans needed before re-attempting.
