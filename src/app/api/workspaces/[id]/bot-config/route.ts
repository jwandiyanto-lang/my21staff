import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/../convex/_generated/api'
import { isDevMode, getMockWorkspaceSettings, updateMockWorkspaceSettings } from '@/lib/mock-data'

// Default bot names
const DEFAULT_INTERN_NAME = 'Sarah'
const DEFAULT_BRAIN_NAME = 'Grok'

/**
 * GET /api/workspaces/[id]/bot-config
 * Returns bot configuration for the workspace
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

    const { id: workspaceId } = await params

    // In dev mode, return mock data
    if (isDevMode() && workspaceId === 'demo') {
      const settings = getMockWorkspaceSettings()
      return NextResponse.json({
        intern_name: settings.intern_name || DEFAULT_INTERN_NAME,
        brain_name: settings.brain_name || DEFAULT_BRAIN_NAME,
      })
    }

    // Fetch from Convex
    const config = await fetchQuery(api.botConfig.getBotConfig, {
      workspace_id: workspaceId as any,
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

    const { id: workspaceId } = await params
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
    if (isDevMode() && workspaceId === 'demo') {
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

    // Update in Convex
    const config = await fetchMutation(api.botConfig.updateBotConfig, {
      workspace_id: workspaceId as any,
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
