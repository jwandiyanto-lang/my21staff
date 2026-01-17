import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Remove a team member from workspace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Verify current user is admin/owner of the workspace
    const { data: currentUserMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', memberToDelete.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!currentUserMembership || !['owner', 'admin'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'Only admins can remove team members' },
        { status: 403 }
      )
    }

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
