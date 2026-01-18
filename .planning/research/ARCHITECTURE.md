# Architecture Research: Email, Ticketing, and Roles Integration

**Domain:** WhatsApp CRM SaaS - v2.1 Feature Integration
**Researched:** 2026-01-18
**Confidence:** HIGH (based on existing codebase patterns + official Supabase documentation)

## Executive Summary

The v2.1 features (email templates, support ticketing, workspace roles) integrate naturally with the existing multi-tenant architecture. The codebase already has the foundational patterns: workspace-scoped RLS, role-based membership (`owner`, `admin`, `member`), and a working email infrastructure (nodemailer via Hostinger SMTP). The key architectural decisions are:

1. **Email Templates**: Store in database (not filesystem) for admin editability, use React Email for rendering
2. **Support Ticketing**: Standard ticket lifecycle with comments, following the existing `contact_notes` pattern
3. **Workspace Roles**: Extend existing `workspace_members.role` with permission checks, not JWT claims (simpler for this scale)

## Email System Integration

### Current State Analysis

The codebase already has email infrastructure in `/src/lib/email/transporter.ts`:
- Nodemailer with Hostinger SMTP (`smtp.hostinger.com:465`)
- One template type: invitation emails
- HTML templates hardcoded in TypeScript

### Data Model

**Option A: Database-Stored Templates (Recommended)**

```sql
-- Migration: 20_email_templates.sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  -- NULL workspace_id = system default templates
  template_type VARCHAR(50) NOT NULL,
  -- 'invitation', 'welcome', 'password_reset', 'ticket_created', 'ticket_updated'
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT, -- Plain text fallback
  variables JSONB DEFAULT '[]', -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, template_type)
);

CREATE INDEX idx_email_templates_workspace ON email_templates(workspace_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Workspace admins can manage their templates
CREATE POLICY "Admins can manage templates" ON email_templates
  FOR ALL USING (
    workspace_id IS NULL OR -- System templates readable by all
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

**Template Types:**
| Type | Use Case | Variables |
|------|----------|-----------|
| `invitation` | Team member invite | `{{inviterName}}`, `{{workspaceName}}`, `{{inviteLink}}` |
| `welcome` | Post-signup welcome | `{{userName}}`, `{{workspaceName}}` |
| `password_reset` | Password recovery | `{{resetLink}}`, `{{expiryHours}}` |
| `ticket_created` | Support ticket opened | `{{ticketId}}`, `{{ticketTitle}}`, `{{ticketUrl}}` |
| `ticket_updated` | Ticket status change | `{{ticketId}}`, `{{oldStatus}}`, `{{newStatus}}`, `{{ticketUrl}}` |

### API Pattern

**Extend existing email infrastructure:**

```
src/lib/email/
  transporter.ts      # Existing SMTP config
  templates.ts        # NEW: Template fetching + variable substitution
  send.ts             # NEW: Unified send function
```

**Template Rendering Flow:**
```typescript
// src/lib/email/templates.ts
export async function getEmailTemplate(
  type: TemplateType,
  workspaceId?: string
): Promise<EmailTemplate> {
  const supabase = createApiAdminClient()

  // Try workspace-specific first, fall back to system default
  const { data } = await supabase
    .from('email_templates')
    .select('*')
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    .eq('template_type', type)
    .eq('is_active', true)
    .order('workspace_id', { ascending: false, nullsLast: true })
    .limit(1)
    .single()

  return data
}

export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): string {
  let html = template.html_content
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return html
}
```

### Template Storage Recommendation

**Database over filesystem because:**
1. Admins can edit templates without code deployment
2. Workspace-specific customization possible
3. Consistent with existing data patterns
4. Auditable (updated_at tracking)

**Seed system defaults via migration:**
```sql
-- Seed default templates
INSERT INTO email_templates (workspace_id, template_type, subject, html_content, variables)
VALUES
(NULL, 'invitation', 'Anda diundang ke {{workspaceName}}',
 '<div>...invitation HTML...</div>',
 '["inviterName", "workspaceName", "inviteLink"]'),
