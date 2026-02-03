import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

/**
 * GET /api/fix-workspace-membership
 *
 * Temporary endpoint to fix missing workspace membership records.
 * Adds the current user as an owner to their workspace.
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

    // Hardcode workspace slug for now (easier than URL encoding issues)
    const workspaceSlug = 'my21staff-vpdfba'

    // 1. Get workspace by slug
    const workspace = await convex.query(api.workspaces.getBySlug, {
      slug: workspaceSlug,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: `Workspace not found: ${workspaceSlug}` },
        { status: 404 }
      )
    }

    // 2. Check if membership already exists
    const existingMembers = await convex.query(api.workspaceMembers.listByWorkspace, {
      workspace_id: workspace._id,
    })

    const alreadyMember = existingMembers.some((m: any) => m.user_id === userId)

    if (alreadyMember) {
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this workspace',
        workspace: {
          id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
        },
      })
    }

    // 3. Create workspace member record
    await convex.mutation(api.workspaceMembers.create, {
      workspace_id: workspace._id,
      user_id: userId,
      role: 'owner',
    })

    return NextResponse.json({
      success: true,
      message: 'Workspace membership created successfully!',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      },
      user: {
        id: userId,
        role: 'owner',
      },
    })
  } catch (error) {
    console.error('Fix workspace membership error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fix membership',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
