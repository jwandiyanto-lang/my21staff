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
    const { primaryId, secondaryId, fields } = await request.json()

    if (!primaryId || !secondaryId || !fields) {
      return NextResponse.json(
        { error: 'primaryId, secondaryId, and fields are required' },
        { status: 400 }
      )
    }

    if (primaryId === secondaryId) {
      return NextResponse.json(
        { error: 'Cannot merge a contact into itself' },
        { status: 400 }
      )
    }

    const mergedContact = await convex.mutation(api.contacts.mergeContacts, {
      primaryId: primaryId as any,
      secondaryId: secondaryId as any,
      mergedFields: fields,
      mergedBy: userId,
    })

    return NextResponse.json({
      success: true,
      contact: mergedContact,
      deletedContactId: secondaryId
    })
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}
