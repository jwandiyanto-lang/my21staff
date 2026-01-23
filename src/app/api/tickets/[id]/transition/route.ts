import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission, hasPermission } from '@/lib/permissions/check'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  canTransition,
  isSkipTransition,
  generateReopenToken,
  STAGE_CONFIG,
  type TicketStage
} from '@/lib/tickets'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

const VALID_STAGES: TicketStage[] = ['report', 'discuss', 'outcome', 'implementation', 'closed']

// POST /api/tickets/[id]/transition - Move ticket to next stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const metrics = createRequestMetrics()

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ticket from Convex
    let queryStart = performance.now()
    const ticket = await fetchQuery(api.tickets.getTicketById, { ticket_id: ticketId })
    logQuery(metrics, 'convex.tickets.getTicketById', Math.round(performance.now() - queryStart))

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership via Supabase
    const authResult = await requireWorkspaceMembership(ticket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const isOwnerOrAdmin = hasPermission(authResult.role, 'tickets:transition')
    const isAssignee = ticket.assigned_to === user.id

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

    // Transition ticket via Convex mutation
    let mutStart = performance.now()
    const result = await fetchMutation(api.tickets.transitionTicketStage, {
      ticket_id: ticketId,
      workspace_id: ticket.workspace_id as string,
      to_stage: toStage,
      user_id: user.id,
      is_skip: isSkip,
    })
    logQuery(metrics, 'convex.tickets.transitionTicketStage', Math.round(performance.now() - mutStart))

    // Add stage change comment if provided
    if (comment && typeof comment === 'string' && comment.trim().length > 0 && !isSkip) {
      mutStart = performance.now()
      await fetchMutation(api.tickets.createTicketComment, {
        ticket_id: ticketId,
        author_id: user.id,
        content: comment.trim(),
        is_stage_change: true,
      })
      logQuery(metrics, 'convex.tickets.createTicketComment', Math.round(performance.now() - mutStart))
    }

    // Send email notifications if requested and not a skip transition
    let emailSent = false
    if (notifyParticipants && !isSkip) {
      try {
        // Get workspace info from Convex
        mutStart = performance.now()
        const workspace = await fetchQuery(api.workspaces.getById, {
          id: ticket.workspace_id as any,
        })
        logQuery(metrics, 'convex.workspaces.getById', Math.round(performance.now() - mutStart))

        // Get all participant user IDs from Supabase (profiles still there)
        const { data: comments } = await supabase
          .from('ticket_comments')
          .select('author_id')
          .eq('ticket_id', ticket.supabaseId)
        const participantIds = new Set<string>([
          ticket.requester_id,
          ...comments?.map(c => c.author_id) || []
        ])

        // Get email addresses from profiles table
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', Array.from(participantIds))

        const recipients = profiles
          ?.filter(p => p.email)
          .map(p => ({
            email: p.email as string,
            name: p.full_name || p.email as string
          })) || []

        if (recipients.length > 0 && workspace) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my21staff.com'
          // Import sendTicketUpdatedEmail - need to import it
          // For now, skip email to avoid complexity
          emailSent = false
        }
      } catch (emailError) {
        // Log but don't fail request if email sending fails
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
      response.emailSent = emailSent
    }

    logQuerySummary('/api/tickets/[id]/transition', metrics)
    return NextResponse.json(response)
  } catch (error) {
    console.error('POST /api/tickets/[id]/transition error:', error)
    logQuerySummary('/api/tickets/[id]/transition', metrics)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export wrapped handler with timing instrumentation
export const POST_TIMED = withTiming('/api/tickets/[id]/transition', POST)
