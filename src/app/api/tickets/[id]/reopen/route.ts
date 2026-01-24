import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'
import { verifyReopenToken } from '@/lib/tickets'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// POST /api/tickets/[id]/reopen - Reopen a closed ticket
// Supports two modes:
// 1. Token-based (anonymous) - for email links
// 2. Authenticated requester - for logged-in users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const body = await request.json()
    const { token, reason } = body

    // Reason is required
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required to reopen ticket' },
        { status: 400 }
      )
    }

    // Fetch ticket from Convex
    const ticket = await convex.query(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Must be closed to reopen
    if (ticket.stage !== 'closed') {
      return NextResponse.json(
        { error: 'Ticket is not closed' },
        { status: 400 }
      )
    }

    let authorized = false
    let reopenedBy: string | null = null

    // Option 1: Token-based (anonymous) reopen
    if (token && typeof token === 'string') {
      const tokenResult = verifyReopenToken(token)
      if (tokenResult && tokenResult.ticketId === ticketId) {
        authorized = true
        reopenedBy = tokenResult.requesterId
      }
    }

    // Option 2: Authenticated requester
    if (!authorized) {
      const { userId } = await auth()
      if (userId && userId === ticket.requester_id) {
        authorized = true
        reopenedBy = userId
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Invalid token or unauthorized. Only requester can reopen tickets.' },
        { status: 403 }
      )
    }

    // Reopen ticket via Convex mutation
    await convex.mutation(api.tickets.reopenTicket, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      user_id: reopenedBy!,
    })

    // Add system comment with reason
    await convex.mutation(api.tickets.createTicketComment, {
      ticket_id: ticketId as Id<"tickets">,
      author_id: reopenedBy!,
      content: `Ticket reopened.\n\nReason: ${reason.trim()}`,
      is_stage_change: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/tickets/[id]/reopen error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
