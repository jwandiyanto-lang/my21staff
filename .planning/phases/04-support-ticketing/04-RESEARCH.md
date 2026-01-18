# Phase 4: Support Ticketing Core - Research

**Researched:** 2026-01-18
**Domain:** Support ticketing system with 4-stage workflow, approval flows, RLS, email notifications
**Confidence:** HIGH

## Summary

This phase implements a support ticketing system for workspace members to report issues and track resolution through a 4-stage workflow: Report, Discuss, Outcome, Implementation. The system builds on Phase 2 (Resend email) and Phase 3 (permissions) infrastructure.

The standard approach for this domain combines:
1. **PostgreSQL tables** for tickets, comments, and status_history with proper foreign keys
2. **Simple TypeScript state machine** for stage transitions (not XState - overkill for 4 linear stages)
3. **RLS policies** using existing `private.get_user_role_in_workspace()` function from Phase 3
4. **React Email templates** following established patterns from Phase 2
5. **HMAC-based reopen tokens** for secure email links

**Primary recommendation:** Keep the state machine simple with TypeScript constants and validation functions. Use pg_cron for auto-close after 7 days. Model approval as a separate `pending_approval` boolean on tickets rather than an additional stage.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase PostgreSQL | Current | Tickets, comments, status_history tables | Already in use, RLS for multi-tenant |
| TypeScript | Current | Stage transition validation, type safety | No runtime dependency needed |
| Resend + React Email | ^6.7.0 / ^0.0.x | Notification emails | Already set up in Phase 2 |
| pg_cron | v1.6.4+ | Auto-close tickets after 7 days | Supabase built-in, no external dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node.js built-in) | - | HMAC tokens for reopen links | Email reopen functionality |
| date-fns | ^4.x | Date formatting for due dates | Already installed |
| sonner | Current | Toast notifications | Already installed |
| shadcn/ui components | Current | Ticket UI (Sheet, Badge, Tabs) | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeScript constants for stages | XState | XState overkill for 4 linear stages; adds ~15KB bundle |
| pg_cron for auto-close | Vercel Cron | pg_cron runs in-database with zero latency; Vercel adds cold start |
| Status history table | PostgreSQL triggers | Explicit table cleaner for querying; triggers add complexity |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Database Schema

```sql
-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),

  -- Core fields
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'bug', 'feature', 'question'
  priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high'

  -- Stage tracking
  stage VARCHAR(50) NOT NULL DEFAULT 'report', -- 'report', 'discuss', 'outcome', 'implementation', 'closed'

  -- Approval flow (for stage skipping)
  pending_approval BOOLEAN DEFAULT FALSE,
  pending_stage VARCHAR(50), -- Stage admin wants to skip to
  approval_requested_at TIMESTAMPTZ,

  -- Reopen tracking
  reopen_token VARCHAR(255),
  closed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table (flat timeline, not threaded)
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_stage_change BOOLEAN DEFAULT FALSE, -- Flag for stage transition comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history table (audit trail)
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  reason TEXT, -- Optional reason for change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_workspace ON tickets(workspace_id);
CREATE INDEX idx_tickets_requester ON tickets(requester_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_stage ON tickets(stage);
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_status_history_ticket ON ticket_status_history(ticket_id);
```

### Recommended Project Structure

```
src/
├── lib/
│   └── tickets/
│       ├── types.ts          # TicketStage, TicketCategory, TicketPriority
│       ├── constants.ts      # STAGE_CONFIG, VALID_TRANSITIONS
│       ├── transitions.ts    # canTransition(), validateTransition()
│       └── tokens.ts         # generateReopenToken(), verifyReopenToken()
├── emails/
│   ├── ticket-created.tsx    # Notification to requester
│   ├── ticket-updated.tsx    # Stage change notification
│   └── ticket-closed.tsx     # Auto-close with reopen link
├── app/
│   ├── api/
│   │   ├── tickets/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET (detail), PATCH (update)
│   │   │       ├── comments/route.ts # GET, POST comments
│   │   │       ├── transition/route.ts # POST stage transition
│   │   │       └── reopen/route.ts   # POST reopen with token
│   │   └── ...
│   └── (dashboard)/
│       └── [workspace]/
│           └── support/
│               ├── page.tsx          # Ticket list
│               ├── support-client.tsx
│               ├── ticket-form-sheet.tsx
│               └── [id]/
│                   ├── page.tsx      # Ticket detail
│                   └── ticket-detail-client.tsx
```

