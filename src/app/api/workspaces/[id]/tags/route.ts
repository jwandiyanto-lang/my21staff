import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * PATCH /api/workspaces/[id]/tags
 * Updates contact tags for the workspace
 * Note: [id] is the workspace SLUG, not Convex ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceSlug } = await params
    const body = await request.json()
    const { tags } = body

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 })
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Use the admin mutation with custom tags, passing Convex ID (as string for this mutation)
    const result = await convex.mutation(api.admin.setContactTags, {
      workspaceId: workspace._id,
      tags,
    })

    return NextResponse.json({ success: true, tags: result.tags })
  } catch (error) {
    console.error('Error updating tags:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tags' },
      { status: 500 }
    )
  }
}
