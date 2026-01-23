import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { type TicketCategory, type TicketPriority } from '@/lib/tickets'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

// Hardcoded for debugging - my21staff workspace ID
const ADMIN_WORKSPACE_ID = '0318fda5-22c4-419b-bdd8-04471b818d17'

const VALID_CATEGORIES: TicketCategory[] = ['bug', 'feature', 'question']
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

// GET /api/portal/tickets - List client's own tickets
export async function GET() {
  const metrics = createRequestMetrics()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Client sees ONLY their own tickets (requester_id = auth.uid())
    let queryStart = performance.now()
    const tickets = await fetchQuery(api.tickets.listTicketsByRequester, {
      requester_id: user.id,
    })
    logQuery(metrics, 'convex.tickets.listTicketsByRequester', Math.round(performance.now() - queryStart))

    logQuerySummary('/api/portal/tickets', metrics)
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('GET /api/portal/tickets error:', error)
    logQuerySummary('/api/portal/tickets', metrics)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portal/tickets - Create ticket routed to admin workspace
export async function POST(request: NextRequest) {
  const metrics = createRequestMetrics()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace membership from Supabase
    let queryStart = performance.now()
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()
    logQuery(metrics, 'supabase.workspace_members', Math.round(performance.now() - queryStart))

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

    // Create ticket via Convex mutation
    queryStart = performance.now()
    const ticket = await fetchMutation(api.mutations.createTicket, {
      workspace_id: membership.workspace_id,
      requester_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    })
    logQuery(metrics, 'convex.mutations.createTicket', Math.round(performance.now() - queryStart))

    logQuerySummary('/api/portal/tickets', metrics)
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portal/tickets error:', error)
    logQuerySummary('/api/portal/tickets', metrics)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export wrapped handlers with timing instrumentation
export const GET_TIMED = withTiming('/api/portal/tickets', GET)
export const POST_TIMED = withTiming('/api/portal/tickets', POST)
