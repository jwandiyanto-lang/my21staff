import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { auth } from '@clerk/nextjs/server'
import { type TicketCategory, type TicketPriority } from '@/lib/tickets'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

const VALID_CATEGORIES: TicketCategory[] = ['bug', 'feature', 'question']
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

// GET /api/portal/tickets - List client's own tickets
export async function GET() {
  const metrics = createRequestMetrics()

  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Client sees ONLY their own tickets (requester_id = auth.uid())
    let queryStart = performance.now()
    const tickets = await fetchQuery(api.tickets.listTicketsByRequester, {
      requester_id: userId,
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
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace membership from Convex
    let queryStart = performance.now()
    const user = await fetchQuery(api.users.getUserById, {
      clerkId: userId,
    })
    logQuery(metrics, 'convex.users.getUserById', Math.round(performance.now() - queryStart))

    if (!user || !user.workspace_id) {
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
    const ticketId = await fetchMutation(api.tickets.createTicket, {
      workspace_id: user.workspace_id as string,
      requester_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    })
    logQuery(metrics, 'convex.tickets.createTicket', Math.round(performance.now() - queryStart))

    // Fetch created ticket to return it
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as any,
    })

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
