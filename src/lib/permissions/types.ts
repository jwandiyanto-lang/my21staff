export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type Permission =
  | 'leads:delete'
  | 'leads:view_all'
  | 'leads:export'
  | 'team:invite'
  | 'team:remove'
  | 'team:change_role'
  | 'workspace:settings'
  // Ticket permissions
  | 'tickets:assign'      // Assign tickets to team members
  | 'tickets:transition'  // Move tickets between stages
  | 'tickets:skip_stage'  // Skip stages (requires approval)
