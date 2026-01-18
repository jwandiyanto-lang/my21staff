import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { sendRoleChangeEmail } from '@/lib/email/send'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: memberId } = await params
    const { role: newRole } = await request.json()

    // Validate new role
    if (!['admin', 'member'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Role tidak valid. Harus admin atau member.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the membership to change
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role')
      .eq('id', memberId)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    // Cannot change owner role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Tidak dapat mengubah role owner. Hubungi my21staff untuk transfer kepemilikan.' },
        { status: 400 }
      )
    }

    // Check caller's permission
    const authResult = await requireWorkspaceMembership(targetMember.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    const permError = requirePermission(
      authResult.role,
      'team:change_role',
      'Hanya pemilik workspace yang dapat mengubah role'
    )
    if (permError) return permError

    // Skip if role is the same
    if (targetMember.role === newRole) {
      return NextResponse.json({ success: true, role: newRole })
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (updateError) {
      console.error('Failed to update role:', updateError)
      return NextResponse.json(
        { error: 'Gagal mengubah role' },
        { status: 500 }
      )
    }

    // Get user email for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', targetMember.user_id)
      .single()

    // Get workspace name for email
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', targetMember.workspace_id)
      .single()

    // Send notification email (don't fail the request if email fails)
    if (profile?.email) {
      try {
        await sendRoleChangeEmail({
          to: profile.email,
          userName: profile.full_name || profile.email,
          workspaceName: workspace?.name || 'workspace Anda',
          oldRole: targetMember.role as WorkspaceRole,
          newRole: newRole as WorkspaceRole,
        })
      } catch (emailError) {
        console.error('Failed to send role change email:', emailError)
        // Continue - role was changed successfully
      }
    }

    return NextResponse.json({ success: true, role: newRole })
  } catch (error) {
    console.error('Role change error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal' },
      { status: 500 }
    )
  }
}
