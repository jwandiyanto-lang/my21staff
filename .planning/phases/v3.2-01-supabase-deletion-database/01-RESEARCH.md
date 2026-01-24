# Phase 1: Supabase Deletion + Database Foundation - Research

**Researched:** 2026-01-24
**Domain:** Supabase removal, Convex migration, n8n integration
**Confidence:** HIGH

## Summary

This research investigates what's needed to complete Phase 1: deleting all Supabase code, rebuilding the Contact Database with Convex, and restoring n8n sync. The codebase is in a hybrid state where API routes use Convex but 24 page/client components still import Supabase directly.

Key findings:
1. **24 files still use Supabase** - 18 server components, 6 client components (documented in 07-07-SUMMARY.md)
2. **Database page already works with Convex** - `database-client.tsx` uses TanStack Query hitting Convex API routes
3. **Contact detail sheet uses Supabase directly** - Must be migrated to use Convex via API routes
4. **n8n webhook already functional** - `convex/n8n.ts` creates leads at `intent-otter-212.convex.site/webhook/n8n`
5. **Navigation sidebar uses Supabase for unread count** - Simple migration to Convex query

**Primary recommendation:** Delete Supabase page files entirely. Keep only database page (already Convex-powered). Migrate contact-detail-sheet and sidebar to Convex. The approach is "delete and rebuild fresh" not "migrate in place."

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | ^1.31.6 | Real-time database & backend | Already deployed, 25.4x faster than Supabase |
| @clerk/nextjs | ^6.36.9 | Authentication | Already integrated, provides auth() |
| TanStack Query | ^5.90.19 | Client-side data fetching | Already used for caching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | User feedback |
| date-fns | ^4.1.0 | Date formatting | Display timestamps |
| zod | ^4.3.5 | Schema validation | Form validation |

### Packages to Remove
| Package | Reason |
|---------|--------|
| @supabase/ssr | ^0.8.0 | No longer needed |
| @supabase/supabase-js | ^2.90.1 | No longer needed |