### Pattern 1: TypeScript Stage Machine

**What:** Type-safe stage transitions without runtime library
**When to use:** All stage transition logic
**Example:**
```typescript
// src/lib/tickets/types.ts
export type TicketStage = 'report' | 'discuss' | 'outcome' | 'implementation' | 'closed'
export type TicketCategory = 'bug' | 'feature' | 'question'
export type TicketPriority = 'low' | 'medium' | 'high'

// src/lib/tickets/constants.ts
export const STAGE_CONFIG: Record<TicketStage, { label: string; next: TicketStage | null }> = {
  report: { label: 'Laporan', next: 'discuss' },
  discuss: { label: 'Diskusi', next: 'outcome' },
  outcome: { label: 'Keputusan', next: 'implementation' },
  implementation: { label: 'Implementasi', next: 'closed' },
  closed: { label: 'Selesai', next: null }
}

// Valid transitions: each stage can only go to its next stage (unless admin skips with approval)
export const VALID_TRANSITIONS: Record<TicketStage, TicketStage[]> = {
  report: ['discuss'],
  discuss: ['outcome'],
  outcome: ['implementation'],
  implementation: ['closed'],
  closed: ['report'] // Reopen goes back to report
}

// src/lib/tickets/transitions.ts
import { VALID_TRANSITIONS, type TicketStage } from './constants'

export function canTransition(
  fromStage: TicketStage,
  toStage: TicketStage,
  isAdminSkip: boolean = false
): boolean {
  // Reopen from closed
  if (fromStage === 'closed' && toStage === 'report') return true

  // Normal transition
  if (VALID_TRANSITIONS[fromStage].includes(toStage)) return true

  // Admin skip (requires approval)
  if (isAdminSkip && fromStage !== 'closed') return true

  return false
}
```

### Pattern 2: RLS Policies for Ticket Visibility

**What:** Use existing `get_user_role_in_workspace()` function for consistent RLS
**When to use:** All ticket-related tables
**Example:**
```sql
-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

-- Tickets: All workspace members can view tickets
CREATE POLICY "Members can view tickets" ON tickets
  FOR SELECT USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
  );

-- Tickets: Any member can create tickets
CREATE POLICY "Members can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    AND requester_id = auth.uid()
  );

-- Tickets: Only assigned staff or admin can update tickets
CREATE POLICY "Assigned staff or admin can update tickets" ON tickets
  FOR UPDATE USING (
    (SELECT private.get_user_role_in_workspace(workspace_id)) IN ('owner', 'admin')
    OR assigned_to = auth.uid()
    OR requester_id = auth.uid() -- Requester can approve/reject stage skip
  );

-- Comments: All workspace members can view comments
CREATE POLICY "Members can view comments" ON ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
  );

-- Comments: Any member can add comments
CREATE POLICY "Members can add comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets
      WHERE (SELECT private.get_user_role_in_workspace(workspace_id)) IS NOT NULL
    )
    AND author_id = auth.uid()
  );
```

### Pattern 3: Approval Flow for Stage Skipping

**What:** Admin requests to skip stage, requester must approve in-app
**When to use:** Admin wants to jump from Report directly to Outcome
**Example:**
```typescript
// API: Request stage skip (admin only)
export async function POST(request: NextRequest, context: RouteContext) {
  const { ticketId, targetStage, reason } = await request.json()

  // Validate admin role
  const authResult = await requireWorkspaceMembership(ticket.workspace_id)
  if (authResult instanceof NextResponse) return authResult

  const permError = requirePermission(authResult.role, 'tickets:skip_stage')
  if (permError) return permError

  // Set pending approval
  await supabase
    .from('tickets')
    .update({
      pending_approval: true,
      pending_stage: targetStage,
      approval_requested_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  // Add system comment
  await supabase.from('ticket_comments').insert({
    ticket_id: ticketId,
    author_id: authResult.user.id,
    content: `Meminta persetujuan untuk langsung ke tahap "${STAGE_CONFIG[targetStage].label}". Alasan: ${reason}`,
    is_stage_change: true
  })
}

// Client: Show approval UI to requester
function ApprovalBanner({ ticket, currentUserId }) {
  if (!ticket.pending_approval || ticket.requester_id !== currentUserId) return null

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertDescription>
        Admin meminta persetujuan untuk langsung ke tahap{' '}
        <strong>{STAGE_CONFIG[ticket.pending_stage].label}</strong>.
        <div className="mt-2 flex gap-2">
          <Button onClick={() => handleApproval(true)}>Setuju</Button>
          <Button variant="outline" onClick={() => handleApproval(false)}>Tolak</Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
```

