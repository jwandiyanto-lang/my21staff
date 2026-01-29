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
  workspaceSlug: string
): Promise<AuthResult | NextResponse> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from Convex
  const user = await convex.query(api.users.getUserByClerkId, { clerk_id: userId })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Fetch workspace by slug to get Convex ID
  const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Check workspace membership via Convex using workspace ID
  const member = await convex.query(api.workspaces.getMembership, {
    workspace_id: workspace._id,
    user_id: userId,
  })

  if (!member) {
    return NextResponse.json(
      { error: 'Not authorized to access this workspace' },
      { status: 403 }
    )
  }

  return {
    user: { id: userId, email: '' }, // Email not stored in Convex, get from Clerk if needed
    workspaceId: workspace._id, // Return Convex ID, not slug
    role: member.role as WorkspaceRole
  }
}
