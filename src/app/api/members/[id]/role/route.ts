import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { sendRoleChangeEmail } from '@/lib/email/send'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: memberId } = await params
    const { role: newRole } = await request.json()

    // Validate new role
    if (!['admin', 'member'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Role tidak valid. Harus admin atau member.' },
        { status: 400 }
      )
    }

    // Get the membership to change
    const targetMember = await convex.query(api.workspaceMembers.getById, {
      id: memberId
    }) as {
      _id: string
      workspace_id: string
      user_id: string
      role: string
    } | null

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

    // Update the role via Convex
    await convex.mutation(api.workspaces.updateMemberRole, {
      member_id: memberId,
      role: newRole
    })

    // Get user from Clerk for email notification
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()

    try {
      const user = await clerk.users.getUser(targetMember.user_id)
      const workspace = await convex.query(api.workspaces.getById, {
        id: targetMember.workspace_id
      }) as { name?: string } | null

      // Send notification email (don't fail the request if email fails)
      if (user.primaryEmailAddress?.emailAddress) {
        try {
          await sendRoleChangeEmail({
            to: user.primaryEmailAddress.emailAddress,
            userName: user.fullName || user.primaryEmailAddress.emailAddress,
            workspaceName: workspace?.name || 'workspace Anda',
            oldRole: targetMember.role as WorkspaceRole,
            newRole: newRole as WorkspaceRole,
          })
        } catch (emailError) {
          console.error('Failed to send role change email:', emailError)
          // Continue - role was changed successfully
        }
      }
    } catch (userError) {
      console.error('Failed to get user for email notification:', userError)
      // Continue - role was changed successfully
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
