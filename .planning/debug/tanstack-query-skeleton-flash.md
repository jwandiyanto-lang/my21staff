---
status: resolved
trigger: "TanStack Query cache not preventing skeleton on return navigation"
created: 2026-01-20T12:00:00Z
updated: 2026-01-20T12:30:00Z
---

## Current Focus

hypothesis: CONFIRMED - Root cause identified
test: Code analysis complete
expecting: N/A
next_action: Document findings and recommended fix

## Symptoms

expected: Returning to a previously visited page should load instantly from TanStack Query cache (no skeleton)
actual: Loading skeleton shows every time on return navigation
errors: None
reproduction: Navigate to Inbox -> go to another page -> return to Inbox -> skeleton shows
started: Always been this way (architectural issue)

## Eliminated

- hypothesis: TanStack Query not configured correctly
  evidence: providers.tsx has staleTime: 60s, refetchOnWindowFocus: false - correct settings
  timestamp: 2026-01-20T12:10:00Z

- hypothesis: Cache being cleared on navigation
  evidence: QueryClient is created once with useState, persists across navigations
  timestamp: 2026-01-20T12:12:00Z

## Evidence

- timestamp: 2026-01-20T12:05:00Z
  checked: src/app/(dashboard)/[workspace]/inbox/page.tsx
  found: Page is an async Server Component that fetches data server-side
  implication: Server component ALWAYS runs on navigation, causing loading.tsx to show

- timestamp: 2026-01-20T12:07:00Z
  checked: src/app/(dashboard)/[workspace]/inbox/loading.tsx
  found: Standard loading.tsx with InboxSkeleton
  implication: Next.js App Router shows loading.tsx during server component execution

- timestamp: 2026-01-20T12:10:00Z
  checked: src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
  found: Client component receives initialConversations prop from server, uses local state
  implication: Data is server-fetched then passed down, TanStack Query NOT used for main list

- timestamp: 2026-01-20T12:15:00Z
  checked: src/lib/queries/use-messages.ts
  found: useMessages hook exists but only used for message thread, not conversation list
  implication: Messages benefit from cache, but the page-level loading is unaffected

- timestamp: 2026-01-20T12:18:00Z
  checked: src/app/(dashboard)/[workspace]/database/page.tsx and database-client.tsx
  found: Same pattern - server component fetches, passes to client
  implication: Same issue affects Database page

- timestamp: 2026-01-20T12:20:00Z
  checked: database-client.tsx line 102
  found: useContacts(workspace.id, currentPage) used for pagination ONLY
  implication: Initial load is server-side, TanStack Query kicks in for page 2+

## Resolution

root_cause: |
  **Architecture mismatch between Next.js App Router server components and TanStack Query client-side caching.**

  The flow is:
  1. User navigates to /inbox
  2. Next.js executes async InboxPage server component
  3. loading.tsx shows IMMEDIATELY while server fetches
  4. Server fetches workspace, conversations, members from Supabase
  5. InboxClient receives data as props (initialConversations)
  6. Client renders with server-fetched data

  **The problem:** TanStack Query cache exists on the CLIENT, but the page data is fetched on the SERVER.
  Each navigation triggers a new server render, and loading.tsx shows during that render - BEFORE any
  client-side code can check the cache.

  Key files:
  - src/app/(dashboard)/[workspace]/inbox/page.tsx:13-108 - Server component doing all data fetching
  - src/app/(dashboard)/[workspace]/inbox/loading.tsx:1-5 - Unconditionally shows skeleton
  - src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx:49 - Takes initialConversations prop, doesn't use TanStack Query for list

fix: |
  **Three possible approaches (in order of recommendation):**

  **Option A: Move to client-side data fetching with TanStack Query (Recommended)**

  1. Create useConversations hook similar to useContacts
  2. Simplify page.tsx to only fetch workspace (minimal server work)
  3. Let InboxClient fetch conversations via TanStack Query
  4. Use placeholderData or initialData to hydrate from server if needed
  5. TanStack Query will then serve from cache on return navigation

  Example structure:
  ```typescript
  // page.tsx - minimal server work
  export default async function InboxPage({ params }) {
    const workspace = await getWorkspace(params.workspace) // fast, cacheable
    return <InboxClient workspaceId={workspace.id} />
  }

  // inbox-client.tsx - client fetches with cache
  const { data: conversations, isLoading } = useConversations(workspaceId)
  // First visit: shows skeleton while fetching
  // Return visit: instant from cache, background refetch
  ```

  **Option B: Use Next.js dynamic rendering with suspense boundaries**

  Move loading boundary inside the client component using React Suspense,
  so the page shell renders instantly and only the data area suspends.

  **Option C: Remove loading.tsx and handle loading in client**

  Delete loading.tsx, let the page render immediately with skeleton state
  managed by the client component based on whether data exists.

  **Recommended: Option A** because:
  - Aligns with existing TanStack Query patterns in codebase
  - Enables proper caching semantics
  - Allows optimistic updates and real-time sync
  - Already partially implemented (useContacts exists)

verification: Analysis complete, no code changes made (find_root_cause_only mode)

files_changed: []
