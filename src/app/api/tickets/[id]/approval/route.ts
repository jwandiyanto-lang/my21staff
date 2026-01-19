import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { generateReopenToken, type TicketStage } from '@/lib/tickets'

// POST /api/tickets/[id]/approval - Approve or reject stage skip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if ticket is pending approval
    if (!ticket.pending_approval) {
      return NextResponse.json(
        { error: 'Ticket is not pending approval' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // ONLY the requester can approve/reject
    if (authResult.user.id !== ticket.requester_id) {
      return NextResponse.json(
        { error: 'Only the ticket requester can approve or reject stage skips' },
        { status: 403 }
      )
    }

    const currentStage = ticket.stage as TicketStage
    const pendingStage = ticket.pending_stage as TicketStage

    // Prepare update data
    const updateData: Record<string, unknown> = {
      pending_approval: false,
      pending_stage: null,
      approval_requested_at: null
    }

    let historyReason: string

    if (approved) {
      // Apply the stage change
      updateData.stage = pendingStage
      historyReason = `Skip approved to ${pendingStage} stage`

      // If closing, set closed_at and generate reopen token
      if (pendingStage === 'closed') {
        updateData.closed_at = new Date().toISOString()
        updateData.reopen_token = generateReopenToken(ticketId, ticket.requester_id)
      }
    } else {
      // Rejected - stay at current stage
      historyReason = `Skip rejected to ${pendingStage} stage - staying at ${currentStage}`
    }

    // Update ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Add status history entry
    await supabase.from('ticket_status_history').insert({
      ticket_id: ticketId,
      changed_by: authResult.user.id,
      from_stage: currentStage,
      to_stage: approved ? pendingStage : currentStage,
      reason: historyReason
    })

    // Add rejection comment if rejected
    if (!approved) {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        author_id: authResult.user.id,
        content: `Rejected: skip request to "${pendingStage}" stage was declined.`,
        is_stage_change: true
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
