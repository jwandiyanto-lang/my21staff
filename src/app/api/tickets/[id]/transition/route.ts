import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission, hasPermission } from '@/lib/permissions/check'
import {
  canTransition,
  isSkipTransition,
  generateReopenToken,
  sendTicketUpdatedEmail,
  STAGE_CONFIG,
  type TicketStage
} from '@/lib/tickets'

const VALID_STAGES: TicketStage[] = ['report', 'discuss', 'outcome', 'implementation', 'closed']

// POST /api/tickets/[id]/transition - Move ticket to next stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const isOwnerOrAdmin = hasPermission(authResult.role, 'tickets:transition')
    const isAssignee = ticket.assigned_to === authResult.user.id

    // For normal transitions: owner/admin OR assigned user
    // For skip transitions: only owner/admin with tickets:skip_stage
    const currentStage = ticket.stage as TicketStage
    const isSkip = isSkipTransition(currentStage, toStage)

    if (isSkip) {
      const permError = requirePermission(
        authResult.role,
        'tickets:skip_stage',
        'Only workspace owners and admins can skip stages'
      )
      if (permError) return permError
    } else {
      // Normal transition - owner/admin or assignee
      if (!isOwnerOrAdmin && !isAssignee) {
        return NextResponse.json(
          { error: 'Only workspace owners, admins, or assigned users can transition tickets' },
          { status: 403 }
        )
      }
    }

    // Validate transition
    if (!canTransition(currentStage, toStage, isSkip)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStage} to ${toStage}` },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (isSkip) {
      // Skip transition requires approval from requester
      updateData.pending_approval = true
      updateData.pending_stage = toStage
      updateData.approval_requested_at = new Date().toISOString()
    } else {
      // Normal transition - update stage directly
      updateData.stage = toStage

      // If closing, set closed_at and generate reopen token
      if (toStage === 'closed') {
        updateData.closed_at = new Date().toISOString()
        try {
          updateData.reopen_token = generateReopenToken(ticketId, ticket.requester_id)
        } catch (tokenError) {
          // Token generation requires ENCRYPTION_KEY - skip if not set
          console.warn('Could not generate reopen token:', tokenError)
        }
      }
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
    const historyReason = isSkip
      ? `Permintaan skip ke tahap ${toStage} (menunggu persetujuan)`
      : `Transisi ke tahap ${toStage}`

    await supabase.from('ticket_status_history').insert({
      ticket_id: ticketId,
      changed_by: authResult.user.id,
      from_stage: currentStage,
      to_stage: isSkip ? currentStage : toStage, // Stay at current if pending
      reason: historyReason
    })

    // Add system comment if provided (for stage change notes)
    if (comment && typeof comment === 'string' && comment.trim().length > 0) {
      await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        author_id: authResult.user.id,
        content: comment.trim(),
        is_stage_change: true
      })
    }

    // Send email notifications if requested and not a skip transition
    if (notifyParticipants && !isSkip) {
      try {
        // Get workspace info
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('name, slug')
          .eq('id', ticket.workspace_id)
          .single()

        // Get all participants (requester + commenters)
        const { data: comments } = await supabase
          .from('ticket_comments')
          .select('author_id')
          .eq('ticket_id', ticketId)

        const participantIds = new Set<string>([
          ticket.requester_id,
          ...comments?.map(c => c.author_id) || []
        ])

        // Get email addresses from profiles table
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', Array.from(participantIds))

        const recipients = profiles?.map(p => ({
          email: p.email,
          name: p.full_name || p.email
        })) || []

        if (recipients.length > 0 && workspace) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.vercel.app'
          await sendTicketUpdatedEmail(recipients, {
            ticketTitle: ticket.title,
            ticketId,
            workspaceName: workspace.name,
            changedByName: authResult.user.email || 'Unknown',
            fromStage: STAGE_CONFIG[currentStage].labelId,
            toStage: STAGE_CONFIG[toStage as TicketStage].labelId,
            comment: comment || undefined,
            ticketLink: `${appUrl}/${workspace.slug}/support/${ticketId}`
          })
        }
      } catch (emailError) {
        // Log but don't fail the request if email sending fails
        console.error('Failed to send transition notification emails:', emailError)
      }
    }

    const response: { success: boolean; pendingApproval?: boolean; emailSent?: boolean } = {
      success: true
    }

    if (isSkip) {
      response.pendingApproval = true
    }

    if (notifyParticipants && !isSkip) {
      response.emailSent = true
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
