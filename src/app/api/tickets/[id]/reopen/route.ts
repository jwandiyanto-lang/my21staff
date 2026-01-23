import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { verifyReopenToken } from '@/lib/tickets'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

// POST /api/tickets/[id]/reopen - Reopen a closed ticket
// Supports two modes:
// 1. Token-based (anonymous) - for email links
// 2. Authenticated requester - for logged-in users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const metrics = createRequestMetrics()

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

    const supabase = await createClient()

    // Fetch ticket from Convex
    let queryStart = performance.now()
    const ticket = await fetchQuery(api.tickets.getTicketById, { ticket_id: ticketId as Id<"tickets"> })
    logQuery(metrics, 'convex.tickets.getTicketById', Math.round(performance.now() - queryStart))

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
      const { data: { user } } = await supabase.auth.getUser()

      if (user && user.id === ticket.requester_id) {
        authorized = true
        reopenedBy = user.id
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Invalid token or unauthorized. Only requester can reopen tickets.' },
        { status: 403 }
      )
    }

    // Reopen ticket via Convex mutation
    let mutStart = performance.now()
    const result = await fetchMutation(api.tickets.reopenTicket, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      user_id: reopenedBy!,
    })
    logQuery(metrics, 'convex.tickets.reopenTicket', Math.round(performance.now() - mutStart))

    // Add system comment with reason
    mutStart = performance.now()
    await fetchMutation(api.tickets.createTicketComment, {
      ticket_id: ticketId as Id<"tickets">,
      author_id: reopenedBy!,
      content: `Ticket reopened.\n\nReason: ${reason.trim()}`,
      is_stage_change: true,
    })
    logQuery(metrics, 'convex.tickets.createTicketComment', Math.round(performance.now() - mutStart))

    logQuerySummary('/api/tickets/[id]/reopen', metrics)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/tickets/[id]/reopen error:', error)
    logQuerySummary('/api/tickets/[id]/reopen', metrics)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export wrapped handler with timing instrumentation
export const POST_TIMED = withTiming('/api/tickets/[id]/reopen', POST)
