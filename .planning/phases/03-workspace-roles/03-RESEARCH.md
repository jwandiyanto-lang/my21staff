# Phase 3: Workspace Roles Enhancement - Research

**Researched:** 2026-01-18
**Domain:** RBAC (Role-Based Access Control) for Multi-tenant SaaS with Supabase + Next.js
**Confidence:** HIGH

## Summary

This phase implements permission infrastructure for the existing workspace roles (owner/admin/member) that already exist in the database schema. The codebase already has a `role` column in `workspace_members` with values 'owner', 'admin', 'member' - but no enforcement beyond basic membership checks.

The standard approach for this domain is:
1. **Application-layer permission checks** for most operations (via `hasPermission()` utility)
2. **RLS policies for data visibility** (members only see assigned leads)
3. **Per-action authorization** in server actions/API routes (not middleware)
4. **Disabled UI elements with tooltips** for unauthorized actions (not hidden)

**Primary recommendation:** Extend the existing `requireWorkspaceMembership()` function to return the user's role, then add a `hasPermission()` utility that checks role against action. Apply RLS policy modifications only for the member lead-visibility rule.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase RLS | Current | Row-level data visibility for members | Already in use, standard for multi-tenant |
| TypeScript Enums/Unions | - | Permission and role type definitions | Type safety, IDE autocomplete |
| Next.js Server Actions | 15.x | Per-action permission checks | Already in use, defense-in-depth |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Tooltip | Current | Disabled button explanations | For permission-denied UI states |
| Zod | Current | Validate permission payloads | Already in use for validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Application-layer RBAC | Supabase Custom Claims + JWT | Overkill for 3 roles, adds complexity, requires Auth Hooks |
| Simple role checks | Third-party RBAC (Permit.io, Clerk) | External dependency, cost, overkill for simple permission model |
| Per-action checks | Middleware-only checks | CVE-2025-29927 showed middleware can be bypassed; defense-in-depth required |

**Installation:**
No new packages required - all libraries already in use.

## Architecture Patterns

### Recommended Permission Model

```typescript
// src/lib/permissions/types.ts
export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type Permission =
  | 'leads:delete'
  | 'leads:view_all'
  | 'leads:export'
  | 'team:invite'
  | 'team:remove'
  | 'team:change_role'
  | 'workspace:settings'

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    'leads:delete',
    'leads:view_all',
    'leads:export',
    'team:invite',
    'team:remove',
    'team:change_role',
    'workspace:settings'
  ],
  admin: [
    'leads:view_all',
    'leads:export'
  ],
  member: []
}
```

### Recommended Project Structure
```
src/lib/
  permissions/
    types.ts          # WorkspaceRole, Permission types
    check.ts          # hasPermission(), requirePermission()
    constants.ts      # ROLE_PERMISSIONS mapping
  auth/
    workspace-auth.ts # Extended to return role
```

### Pattern 1: Extended Workspace Auth

**What:** Modify `requireWorkspaceMembership()` to return user role alongside membership
**When to use:** Every API route/server action that needs permission checks

```typescript
// Source: Extending existing src/lib/auth/workspace-auth.ts
export interface AuthResult {
  user: { id: string; email: string }
  workspaceId: string
  role: WorkspaceRole  // NEW: Add role to result
}

export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')  // Add role to select
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: 'Not authorized to access this workspace' },
      { status: 403 }
    )
  }

  return {
    user: { id: user.id, email: user.email || '' },
    workspaceId,
    role: membership.role as WorkspaceRole  // Return role
  }
}
```

### Pattern 2: Permission Check Utility

**What:** Type-safe utility to check if role has permission
**When to use:** API routes, server actions, React components

```typescript
// Source: New file src/lib/permissions/check.ts
import { ROLE_PERMISSIONS, type Permission, type WorkspaceRole } from './types'

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// For API routes - returns 403 response if unauthorized
export function requirePermission(
  role: WorkspaceRole,
  permission: Permission,
  errorMessage?: string
): NextResponse | null {
  if (!hasPermission(role, permission)) {
    return NextResponse.json(
      { error: errorMessage || `Insufficient permissions: requires ${permission}` },
      { status: 403 }
    )
  }
  return null
}
```

### Pattern 3: RLS for Member Lead Visibility

**What:** PostgreSQL RLS policy that restricts members to only see assigned leads
**When to use:** For `contacts` table SELECT policy

