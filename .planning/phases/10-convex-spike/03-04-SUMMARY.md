---
phase: 03-convex-spike
plan: 04
type: complete
autonomous: true
wave: 3

title: "Convex HTTP Actions for External API Access"
one-liner: "Created HTTP actions for Convex contact lookup and Next.js API route for benchmarking"

---

# Phase 3 Plan 4: Convex HTTP Actions Summary

**Completed:** 2026-01-21
**Duration:** ~5 minutes
**Tasks:** 2/2

---

## Overview

Implemented Convex HTTP actions for external API access and created Next.js API route for performance benchmarking against Supabase. This establishes the headless API endpoints needed for comparing Convex vs Supabase performance on the contact lookup hot path.

---

## Tasks Completed

### Task 1: Create HTTP action for contact lookup (convex/http/contacts.ts)

Created `convex/http/contacts.ts` with:

- **httpRouter** with two routes:
  - `POST /webhook/kapso` - Placeholder for Kapso webhook integration
  - `GET /http/contacts/getByPhone` - Contact lookup endpoint

- **Authentication:** Uses `CRM_API_KEY` environment variable for verification

- **Integration:** Calls `api.contacts.getContextByPhone` query via `ctx.runQuery`

- **Response structure:** Matches Supabase version for fair comparison

**Key implementation details:**

```typescript
http.route({
  path: "/http/contacts/getByPhone",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.CRM_API_KEY) {
      return new Response(
        JSON.stringify({ found: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const workspaceId = url.searchParams.get("workspace_id");

    const result = await ctx.runQuery(
      api.contacts.getContextByPhone,
      { phone, workspace_id: workspaceId }
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

---

### Task 2: Create Next.js API route using Convex

Created `src/app/api/contacts/by-phone-convex/route.ts` with:

- **Identical interface** to Supabase version (`/api/contacts/by-phone`)
- **Same query parameters:** `phone`, `workspace_id`
- **Same authentication:** `x-api-key` header
- **Same response structure:** `{ found, contact, notes, last_interaction, recent_messages }`
- **Timing instrumentation:** Using `withTiming` wrapper for fair comparison

**Key implementation details:**

```typescript
const result = await fetchQuery(
  api.contacts.getContextByPhone,
  { phone: normalizedPhone, workspace_id: workspaceId }
)

const queryTime = Math.round(performance.now() - queryStart)
logQuerySummary('/api/contacts/by-phone-convex', {
  ...metrics,
  queries: [{ name: 'convex.contacts.getContextByPhone', duration: queryTime }],
})
```

---

## Tech Stack Changes

### Added

- **convex/http/contacts.ts** - HTTP actions for external API access
- **src/app/api/contacts/by-phone-convex/route.ts** - Next.js API route using Convex

### Patterns Used

- Convex `httpAction` for HTTP endpoints
- Convex `fetchQuery` for server-side query execution from Next.js
- `withTiming` wrapper for performance instrumentation
- API key authentication (CRM_API_KEY)

---

## Key Links Established

| From | To | Pattern |
|------|-----|---------|
| convex/http/contacts.ts | convex/contacts.ts | `ctx.runQuery(api.contacts.getContextByPhone)` |
| src/app/api/contacts/by-phone-convex/route.ts | convex/contacts.ts | `fetchQuery(api.contacts.getContextByPhone)` |

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Verification Criteria Met

- [x] convex/http/contacts.ts exists with getByPhone HTTP action
- [x] HTTP action verifies CRM_API_KEY
- [x] HTTP action calls getContextByPhone query
- [x] Next.js API route calls Convex via fetchQuery with timing instrumentation
- [x] Response structure matches Supabase version

---

## Success Criteria Met

- [x] Convex HTTP action accepts CRM_API_KEY for authentication
- [x] HTTP action accepts phone and workspace_id query params
- [x] Next.js API route calls Convex query via fetchQuery
- [x] Endpoint returns same structure as Supabase version

---

## Next Steps

1. **Deploy changes to Convex** - Need to run `npx convex dev` or `npx convex deploy` to push HTTP actions
2. **Test HTTP action** - Verify `/http/contacts/getByPhone` endpoint works with convex-test.html
3. **Run benchmarks** - Compare Convex vs Supabase performance on contact lookup
4. **03-03-PLAN** - Benchmark Convex vs Supabase execution
