import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_WORKSPACE_ID } from '@/lib/config/support'
import { type TicketCategory, type TicketPriority } from '@/lib/tickets'

const VALID_CATEGORIES: TicketCategory[] = ['bug', 'feature', 'question']
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

// GET /api/portal/tickets - List client's own tickets
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Client sees ONLY their own tickets (requester_id = auth.uid())
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        category,
        priority,
        stage,
        created_at,
        updated_at,
        closed_at
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('GET /api/portal/tickets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portal/tickets - Create ticket routed to admin workspace
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, category, priority } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.length < 3 || title.length > 255) {
      return NextResponse.json({ error: 'Title must be 3-255 characters' }, { status: 400 })
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 })
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` }, { status: 400 })
    }

    // Create ticket routed to admin workspace
    const { data: ticket, error: createError } = await supabase
      .from('tickets')
      .insert({
        workspace_id: membership.workspace_id,
        admin_workspace_id: ADMIN_WORKSPACE_ID, // Route to my21staff
        requester_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        stage: 'report'
      })
      .select('id, title, category, priority, stage, created_at')
      .single()

    if (createError) {
      console.error('Error creating ticket:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Add initial status history
    await supabase.from('ticket_status_history').insert({
      ticket_id: ticket.id,
      changed_by: user.id,
      to_stage: 'report',
      reason: 'Ticket created via portal'
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portal/tickets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