(NULL, 'welcome', 'Selamat datang di my21staff',
 '<div>...welcome HTML...</div>',
 '["userName", "workspaceName"]');
```

### Alternative: React Email (Future Enhancement)

For more complex templates, consider React Email + Resend:
```typescript
// src/emails/invitation.tsx
import { Html, Button, Text } from '@react-email/components'

export function InvitationEmail({ inviterName, workspaceName, inviteLink }) {
  return (
    <Html>
      <Text>{inviterName} mengundang Anda ke {workspaceName}</Text>
      <Button href={inviteLink}>Terima Undangan</Button>
    </Html>
  )
}
```

**Not recommended for v2.1** - adds complexity without clear benefit at current scale. Database templates with variable substitution are sufficient.

## Support Ticketing Integration

### Data Model

Following the pattern from `contact_notes`, create a comprehensive ticketing system:

```sql
-- Migration: 21_support_tickets.sql

-- Ticket status enum
CREATE TYPE ticket_status AS ENUM (
  'open',        -- Initial: Ticket created
  'in_progress', -- Custom: Being worked on
  'waiting',     -- Custom: Awaiting user response
  'resolved',    -- Final precursor: Issue addressed
  'closed'       -- Final: Ticket complete
);

-- Ticket priority enum
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Ticket category enum (customizable per use case)
CREATE TYPE ticket_category AS ENUM (
  'bug',           -- Something broken
  'feature',       -- Feature request
  'question',      -- How-to question
  'account',       -- Account/billing issue
  'integration'    -- WhatsApp/Kapso integration
);

