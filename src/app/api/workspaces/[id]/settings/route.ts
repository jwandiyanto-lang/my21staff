import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { safeEncrypt } from '@/lib/crypto'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    await convex.mutation(api.workspaces.updateSettings, {
      workspace_id: workspaceId,
      ...updates
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in workspace settings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
