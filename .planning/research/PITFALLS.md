# Domain Pitfalls: Kapso Integration & Production Debugging

**Project:** my21staff v3.4 Kapso Inbox Integration + Your Intern Debug
**Researched:** 2026-01-27
**Focus:** Common mistakes when integrating third-party WhatsApp components with Convex backends and debugging production crashes

---

## Executive Summary

Integrating Kapso's `whatsapp-cloud-inbox` with a custom Convex backend introduces three high-risk failure modes:

1. **Data Structure Mismatch** — The external component expects specific Convex query shapes; changing filters breaks assumptions
2. **Hydration Crashes (Dev vs. Prod)** — Dev mode mock data differs from production subscriptions, causing SSR/client render divergence
3. **Your Intern Crash Root Causes** — Missing environment checks, async hook calls, and state initialization errors during SSR

Each pitfall has specific prevention strategies tied to your current architecture.

---

## Critical Pitfalls

### Pitfall 1: Component API Expectation Mismatch

**What goes wrong:**
You integrate Kapso's `whatsapp-cloud-inbox` component which expects data in a specific schema. Your existing Inbox works because you manually shape data (`MOCK_INBOX_DATA` transformation in `inbox-client.tsx`). When you swap components:
- Kapso component expects fields like `conversation.metadata.lastMessageAt` (nested)
- Your Convex query returns `conversation.last_message_at` (flat)
- Component silently renders nothing, or crashes with undefined property access

**Why it happens:**
Third-party components aren't written for your schema. They assume their own data structures. You must either:
1. Shape all data to match their expectations (adapter pattern)
2. Convince them to accept your schema (unlikely with closed components)
3. Create a translation layer that converts between schemas

The trap: Component documentation shows example data that "looks right" but doesn't match your actual Convex types.

**Consequences:**
- Conversations don't render in Inbox
- Filter/search features malfunction silently
- Real-time updates don't propagate to the UI
- You debug for 2+ hours before realizing it's a schema mismatch

**Evidence:**
Your current `inbox-client.tsx` (line 27-59) already does this translation work:
```typescript
const MOCK_INBOX_DATA = {
  conversations: MOCK_CONVERSATIONS.map((conv) => ({
    _id: conv.id as Id<'conversations'>,
    status: conv.status,
    // ... manual field mapping
  })),
}
```

When you replace this with Kapso's component, you need the same adapter for production Convex data.

**Prevention:**
1. **Before integrating:** Read Kapso component's TypeScript interfaces for required data shape
2. **Create an adapter function:**
   ```typescript
   function adaptConvexToKapsoFormat(convexConversation: ConversationType) {
     return {
       id: convexConversation._id,
       messages: convexConversation.messages.map(m => ({
         id: m._id,
         content: m.body,
         timestamp: m.created_at,
         // ... all required fields
       }))
     }
   }
   ```
3. **Test against component's expected types** — Use TypeScript strict mode to catch missing/wrong fields early
4. **Keep both implementations temporarily** — Run side-by-side until you're confident data flows correctly

**Detection:**
- Component renders empty
- No errors in console (it silently falls back)
- Convex subscription shows data in dev tools, but component shows nothing
- Filter buttons exist but don't change visible conversations

**Phase responsibility:** Phase 1 (Kapso replacement) — must validate schema before full swap

---

### Pitfall 2: Hydration Mismatch (Dev Mock vs. Prod Subscriptions)

**What goes wrong:**
Your app works perfectly in dev mode (`/demo`) because `isDevMode()` returns mock data:
```typescript
const convexData = useQuery(
  api.conversations.listWithFilters,
  isDevMode() ? 'skip' : { workspace_id: workspaceId, ... }
)
const data = isDevMode() ? MOCK_INBOX_DATA : convexData
```

On production (`my21staff.com`):
- Server renders with Convex subscription
- Client hydrates and calls `useQuery` again
- If subscription data changes between server render and client render → hydration mismatch
- React throws: "Text content does not match server-rendered HTML"
- Page crashes or shows blank

**Why it happens:**
Next.js SSR renders on server, then hydrates on client. If the same component renders different content:
- Server: Sees 5 conversations
- Client: Subscription fires, now sees 6 conversations (new message arrived)
- Mismatch → crash

With dev mode, you avoid real subscriptions entirely, so this never happens locally.

**Evidence:**
Your INTEGRATION_CHECK_V3.3.md notes (line 99):
> Real-time sync: PARTIAL — Dev mode doesn't sync; production uses Convex subscriptions

This is the exact mismatch vector.

**Consequences:**
- Works in dev (`/demo`), crashes in production
- Error only appears after deployment
- Hard to reproduce locally
- Takes hours to debug because "it works on my machine"