```sql
-- Source: Based on Supabase RLS best practices
-- Use security definer function to avoid RLS recursion and improve performance

CREATE OR REPLACE FUNCTION private.get_user_role_in_workspace(workspace_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = workspace_uuid
  AND user_id = auth.uid()
$$;

-- Optimized contacts SELECT policy
DROP POLICY IF EXISTS "Users can view contacts in their workspaces" ON contacts;

CREATE POLICY "Users can view contacts based on role" ON contacts
  FOR SELECT USING (
    -- Use subquery wrapper for function caching (60-80% faster)
    (SELECT private.get_user_role_in_workspace(workspace_id)) IN ('owner', 'admin')
    OR (
      -- Members only see assigned contacts
      (SELECT private.get_user_role_in_workspace(workspace_id)) = 'member'
      AND assigned_to = (SELECT auth.uid())
    )
  );
```

### Pattern 4: Disabled Button with Tooltip

**What:** Show disabled buttons with explanation tooltip instead of hiding
**When to use:** Any action the user lacks permission for

```tsx
// Source: shadcn/ui pattern from GitHub issue #1022
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface PermissionButtonProps {
  permission: Permission
  userRole: WorkspaceRole
  onClick: () => void
  children: React.ReactNode
}

export function PermissionButton({
  permission,
  userRole,
  onClick,
  children
}: PermissionButtonProps) {
  const allowed = hasPermission(userRole, permission)

  if (allowed) {
    return <Button onClick={onClick}>{children}</Button>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild className="disabled:pointer-events-auto">
        <Button disabled>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>
        Contact your workspace owner to access this
      </TooltipContent>
    </Tooltip>
  )
}
```

### Anti-Patterns to Avoid

- **Hiding buttons instead of disabling:** Per CONTEXT.md decisions, use disabled+tooltip pattern
- **Middleware-only permission checks:** CVE-2025-29927 showed middleware can be bypassed; always verify in server actions too
- **Complex RLS for all permissions:** Use RLS only for data visibility (member lead filtering), use application code for action permissions
- **Checking permissions in client components only:** Always verify on server; client checks are UX only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role storage | Custom roles table | Existing `workspace_members.role` column | Already exists, works |
| Permission matrix | Complex permission inheritance | Simple ROLE_PERMISSIONS constant | 3 roles is too simple for RBAC libraries |
| Tooltip on disabled button | Custom hover logic | shadcn/ui Tooltip + `disabled:pointer-events-auto` | Handles accessibility, already styled |
| Role-based data filtering | Application-level filtering | Supabase RLS policies | Database enforces it, can't bypass |

**Key insight:** The permission model (owner/admin/member with fixed capabilities) is simple enough that a library like Permit.io or Clerk Organizations adds unnecessary complexity. A TypeScript constant mapping roles to permissions is sufficient and maintainable.

## Common Pitfalls

### Pitfall 1: Forgetting Server-Side Permission Checks
**What goes wrong:** Checking permissions only in React components, API still allows action
**Why it happens:** Client-side checks feel complete, easy to forget server
**How to avoid:** Every API route/server action that modifies data must call `requirePermission()`
**Warning signs:** No 403 errors in API responses, only UI prevents action

### Pitfall 2: RLS Policy Performance Issues
**What goes wrong:** Slow queries when RLS policies use subqueries inefficiently
**Why it happens:** Naive subqueries execute per-row instead of being cached
**How to avoid:**
- Wrap function calls in `(SELECT func())` for caching
- Use `SECURITY DEFINER` functions in private schema
- Add indexes on role lookup columns
**Warning signs:** Query times increase with table size, `EXPLAIN ANALYZE` shows repeated function calls

### Pitfall 3: Tooltip Accessibility on Disabled Buttons
**What goes wrong:** Tooltip doesn't appear on disabled button
**Why it happens:** `disabled` attribute removes pointer events
**How to avoid:** Add `className="disabled:pointer-events-auto"` to TooltipTrigger
**Warning signs:** Hovering disabled button shows no tooltip

### Pitfall 4: Role Check in Wrong Location
**What goes wrong:** Checking workspace owner_id instead of workspace_members.role
**Why it happens:** Schema has both `workspaces.owner_id` and `workspace_members.role`
**How to avoid:** Always use `workspace_members.role` - it's the canonical source
**Warning signs:** Owner determined by workspace creator, not membership role

### Pitfall 5: Missing Permission for Own Profile View
**What goes wrong:** Users can't see their own role because of permission check
**Why it happens:** Over-applying permission checks
**How to avoid:** Users can always view their own membership data
**Warning signs:** 403 when user tries to see profile/settings

## Code Examples

Verified patterns from official sources:

### API Route with Permission Check

