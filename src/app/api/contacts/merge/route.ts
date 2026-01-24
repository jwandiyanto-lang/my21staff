import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { keepContactId, mergeContactId, activePhone, activeEmail, workspaceId } = await request.json()

    if (!keepContactId || !mergeContactId || !workspaceId) {
      return NextResponse.json(
        { error: 'keepContactId, mergeContactId, and workspaceId are required' },
        { status: 400 }
      )
    }

    if (keepContactId === mergeContactId) {
      return NextResponse.json(
        { error: 'Cannot merge a contact into itself' },
        { status: 400 }
      )
    }

    const mergedContact = await convex.mutation(api.mutations.mergeContacts, {
      workspace_id: workspaceId,
      primary_id: keepContactId,
      secondary_id: mergeContactId,
      active_phone: activePhone || undefined,
      active_email: activeEmail || undefined,
    })

    return NextResponse.json({
      success: true,
      contact: mergedContact,
      deletedContactId: mergeContactId
    })
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}
