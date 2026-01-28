/**
 * Individual Slot API
 * PATCH - Update slot
 * DELETE - Delete slot
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { ConsultantSlotUpdate } from '@/lib/ari/types'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

interface RouteParams {
  params: Promise<{ id: string; slotId: string }>
}

// PATCH /api/workspaces/[id]/slots/[slotId]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, slotId } = await params
    const body = await request.json()

    // Dev mode: return mock updated slot without auth
    if (isDevMode() && workspaceId === 'demo') {
      return NextResponse.json({
        slot: {
          id: slotId,
          workspace_id: workspaceId,
          ...body,
          updated_at: new Date().toISOString(),
        },
      })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update slot in Convex
    const slot = await fetchMutation(api.ari.updateSlot, {
      slot_id: slotId,
      workspace_id: workspace._id,
      consultant_id: body.consultant_id,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes,
      booking_window_days: body.booking_window_days,
      max_bookings_per_slot: body.max_bookings_per_slot,
      is_active: body.is_active,
    })

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

    // Dev mode: return success without auth
    if (isDevMode() && workspaceId === 'demo') {
      return NextResponse.json({ success: true })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Delete slot in Convex
    await fetchMutation(api.ari.deleteSlot, {
      slot_id: slotId,
      workspace_id: workspace._id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in slot DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
