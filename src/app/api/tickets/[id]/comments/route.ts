import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

// GET /api/tickets/[id]/comments - List comments for ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params

    const supabase = await createClient()

    // Fetch ticket first to verify it exists and get workspace_id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('workspace_id')
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

    // Fetch comments with author info
    const { data: comments, error: commentsError } = await supabase
      .from('ticket_comments')
      .select(`
        *,
        author:profiles!ticket_comments_author_id_fkey(id, full_name, email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ error: commentsError.message }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('GET /api/tickets/[id]/comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tickets/[id]/comments - Add comment to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params
    const body = await request.json()
    const { content } = body

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'content must be 10000 characters or less' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch ticket first to verify it exists and get workspace_id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('workspace_id')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership (any member can comment)
    const authResult = await requireWorkspaceMembership(ticket.workspace_id)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        author_id: authResult.user.id,
        content: content.trim(),
        is_stage_change: false
      })
      .select(`
        *,
        author:profiles!ticket_comments_author_id_fkey(id, full_name, email)
      `)
      .single()

    if (createError) {
      console.error('Error creating comment:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tickets/[id]/comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
