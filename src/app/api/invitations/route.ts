import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/transporter'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, workspaceId } = await request.json()

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: 'Email and workspaceId are required' },
        { status: 400 }
      )
    }

    // Verify user is admin/owner of the workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins can invite team members' },
        { status: 403 }
      )
    }

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

    // Check if user already a member
    const { data: existingMember } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', (await adminClient.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '')
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Calculate expiry (7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation record using admin client (bypass RLS for insert)
    const { data: invitation, error: insertError } = await adminClient
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        role: 'member',
        token,
        status: 'pending',
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create invitation:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Build invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.vercel.app'
    const inviteLink = `${appUrl}/api/invitations/accept?token=${token}`

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: email,
        inviteLink,
        workspaceName: workspace.name,
        inviterName,
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the whole operation - invitation is created
      // User can see it in pending list and we can resend later
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
