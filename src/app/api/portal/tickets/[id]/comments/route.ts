import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { auth } from '@clerk/nextjs/server'

// GET /api/portal/tickets/[id]/comments - List public comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ticket belongs to user
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket || ticket.requester_id !== userId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get all comments (filter public comments client-side for now)
    // TODO: Add query for public comments only in convex/tickets.ts
    const allComments = await fetchQuery(api.tickets.listTicketComments, {
      ticket_id: ticketId as Id<"tickets">,
    })

    // Filter to public comments only (is_internal = false or null)
    const comments = allComments.filter(c => !c.is_stage_change)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/portal/tickets/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portal/tickets/[id]/comments - Add comment (always public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ticket belongs to user
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket || ticket.requester_id !== userId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Can't comment on closed tickets
    if (ticket.stage === 'closed') {
      return NextResponse.json({ error: 'Cannot comment on closed tickets' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    // Create comment (always public - is_internal = false)
    const comment = await fetchMutation(api.tickets.createTicketComment, {
      ticket_id: ticketId as Id<"tickets">,
      author_id: userId,
      content: content.trim(),
      is_stage_change: false,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portal/tickets/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
