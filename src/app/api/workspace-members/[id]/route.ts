import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Remove a team member from workspace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const adminClient = createApiAdminClient()

    // Get the membership to delete
    const { data: memberToDelete, error: memberError } = await adminClient
      .from('workspace_members')
      .select('id, workspace_id, user_id, role')
      .eq('id', id)
      .single()

    if (memberError || !memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot delete owner
    if (memberToDelete.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the workspace owner' },
        { status: 400 }
      )
    }

    // Verify membership and get role
    const authResult = await requireWorkspaceMembership(memberToDelete.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    // Check permission - only owners can remove team members
    const permError = requirePermission(
      authResult.role,
      'team:remove',
      'Only workspace owners can remove team members'
    )
    if (permError) return permError

    // Delete the membership
    const { error: deleteError } = await adminClient
      .from('workspace_members')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
