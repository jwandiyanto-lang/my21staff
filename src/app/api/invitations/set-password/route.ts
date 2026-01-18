import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { invitationToken, password } = await request.json()

    if (!invitationToken || !password) {
      return NextResponse.json(
        { error: 'Invitation token and password are required' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const adminClient = createApiAdminClient()

    // Look up invitation by token
    const { data: invitation, error: inviteError } = await adminClient
      .from('workspace_invitations')
      .select('id, email, workspace_id, status')
      .eq('token', invitationToken)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      )
    }

    // Find the user by email
    const { data: { users } } = await adminClient.auth.admin.listUsers()
    const authUser = users.find(u => u.email?.toLowerCase() === invitation.email.toLowerCase())

    if (!authUser) {
      return NextResponse.json(
        { error: 'User account not found. Please contact support.' },
        { status: 400 }
      )
    }

    // Set the user's password using admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      authUser.id,
      { password }
    )

    if (updateError) {
      console.error('Failed to set password:', updateError)
      return NextResponse.json(
        { error: 'Failed to set password. Please try again.' },
        { status: 500 }
      )
    }

    // Get workspace info for redirect
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('slug')
      .eq('id', invitation.workspace_id)
      .single()

    // Add user to workspace
    const { error: memberError } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: authUser.id,
        role: 'member',
      })

    if (memberError && !memberError.message.includes('duplicate')) {
      console.error('Failed to add member:', memberError)
      // Don't fail - password was set, they can join later
    }

    // Update invitation status
    await adminClient
      .from('workspace_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      email: invitation.email,
      workspaceSlug: workspace?.slug,
    })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
