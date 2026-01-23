import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { verifyReopenToken, type TicketStage } from '@/lib/tickets'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

// POST /api/tickets/[id]/approval - Approve or reject stage skip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const metrics = createRequestMetrics()

  try {
    const { id: ticketId } = await params
    const body = await request.json()
    const { approved } = body

    // Validate approved field
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ticket from Convex
    let queryStart = performance.now()
    const ticket = await fetchQuery(api.tickets.getTicketById, { ticket_id: ticketId as Id<"tickets"> })
    logQuery(metrics, 'convex.tickets.getTicketById', Math.round(performance.now() - queryStart))

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if ticket is pending approval
    if (!ticket.pending_approval) {
      return NextResponse.json(
        { error: 'Ticket is not pending approval' },
        { status: 400 }
      )
    }

    // Verify workspace membership via Supabase
    const authResult = await requireWorkspaceMembership(ticket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // ONLY requester can approve/reject
    if (authResult.user.id !== ticket.requester_id) {
      return NextResponse.json(
        { error: 'Only ticket requester can approve or reject stage skips' },
        { status: 403 }
      )
    }

    const currentStage = ticket.stage as TicketStage
    const pendingStage = ticket.pending_stage as TicketStage

    // Approve/reject via Convex mutation
    let mutStart = performance.now()
    const result = await fetchMutation(api.tickets.approveTicketStageSkip, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      approved,
      user_id: user.id,
    })
    logQuery(metrics, 'convex.tickets.approveTicketStageSkip', Math.round(performance.now() - mutStart))

    // Add rejection comment if rejected
    if (!approved) {
      mutStart = performance.now()
      await fetchMutation(api.tickets.createTicketComment, {
        ticket_id: ticketId as Id<"tickets">,
        author_id: user.id,
        content: `Rejected: skip request to "${pendingStage}" stage was declined.`,
        is_stage_change: true,
      })
      logQuery(metrics, 'convex.tickets.createTicketComment', Math.round(performance.now() - mutStart))
    }

    logQuerySummary('/api/tickets/[id]/approval', metrics)
    return NextResponse.json({ success: true, approved })
  } catch (error) {
    console.error('POST /api/tickets/[id]/approval error:', error)
    logQuerySummary('/api/tickets/[id]/approval', metrics)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export wrapped handler with timing instrumentation
export const POST_TIMED = withTiming('/api/tickets/[id]/approval', POST)
