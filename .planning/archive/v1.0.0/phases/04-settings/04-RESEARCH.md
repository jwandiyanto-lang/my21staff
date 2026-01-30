# Phase 4: Settings - Research

**Researched:** 2026-01-24
**Domain:** Workspace configuration and team management in Next.js 15 with Convex + Clerk
**Confidence:** HIGH

## Summary

Settings pages in this architecture need to rebuild the previous Supabase-based implementation using Convex for data storage and Clerk OrganizationProfile for team management. The existing settings-client.tsx file contains a full implementation with 4 tabs (Integrations, Quick Replies, Tags, Data) that was built against the old Supabase backend and was deleted in commit 597b1bd.

The standard approach is to create a minimal server component page.tsx that fetches workspace data via Convex, then renders the existing SettingsClient component. Team management should redirect to the /team page which already uses Clerk OrganizationProfile (built in v3.1 Phase 4).

**Primary recommendation:** Create page.tsx using fetchQuery pattern from database page, keep existing settings-client.tsx as-is since it already uses the correct API route (/api/workspaces/[id]/settings) which calls Convex mutations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.1 | Server components with async params | App Router with React Server Components is the current standard |
| Convex | ^1.31.6 | Real-time database queries | Already integrated, provides reactive data updates |
| Clerk | ^6.36.9 | Organization/team management | OrganizationProfile handles invites, roles, member management |
| Shadcn/ui | Latest | UI components (Tabs, Card, Form) | Project standard, already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex/nextjs | Built-in | Server-side Convex queries | Use fetchQuery in page.tsx server components |
| @clerk/nextjs | ^6.36.9 | useOrganization hook | Client components needing org context |
| date-fns | ^4.1.0 | Date formatting | Already used in settings-client.tsx |
| crypto (Node) | Built-in | AES-256-GCM encryption | API key encryption in settings route |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fetchQuery (server) | useQuery (client) | fetchQuery renders faster (SSR), useQuery enables real-time |
| Clerk OrganizationProfile | Custom team UI | Custom UI more work, Clerk handles invites/roles/billing built-in |
| API route + mutation | Direct mutation from client | API route allows encryption, validation, authorization checks |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/app/(dashboard)/[workspace]/settings/
├── page.tsx              # Server component (fetch workspace data)
├── settings-client.tsx   # Client component (existing, 4 tabs UI)
└── loading.tsx           # Loading state (already exists)
```

### Pattern 1: Server Component with Async Params (Next.js 15)
**What:** Page component receives params as Promise, must await before accessing properties
**When to use:** All Next.js 15 page.tsx files with dynamic routes
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return <SettingsClient workspace={workspace} />
}
```

### Pattern 2: Convex Server-Side Fetching
**What:** Use fetchQuery in server components for initial data, useQuery in client for real-time
**When to use:** Server components that need workspace/user data before rendering
**Example:**
```typescript
// Source: https://docs.convex.dev/client/react (Convex React docs)
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

// In server component:
const workspace = await fetchQuery(api.workspaces.getById, { id })

// In client component (for real-time updates):
const workspace = useQuery(api.workspaces.getById, { id })
```

### Pattern 3: Tabs for Settings Organization
**What:** Use Shadcn Tabs component to organize settings into logical groups
**When to use:** Settings pages with multiple configuration domains (integrations, team, data)
**Example:**
```typescript
// Source: Existing settings-client.tsx (proven pattern)
<Tabs defaultValue="integrations" className="space-y-6">
  <TabsList>
    <TabsTrigger value="integrations">Integrations</TabsTrigger>
    <TabsTrigger value="quick-replies">Quick Replies</TabsTrigger>
    <TabsTrigger value="tags">Tags</TabsTrigger>
    <TabsTrigger value="data">Data</TabsTrigger>
  </TabsList>
  <TabsContent value="integrations">...</TabsContent>
</Tabs>
```

### Pattern 4: API Route for Settings Updates
**What:** PATCH /api/workspaces/[id]/settings with encryption, validation, authorization
**When to use:** Settings mutations that need server-side encryption or validation
**Example:**
```typescript
// Source: src/app/api/workspaces/[id]/settings/route.ts (already exists)
// Client sends:
await fetch(`/api/workspaces/${workspace.id}/settings`, {
  method: 'PATCH',
  body: JSON.stringify({ settings: { kapso_api_key: apiKey } })
})

// Server encrypts sensitive data before Convex mutation:
if (newSettings.kapso_api_key) {
  newSettings.kapso_api_key = safeEncrypt(newSettings.kapso_api_key)
}
await convex.mutation(api.workspaces.updateSettings, { workspace_id, settings })
```