**Removal command:**
```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

## Architecture Patterns

### Files to DELETE (confirmed from 07-07-SUMMARY.md)

**Server Components (18 files):**
```
src/app/(dashboard)/[workspace]/page.tsx          # Dashboard - rebuild later
src/app/(dashboard)/[workspace]/inbox/page.tsx    # Inbox - rebuild later
src/app/(dashboard)/[workspace]/settings/page.tsx # Settings - rebuild later
src/app/(dashboard)/[workspace]/support/page.tsx  # Support - rebuild later
src/app/(dashboard)/[workspace]/support/[id]/page.tsx
src/app/(dashboard)/[workspace]/knowledge-base/page.tsx
src/app/(dashboard)/[workspace]/integrations/page.tsx
src/app/(dashboard)/[workspace]/website/page.tsx
src/app/(dashboard)/[workspace]/layout.tsx        # Keep but remove Supabase
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/admin/clients/page.tsx
src/app/(dashboard)/admin/layout.tsx
src/app/portal/layout.tsx
src/app/portal/support/page.tsx
src/app/portal/support/[id]/page.tsx
src/app/webinars/[workspace]/[slug]/page.tsx
src/app/articles/[workspace]/[slug]/page.tsx
```

**Client Components (6 files):**
```
src/components/workspace/sidebar.tsx              # Migrate to Convex
src/components/workspace/workspace-switcher.tsx   # Migrate to Convex
src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx
src/app/(dashboard)/[workspace]/inbox/message-thread.tsx
src/components/inbox/appointment-card.tsx
src/components/auth/login-modal.tsx               # Likely dead code (Clerk handles auth)
```

**Supabase lib files (3 files):**
```
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/config.ts
```

### Files to KEEP (already Convex-powered)

```
src/app/(dashboard)/[workspace]/database/page.tsx           # Uses Convex via fetchQuery
src/app/(dashboard)/[workspace]/database/database-client.tsx # Uses TanStack Query
src/app/(dashboard)/[workspace]/team/page.tsx               # Uses Clerk
```

### Pattern 1: Server Component with Convex
**What:** Server components fetch via `fetchQuery` from `convex/nextjs`
**Example (database/page.tsx - already working):**
```typescript
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { workspace: workspaceSlug } = await params

  // Production: validate workspace exists via Convex
  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <DatabaseClient workspace={{ id: workspace._id, name: workspace.name, slug: workspace.slug }} />
}
```

### Pattern 2: Client Component with TanStack Query
**What:** Client components use TanStack Query hitting API routes that use Convex
**Example (use-contacts.ts - already working):**
```typescript
export function useContacts(workspaceId: string, page: number) {
  return useQuery({
    queryKey: ['contacts', workspaceId, page],
    queryFn: async (): Promise<ContactsResponse> => {
      const response = await fetch(
        `/api/contacts?workspace=${workspaceId}&page=${page}&limit=${PAGE_SIZE}`
      )
      return response.json()
    },
    staleTime: 2 * 60 * 1000,
  })
}
```

### Pattern 3: Navigation Items Configuration
**What:** Hide broken pages by removing from sidebar nav arrays
**Location:** `src/components/workspace/sidebar.tsx`
```typescript
const operationsNav = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '' },
  { title: 'Lead Management', icon: Users, href: '/database' },  // Keep - works
  { title: 'Conversations', icon: MessageCircle, href: '/inbox' },  // Remove until rebuilt
  { title: 'Support', icon: Headphones, href: '/support' },  // Remove until rebuilt
]
```

### Anti-Patterns to Avoid
- **Direct Supabase import in page components:** Always go through API routes or Convex queries
- **Mixing auth systems:** Use only Clerk's `auth()` function, never Supabase auth
- **Keeping broken pages accessible:** Remove from navigation before deleting files

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone normalization | Custom regex | `convex/n8n.ts normalizePhone()` | Already handles Indonesian formats |
| Lead scoring | Custom algorithm | Existing metadata parsing | Score breakdown in contact-detail-sheet.tsx |
| Duplicate detection | Custom matching | n8n workflow + merge feature | User decision: always create, merge later |
| Workspace resolution | Direct DB query | `api.workspaces.getBySlug` | Already indexed, cached |

**Key insight:** The codebase already has working patterns - reuse them, don't reinvent.

## Common Pitfalls

### Pitfall 1: Forgetting Shared Components
**What goes wrong:** Deleting a page breaks imports in shared components
**Why it happens:** Components import types or utilities from deleted files
**How to avoid:**
1. Check imports before deleting
2. Delete in order: page files first, then lib files
**Warning signs:** TypeScript errors after deletion

### Pitfall 2: Breaking Navigation Before Cleanup
**What goes wrong:** Users can click links to deleted pages
**Why it happens:** Sidebar still has nav items for deleted routes
**How to avoid:** Update sidebar navigation BEFORE deleting page files
**Warning signs:** 404 errors from navigation clicks

### Pitfall 3: Incomplete Supabase Removal
**What goes wrong:** Build fails due to lingering imports
**Why it happens:** Some files import Supabase indirectly through shared utilities
**How to avoid:**
1. Search for all `@/lib/supabase` imports
2. Search for `createClient` usage
3. Delete lib files last
**Warning signs:** Build errors mentioning Supabase

### Pitfall 4: Contact Detail Sheet Direct Supabase Usage
**What goes wrong:** Messages/Activity tabs break after Supabase removal
**Why it happens:** `contact-detail-sheet.tsx` uses `createClient()` directly for:
- Loading messages (lines 390-410)
- Loading activities (lines 500-567)
**How to avoid:** Migrate these to API routes or Convex queries before deleting Supabase lib
**Warning signs:** Sheet tabs show loading forever

## Code Examples

### Contact Detail Sheet Migration Pattern
**Current (broken after Supabase removal):**
```typescript
const loadMessages = useCallback(async () => {
  const supabase = createClient()
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('contact_id', contact.id)
    .single()
  // ...
}, [contact])
```

**Migrated pattern (using API route):**
```typescript
const loadMessages = useCallback(async () => {
  const response = await fetch(`/api/contacts/${contact.id}/messages`)
  if (response.ok) {
    const { messages } = await response.json()
    setMessages(messages)
  }
}, [contact.id])
```

### Sidebar Unread Count Migration
**Current (uses Supabase):**
```typescript
useEffect(() => {
  async function fetchUnreadCount() {
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select('unread_count')
      .eq('workspace_id', workspace.id)
      .gt('unread_count', 0)
    // ...
  }
  fetchUnreadCount()
}, [workspace.id])
```

**Migrated pattern (using Convex query):**
```typescript
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

