import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

/**
 * GET /api/contacts/[id]/notes - Get notes for a contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Dev mode: return empty notes for now
  if (isDevMode) {
    return NextResponse.json({ notes: [] })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Fetch notes from Convex
    const notes = await convex.query(api.contactNotes.getByContact, {
      contact_id: id as any,
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('GET /api/contacts/[id]/notes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contacts/[id]/notes - Create a note for a contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Dev mode: return mock note
  if (isDevMode) {
    const { id } = await params
    const body = await request.json()
    return NextResponse.json({
      note: {
        id: `note-${Date.now()}`,
        contact_id: id,
        title: body.title || null,
        content: body.content,
        created_at: new Date().toISOString(),
        due_date: body.due_date || null,
      }
    })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Create note in Convex
    const note = await convex.mutation(api.contactNotes.create, {
      contact_id: id as any,
      content: body.content.trim(),
      user_id: userId,
      due_date: body.due_date ? new Date(body.due_date).getTime() : undefined,
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('POST /api/contacts/[id]/notes error:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
