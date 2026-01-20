/**
 * Individual Slot API
 * PATCH - Update slot
 * DELETE - Delete slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { ConsultantSlotUpdate } from '@/lib/ari/types'

interface RouteParams {
  params: Promise<{ id: string; slotId: string }>
}

// PATCH /api/workspaces/[id]/slots/[slotId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, slotId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: ConsultantSlotUpdate = {}
    if (body.consultant_id !== undefined) updateData.consultant_id = body.consultant_id
    if (body.day_of_week !== undefined) updateData.day_of_week = body.day_of_week
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
    if (body.booking_window_days !== undefined) updateData.booking_window_days = body.booking_window_days
    if (body.max_bookings_per_slot !== undefined) updateData.max_bookings_per_slot = body.max_bookings_per_slot
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: slot, error } = await supabase
      .from('consultant_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
      }
      // Handle check constraint violation (time range)
      if (error.code === '23514') {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
      console.error('Failed to update slot:', error)
      return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
    }

    return NextResponse.json({ slot })
  } catch (error) {
    console.error('Error in slot PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/slots/[slotId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, slotId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    const { error } = await supabase
      .from('consultant_slots')
      .delete()
      .eq('id', slotId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Failed to delete slot:', error)
      return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in slot DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
