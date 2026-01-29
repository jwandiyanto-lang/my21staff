import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation } from 'convex/nextjs'
import { api } from '@/../convex/_generated/api'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const body = await request.json()
    const { tags } = body

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 })
    }

    // Use the admin mutation with custom tags
    const result = await fetchMutation(api.admin.setContactTags, {
      workspaceId,
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
