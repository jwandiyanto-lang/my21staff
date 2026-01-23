import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

// GET /api/tickets/[id] - Get ticket detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch ticket from Convex
    const ticket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: id as Id<"tickets">,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('GET /api/tickets/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tickets/[id] - Update ticket (assignment only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { assigned_to } = body

    // Fetch ticket from Convex to get workspace_id
    const existingTicket = await fetchQuery(api.tickets.getTicketById, {
      ticket_id: id as Id<"tickets">,
    })

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(existingTicket.workspace_id as string)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Check permission - assign requires tickets:assign
    const permError = requirePermission(
      authResult.role,
      'tickets:assign',
      'Only workspace owners and admins can assign tickets'
    )
    if (permError) return permError

    // Validate assigned_to if provided (must be a valid workspace member)
    if (assigned_to !== undefined && assigned_to !== null) {
      const member = await fetchQuery(api.workspaceMembers.getByUserAndWorkspace, {
        userId: assigned_to,
        workspaceId: existingTicket.workspace_id as any,
      })

      if (!member) {
        return NextResponse.json(
          { error: 'Assigned user must be a workspace member' },
          { status: 400 }
        )
      }
    }

    // Update ticket assignment via Convex
    const ticket = await fetchMutation(api.tickets.updateTicketAssignment, {
      ticket_id: id,
      workspace_id: existingTicket.workspace_id as string,
      assigned_to: assigned_to || null,
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('PATCH /api/tickets/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