### Pattern 4: HMAC Reopen Token

**What:** Secure token for email "reopen" link without login
**When to use:** Auto-close email with reopen capability
**Example:**
```typescript
// src/lib/tickets/tokens.ts
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.TICKET_TOKEN_SECRET || process.env.ENCRYPTION_KEY

export function generateReopenToken(ticketId: string, requesterId: string): string {
  const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  const payload = `${ticketId}:${requesterId}:${expiry}`
  const signature = createHmac('sha256', SECRET!)
    .update(payload)
    .digest('hex')

  // Return base64 encoded token
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

export function verifyReopenToken(token: string): { ticketId: string; requesterId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [ticketId, requesterId, expiryStr, signature] = decoded.split(':')

    // Check expiry
    const expiry = parseInt(expiryStr, 10)
    if (Date.now() > expiry) return null

    // Verify signature
    const payload = `${ticketId}:${requesterId}:${expiryStr}`
    const expected = createHmac('sha256', SECRET!)
      .update(payload)
      .digest('hex')

    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

    return { ticketId, requesterId }
  } catch {
    return null
  }
}
```

### Pattern 5: pg_cron Auto-Close

**What:** Automatically close tickets 7 days after Implementation stage
**When to use:** Background job for ticket lifecycle
**Example:**
```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create auto-close function
CREATE OR REPLACE FUNCTION public.auto_close_tickets()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_record RECORD;
BEGIN
  -- Find tickets in 'implementation' stage for 7+ days
  FOR ticket_record IN
    SELECT t.id, t.requester_id, t.workspace_id
    FROM tickets t
    WHERE t.stage = 'implementation'
    AND t.updated_at < NOW() - INTERVAL '7 days'
    AND t.closed_at IS NULL
  LOOP
    -- Update ticket to closed
    UPDATE tickets
    SET
      stage = 'closed',
      closed_at = NOW(),
      reopen_token = encode(gen_random_bytes(32), 'hex'), -- Placeholder, real token generated by app
      updated_at = NOW()
    WHERE id = ticket_record.id;

    -- Add status history
    INSERT INTO ticket_status_history (ticket_id, changed_by, from_stage, to_stage, reason)
    VALUES (ticket_record.id, ticket_record.requester_id, 'implementation', 'closed', 'Auto-closed after 7 days');

    -- Note: Email notification handled by app layer via webhook or polling
  END LOOP;
END;
$$;

-- Schedule daily at 00:00 UTC (07:00 WIB)
SELECT cron.schedule(
  'auto-close-tickets',
  '0 0 * * *', -- Daily at midnight UTC
  $$SELECT public.auto_close_tickets()$$
);
```

### Anti-Patterns to Avoid

- **Using XState for simple linear workflow:** 4 stages with linear progression doesn't need a state machine library; TypeScript constants are sufficient
- **Storing stage history in JSONB column:** Use separate `ticket_status_history` table for proper querying and indexing
- **Magic links for reopen without expiry:** Always include expiry timestamp in HMAC payload
- **Checking permissions only in client:** Always verify permissions in API routes using `requirePermission()`
- **Threads/nested comments:** Keep comments flat for simplicity; threaded comments add complexity without value for support tickets

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email templates | HTML strings | React Email components | Tested on Gmail/Outlook, already set up |
| Scheduled jobs | setTimeout/setInterval | pg_cron | Runs in database, survives restarts |
| Permission checks | Inline role checks | `requirePermission()` from Phase 3 | Consistent, type-safe |
| Secure tokens | UUID-only | HMAC with expiry | Prevents brute force, self-validates |
| Audit trail | Manual logging | Status history table | Queryable, consistent |

**Key insight:** The ticketing system is a natural extension of existing patterns. Use the same RLS function, permission system, and email infrastructure. Don't introduce new paradigms.

## Common Pitfalls

### Pitfall 1: RLS Policy Performance with Joins

