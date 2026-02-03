import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from '@/../convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { safeEncrypt } from '@/lib/crypto'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// GET /api/workspaces/[id]/settings - Get workspace settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dev mode: return mock settings
    if (isDevMode()) {
      return NextResponse.json({
        contact_tags: ['Student', 'Parent', 'Hot Lead', 'Follow Up'],
        main_form_fields: [],
        form_field_scores: {},
      })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params

    // Verify workspace access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Fetch workspace by slug to get settings
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Return workspace settings
    const settings = (workspace.settings as Record<string, unknown>) || {}
    return NextResponse.json({
      contact_tags: settings.contact_tags || [],
      main_form_fields: settings.main_form_fields || [],
      form_field_scores: settings.form_field_scores || {},
    })
  } catch (error) {
    console.error('Error in workspace settings GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dev mode: just return success (no DB to update)
    if (isDevMode()) {
      return NextResponse.json({ success: true })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceId } = await params
    const body = await request.json()

    // Verify workspace access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Fetch workspace by slug to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if (body.kapso_phone_id !== undefined) {
      updates.kapso_phone_id = body.kapso_phone_id
    }

    if (body.settings !== undefined) {
      // Merge with existing settings
      const existingSettings = (workspace.settings as Record<string, unknown>) || {}
      const newSettings = { ...body.settings }

      // Encrypt API key if provided
      if (newSettings.kapso_api_key && typeof newSettings.kapso_api_key === 'string') {
        newSettings.kapso_api_key = safeEncrypt(newSettings.kapso_api_key)
      }

      updates.settings = {
        ...existingSettings,
        ...newSettings,
      }
    }

    // Update workspace via Convex using Convex ID as string
    const result = await fetchMutation(api.workspaces.updateSettings, {
      workspace_id: workspace._id,
      settings: updates.settings as any,
      kapso_phone_id: updates.kapso_phone_id as string | undefined,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error in workspace settings API:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