**Prevention:**
1. **Never skip Convex queries in server components** — Use `fetchQuery` instead:
   ```typescript
   // BAD (what inbox does now):
   const data = useQuery(...) // client hook, can't use in SSR

   // GOOD (for SSR pages):
   export const MyPage = async () => {
     const data = await fetchQuery(api.conversations.listWithFilters, args)
     return <InboxClient initialData={data} />
   }
   ```

2. **Implement Suspense + streaming for subscriptions:**
   ```typescript
   <Suspense fallback={<Skeleton />}>
     <InboxClient workspaceId={workspaceId} />
   </Suspense>
   ```

3. **Add explicit dev mode checks before integration:**
   ```typescript
   if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
     // Client only, safe from SSR
   }
   ```

4. **Test in production-like environment before deployment:**
   ```bash
   npm run build
   npm run start  # Runs with SSR, not dev server
   ```

5. **Mock data must match production schema exactly** — Your `MOCK_INBOX_DATA` needs same timestamp format, same field types, same nested structure as Convex queries return

**Detection:**
- App works at `localhost:3000` but crashes on Vercel
- Console shows React hydration errors (specific text content mismatch)
- Page is blank after initial paint
- Error happens during page load, not user interaction

**Phase responsibility:** Integration testing phase (before production swap) — must verify dev/prod parity

---

### Pitfall 3: Real-Time Subscription Not Re-Running on Filter Changes

**What goes wrong:**
Your current inbox filters work because they're client-side:
```typescript
const filteredConversations = useMemo(() => {
  // Filter client-side after query loads
  let filtered = [...data.conversations]
  if (statusFilter.length > 0) {
    filtered = filtered.filter(c => statusFilter.includes(c.contact.lead_status))
  }
  return filtered
}, [data?.conversations, statusFilter, tagFilter, viewMode])
```

When you replace with Kapso component:
- Kapso's own filtering logic may not know about your `statusFilter` state
- Component filters its own data, but real-time subscription doesn't re-run
- You change filter → UI updates with old data → confusion

