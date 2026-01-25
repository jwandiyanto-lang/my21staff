import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * PATCH /api/contacts/[id] - Update a contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Extract allowed fields for update
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email
    if (body.lead_status !== undefined) updates.lead_status = body.lead_status
    if (body.lead_score !== undefined) updates.lead_score = body.lead_score
    if (body.tags !== undefined) updates.tags = body.tags
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to

    // Update contact in Convex - use mutations.updateContactInternal which supports all fields
    const updatedContact = await convex.mutation(api.mutations.updateContactInternal, {
      contact_id: id,
      updates,
    })

    return NextResponse.json({ contact: updatedContact })
  } catch (error) {
    console.error('PATCH /api/contacts/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}