**What goes wrong:** Slow queries when joining tickets with comments using per-row function calls
**Why it happens:** RLS policies execute per-row; joining multiple tables compounds the cost
**How to avoid:**
- Use existing `private.get_user_role_in_workspace()` with subquery wrapping
- Fetch tickets first, then fetch comments separately in API
- Create composite indexes on (ticket_id, created_at)
**Warning signs:** Query times > 200ms for ticket detail page

### Pitfall 2: Missing Stage Transition Validation in Client

**What goes wrong:** Client sends invalid transition, server rejects but UX is confusing
**Why it happens:** Transition buttons shown that shouldn't be available
**How to avoid:**
- Use `canTransition()` in client to hide/disable invalid transitions
- Server still validates (defense in depth)
**Warning signs:** Users see "Invalid transition" errors

### Pitfall 3: Reopen Token Reuse

**What goes wrong:** Same reopen token works multiple times
**Why it happens:** Token not invalidated after use
**How to avoid:**
- Clear `reopen_token` column after successful reopen
- Add `reopen_count` column to track reopens
**Warning signs:** Ticket reopened weeks after original token sent

### Pitfall 4: Email Notification Spam

**What goes wrong:** Users get email for every comment and stage change
**Why it happens:** Auto-sending instead of opt-in toggle
**How to avoid:**
- Per CONTEXT.md: Toggle "Notify participants" per action
- Never auto-send; admin explicitly chooses
**Warning signs:** Users complaining about too many emails

### Pitfall 5: Approval Flow Race Condition

**What goes wrong:** Admin and requester act on approval simultaneously
**Why it happens:** No optimistic locking on pending_approval
**How to avoid:**
- Use `updated_at` as optimistic lock
- Check `approval_requested_at` hasn't changed before processing
**Warning signs:** Approval accepted but ticket shows rejected state

## Code Examples

### Ticket List API Route

```typescript
// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) return authResult

  const supabase = await createClient()

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id, title, category, priority, stage,
      pending_approval, pending_stage,
      created_at, updated_at,
      requester:requester_id (id, full_name, email),
      assignee:assigned_to (id, full_name, email)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tickets })
}
```

### Stage Transition API Route

```typescript
// src/app/api/tickets/[id]/transition/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { canTransition, STAGE_CONFIG, type TicketStage } from '@/lib/tickets/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params
  const { toStage, notifyParticipants, comment } = await request.json()

  const supabase = await createClient()

  // Get ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('workspace_id, stage, assigned_to, requester_id')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Check membership and role
  const authResult = await requireWorkspaceMembership(ticket.workspace_id)
  if (authResult instanceof NextResponse) return authResult

  // Only assigned staff, admin, or owner can transition
  const isAssigned = ticket.assigned_to === authResult.user.id
  const isAdminOrOwner = ['owner', 'admin'].includes(authResult.role)

  if (!isAssigned && !isAdminOrOwner) {
    return NextResponse.json(
      { error: 'Only assigned staff or admin can change stage' },
      { status: 403 }
    )
  }

  // Validate transition
  const fromStage = ticket.stage as TicketStage
  if (!canTransition(fromStage, toStage as TicketStage)) {
    return NextResponse.json(
      { error: `Cannot transition from ${fromStage} to ${toStage}` },
      { status: 400 }
    )
  }

  // Update ticket
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ stage: toStage, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Add status history
  await supabase.from('ticket_status_history').insert({
    ticket_id: ticketId,
    changed_by: authResult.user.id,
    from_stage: fromStage,
    to_stage: toStage,
    reason: comment
  })

  // Add system comment if provided
  if (comment) {
    await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author_id: authResult.user.id,
      content: `Dipindahkan ke ${STAGE_CONFIG[toStage as TicketStage].label}: ${comment}`,
      is_stage_change: true
    })
  }

  // Send email notification if toggled
  if (notifyParticipants) {
    // Get participants (requester + commenters)
    const { data: participants } = await supabase
      .from('ticket_comments')
      .select('author_id')
      .eq('ticket_id', ticketId)

    const recipientIds = new Set([
      ticket.requester_id,
      ...participants?.map(p => p.author_id) || []
    ])

    // TODO: Send email to each recipient
    // await sendTicketUpdateEmail(...)
  }

  return NextResponse.json({ success: true })
}
```

### Ticket Closed Email Template

