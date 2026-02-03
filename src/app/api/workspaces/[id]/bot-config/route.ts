import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { isDevMode, getMockWorkspaceSettings, updateMockWorkspaceSettings } from '@/lib/mock-data'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Default bot names
const DEFAULT_INTERN_NAME = 'Sarah'
const DEFAULT_BRAIN_NAME = 'Grok'

/**
 * GET /api/workspaces/[id]/bot-config
 * Returns bot configuration for the workspace
 * Note: [id] is the workspace SLUG, not Convex ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId && !isDevMode()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceSlug } = await params

    // In dev mode, return mock data
    if (isDevMode() && workspaceSlug === 'demo') {
      const settings = getMockWorkspaceSettings()
      return NextResponse.json({
        intern_name: settings.intern_name || DEFAULT_INTERN_NAME,
        brain_name: settings.brain_name || DEFAULT_BRAIN_NAME,
      })
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Fetch from Convex using proper workspace ID
    const config = await convex.query(api.botConfig.getBotConfig, {
      workspace_id: workspace._id,
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching bot config:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bot config' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workspaces/[id]/bot-config
 * Updates bot configuration for the workspace
 * Note: [id] is the workspace SLUG, not Convex ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId && !isDevMode()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workspaceSlug } = await params
    const body = await request.json()
    const { intern_name, brain_name } = body

    // Validate input
    if (intern_name !== undefined && typeof intern_name !== 'string') {
      return NextResponse.json({ error: 'intern_name must be a string' }, { status: 400 })
    }
    if (brain_name !== undefined && typeof brain_name !== 'string') {
      return NextResponse.json({ error: 'brain_name must be a string' }, { status: 400 })
    }

    // In dev mode, update mock data
    if (isDevMode() && workspaceSlug === 'demo') {
      const updates: { intern_name?: string; brain_name?: string } = {}
      if (intern_name !== undefined) updates.intern_name = intern_name
      if (brain_name !== undefined) updates.brain_name = brain_name

      updateMockWorkspaceSettings(updates)

      const settings = getMockWorkspaceSettings()
      return NextResponse.json({
        intern_name: settings.intern_name || DEFAULT_INTERN_NAME,
        brain_name: settings.brain_name || DEFAULT_BRAIN_NAME,
      })
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update in Convex using proper workspace ID
    const config = await convex.mutation(api.botConfig.updateBotConfig, {
      workspace_id: workspace._id,
      intern_name,
      brain_name,
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating bot config:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bot config' },
      { status: 500 }
    )
  }
}
