import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { safeEncrypt } from '@/lib/crypto'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dev mode: return mock settings
    if (isDevMode()) {
      return NextResponse.json({
        settings: {
          contact_tags: [],
          main_form_fields: [],
          form_field_scores: {}
        }
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

    // Get workspace settings from Convex
    const workspace = await convex.query(api.workspaces.getById, {
      id: workspaceId
    }) as { settings?: Record<string, unknown> } | null

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: workspace.settings || {} })
  } catch (error) {
    console.error('Error in workspace settings GET API:', error)
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

    // Build update object
    const updates: Record<string, unknown> = {}

    if (body.kapso_phone_id !== undefined) {
      updates.kapso_phone_id = body.kapso_phone_id
    }

    if (body.settings !== undefined) {
      // Merge with existing settings
      const existing = await convex.query(api.workspaces.getById, {
        id: workspaceId
      }) as { settings?: Record<string, unknown> } | null

      const existingSettings = (existing?.settings as Record<string, unknown>) || {}
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

    // Update workspace via Convex
    const result = await convex.mutation(api.workspaces.updateSettings, {
      workspace_id: workspaceId,
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
