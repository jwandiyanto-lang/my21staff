import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { requirePermission } from '@/lib/permissions/check'

// GET /api/tickets/[id] - Get ticket detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    // Fetch ticket first to get workspace_id
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:users!tickets_requester_id_fkey(id, full_name, email),
        assignee:users!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(ticket.workspace_id)
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

    const supabase = await createClient()

    // Fetch ticket first to get workspace_id
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('workspace_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(existingTicket.workspace_id)
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
      const { data: member } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', existingTicket.workspace_id)
        .eq('user_id', assigned_to)
        .single()

      if (!member) {
        return NextResponse.json(
          { error: 'Assigned user must be a workspace member' },
          { status: 400 }
        )
      }
    }

    // Update ticket assignment
    const { data: ticket, error: updateError } = await supabase
      .from('tickets')
      .update({ assigned_to: assigned_to || null })
      .eq('id', id)
      .select(`
        *,
        requester:users!tickets_requester_id_fkey(id, full_name, email),
        assignee:users!tickets_assigned_to_fkey(id, full_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Error updating ticket:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('PATCH /api/tickets/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
