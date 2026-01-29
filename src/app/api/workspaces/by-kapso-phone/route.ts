import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

/**
 * POST /api/workspaces/by-kapso-phone
 *
 * Lookup workspace by Kapso phone ID (for webhook/sync scripts).
 * Public endpoint - no auth required for Kapso compatibility.
 */
export async function POST(request: NextRequest) {
  const metrics = { start: performance.now() }

  try {
    const { kapso_phone_id } = await request.json()

    if (!kapso_phone_id) {
      return NextResponse.json(
        { error: 'Missing kapso_phone_id' },
        { status: 400 }
      )
    }

    // Lookup workspace by Kapso phone ID
    const workspace = await fetchQuery(
      api.workspaces.getByKapsoPhoneIdWebhook,
      { kapso_phone_id }
    )

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const duration = Math.round(performance.now() - metrics.start)

    return NextResponse.json({
      workspaceId: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      metrics: { duration_ms: duration }
    })

  } catch (error) {
    console.error('[WorkspacesByKapsoPhone] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