```typescript
// src/emails/ticket-closed.tsx
import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './components/base-layout'

interface TicketClosedEmailProps {
  ticketTitle: string
  ticketId: string
  workspaceName: string
  reopenLink: string
}

export function TicketClosedEmail({
  ticketTitle,
  ticketId,
  workspaceName,
  reopenLink,
}: TicketClosedEmailProps) {
  return (
    <BaseLayout preview={`Tiket #${ticketId.slice(0, 8)} telah selesai`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Tiket Telah Selesai
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        Tiket <strong>&quot;{ticketTitle}&quot;</strong> di{' '}
        <strong>{workspaceName}</strong> telah ditutup secara otomatis
        setelah 7 hari di tahap Implementasi.
      </Text>

      <Text className="text-brand-text leading-6 mb-4">
        Jika Anda belum puas dengan penyelesaian, Anda dapat membuka
        kembali tiket ini dalam 7 hari ke depan.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={reopenLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Buka Kembali Tiket
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Link ini berlaku selama 7 hari. Jika tidak ada masalah,
        abaikan email ini.
      </Text>
    </BaseLayout>
  )
}

export default TicketClosedEmail
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External state machine libs | TypeScript constants + validation | 2024 | Simpler for linear workflows |
| Webhook-based scheduled jobs | pg_cron in-database | Supabase 2024 | Zero cold start, atomic |
| UUID-only tokens | HMAC with expiry | Security best practice | Self-validating, time-limited |
| Auto-email on every action | Manual toggle per action | UX evolution | Reduces noise, user control |

**Deprecated/outdated:**
- **External workflow engines (n8n, Temporal) for simple ticketing:** Overkill for 4-stage linear workflow
- **Threaded comments:** Added complexity without value for support tickets
- **Separate approval table:** Boolean + pending_stage on ticket is cleaner

## Open Questions

1. **Comment formatting**
   - What we know: CONTEXT.md says "Claude's Discretion" for markdown vs plain
   - What's unclear: Whether users need code blocks in support tickets
   - Recommendation: Support basic markdown (bold, code blocks) using existing textarea; no WYSIWYG editor

2. **Real-time updates**
   - What we know: Supabase Realtime already enabled (migration 15)
   - What's unclear: Whether ticket detail page needs live updates
   - Recommendation: Use polling for v1 (simpler), add Realtime subscription later if needed

3. **Attachment support**
   - What we know: CONTEXT.md explicitly defers attachments
   - What's unclear: How users will share screenshots
   - Recommendation: v1 without attachments; users can share via WhatsApp or external links

## Sources

### Primary (HIGH confidence)
- [Supabase Cron (pg_cron)](https://supabase.com/docs/guides/cron) - Auto-close implementation
- [PostgreSQL Audit Trigger Wiki](https://wiki.postgresql.org/wiki/Audit_trigger) - Status history pattern
- [HMAC Verification Tokens](https://rotational.io/blog/hmac-verification-tokens/) - Reopen token pattern
- Phase 2 RESEARCH.md - React Email patterns (already implemented)
- Phase 3 RESEARCH.md - RLS and permission patterns (already implemented)
- Existing codebase: `src/lib/permissions/`, `src/lib/email/`, `supabase/migrations/`

### Secondary (MEDIUM confidence)
- [GeeksforGeeks: Database Design for Customer Support](https://www.geeksforgeeks.org/dbms/database-design-for-customer-support-systems/) - Schema patterns
- [TypeScript FSM patterns on Medium](https://medium.com/@MichaelVD/composable-state-machines-in-typescript-type-safe-predictable-and-testable-5e16574a6906) - State machine approach
- [Supabase Multi-Tenant RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - RLS patterns

### Tertiary (LOW confidence)
- Various WebSearch results on ticketing UI patterns (verified against shadcn/ui docs)

## Metadata

**Confidence breakdown:**
- Database schema: HIGH - Based on PostgreSQL best practices and existing codebase patterns
- Stage machine: HIGH - Simple linear workflow doesn't need library; TypeScript constants verified
- RLS policies: HIGH - Extends existing Phase 3 patterns with same function
- Email integration: HIGH - Extends existing Phase 2 patterns
- Auto-close (pg_cron): MEDIUM - Supabase docs verified, but exact cron.schedule syntax may vary by version
- Reopen token: HIGH - Standard HMAC pattern, matches existing crypto.ts patterns in codebase

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain)
