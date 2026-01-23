import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { auth } from '@clerk/nextjs/server'

// GET /api/portal/tickets/[id] - Get ticket detail (client view)
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

    // Get ticket from Convex - must be requester's own ticket
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Client can only see own tickets
    if (ticket.requester_id !== userId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Return only client-safe fields
    const clientTicket = {
      _id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      stage: ticket.stage,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      closed_at: ticket.closed_at,
    }

    return NextResponse.json({ ticket: clientTicket })
  } catch (error) {
    console.error('GET /api/portal/tickets/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