### Pattern 5: Clerk OrganizationProfile Integration
**What:** Embedded Clerk component handles team management (invites, roles, removal)
**When to use:** Team settings page - replaces custom member management UI
**Example:**
```typescript
// Source: https://clerk.com/docs/nextjs/reference/components/organization/organization-profile
// Already implemented in src/app/(dashboard)/[workspace]/team/page.tsx
import { OrganizationProfile } from '@clerk/nextjs'

<OrganizationProfile
  appearance={{
    elements: {
      card: 'shadow-none border-0',
      navbar: 'hidden',
    }
  }}
  routing="hash"
/>
```

### Anti-Patterns to Avoid
- **Fetching workspace in client component only:** Causes layout shift, slower initial render. Use server-side fetchQuery for initial data.
- **Storing API keys unencrypted:** Use safeEncrypt() in API route before saving to Convex. Never store plain API keys.
- **Mixing team management with workspace settings:** Team management lives at /team page with Clerk OrganizationProfile. Settings page focuses on workspace config only.
- **Direct mutation from client for sensitive data:** Use API route for encryption, validation, authorization checks before mutation.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Team member invitations | Custom invite form + email sending | Clerk OrganizationProfile | Handles invite emails, pending invites, role assignment, RBAC built-in |
| API key encryption | Custom crypto implementation | crypto module with safeEncrypt/safeDecrypt | Already implemented with AES-256-GCM, handles errors gracefully |
| Settings tabs UI | Custom tab switching logic | Shadcn Tabs component | Accessibility, keyboard navigation, URL hash routing handled |
| Real-time settings sync | Manual WebSocket or polling | Convex useQuery hook | Automatic subscriptions, optimistic updates, consistency guarantees |
| CSV import validation | Manual row parsing + validation | Existing /api/contacts/import endpoints | Phone normalization, duplicate detection, preview already built |

**Key insight:** Settings pages have many edge cases (encryption, validation, permissions, real-time sync). Use existing patterns and libraries to avoid security bugs and subtle race conditions.

## Common Pitfalls

### Pitfall 1: Forgetting to Await Params in Next.js 15
**What goes wrong:** TypeScript error or runtime error accessing params.workspace directly
**Why it happens:** Next.js 15 changed params from object to Promise for better streaming/suspense support
**How to avoid:** Always destructure params with await: `const { workspace } = await params`
**Warning signs:**
- TypeScript error: "Property 'workspace' does not exist on type 'Promise<...>'"
- Runtime error: "Cannot read properties of undefined"

### Pitfall 2: Encrypting Already-Encrypted API Keys
**What goes wrong:** Double encryption makes key unrecoverable, breaks WhatsApp integration
**Why it happens:** API route encrypts on save, but doesn't check if already encrypted
**How to avoid:** Use isEncrypted() check before calling safeEncrypt(), or only encrypt on initial save
**Warning signs:**
- Decryption errors in logs: "Invalid encrypted text format"
- WhatsApp messages fail with 401 Unauthorized
- API key field shows gibberish instead of masked value

### Pitfall 3: Not Merging Existing Settings on Update
**What goes wrong:** Updating quick_replies erases contact_tags and other settings
**Why it happens:** Replacing entire settings object instead of merging
**How to avoid:** Always merge with existing settings: `{ ...existingSettings, ...newSettings }`
**Warning signs:**
- Contact tags disappear after saving quick replies
- Integration settings reset when updating data preferences
- Users report "settings keep getting reset"

### Pitfall 4: Exposing Encrypted API Keys to Client
**What goes wrong:** Encrypted key displayed in browser, still a security risk if decryption key leaks
**Why it happens:** Passing full workspace.settings to client component
**How to avoid:** Mask API keys in UI, only send encrypted value to server on update
**Warning signs:**
- Long encrypted string visible in input field
- Browser DevTools shows encrypted keys in component props
- Security audit flags exposed sensitive data

### Pitfall 5: Settings Page Without Workspace Validation
**What goes wrong:** 404 or blank page if workspace doesn't exist
**Why it happens:** Not checking workspace query result before rendering
**How to avoid:** Use notFound() if workspace is null after fetchQuery
**Warning signs:**
- Blank settings page for invalid workspace slug
- Console errors about undefined workspace
- Layout renders but content area empty

### Pitfall 6: Quick Replies State Desynced from Server
**What goes wrong:** User edits quick reply, refreshes page, changes disappear
**Why it happens:** Local state updates but API call fails silently
**How to avoid:** Show save confirmation, handle errors, optimistic updates with rollback
**Warning signs:**
- Changes work until page refresh
- No error message when save fails
- Network tab shows 500 errors but UI looks successful

## Code Examples

Verified patterns from official sources:

### Server Component Page Pattern
```typescript
// Source: src/app/(dashboard)/[workspace]/database/page.tsx (proven working)
import { notFound } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { SettingsClient } from './settings-client'

interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  const workspace = await fetchQuery(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })

  if (!workspace) {
    notFound()
  }

  return (
    <SettingsClient
      workspace={{
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        kapso_phone_id: workspace.kapso_phone_id || null,
        settings: workspace.settings || null,
      }}
    />
  )
}
```

