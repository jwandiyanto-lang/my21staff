import { type Permission, type WorkspaceRole } from './types'

/**
 * Role-based permission mapping
 *
 * Per CONTEXT.md decisions:
 * - Owner: all permissions (delete, view_all, export, invite, remove, change_role, settings)
 * - Admin: view_all, export only
 * - Member: no permissions (empty array) - can only see assigned leads
 */
export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    'leads:delete',
    'leads:view_all',
    'leads:export',
    'team:invite',
    'team:remove',
    'team:change_role',
    'workspace:settings',
    // Ticket permissions
    'tickets:assign',
    'tickets:transition',
    'tickets:skip_stage'
  ],
  admin: [
    'leads:view_all',
    'leads:export',
    // Ticket permissions
    'tickets:assign',
    'tickets:transition',
    'tickets:skip_stage'
  ],
  member: []
}
