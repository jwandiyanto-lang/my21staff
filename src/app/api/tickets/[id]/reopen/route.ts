import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyReopenToken } from '@/lib/tickets'

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
        { error: 'Invalid token or unauthorized. Only the requester can reopen tickets.' },
        { status: 403 }
      )
    }

    // Reopen ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        stage: 'report',
        closed_at: null,
        reopen_token: null, // Clear token after use
        pending_approval: false,
        pending_stage: null,
        approval_requested_at: null
      })
      .eq('id', ticketId)

    if (updateError) {
      console.error('Error reopening ticket:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Add status history entry
    await supabase.from('ticket_status_history').insert({
      ticket_id: ticketId,
      changed_by: reopenedBy!,
      from_stage: 'closed',
      to_stage: 'report',
      reason: `Ticket reopened: ${reason.trim()}`
    })

    // Add system comment with the reason
    await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author_id: reopenedBy!,
      content: `Ticket reopened.\n\nReason: ${reason.trim()}`,
      is_stage_change: true
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