### Settings Update with Encryption
```typescript
// Source: src/app/api/workspaces/[id]/settings/route.ts (already exists)
import { safeEncrypt } from '@/lib/crypto'

// In API route PATCH handler:
const newSettings = { ...body.settings }

// Encrypt API key if provided
if (newSettings.kapso_api_key && typeof newSettings.kapso_api_key === 'string') {
  newSettings.kapso_api_key = safeEncrypt(newSettings.kapso_api_key)
}

// Merge with existing settings to avoid data loss
const existing = await convex.query(api.workspaces.getById, { id: workspaceId })
const existingSettings = existing?.settings || {}

await convex.mutation(api.workspaces.updateSettings, {
  workspace_id: workspaceId,
  settings: {
    ...existingSettings,
    ...newSettings,
  }
})
```

### Client Component Tabs Pattern
```typescript
// Source: src/app/(dashboard)/[workspace]/settings/settings-client.tsx (existing)
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function SettingsClient({ workspace }) {
  const [apiKey, setApiKey] = useState(workspace.settings?.kapso_api_key || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { kapso_api_key: apiKey }
        }),
      })
      if (response.ok) {
        // Show success message
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <Tabs defaultValue="integrations" className="mt-6 space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="quick-replies">Quick Replies</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="integrations">
          {/* Integration settings UI */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase RLS for workspace settings | Convex with API route validation | v3.2 Phase 1 (Jan 2024) | Server-side validation, encryption before storage |
| Custom team management UI | Clerk OrganizationProfile | v3.1 Phase 4 (Jan 2024) | Built-in invites, roles, billing management |
| params as object | params as Promise | Next.js 15 (Oct 2024) | Must await params in page components |
| Client-side only settings | Server component initial fetch | Next.js 15 App Router | Faster initial render, better SEO |

**Deprecated/outdated:**
- Supabase createClient() in page.tsx: Deleted in commit 597b1bd, replaced with Convex fetchQuery
- Custom team member invitation forms: Replaced with Clerk OrganizationProfile (simpler, handles emails)
- Synchronous params access: Next.js 15 requires await for dynamic route params

## Open Questions

Things that couldn't be fully resolved:

1. **Should quick_replies and contact_tags be in workspace.settings or separate Convex tables?**
   - What we know: Currently stored in settings JSONB field, works fine for current scale
   - What's unclear: Performance impact if workspace has 100+ quick replies, query patterns
   - Recommendation: Keep in settings for Phase 4 (simpler), consider separate tables if query patterns emerge

2. **How to display encrypted API keys in the settings form?**
   - What we know: safeEncrypt() creates long hex string, not user-friendly to display
   - What's unclear: Show masked value (****), allow re-entering, or show "configured" badge?
   - Recommendation: Show masked value in input (type="password"), allow re-entering to update

3. **Should Settings page redirect to Team page or embed team management?**
   - What we know: Team page already exists with Clerk OrganizationProfile at /team
   - What's unclear: User expectation - find team settings under Settings tab or separate page?
   - Recommendation: Keep separate /team page, add link/button in Settings to "Manage Team"

## Sources

### Primary (HIGH confidence)
- Next.js 15 Async Params: https://nextjs.org/docs/app/api-reference/file-conventions/page
- Clerk OrganizationProfile: https://clerk.com/docs/nextjs/reference/components/organization/organization-profile
- Convex React Queries: https://docs.convex.dev/client/react
- Existing codebase patterns:
  - src/app/(dashboard)/[workspace]/database/page.tsx (server component pattern)
  - src/app/(dashboard)/[workspace]/team/page.tsx (Clerk integration)
  - src/app/api/workspaces/[id]/settings/route.ts (API route with encryption)
  - src/lib/crypto.ts (AES-256-GCM encryption utilities)

### Secondary (MEDIUM confidence)
- Shadcn Settings Patterns: https://www.shadcndesign.com/pro-blocks/settings
- API Key Security Best Practices: https://www.legitsecurity.com/aspm-knowledge-base/api-key-security-best-practices
- Next.js 15 Breaking Changes: https://medium.com/@matijazib/handling-breaking-changes-in-next-js-15-async-params-and-search-params-96075e04f7b6

### Tertiary (LOW confidence)
- None - all findings verified with official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already integrated and proven working
- Architecture: HIGH - Patterns verified in existing codebase (database page, team page, API routes)
- Pitfalls: MEDIUM - Based on codebase review and general Next.js/encryption pitfalls, not specific user reports

**Research date:** 2026-01-24
**Valid until:** 30 days (stable stack, Next.js 15 and Clerk patterns unlikely to change)
