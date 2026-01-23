import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { auth } from '@clerk/nextjs/server'
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

    // Fetch tickets from Convex
    const tickets = await fetchQuery(api.tickets.listTickets, {
      workspace_id: workspaceId,
      stage: stageFilter || undefined,
    })

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

    // Get Clerk user ID
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create ticket in Convex
    const ticketId = await fetchMutation(api.tickets.createTicket, {
      workspace_id: workspaceId,
      requester_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    })

    // Fetch created ticket to return it
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as any,
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tickets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
