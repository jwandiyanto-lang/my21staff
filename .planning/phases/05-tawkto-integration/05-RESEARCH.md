# Phase 5: Central Support Hub - Research

**Researched:** 2026-01-19
**Domain:** Cross-workspace ticketing, client portal, image uploads, live chat
**Confidence:** HIGH

## Summary

Phase 5 transforms the existing single-workspace ticketing system (Phase 4) into a centralized support hub where all client tickets flow to the my21staff admin workspace. The key architectural decision is using an **admin_workspace_id** column on tickets to route client-created tickets to the central my21staff workspace while maintaining RLS visibility rules.

The existing codebase already has:
- Complete ticketing system (tickets, comments, status_history tables)
- Platform admin concept (`profiles.is_admin`)
- Role-based permissions (`workspace_members.role`)
- Admin client that bypasses RLS (`createAdminClient()`)

This phase extends these patterns rather than replacing them.

**Primary recommendation:** Add `admin_workspace_id` column to tickets table, create client-specific support portal UI, implement Supabase Storage for image attachments, and optionally integrate Tawk.to as a live chat fallback.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Storage | Built-in | Image uploads | Already using Supabase, integrated RLS |
| @supabase/ssr | 0.5.x | Server-side Supabase | Already in use |
| tawkto-react | 3.x | Tawk.to widget | Official React integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | N/A | Image processing | Not needed - Supabase has built-in transforms |
| uuid | 9.x | File naming | Already in use via uuid_generate_v4() |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage | Cloudinary | More features but adds vendor, cost, complexity |
| Tawk.to | Crisp | Crisp is paid, Tawk.to is 100% free |
| tawkto-react | Script injection | npm package provides React hooks API |

**Installation:**
```bash
npm install tawkto-react
```

## Architecture Patterns

### Recommended Database Changes

```sql
-- Add admin_workspace_id to route tickets to my21staff
ALTER TABLE tickets ADD COLUMN admin_workspace_id UUID REFERENCES workspaces(id);

-- Tickets created from client workspaces have:
-- workspace_id = client's workspace (for ownership tracking)
-- admin_workspace_id = my21staff workspace (for central management)

-- Tickets created directly in my21staff have:
-- workspace_id = my21staff workspace
-- admin_workspace_id = NULL (internal tickets)
```

### Cross-Workspace Ticket Flow

```
Client (Eagle) creates ticket:
  1. workspace_id = Eagle's workspace
  2. admin_workspace_id = my21staff workspace
  3. requester_id = Eagle user

my21staff admin views tickets:
  - Sees ALL tickets where admin_workspace_id = my21staff
  - Has full control (assign, transition, close)

Client (Eagle) views tickets:
  - Sees ONLY tickets they created (requester_id = auth.uid())
  - Limited view: description + discussion only
```

### RLS Policy Strategy

```sql
-- Central admin hub: my21staff admins see all routed tickets
CREATE POLICY "Admin workspace can view routed tickets" ON tickets
  FOR SELECT USING (
    admin_workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Clients see only their own tickets
CREATE POLICY "Clients can view own tickets" ON tickets
  FOR SELECT USING (
    requester_id = auth.uid()
  );

-- Comments: my21staff admins see all, clients see non-internal only
CREATE POLICY "Admins see all comments" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND t.admin_workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Clients see public comments on own tickets" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE requester_id = auth.uid()
    )
    AND (is_internal IS NULL OR is_internal = false)
  );
```

### Project Structure for Phase 5

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── [workspace]/
│   │       └── support/           # Existing - becomes admin view
│   │           ├── page.tsx       # Modify: filter by admin_workspace_id
│   │           └── [id]/
│   │               └── page.tsx   # Modify: full admin controls
│   └── portal/                    # NEW: Client portal
│       └── support/
│           ├── page.tsx           # Client ticket list
│           ├── new/
│           │   └── page.tsx       # Client ticket form
│           └── [id]/
│               └── page.tsx       # Client ticket view (limited)
├── components/
│   └── tawk-chat.tsx              # NEW: Tawk.to widget wrapper
└── lib/
    └── storage/
        └── ticket-attachments.ts  # NEW: Image upload helpers
```

### Pattern 1: Client Portal Route

**What:** Separate `/portal/support` route for clients to view/create their tickets
**When to use:** Always - keeps admin UI separate from client UI
**Example:**
```typescript
// src/app/portal/support/page.tsx
export default async function ClientSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Client sees ONLY their own tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, description, stage, created_at')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  return <ClientTicketList tickets={tickets} />
}
```

### Pattern 2: Admin Workspace Configuration

**What:** Environment variable to identify the central support workspace
**When to use:** When routing client tickets
**Example:**
```typescript
// src/lib/config/support.ts
export const ADMIN_WORKSPACE_ID = process.env.NEXT_PUBLIC_ADMIN_WORKSPACE_ID
  || '0318fda5-22c4-419b-bdd8-04471b818d17' // my21staff workspace

