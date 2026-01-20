/**
 * Consultant Slots API
 * GET - List all slots for workspace
 * POST - Create new slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { ConsultantSlotInsert } from '@/lib/ari/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workspaces/[id]/slots
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    // Get slots ordered by day and time
    const { data: slots, error } = await supabase
      .from('consultant_slots')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Failed to fetch slots:', error)
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error in slots GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/slots
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (body.day_of_week === undefined || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // Validate day_of_week range
    if (body.day_of_week < 0 || body.day_of_week > 6) {
      return NextResponse.json(
        { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    const slotData: ConsultantSlotInsert = {
      workspace_id: workspaceId,
      consultant_id: body.consultant_id || null,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes || 60,
      booking_window_days: body.booking_window_days || 14,
      max_bookings_per_slot: body.max_bookings_per_slot || 1,
      is_active: body.is_active ?? true,
    }

    const { data: slot, error } = await supabase
      .from('consultant_slots')
      .insert(slotData)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Slot already exists for this day and time' },
          { status: 409 }
        )
      }
      // Handle check constraint violation (time range)
      if (error.code === '23514') {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
      console.error('Failed to create slot:', error)
      return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 })
    }

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error('Error in slots POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
