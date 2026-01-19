import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/portal/tickets/[id]/comments - List public comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ticket belongs to user
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('requester_id', user.id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get public comments only (is_internal = false or null)
    const { data: comments, error } = await supabase
      .from('ticket_comments')
      .select(`
        id,
        content,
        is_stage_change,
        created_at,
        author:profiles!ticket_comments_author_id_fkey(id, full_name)
      `)
      .eq('ticket_id', ticketId)
      .or('is_internal.is.null,is_internal.eq.false')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/portal/tickets/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portal/tickets/[id]/comments - Add comment (always public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ticket belongs to user
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, stage')
      .eq('id', ticketId)
      .eq('requester_id', user.id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Can't comment on closed tickets
    if (ticket.stage === 'closed') {
      return NextResponse.json({ error: 'Cannot comment on closed tickets' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    // Create comment (always public - is_internal = false)
    const { data: comment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        author_id: user.id,
        content: content.trim(),
        is_internal: false,
        is_stage_change: false
      })
      .select(`
        id,
        content,
        created_at,
        author:profiles!ticket_comments_author_id_fkey(id, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portal/tickets/[id]/comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
