import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/send'
import { randomBytes } from 'crypto'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    const { email, workspaceId } = await request.json()

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'Email and workspaceId are required' },
        { status: 400 }
      )
    }

    // Verify membership and get role
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Check permission - only owners can invite
    const permError = requirePermission(
      authResult.role,
      'team:invite',
      'Only workspace owners can invite team members'
    )
    if (permError) return permError

    const user = authResult.user
    const normalizedEmail = email.toLowerCase().trim()

    // Get workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || user.email || 'Team member'

    // Check if user already exists in Supabase auth
    const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers()
    const existingAuthUser = existingUsers.find(u => u.email?.toLowerCase() === normalizedEmail)

    // Check if already a member of this workspace
    if (existingAuthUser) {
      const { data: existingMember } = await adminClient
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingAuthUser.id)
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 400 }
      )
    }

    // Generate unique invitation token
    const invitationToken = randomBytes(32).toString('hex')

    // Calculate expiry (7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create or get the user in Supabase auth
    let authUserId: string

    if (existingAuthUser) {
      // User exists - they'll just need to log in
      authUserId = existingAuthUser.id
    } else {
      // Create new user with email_confirm: true (skip Supabase email)
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          invited_to_workspace: workspaceId,
        },
      })

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json(
          { error: `Failed to create user account: ${createError.message}` },
          { status: 500 }
        )
      }

      authUserId = newUser.user.id
    }

    // Generate a recovery link (for password setup)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.vercel.app'
    const redirectTo = `${appUrl}/set-password?invitation=${invitationToken}`

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo,
      },
    })

    if (linkError || !linkData) {
      console.error('Failed to generate recovery link:', linkError)
      return NextResponse.json(
        { error: `Failed to generate invitation link: ${linkError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Create invitation record
    const { data: invitation, error: insertError } = await adminClient
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: normalizedEmail,
        role: 'member',
        token: invitationToken,
        status: 'pending',
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create invitation:', insertError)
      return NextResponse.json(
        { error: `Failed to create invitation: ${insertError.message}` },
        { status: 500 }
      )
    }

    // The recovery link from Supabase (contains the magic token)
    // This link, when clicked, will validate the token and redirect to our callback
    const inviteLink = linkData.properties.action_link

    // Send invitation email via our SMTP
    try {
      await sendInvitationEmail({
        to: normalizedEmail,
        inviteLink,
        workspaceName: workspace.name,
        inviterName,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Return error with details - email is required for invitation to work
      return NextResponse.json(
        { error: `Failed to send invitation email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at,
      },
    })
  } catch (error) {
    console.error('Invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