-- Support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ticket_number SERIAL, -- Human-readable ticket ID
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  category ticket_category,

  -- Submitter
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_by_email VARCHAR(255), -- Denormalized for display

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),

  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_workspace ON support_tickets(workspace_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_submitted_by ON support_tickets(submitted_by);
CREATE INDEX idx_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_tickets_created ON support_tickets(created_at DESC);

-- Ticket comments (discussion thread)
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs public reply
  attachments JSONB DEFAULT '[]', -- [{url, name, type}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_comments_created ON ticket_comments(created_at);

-- Ticket status history (audit trail)
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  old_status ticket_status,
  new_status ticket_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_ticket ON ticket_status_history(ticket_id);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
```

### RLS Considerations

**Who can see what tickets:**

```sql
-- Users can view tickets they submitted
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (submitted_by = auth.uid());

-- Workspace admins can view all workspace tickets
CREATE POLICY "Admins can view workspace tickets" ON support_tickets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Platform admins (is_admin in profiles) can view all tickets
CREATE POLICY "Platform admins can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Users can create tickets in their workspaces
CREATE POLICY "Members can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Only admins and assignees can update tickets
CREATE POLICY "Admins and assignees can update tickets" ON support_tickets
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

**Comments RLS:**

```sql
-- Anyone who can view ticket can view comments (non-internal)
CREATE POLICY "Users can view public comments" ON ticket_comments
  FOR SELECT USING (
    is_internal = false AND
    ticket_id IN (SELECT id FROM support_tickets) -- RLS on tickets filters
  );

-- Only admins can view internal comments
CREATE POLICY "Admins can view internal comments" ON ticket_comments
  FOR SELECT USING (
    is_internal = true AND
    EXISTS (
      SELECT 1 FROM support_tickets t
      JOIN workspace_members wm ON t.workspace_id = wm.workspace_id
      WHERE t.id = ticket_comments.ticket_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Ticket participants can add comments
CREATE POLICY "Participants can add comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    ticket_id IN (SELECT id FROM support_tickets)
  );
```

### API Pattern

**CRUD Operations:**

```
src/app/api/tickets/
  route.ts                    # GET list, POST create
  [id]/
    route.ts                  # GET single, PATCH update
    comments/
      route.ts                # GET/POST comments
    status/
      route.ts                # PATCH status change (with history)
```

**Status Transitions (State Machine):**

```typescript
// src/lib/ticket/status.ts
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  'open': ['in_progress', 'waiting', 'closed'],
  'in_progress': ['waiting', 'resolved', 'open'],
  'waiting': ['in_progress', 'resolved', 'closed'],
  'resolved': ['closed', 'open'], // Can reopen if issue recurs
  'closed': ['open'], // Reopen only
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
```

### Ticket Workflow (Report -> Discuss -> Outcome -> Implementation)

Map the desired workflow to statuses:

| Stage | Status | Description |
|-------|--------|-------------|
| **Report** | `open` | User submits ticket with title, description, category |
| **Discuss** | `in_progress` | Admin reviews, asks clarifying questions via comments |
| **Waiting** | `waiting` | Awaiting user response or external dependency |
| **Outcome** | `resolved` | Solution determined, documented in resolution field |
| **Implementation** | `closed` | Solution applied, ticket archived |

## Workspace Roles Integration

### Current State Analysis

The codebase already has roles in `workspace_members`:
```sql
role VARCHAR(50) DEFAULT 'member' -- 'owner', 'admin', 'member'
```

RLS policies in migration 12 already check for `role IN ('owner', 'admin')`.

### Data Model Enhancement

**Option A: Keep Simple (Recommended for v2.1)**

The current role column is sufficient. Add a permissions lookup in application code:

```typescript
// src/lib/auth/permissions.ts
export const ROLE_PERMISSIONS = {
  owner: [
    'workspace.delete',
    'workspace.settings',
    'members.invite',
    'members.remove',
    'members.change_role',
    'tickets.manage_all',
    'templates.manage',
    'contacts.delete',
    // ... all permissions
  ],
  admin: [
    'members.invite',
    'members.remove',
    'tickets.manage_all',
    'templates.manage',
    'contacts.delete',
    // ... most permissions
  ],
  member: [
    'contacts.view',
    'contacts.edit',
    'tickets.create',
    'tickets.view_own',
    'messages.send',
    // ... basic permissions
  ],
} as const

export function hasPermission(
  role: 'owner' | 'admin' | 'member',
  permission: string
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
```

**Option B: Database Permissions Table (Future)**

Only if permission granularity is needed:
```sql
-- Future: Fine-grained permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  UNIQUE(workspace_id, role, permission)
);
```

### Permission Enforcement

**API Level (Primary):**

```typescript
// src/lib/auth/workspace-auth.ts - Extend existing function
export async function requireWorkspaceRole(
  workspaceId: string,
  requiredRoles: ('owner' | 'admin' | 'member')[]
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !requiredRoles.includes(membership.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return {
    user: { id: user.id, email: user.email || '' },
    workspaceId,
    role: membership.role
  }
}
```

**RLS Level (Defense in Depth):**

RLS policies already enforce role checks. The application-level check provides better error messages.

### Migration Strategy

**For existing data:**

```sql
-- Migration: 22_ensure_workspace_owners.sql

-- Ensure every workspace has exactly one owner in workspace_members
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.workspace_id = w.id AND wm.user_id = w.owner_id
)
ON CONFLICT (workspace_id, user_id)
DO UPDATE SET role = 'owner';

-- Update existing owner_id members to have 'owner' role
UPDATE workspace_members wm
SET role = 'owner'
FROM workspaces w
WHERE wm.workspace_id = w.id
AND wm.user_id = w.owner_id
AND wm.role != 'owner';
```

## Component Boundaries

```
                    +------------------+
                    |   Next.js App    |
                    +------------------+
                           |
         +-----------------+------------------+
         |                 |                  |
    +---------+      +---------+        +---------+
    |  Pages  |      |   API   |        |  Email  |
    | (React) |      | Routes  |        | Worker  |
    +---------+      +---------+        +---------+
         |                 |                  |
         |    +------------+-----------+      |
         |    |                        |      |
         v    v                        v      v
    +------------+              +--------------+
    | Supabase   |              |    SMTP      |
    | (Postgres) |              | (Hostinger)  |
    +------------+              +--------------+
         |
         +-- workspaces
         +-- workspace_members (roles)
         +-- contacts
         +-- support_tickets (NEW)
         +-- ticket_comments (NEW)
         +-- email_templates (NEW)
```

**Component Communication:**

| Component | Talks To | Protocol |
|-----------|----------|----------|
| Pages | API Routes | HTTP (fetch) |
| API Routes | Supabase | PostgreSQL (supabase-js) |
| API Routes | SMTP | nodemailer |
| Kapso Webhook | API Routes | HTTP POST |
| Email Worker | SMTP | nodemailer |

**Data Flow for Ticket Creation:**

```
1. User submits form (React)
   ↓
2. POST /api/tickets (API Route)
   ↓
3. Validate user membership + role (workspace-auth)
   ↓
4. Insert into support_tickets (Supabase + RLS)
   ↓
5. Insert into ticket_status_history (Supabase)
   ↓
6. Fetch email template (Supabase)
   ↓
7. Render + send email (nodemailer)
   ↓
8. Return ticket ID (Response)
```

## Build Order

Based on dependencies:

### Phase 1: Email Templates Foundation
**Rationale:** Required by tickets for notifications. Can be tested with existing invitation flow.

1. Create `email_templates` table migration
2. Seed default templates (invitation, welcome)
3. Create `/src/lib/email/templates.ts` for fetching + rendering
4. Refactor existing `sendInvitationEmail` to use templates
5. Test with existing invitation flow

### Phase 2: Workspace Roles Enhancement
**Rationale:** Needed for ticket management permissions. Already partially implemented.

1. Create permissions utility (`/src/lib/auth/permissions.ts`)
2. Extend `requireWorkspaceMembership` to `requireWorkspaceRole`
3. Add role display to settings page
4. Add role change capability (owner only)
5. Run migration to ensure owner consistency

### Phase 3: Support Ticketing Core
**Rationale:** Depends on roles for permissions, email for notifications.

1. Create ticket tables migration
2. Create ticket API routes (CRUD)
3. Create ticket list page
4. Create ticket detail page with comments
5. Add status transition logic

### Phase 4: Ticket Notifications
**Rationale:** Depends on tickets + email templates.

1. Add `ticket_created` and `ticket_updated` templates
2. Hook email sending into ticket create/update
3. Add notification preferences (optional)

## RLS Security Checklist

- [x] **Email Templates:** Workspace-scoped with admin-only write access; system templates (NULL workspace_id) readable by all
- [x] **Support Tickets:** Users see own tickets; admins see all workspace tickets; platform admins see everything
- [x] **Ticket Comments:** Public comments visible to ticket participants; internal comments admin-only
- [x] **Status History:** Append-only (no update/delete policies); visible to ticket viewers
- [x] **Role Changes:** Only owners can change member roles (enforced at API level)
- [x] **Workspace Deletion:** CASCADE deletes all related tickets, templates, members

## Anti-Patterns to Avoid

### 1. JWT Claims for Roles (Avoid)
**Why:** At this scale (single workspace per user session), JWT claims add complexity without benefit. The existing per-request role lookup is sufficient and always current.

### 2. Separate Permissions Table (Avoid for v2.1)
**Why:** Three roles (owner/admin/member) with hardcoded permissions is simpler and sufficient. Add granular permissions only if business requires it.

### 3. Filesystem Email Templates (Avoid)
**Why:** Requires code deployment to update templates. Database storage allows admin editing.

### 4. Complex State Machines (Avoid)
**Why:** Five statuses with simple transitions cover the workflow. XState or similar is overkill.

## Sources

**Official Documentation:**
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

**Patterns & Best Practices:**
- [Resend with Next.js](https://resend.com/docs/send-with-nextjs)
- [React Email Templates](https://react.email/)
- [Supabase Multi-Tenant RBAC Template](https://github.com/point-source/supabase-tenant-rbac)

**Ticketing Workflow:**
- [Jira Workflow Best Practices](https://www.herocoders.com/blog/jira-workflows-guide)
- [Ticket Status Guide](https://www.zluri.com/blog/ticket-statuses)
- [Support Ticket Workflow Templates](https://unito.io/blog/build-support-ticket-workflow/)

---
*Last updated: 2026-01-18*
