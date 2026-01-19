import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'

// Type for invitation with name (column added in migration 33)
interface InvitationWithName {
  id: string
  email: string
  workspace_id: string
  status: string
  role: string | null
  name: string | null
}

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
    const { data: invitationData, error: inviteError } = await adminClient
      .from('workspace_invitations')
      .select('id, email, workspace_id, status, role, name')
      .eq('token', invitationToken)
      .single()

    const invitation = invitationData as unknown as InvitationWithName | null

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

    // Create profile if it doesn't exist
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .eq('id', authUser.id)
      .maybeSingle()

    if (!existingProfile) {
      // Use name from invitation, fallback to email prefix
      const fullName = invitation.name || invitation.email.split('@')[0]
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: authUser.id,
          email: invitation.email,
          full_name: fullName,
        })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        // Don't fail - continue with the flow
      }
    } else if (invitation.name && !existingProfile.full_name) {
      // Update existing profile with name if it was missing
      await adminClient
        .from('profiles')
        .update({ full_name: invitation.name })
        .eq('id', authUser.id)
    }

    // Get workspace info for redirect
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('slug')
      .eq('id', invitation.workspace_id)
      .single()

    // Add user to workspace with role from invitation
    console.log('Adding user to workspace:', {
      workspace_id: invitation.workspace_id,
      user_id: authUser.id,
      role: invitation.role || 'member',
    })

    const { data: newMember, error: memberError } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: authUser.id,
        role: invitation.role || 'member',
        must_change_password: false, // User just set their password via invitation
      })
      .select()
      .single()

    if (memberError && !memberError.message.includes('duplicate')) {
      console.error('Failed to add member:', memberError)
      // Don't fail - password was set, they can join later
    } else {
      console.log('Successfully added member:', newMember)
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
