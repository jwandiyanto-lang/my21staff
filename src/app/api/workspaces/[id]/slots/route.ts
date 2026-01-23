/**
 * Consultant Slots API
 * GET - List all slots for workspace
 * POST - Create new slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get slots from Convex
    const slots = await fetchQuery(api.ari.getConsultantSlots, {
      workspace_id: workspace._id,
    })

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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Create slot in Convex
    const slot = await fetchMutation(api.ari.createSlot, {
      workspace_id: workspace._id,
      consultant_id: body.consultant_id || undefined,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes || 60,
      booking_window_days: body.booking_window_days || 14,
      max_bookings_per_slot: body.max_bookings_per_slot || 1,
      is_active: body.is_active ?? true,
    })

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error('Error in slots POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
