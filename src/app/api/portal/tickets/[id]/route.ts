import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/portal/tickets/[id] - Get ticket detail (client view)
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

    // Get ticket - must be requester's own ticket
    const { data: ticket, error } = await supabase
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
      .eq('id', ticketId)
      .eq('requester_id', user.id) // Client can only see own tickets
      .single()

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('GET /api/portal/tickets/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
