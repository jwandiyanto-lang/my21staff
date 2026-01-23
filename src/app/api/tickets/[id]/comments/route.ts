import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { auth } from '@clerk/nextjs/server'

// GET /api/tickets/[id]/comments - List comments for ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params

    // Fetch ticket from Convex to verify it exists and get workspace_id
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Fetch comments from Convex
    const comments = await fetchQuery(api.tickets.listTicketComments, {
      ticket_id: ticketId as Id<"tickets">,
    })

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
    const { content, is_internal = false } = body

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

    // Fetch ticket from Convex to verify it exists and get workspace_id
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: ticketId as Id<"tickets">,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get Clerk user ID
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow is_internal for owner/admin
    const isInternal = is_internal && (authResult.role === 'owner' || authResult.role === 'admin')

    // Create comment in Convex
    const comment = await fetchMutation(api.tickets.createTicketComment, {
      ticket_id: ticketId as Id<"tickets">,
      author_id: userId,
      content: content.trim(),
      is_stage_change: false,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tickets/[id]/comments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
