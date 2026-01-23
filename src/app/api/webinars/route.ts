import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { Webinar } from '@/types/database'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Extended type with registration count
interface WebinarWithCount extends Webinar {
  registration_count: number
}

// GET /api/webinars - List webinars for a workspace with registration counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceSlug = searchParams.get('workspace_id')

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspaceSlug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get workspace by slug
    const workspace = await fetchQuery(api.workspaces.getBySlug, {
      slug: workspaceSlug,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Fetch webinars from Convex
    const webinars = await fetchQuery(api.cms.listWebinars, {
      workspaceId: workspace._id as any,
    })

    // Fetch registration counts for each webinar in parallel
    const webinarsWithCounts = await Promise.all(
      webinars.map(async (webinar: any) => {
        const count = await fetchQuery(api.cms.countWebinarRegistrations, {
          webinarId: webinar._id as any,
        })
        return {
          ...webinar,
          registration_count: count,
        }
      })
    )

    return NextResponse.json(webinarsWithCounts)
  } catch (error) {
    console.error('GET /api/webinars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/webinars - Create a new webinar
export async function POST(request: NextRequest) {
  try {
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
      workspace_id,
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace_id)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get workspace by slug
    const workspace = await fetchQuery(api.workspaces.getBySlug, {
      slug: workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || slugify(title)

    // Convert ISO string to timestamp if needed
    const scheduledTimestamp = typeof scheduled_at === 'string'
      ? new Date(scheduled_at).getTime()
      : scheduled_at

    // Create webinar in Convex
    const webinarId = await fetchMutation(api.cms.createWebinar, {
      workspaceId: workspace._id as any,
      title: title.trim(),
      slug: finalSlug,
      description: description?.trim() || undefined,
      cover_image_url: cover_image_url?.trim() || undefined,
      scheduled_at: scheduledTimestamp,
      duration_minutes: duration_minutes || 60,
      meeting_url: meeting_url?.trim() || undefined,
      max_registrations: max_registrations || undefined,
      status: status || 'draft',
    })

    // Fetch created webinar to return it
    const webinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: webinarId as any,
    })

    return NextResponse.json(webinar, { status: 201 })
  } catch (error) {
    console.error('POST /api/webinars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
