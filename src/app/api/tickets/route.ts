import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { type TicketCategory, type TicketPriority } from '@/lib/tickets'

const VALID_CATEGORIES: TicketCategory[] = ['bug', 'feature', 'question']
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

// GET /api/tickets - List tickets in workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const stageFilter = searchParams.get('stage')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    // Verify membership
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    let query = supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (stageFilter) {
      query = query.eq('stage', stageFilter)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('GET /api/tickets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, title, description, category, priority } = body

    // Validate required fields
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }

    if (title.length < 3 || title.length > 255) {
      return NextResponse.json(
        { error: 'title must be 3-255 characters' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'description required' }, { status: 400 })
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify membership (any member can create tickets)
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    // Create ticket
    const { data: ticket, error: createError } = await supabase
      .from('tickets')
      .insert({
        workspace_id: workspaceId,
        requester_id: authResult.user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        stage: 'report'
      })
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, full_name, email),
        assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .single()

    if (createError) {
      console.error('Error creating ticket:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Add status history entry
    const { error: historyError } = await supabase
      .from('ticket_status_history')
      .insert({
        ticket_id: ticket.id,
        changed_by: authResult.user.id,
        to_stage: 'report',
        reason: 'Tiket dibuat'
      })

    if (historyError) {
      console.error('Error creating status history:', historyError)
      // Non-fatal - ticket was created successfully
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tickets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
