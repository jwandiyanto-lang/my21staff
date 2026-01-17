import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/transporter'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Cancel/delete a pending invitation
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

    // Get the invitation
    const { data: invitation, error: invError } = await adminClient
      .from('workspace_invitations')
      .select('id, workspace_id, status')
      .eq('id', id)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify user is admin/owner of the workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins can delete invitations' },
        { status: 403 }
      )
    }

    // Delete the invitation
    const { error: deleteError } = await adminClient
      .from('workspace_invitations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete invitation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Resend invitation email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the invitation with workspace info
    const { data: invitation, error: invError } = await adminClient
      .from('workspace_invitations')
      .select('id, workspace_id, email, token, status')
      .eq('id', id)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only resend pending invitations' },
        { status: 400 }
      )
    }

    // Verify user is admin/owner of the workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins can resend invitations' },
        { status: 403 }
      )
    }

    // Get workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('id', invitation.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || user.email || 'Team member'

    // Build invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.vercel.app'
    const inviteLink = `${appUrl}/api/invitations/accept?token=${invitation.token}`

    // Send invitation email
    await sendInvitationEmail({
      to: invitation.email,
      inviteLink,
      workspaceName: workspace.name,
      inviterName,
    })

    // Update the invitation timestamp
    await adminClient
      .from('workspace_invitations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}
