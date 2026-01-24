import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { type WorkspaceRole } from '@/lib/permissions/types'
import { NextResponse } from 'next/server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export interface AuthResult {
  user: { id: string; email: string }
  workspaceId: string
  role: WorkspaceRole
}

export async function requireWorkspaceMembership(
  workspaceId: string
): Promise<AuthResult | NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from Convex
  const user = await convex.query(api.users.getByClerkId, { clerkId: userId })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Check workspace membership via Convex
  const member = await convex.query(api.workspaces.getMembership, {
    workspace_id: workspaceId,
    user_id: userId,
  })

  if (!member) {
    return NextResponse.json(
      { error: 'Not authorized to access this workspace' },
      { status: 403 }
    )
  }

  return {
    user: { id: userId, email: user.email || '' },
    workspaceId,
    role: member.role as WorkspaceRole
  }
}
