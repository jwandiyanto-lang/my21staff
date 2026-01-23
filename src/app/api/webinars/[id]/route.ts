import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { Webinar } from '@/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

// Extended type with registration count
interface WebinarWithCount extends Webinar {
  registration_count: number
}

// GET /api/webinars/[id] - Get a single webinar with registration count
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Fetch webinar from Convex
    const webinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: id as any,
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: webinar.workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get registration count
    const registrationCount = await fetchQuery(api.cms.countWebinarRegistrations, {
      webinarId: id as any,
    })

    const webinarWithCount: WebinarWithCount = {
      ...webinar,
      registration_count: registrationCount,
    }

    return NextResponse.json(webinarWithCount)
  } catch (error) {
    console.error('GET /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/webinars/[id] - Update a webinar
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      title,
      slug,
      description,
      cover_image_url,
      scheduled_at,
      duration_minutes,
      meeting_url,
      max_registrations,
      status,
    } = body

    // Fetch existing webinar to get workspace
    const existingWebinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: id as any,
    })

    if (!existingWebinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: existingWebinar.workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Build update object with only defined fields
    const updates: any = {}
    if (title !== undefined) updates.title = title.trim()
    if (slug !== undefined) updates.slug = slug.trim()
    if (description !== undefined) updates.description = description?.trim() || undefined
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url?.trim() || undefined
    if (scheduled_at !== undefined) {
      // Convert ISO string to timestamp if needed
      updates.scheduled_at = typeof scheduled_at === 'string'
        ? new Date(scheduled_at).getTime()
        : scheduled_at
    }
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes
    if (meeting_url !== undefined) updates.meeting_url = meeting_url?.trim() || undefined
    if (max_registrations !== undefined) updates.max_registrations = max_registrations || undefined
    if (status !== undefined) updates.status = status

    // Update webinar in Convex
    await fetchMutation(api.cms.updateWebinar, {
      webinarId: id as any,
      ...updates,
    })

    // Fetch updated webinar to return it
    const webinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: id as any,
    })

    return NextResponse.json(webinar)
  } catch (error) {
    console.error('PUT /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/webinars/[id] - Delete a webinar (registrations should be deleted first)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Fetch existing webinar to get workspace
    const existingWebinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: id as any,
    })

    if (!existingWebinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: existingWebinar.workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Delete webinar from Convex
    // Note: Convex doesn't have CASCADE, so registrations must be deleted manually if needed
    await fetchMutation(api.cms.deleteWebinar, {
      webinarId: id as any,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
