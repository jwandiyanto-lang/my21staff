import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE - Remove a team member from workspace
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the membership to delete
    const memberToDelete = await convex.query(api.workspaceMembers.getById, {
      id: id
    }) as {
      _id: string
      workspace_id: string
      user_id: string
      role: string
    } | null

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot delete owner
    if (memberToDelete.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the workspace owner' },
        { status: 400 }
      )
    }

    // Verify membership and get role
    const authResult = await requireWorkspaceMembership(memberToDelete.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    // Check permission - only owners can remove team members
    const permError = requirePermission(
      authResult.role,
      'team:remove',
      'Only workspace owners can remove team members'
    )
    if (permError) return permError

    // Delete the membership via Convex
    await convex.mutation(api.workspaces.removeMember, { member_id: id })

    // Note: User cleanup from Clerk happens via organization membership removal
    // Clerk webhooks handle organization membership deletion automatically

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
