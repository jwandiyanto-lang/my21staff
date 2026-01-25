import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * GET /api/contacts/[id]/messages - Get messages for a contact
 *
 * Returns all messages from the contact's conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: contactId } = await params

    // Get contact using internal query (no workspace auth needed)
    const contact = await convex.query(api.contacts.getByIdInternal, {
      contact_id: contactId,
    })

    if (!contact) {
      return NextResponse.json({ messages: [] })
    }

    // Get conversation for this contact using internal query
    const conversations = await convex.query(api.conversations.listWithFiltersInternal, {
      workspace_id: (contact as any).workspace_id,
      limit: 1000,
    })

    const conversation = conversations.conversations.find(
      (c: any) => c.contact_id === contactId || c.contact?._id === contactId
    )

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    // Get messages for this conversation
    const messages = await convex.query(api.messages.listByConversation, {
      conversation_id: conversation._id,
      limit: 100,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('GET /api/contacts/[id]/messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', messages: [] },
      { status: 500 }
    )
  }
}
