import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_token', request.url)
    )
  }

  try {
    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Look up invitation by token
    const { data: invitation, error: inviteError } = await adminClient
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.redirect(
        new URL('/login?error=invitation_not_found', request.url)
      )
    }

    // Get workspace info
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('id, name, slug')
      .eq('id', invitation.workspace_id)
      .single()

    // Check if already accepted
    if (invitation.status === 'accepted') {
      if (workspace) {
        return NextResponse.redirect(
          new URL(`/${workspace.slug}/inbox`, request.url)
        )
      }
      return NextResponse.redirect(
        new URL('/login?error=already_accepted', request.url)
      )
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await adminClient
        .from('workspace_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.redirect(
        new URL('/login?error=invitation_expired', request.url)
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // User not logged in - redirect to login with redirect back
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', `/api/invitations/accept?token=${token}`)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user email matches invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.redirect(
        new URL('/login?error=email_mismatch', request.url)
      )
    }

    // Check if already a member
    const { data: existingMember } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Already a member, just redirect
      if (workspace) {
        return NextResponse.redirect(
          new URL(`/${workspace.slug}/inbox`, request.url)
        )
      }
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add user to workspace
    const { error: memberError } = await adminClient
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role || 'member',
      })

    if (memberError) {
      console.error('Failed to add member:', memberError)
      return NextResponse.redirect(
        new URL('/login?error=join_failed', request.url)
      )
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

    // Redirect to workspace inbox
    if (workspace) {
      return NextResponse.redirect(
        new URL(`/${workspace.slug}/inbox`, request.url)
      )
    }

    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    )
  }
}