export function isAdminWorkspace(workspaceId: string): boolean {
  return workspaceId === ADMIN_WORKSPACE_ID
}
```

### Pattern 3: Image Upload with Supabase Storage

**What:** Upload ticket attachments to Supabase Storage bucket
**When to use:** When clients/admins attach images
**Example:**
```typescript
// src/lib/storage/ticket-attachments.ts
import { createClient } from '@/lib/supabase/client'

export async function uploadTicketAttachment(
  ticketId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const supabase = createClient()
  const fileName = `${ticketId}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(data.path)

  return { url: publicUrl, path: data.path }
}
```

### Anti-Patterns to Avoid

- **Storing images in database:** Use Supabase Storage, not BYTEA columns. Images belong in object storage.
- **Global admin check in RLS:** Don't check `profiles.is_admin` in ticket RLS - use workspace membership with admin_workspace_id pattern.
- **Client seeing internal comments:** Always filter by `is_internal = false` for client views.
- **Hardcoding workspace IDs in RLS:** Use the column-based `admin_workspace_id` pattern, not hardcoded UUIDs.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image uploads | Custom file server | Supabase Storage | Built-in RLS, CDN, transforms |
| Image resizing | sharp processing | Supabase Image Transforms | Zero infrastructure |
| Live chat | WebSocket implementation | Tawk.to | Free, battle-tested, mobile apps |
| File validation | Manual checks | Supabase bucket config | Set allowed MIME types at bucket level |

**Key insight:** Supabase Storage provides everything needed for ticket attachments - no need for external services or custom upload infrastructure.

## Common Pitfalls

### Pitfall 1: RLS Policy Conflicts
**What goes wrong:** Multiple overlapping SELECT policies allow unintended access
**Why it happens:** Adding new policies without considering how they combine (OR logic)
**How to avoid:**
- Use `DROP POLICY IF EXISTS` before creating
- Test each role combination explicitly
- Remember: multiple SELECT policies are OR'd together
**Warning signs:** Users seeing data they shouldn't; RLS errors only in production

### Pitfall 2: Client Portal Auth Confusion
**What goes wrong:** Client portal uses wrong Supabase client, bypasses RLS
**Why it happens:** Accidentally using `createAdminClient()` in client-facing routes
**How to avoid:**
- Portal routes MUST use `createClient()` (regular client with user context)
- Admin views can use `createAdminClient()` only when bypassing RLS intentionally
**Warning signs:** Clients see all tickets instead of just their own

### Pitfall 3: Storage Bucket Public Access
**What goes wrong:** All ticket attachments publicly accessible without auth
**Why it happens:** Creating bucket as "public" for convenience
**How to avoid:**
- Create bucket as PRIVATE
- Add RLS policies for access control
- Use signed URLs or public URL only if truly public
**Warning signs:** Images accessible via direct URL without login

### Pitfall 4: Missing Internal Comment Flag
**What goes wrong:** New comments table missing is_internal column
**Why it happens:** Forgetting Phase 5 adds internal notes functionality
**How to avoid:**
- Phase 4 already has `is_internal` column ready
- Ensure client views ALWAYS filter: `AND (is_internal IS NULL OR is_internal = false)`
**Warning signs:** Internal admin notes visible to clients

### Pitfall 5: Tawk.to Widget on Admin Pages
**What goes wrong:** Tawk.to widget shows on admin dashboard
**Why it happens:** Adding widget to root layout instead of portal layout
**How to avoid:**
- Add Tawk.to widget ONLY in `/portal` layout
- Use environment variable to enable/disable
**Warning signs:** Support staff get chat popups while managing tickets

## Code Examples

Verified patterns from existing codebase and official sources:

### Storage Bucket Creation (Migration)

```sql
-- Migration: 28_ticket_attachments_storage.sql

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false);

-- RLS: Users can upload to tickets they're involved in
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.role() = 'authenticated' AND
    -- Extract ticket_id from path: ticket-attachments/{ticket_id}/{filename}
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tickets
      WHERE requester_id = auth.uid()
      OR assigned_to = auth.uid()
      OR admin_workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- RLS: Users can view attachments for tickets they can view
CREATE POLICY "Users can view attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tickets
      WHERE requester_id = auth.uid()
      OR assigned_to = auth.uid()
      OR admin_workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );
```

### Tawk.to Integration

```typescript
// src/components/tawk-chat.tsx
'use client'

import TawkMessengerReact from 'tawkto-react'

interface TawkChatProps {
  userEmail?: string
  userName?: string
}

export function TawkChat({ userEmail, userName }: TawkChatProps) {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

  if (!propertyId || !widgetId) {
    return null // Don't render if not configured
  }

  return (
    <TawkMessengerReact
      propertyId={propertyId}
      widgetId={widgetId}
      onLoad={() => {
        // Set visitor attributes if available
        if (userEmail || userName) {
          window.Tawk_API?.setAttributes({
            name: userName || '',
            email: userEmail || '',
          })
        }
      }}
    />
  )
}

// Usage in portal layout:
// src/app/portal/layout.tsx
import { TawkChat } from '@/components/tawk-chat'

export default function PortalLayout({ children }) {
  return (
    <>
      {children}
      <TawkChat />
    </>
  )
}
```

### Client Ticket Creation

```typescript
// src/app/api/portal/tickets/route.ts
import { createClient } from '@/lib/supabase/server'
import { ADMIN_WORKSPACE_ID } from '@/lib/config/support'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No workspace' }, { status: 400 })
  }

  const body = await request.json()

  // Create ticket routed to admin workspace
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      workspace_id: membership.workspace_id,
      admin_workspace_id: ADMIN_WORKSPACE_ID, // Route to my21staff
      requester_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category || 'question',
      priority: body.priority || 'medium',
      stage: 'report'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ticket })
}
```

### Admin View: All Client Tickets

```typescript
// src/app/(dashboard)/[workspace]/support/page.tsx (modified)
export default async function AdminSupportPage({ params }) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  // Admin sees tickets routed TO this workspace
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:profiles!tickets_requester_id_fkey(id, full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email),
      source_workspace:workspaces!tickets_workspace_id_fkey(name, slug)
    `)
    .eq('admin_workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  // Also get internal tickets (no admin_workspace_id)
  const { data: internalTickets } = await supabase
    .from('tickets')
    .select(`
      *,
      requester:profiles!tickets_requester_id_fkey(id, full_name, email),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)
    `)
    .eq('workspace_id', workspace.id)
    .is('admin_workspace_id', null)
    .order('created_at', { ascending: false })

  return (
    <AdminSupportClient
      clientTickets={tickets}
      internalTickets={internalTickets}
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Filesystem uploads | Object storage (S3/Supabase) | 2020+ | Better scalability, CDN |
| Manual file serving | Signed URLs | Standard | Better security |
| Custom chat | Embedded widgets (Tawk, Crisp) | 2018+ | Free, maintained, mobile apps |
| ENUM types | CHECK constraints | Phase 4 decision | Easier migrations |

**Deprecated/outdated:**
- Base64 image storage in database: Use object storage
- Building custom chat: Use Tawk.to (free) or paid alternatives

## Open Questions

Things that couldn't be fully resolved:

1. **Tawk.to Necessity**
   - What we know: Tawk.to is 100% free, easy to integrate
   - What's unclear: Is live chat needed when ticketing exists?
   - Recommendation: Make optional via env var; implement if time permits

2. **Client Portal Navigation**
   - What we know: Clients need separate UI from admin dashboard
   - What's unclear: Should clients see sidebar? Full navigation?
   - Recommendation: Minimal portal UI - just support page + profile

3. **Image Size Limits**
   - What we know: Supabase standard upload handles up to 6MB
   - What's unclear: Should we allow larger files? What's reasonable?
   - Recommendation: 5MB limit, common images are under this

4. **Internal Comments Column**
   - What we know: Phase 4 ticket_comments table exists
   - What's unclear: Does it already have is_internal column?
   - Recommendation: Check migration 26 - add if missing

## Sources

### Primary (HIGH confidence)
- Supabase Storage Standard Uploads - https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase Storage Access Control - https://supabase.com/docs/guides/storage/security/access-control
- Existing codebase: `src/lib/supabase/server.ts` (admin client pattern)
- Existing codebase: `supabase/migrations/26_tickets.sql` (ticket schema)
- Existing codebase: `src/lib/permissions/` (role-based access)

### Secondary (MEDIUM confidence)
- [Tawk.to Next.js Integration](https://www.3zerodigital.com/blog/tawk-to-next-js-integration-for-real-time-chat-support)
- [Tawk.to React npm package](https://www.npmjs.com/package/tawkto-react)
- [Tawk.to JavaScript API](https://developer.tawk.to/jsapi/)

### Tertiary (LOW confidence)
- WebSearch results for cross-workspace RLS patterns (needs validation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Supabase patterns
- Architecture (admin_workspace_id): HIGH - Follows existing routing pattern (see leads route)
- Storage patterns: HIGH - Official Supabase documentation
- Tawk.to integration: MEDIUM - Third-party, verify npm package compatibility
- RLS policies: MEDIUM - Complex, needs thorough testing

**Research date:** 2026-01-19
**Valid until:** 30 days (stable patterns)
