import { createClient } from '@/lib/supabase/server'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { NextResponse } from 'next/server'

export interface AuthResult {
  user: { id: string; email: string }
  workspaceId: string
  role: WorkspaceRole
}

export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify workspace membership and get role
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
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
    role: membership.role as WorkspaceRole
  }
}