```typescript
// Source: Pattern from codebase + research
// DELETE /api/contacts/[id] - Owner only

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  // Get contact to find workspace
  const { data: contact } = await supabase
    .from('contacts')
    .select('workspace_id')
    .eq('id', id)
    .single()

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Check membership AND get role
  const authResult = await requireWorkspaceMembership(contact.workspace_id)
  if (authResult instanceof NextResponse) return authResult

  // Check permission - delete requires owner
  const permError = requirePermission(authResult.role, 'leads:delete')
  if (permError) return permError

  // Proceed with deletion...
}
```

### React Component with Permission Context

```typescript
// Source: Pattern from Clerk + React best practices
// contexts/workspace-context.tsx

interface WorkspaceContextValue {
  workspace: Workspace
  role: WorkspaceRole
  can: (permission: Permission) => boolean
}

export function WorkspaceProvider({ children, workspace, role }: Props) {
  const can = useCallback(
    (permission: Permission) => hasPermission(role, permission),
    [role]
  )

  return (
    <WorkspaceContext.Provider value={{ workspace, role, can }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Usage in component
function DeleteButton({ contactId }: { contactId: string }) {
  const { can } = useWorkspace()

  if (!can('leads:delete')) {
    return (
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          <Button variant="destructive" disabled>
            <Trash className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Contact your workspace owner to access this
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button variant="destructive" onClick={() => deleteContact(contactId)}>
      <Trash className="h-4 w-4" />
    </Button>
  )
}
```

### Role Change with Confirmation and Email

```typescript
// Source: Pattern combining codebase patterns + research
// Server action for role change

export async function changeRole(memberId: string, newRole: WorkspaceRole) {
  const supabase = await createClient()

  // Get membership to change
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id, user_id, role')
    .eq('id', memberId)
    .single()

  if (!member) throw new Error('Member not found')

  // Check caller is owner
  const authResult = await requireWorkspaceMembership(member.workspace_id)
  if (authResult instanceof NextResponse) throw new Error('Unauthorized')

  const permError = requirePermission(authResult.role, 'team:change_role')
  if (permError) throw new Error('Only owners can change roles')

  // Cannot change owner role
  if (member.role === 'owner') {
    throw new Error('Cannot change owner role')
  }

  // Update role
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('id', memberId)

  if (error) throw error

  // Send notification email (per CONTEXT.md decision)
  await sendRoleChangeEmail(member.user_id, newRole)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JWT custom claims for roles | Application-layer role checks | 2024-2025 | Simpler, no Auth Hook complexity |
| Middleware-only auth | Defense-in-depth (middleware + server action) | CVE-2025-29927 (2025) | Critical security fix |
| Hide unauthorized buttons | Disable with tooltip | 2024 accessibility focus | Better UX, WCAG compliance |
| Per-row function execution in RLS | Subquery wrapping for caching | Supabase optimization | 60-80% query improvement |

**Deprecated/outdated:**
- **JWT claims for simple RBAC**: Adds complexity (Auth Hooks) for minimal benefit with 3 roles
- **`disabled` attribute for permission-denied buttons**: Breaks tooltip hover; use `aria-disabled` pattern

## Open Questions

Things that couldn't be fully resolved:

1. **Email delivery for role change notifications**
   - What we know: Phase 02 set up Hostinger email system
   - What's unclear: Whether SMTP issues from Phase 02 are fully resolved
   - Recommendation: Use existing email infrastructure, add role change template

2. **Role badge colors in team list**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Brand colors not fully defined in BRAND.md (deleted)
   - Recommendation: Use shadcn/ui Badge variants (default for owner, secondary for others)

## Sources

### Primary (HIGH confidence)
- Supabase RLS Performance docs: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase Custom Claims RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- shadcn/ui Tooltip disabled button: https://github.com/shadcn-ui/ui/issues/1022
- Existing codebase patterns: `src/lib/auth/workspace-auth.ts`, `supabase/schema.sql`

### Secondary (MEDIUM confidence)
- Clerk Next.js RBAC patterns: https://clerk.com/blog/nextjs-role-based-access-control
- TypeScript permissions patterns: https://xetera.dev/article/typescript-permissions
- Material UI disabled button accessibility: https://mui.com/material-ui/react-tooltip/

### Tertiary (LOW confidence)
- CVE-2025-29927 middleware bypass: Referenced in multiple 2025 articles, verify specific version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing libraries, well-documented patterns
- Architecture: HIGH - Extending existing patterns, verified with official docs
- Pitfalls: HIGH - Multiple sources confirm, verified with Supabase docs
- RLS optimization: MEDIUM - Supabase docs confirm, but exact performance gains vary

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain, well-established patterns)
