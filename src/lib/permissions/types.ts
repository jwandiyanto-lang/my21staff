export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type Permission =
  | 'leads:delete'
  | 'leads:view_all'
  | 'leads:export'
  | 'team:invite'
  | 'team:remove'
  | 'team:change_role'
  | 'workspace:settings'