**Why it happens:**
Convex subscriptions are smart — they re-run when query dependencies change. But:
- If you pass filtered data to a component, subscription doesn't know about filter changes
- Component might cache data and not request updates
- Two sources of truth (Convex query + component's internal cache)

**Consequences:**
- User selects "Hot" status filter → sees old list anyway
- User thinks feature is broken
- UI feels sluggish or unresponsive
- Filter buttons exist but don't work

**Evidence:**
Your `inbox-client.tsx` passes all conversations to `ConversationList`:
```typescript
<ConversationList
  conversations={filteredConversations}  // Already filtered client-side
  selectedId={selectedConversationId}
  onSelect={setSelectedConversationId}
  members={data.members}
/>
```

If Kapso component doesn't know about this filtering, it won't update.

**Prevention:**
1. **Keep Convex query filtering, not component filtering:**
   ```typescript
   // GOOD: Filter at query level
   const convexData = useQuery(
     api.conversations.listWithFilters,
     {
       workspace_id: workspaceId,
       statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
       tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
     }
   )

   // Then pass directly to component, no client-side filtering
   <KapsoInbox data={convexData} />
   ```

2. **Verify Kapso component accepts filter props** — Read its documentation for how to control filtering
3. **Use TanStack Query cache invalidation explicitly:**
   ```typescript
   const queryClient = useQueryClient()
   const handleFilterChange = (newFilter) => {
     setStatusFilter(newFilter)
     // Force Convex to re-run query
     queryClient.invalidateQueries({
       queryKey: ['conversations', workspaceId, newFilter]
     })
   }
   ```

4. **Test filter → wait for update → select conversation cycle** before deploying

**Detection:**
- Filter buttons highlight but conversations don't change
- Filtering works on page reload (not in real-time)
- UI shows "no conversations" but DevTools show data exists
- Search works but status filter doesn't

**Phase responsibility:** Phase 2 (Real-time integration) — must verify filters trigger subscriptions

---

## Your Intern Page Crash — Specific Pitfalls

### Pitfall 4: SSR Hook Calls in Server Components

**What goes wrong:**
Your `knowledge-base-client.tsx` uses client hooks:
```typescript
'use client'
const [activeTab, setActiveTab] = useState('persona')
```

But if the parent page component tries to use Clerk or Convex hooks during SSR:
```typescript
// In page.tsx (server component)
const data = useQuery(api.workspaces.getBySlug) // ← Can't use hooks on server!
```

Next.js crashes because you're calling client-only hooks in a server context.

**Why it happens:**
- Clerk's `useAuth()` hook doesn't work during SSR
- Convex's `useQuery()` hook doesn't work on the server
- Your Your Intern page likely fetches workspace data on the server, then passes to client component
- If the page tries to do this with hooks instead of async functions, it crashes

**Evidence:**
Your INTEGRATION_CHECK notes mention:
> Settings page SSR auth crash (gap closure - move AI config to client)

This was fixed in Phase 06-03, but the pattern might repeat in the Your Intern page.

**Consequences:**
- Page returns 500 Internal Server Error in production
- Works in dev because dev mode bypasses auth
- Error: "useAuth is not a valid hook call"
- Cannot access workspace data

**Prevention:**
1. **Use `fetchQuery` for server-side data:**
   ```typescript
   // page.tsx (server component)
   import { fetchQuery } from 'convex/nextjs'

   export default async function YourInternPage() {
     const workspace = await fetchQuery(api.workspaces.getBySlug, {
       slug: params.workspace
     })
     return <KnowledgeBaseClient workspace={workspace} />
   }
   ```

2. **Never import hooks in server components:**
   ```typescript
   // BAD in page.tsx:
   import { useAuth } from '@clerk/nextjs'

   // GOOD in page.tsx:
   import { auth } from '@clerk/nextjs/server'
   ```

3. **Add `'use client'` only to components that need hooks**

4. **Test with `npm run build && npm run start`** (catches SSR issues)

**Detection:**
- 500 error on Vercel, works on localhost
- Console shows "useAuth is not a valid hook"
- Error mentions "cannot be used in a server context"
- Page renders in dev but not production

**Phase responsibility:** Phase 1 (Your Intern debug) — must trace exact error with production logs

---

### Pitfall 5: Missing DevMode Check in New Features

**What goes wrong:**
Your Your Intern page has 5 tabs with forms. If any tab:
- Makes a Convex mutation
- Reads from Convex
- Uses Clerk organizations

And doesn't have a `isDevMode()` check, it will crash in `/demo` mode.

Example:
```typescript
// PersonaTab.tsx
export function PersonaTab({ workspaceId }: { workspaceId: string }) {
  const mutation = useMutation(api.workspaces.updateARI) // ← No dev mode check

  const handleSave = async (data) => {
    await mutation({ workspace_id: workspaceId, ...data })
  }
}
```

On `/demo`, `workspaceId` is a string ID but `useMutation` tries to call Convex API → crash.

**Why it happens:**
When you added Your Intern in v2.2, it wasn't designed for dev mode. The dev mode bypass was added later in v3.2. New code doesn't know about this pattern.

**Evidence:**
Your `mock-data.ts` has no mock functions for ARI config:
```typescript
// Only these mocks exist:
MOCK_CONVERSATIONS, MOCK_TEAM_MEMBERS, MOCK_CONTACTS, getNotesForContact
// Missing: MOCK_ARI_CONFIG, MOCK_SCORING_RULES, etc.
```

**Consequences:**
- `/demo` crashes when visiting Your Intern tab
- Users testing locally can't access the feature
- Can't test UI without running full Convex backend
- Feature development is slow (need Convex running)

**Prevention:**
1. **Add dev mode check to all new mutations/queries:**
   ```typescript
   const PersonaTab = ({ workspaceId }) => {
     const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

     const mutation = useMutation(
       isDevMode ? undefined : api.workspaces.updateARI
     )

     const handleSave = async (data) => {
       if (isDevMode) {
         console.log('Dev mode: would save', data)
         return
       }
       await mutation({ workspace_id: workspaceId, ...data })
     }
   }
   ```

2. **Add mock data for Your Intern:**
   ```typescript
   // mock-data.ts
   export const MOCK_ARI_CONFIG = {
     workspace_id: MOCK_WORKSPACE_ID,
     persona_name: 'Ari',
     greeting_message: 'Hello!',
   }
   ```

3. **Test every Your Intern tab at `localhost:3000/demo`**

4. **Add a checklist to PR template:** "All new Convex calls have `isDevMode()` check"

**Detection:**
- `/demo` page throws error when clicking tabs
- Works at `localhost:3000/[workspace]/knowledge-base`
- Error message mentions Convex API or mutation
- Console shows "Cannot read property of undefined"

**Phase responsibility:** Phase 1 (Your Intern debug) — add dev mode bypass before production swap

---

## Moderate Pitfalls

### Pitfall 6: Component Library Styling Conflicts

**What goes wrong:**
Kapso's `whatsapp-cloud-inbox` might use Tailwind CSS or CSS modules. Your app uses Shadcn/ui (Tailwind). If:
- Both use same Tailwind config → style collisions
- Kapso uses inline styles → overrides your theme
- Kapso uses CSS-in-JS → conflicts with your CSS class names

Result: Conversations render with wrong colors, broken layout, unclickable buttons.

**Prevention:**
1. Install Kapso component in an isolated div with CSS reset
2. Check Kapso's CSS imports and bundle size
3. Test theme switching (dark/light mode) after integration
4. Use CSS modules for Kapso if needed to isolate styles

**Detection:**
- Component renders but colors are wrong
- Layout is broken (components overlap)
- Dark mode doesn't apply to Kapso component
- Buttons don't respond to hover

---

### Pitfall 7: Missing Dependency Updates for Kapso

**What goes wrong:**
Kapso's component might depend on Next.js 14 but your project uses Next.js 15. Incompatibility causes:
- Build errors
- Runtime crashes
- Type mismatches

**Prevention:**
1. Check Kapso's `package.json` for Next.js version requirement
2. Run `npm list next` to verify compatibility
3. Test full build: `npm run build`
4. Look for peer dependency warnings during install

**Detection:**
- Build fails with "cannot find module"
- TypeScript errors about undefined types
- Component doesn't render (blank page)

---

### Pitfall 8: Async Initialization in Client Components

**What goes wrong:**
Your Inbox component is marked `'use client'` but tries to wait for Convex subscription:
```typescript
'use client'

export function InboxClient() {
  // This waits for data, but component is rendered immediately
  const data = useQuery(api.conversations.listWithFilters, ...)

  if (data === undefined) return <Skeleton />
  // Data will be undefined until subscription connects
}
```

If Kapso component doesn't handle undefined data well, it crashes.

**Prevention:**
1. **Provide initial data from server:**
   ```typescript
   <Suspense fallback={<Skeleton />}>
     <InboxClient initialData={serverData} />
   </Suspense>
   ```

2. **Ensure component gracefully handles loading state:**
   ```typescript
   if (!data) return null // Don't render Kapso component until data exists
   ```

3. **Test network throttling** — Simulate slow Convex connection

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: Kapso Swap | Data schema mismatch | Component expects different field names/structure | Create adapter function before integration; validate TypeScript types |
| Phase 1: Your Intern Debug | SSR hook calls | `useAuth()` called in server component | Use `fetchQuery` on server, pass data to client components |
| Phase 1: Your Intern Debug | Missing dev mode check | `/demo` crashes on new Convex calls | Add `isDevMode()` guard to all mutations; create mock data |
| Phase 2: Real-time integration | Hydration mismatch | Dev/prod schemas differ | Ensure mock data exactly matches Convex schema |
| Phase 2: Real-time integration | Filter logic location | Client-side filters don't trigger subscription re-runs | Move filtering to Convex query level, not component level |
| Phase 2: Real-time integration | Component caching | Kapso caches data without knowing about filter changes | Test filter → wait → verify update cycle |
| Production deployment | Environment secrets | Wrong Convex deployment URL or API keys | Verify all env vars match between dev/prod (use checklist) |
| Production deployment | Styling conflicts | Kapso styles override your design system | Isolate component in scoped CSS or shadow DOM |

---

## Summary: Prevention Strategy by Incident

### "Component Renders Empty"
1. Check schema mismatch (Pitfall 1)
2. Verify dev mode is not enabled in production
3. Inspect network tab — is Convex subscription connecting?
4. Log component's props in browser console

### "Works in Dev, Crashes in Prod"
1. Check for SSR hook calls (Pitfall 4)
2. Verify hydration parity (Pitfall 2)
3. Test with `npm run build && npm run start`
4. Check Vercel logs for error messages

### "Filters Don't Work"
1. Verify filters modify Convex query params (Pitfall 3)
2. Check if component has its own filter logic
3. Ensure subscription re-runs on filter state change
4. Test manually with TanStack DevTools

### "Your Intern Tabs Crash"
1. Check for `useAuth()` in server component (Pitfall 4)
2. Verify all mutations have `isDevMode()` check (Pitfall 5)
3. Check mock data exists for new features (Pitfall 5)
4. Run at `/demo` to verify dev mode works

---

## Sources

- [Kapso WhatsApp Cloud Inbox GitHub](https://github.com/gokapso/whatsapp-cloud-inbox)
- [Kapso Documentation](https://docs.kapso.ai/)
- [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [Resolving Hydration Errors in Next.js - LogRocket Blog](https://blog.logrocket.com/resolving-hydration-mismatch-errors-next-js/)
- [Convex Real-Time Database Guide](https://docs.convex.dev/home)
- [React Query Cache Invalidation Strategies](https://borstch.com/blog/development/strategies-for-effective-query-invalidation-and-cache-management-react-query-library)
- [Next.js SSR Debugging Guide - Sentry Blog](https://blog.sentry.io/next-js-debugging-tips-and-techniques-from-dev-to-prod/)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)

---

*Created: 2026-01-27 for v3.4 Milestone Research*
*Scope: Kapso Integration + Your Intern Debugging*
