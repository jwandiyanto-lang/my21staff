// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/send'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Cancel/delete a pending invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const adminClient = createApiAdminClient()

    // Get the invitation first to get workspace_id and email
    const { data: invitation, error: invError } = await adminClient
      .from('workspace_invitations')
      .select('id, workspace_id, email, status')
      .eq('id', id)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify membership and get role
    const authResult = await requireWorkspaceMembership(invitation.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    // Check permission - only owners can delete invitations
    const permError = requirePermission(
      authResult.role,
      'team:remove',
      'Only workspace owners can delete invitations'
    )
    if (permError) return permError

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

    // If invitation was pending, clean up the auth user if they have no other workspaces
    if (invitation.status === 'pending') {
      // Find the user by email
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const authUser = users.find(u => u.email?.toLowerCase() === invitation.email.toLowerCase())

      if (authUser) {
        // Check if user has any workspace memberships
        const { data: memberships } = await adminClient
          .from('workspace_members')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1)

        // If no memberships, delete the auth user
        if (!memberships || memberships.length === 0) {
          const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(authUser.id)
          if (authDeleteError) {
            console.error('Failed to delete auth user:', authDeleteError)
            // Don't fail - invitation was already deleted
          }
        }
      }
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

    // Get the invitation first to get workspace_id
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

    // Verify membership and get role
    const authResult = await requireWorkspaceMembership(invitation.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    // Check permission - only owners can resend invitations
    const permError = requirePermission(
      authResult.role,
      'team:invite',
      'Only workspace owners can resend invitations'
    )
    if (permError) return permError

    const user = authResult.user

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

    // Generate direct link to set-password page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.com'
    const inviteLink = `${appUrl}/set-password?invitation=${invitation.token}`

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: invitation.email,
        inviteLink,
        workspaceName: workspace.name,
        inviterName,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      return NextResponse.json(
        { error: `Failed to send email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Update the invitation timestamp
    await adminClient
      .from('workspace_invitations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: `Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
