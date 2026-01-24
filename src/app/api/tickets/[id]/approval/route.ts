import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'
import { type TicketStage } from '@/lib/tickets'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// POST /api/tickets/[id]/approval - Approve or reject stage skip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Fetch ticket from Convex
    const ticket = await convex.query(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

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

    // ONLY requester can approve/reject
    if (userId !== ticket.requester_id) {
      return NextResponse.json(
        { error: 'Only ticket requester can approve or reject stage skips' },
        { status: 403 }
      )
    }

    const currentStage = ticket.stage as TicketStage
    const pendingStage = ticket.pending_stage as TicketStage

    // Approve/reject via Convex mutation
    await convex.mutation(api.tickets.approveTicketStageSkip, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      approved,
      user_id: userId,
    })

    // Add rejection comment if rejected
    if (!approved) {
      await convex.mutation(api.tickets.createTicketComment, {
        ticket_id: ticketId as Id<"tickets">,
        author_id: userId,
        content: `Rejected: skip request to "${pendingStage}" stage was declined.`,
        is_stage_change: true,
      })
    }

    return NextResponse.json({ success: true, approved })
  } catch (error) {
    console.error('POST /api/tickets/[id]/approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