// In component
const unreadCount = useQuery(api.conversations.getTotalUnread, {
  workspace_id: workspace.id
})
```

### n8n Webhook - Already Working
**Current implementation (convex/http.ts lines 77-136):**
```typescript
http.route({
  path: "/webhook/n8n",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const workspace = await ctx.runQuery(api.workspaces.getBySlug, {
      slug: "eagle-overseas",
    })

    const result = await ctx.runMutation(api.n8n.createLead, {
      workspace_id: workspace._id,
      name: payload.name || "Unknown",
      phone: payload.phone,
      email: payload.email || undefined,
      lead_score: payload.lead_score || 0,
      metadata: payload.metadata || undefined,
    })
    // ...
  }),
})
```

**Note:** n8n sync already works. Phase 1 just needs to verify it syncs all Google Sheets leads.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase client in components | Convex queries via API | v3.1 (partial) | 25.4x faster |
| Supabase auth | Clerk auth | v3.1 | Simplified, reliable |
| Direct database queries | TanStack Query + API routes | v2.1 | Better caching |

**Deprecated/outdated:**
- `@/lib/supabase/*`: Remove entirely after migration complete
- `createClient()`: Replace with Convex queries or API routes

## Convex Schema Analysis

**Contacts table (convex/schema.ts) - already comprehensive:**
```typescript
contacts: defineTable({
  workspace_id: v.id("workspaces"),
  phone: v.string(),
  phone_normalized: v.optional(v.string()),
  name: v.optional(v.string()),
  kapso_name: v.optional(v.string()),
  email: v.optional(v.string()),
  lead_score: v.number(),
  lead_status: v.string(),
  tags: v.optional(v.array(v.string())),
  assigned_to: v.optional(v.string()),
  source: v.optional(v.string()),
  metadata: v.optional(v.any()),
  created_at: v.number(),
  updated_at: v.number(),
  supabaseId: v.string(),
})
```

**Note on supabaseId:** Currently required field (`v.string()`). New contacts from n8n set it to empty string. This is fine - it's for migration reference only.

## n8n Sync Analysis

**Current state:**
- Webhook endpoint: `intent-otter-212.convex.site/webhook/n8n`
- Mutation: `convex/n8n.ts createLead`
- Behavior: Checks for duplicate by phone, creates new if not exists
- Tags: All n8n contacts get `["google-form"]` tag
- Source: All n8n contacts get `source: "n8n"`

**User decision (from CONTEXT.md):**
- Hourly trigger (existing schedule)
- Incremental sync (only add new leads)
- Always create new records (duplicates handled by merge feature later)

**What might need change:**
- Currently only syncs new leads. Need to verify n8n workflow sends all fields from Google Sheets
- `lead_score: 0` default - should n8n calculate and pass score from form answers?

## Open Questions

1. **Form answers in metadata**
   - What we know: n8n passes `metadata` field, contact-detail-sheet parses it for score breakdown
   - What's unclear: Does n8n currently pass all Google Sheets columns?
   - Recommendation: Verify n8n workflow configuration, ensure all columns mapped

2. **Contact detail modal vs sheet**
   - What we know: User wants modal dialog (per CONTEXT.md), current is sheet
   - What's unclear: Whether to update Sheet to Dialog in this phase or later
   - Recommendation: User said modal - change Sheet to Dialog component in this phase

3. **Merge functionality scope**
   - What we know: User wants side-by-side comparison, user picks fields
   - What's unclear: Full UI implementation details
   - Recommendation: Research phase for merge can be minimal since it's new functionality, not migration

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `07-07-SUMMARY.md` - list of 24 files using Supabase
- Codebase analysis: `convex/schema.ts` - contacts table structure
- Codebase analysis: `convex/n8n.ts` - lead creation mutation
- Codebase analysis: `convex/http.ts` - n8n webhook handler
- Codebase analysis: `database-client.tsx` - working Convex pattern

### Secondary (MEDIUM confidence)
- User decisions: `01-CONTEXT.md` - modal, merge, n8n behavior decisions

## Metadata

**Confidence breakdown:**
- Supabase removal scope: HIGH - complete file list from 07-07-SUMMARY.md
- Convex patterns: HIGH - already working in database page
- n8n sync: HIGH - webhook already deployed and tested
- Contact modal UI: MEDIUM - user decision clear, implementation standard
- Merge functionality: MEDIUM - new feature, user requirements clear

**Research date:** 2026-01-24
**Valid until:** 2026-02-07 (14 days - stable scope, clear requirements)
