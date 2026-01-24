import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'
import {
  canTransition,
  isSkipTransition,
  type TicketStage
} from '@/lib/tickets'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const VALID_STAGES: TicketStage[] = ['report', 'discuss', 'outcome', 'implementation', 'closed']

// POST /api/tickets/[id]/transition - Move ticket to next stage
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
    const { toStage, notifyParticipants, comment } = body

    // Validate toStage
    if (!toStage || !VALID_STAGES.includes(toStage)) {
      return NextResponse.json(
        { error: `toStage must be one of: ${VALID_STAGES.join(', ')}` },
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

    // Check if user has access to this workspace
    const workspace = await convex.query(api.workspaces.getById, {
      id: ticket.workspace_id,
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // For simplicity, allow any authenticated user in the workspace to transition
    // In production, you'd check workspace membership and permissions
    const currentStage = ticket.stage as TicketStage
    const isSkip = isSkipTransition(currentStage, toStage)

    // Validate transition
    if (!canTransition(currentStage, toStage, isSkip)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStage} to ${toStage}` },
        { status: 400 }
      )
    }

    // Transition ticket via Convex mutation
    await convex.mutation(api.tickets.transitionTicketStage, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      to_stage: toStage,
      user_id: userId,
      is_skip: isSkip,
    })

    // Add stage change comment if provided
    if (comment && typeof comment === 'string' && comment.trim().length > 0 && !isSkip) {
      await convex.mutation(api.tickets.createTicketComment, {
        ticket_id: ticketId as Id<"tickets">,
        author_id: userId,
        content: comment.trim(),
        is_stage_change: true,
      })
    }

    const response: { success: boolean; pendingApproval?: boolean; emailSent?: boolean } = {
      success: true
    }

    if (isSkip) {
      response.pendingApproval = true
    }

    if (notifyParticipants && !isSkip) {
      // Email notifications not implemented yet
      response.emailSent = false
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('POST /api/tickets/[id]/transition error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
