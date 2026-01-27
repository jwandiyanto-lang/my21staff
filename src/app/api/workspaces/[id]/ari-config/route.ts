/**
 * ARI Config API
 * GET - Fetch config or return defaults
 * PUT - Upsert config (create if not exists, update if exists)
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// ARI Config insert type matching database schema
interface ARIConfigInsert {
  workspace_id: string
  enabled?: boolean | null
  bot_name?: string | null
  greeting_style?: string | null
  language?: string | null
  tone?: Record<string, unknown> | null
  community_link?: string | null
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// Default config values
const DEFAULT_CONFIG = {
  enabled: true,
  bot_name: 'ARI',
  greeting_style: 'professional',
  language: 'id',
  tone: { supportive: true, clear: true, encouraging: true },
  community_link: null,
}

// GET /api/workspaces/[id]/ari-config
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

    // Get existing config from Convex
    const config = await fetchQuery(api.ari.getAriConfig, {
      workspace_id: workspace._id,
    })

    // Return existing config or defaults
    if (config) {
      return NextResponse.json({ config })
    }

    // Return defaults for workspaces without config
    return NextResponse.json({
      config: {
        workspace_id: workspaceId,
        ...DEFAULT_CONFIG,
      },
    })
  } catch (error) {
    console.error('Error in ari-config GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id]/ari-config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()

    // Validate bot_name
    if (body.bot_name !== undefined) {
      if (typeof body.bot_name !== 'string' || body.bot_name.trim() === '') {
        return NextResponse.json(
          { error: 'bot_name is required and must be non-empty' },
          { status: 400 }
        )
      }
      if (body.bot_name.length > 100) {
        return NextResponse.json(
          { error: 'bot_name must be 100 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate tone_description
    if (body.tone_description !== undefined && body.tone_description !== null) {
      if (typeof body.tone_description !== 'string') {
        return NextResponse.json(
          { error: 'tone_description must be a string' },
          { status: 400 }
        )
      }
      if (body.tone_description.length > 500) {
        return NextResponse.json(
          { error: 'tone_description must be 500 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate greeting_template
    if (body.greeting_template !== undefined && body.greeting_template !== null) {
      if (typeof body.greeting_template !== 'string') {
        return NextResponse.json(
          { error: 'greeting_template must be a string' },
          { status: 400 }
        )
      }
      if (body.greeting_template.length > 500) {
        return NextResponse.json(
          { error: 'greeting_template must be 500 characters or less' },
          { status: 400 }
        )
      }
    }

    // Build tone JSONB
    let toneData: Record<string, unknown> = { ...DEFAULT_CONFIG.tone }

    // Store tone_description in tone JSONB as { description: string }
    if (body.tone_description !== undefined) {
      toneData = {
        ...toneData,
        description: body.tone_description || '',
      }
    }

    // Store greeting_template in tone JSONB
    if (body.greeting_template !== undefined) {
      toneData = {
        ...toneData,
        greeting_template: body.greeting_template || '',
      }
    }

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Upsert config in Convex
    const config = await fetchMutation(api.ari.upsertAriConfig, {
      workspace_id: workspace._id,
      bot_name: body.bot_name || DEFAULT_CONFIG.bot_name,
      greeting_style: DEFAULT_CONFIG.greeting_style,
      language: DEFAULT_CONFIG.language,
      tone: toneData,
      community_link: body.community_link !== undefined ? (body.community_link || undefined) : undefined,
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error in ari-config PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/workspaces/[id]/ari-config - Toggle AI enabled/disabled
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Dev mode: just return success with enabled status
    if (isDevMode()) {
      const body = await request.json()
      return NextResponse.json({
        config: {
          enabled: body.enabled,
          ...DEFAULT_CONFIG
        }
      })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()

    // Validate enabled field
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Toggle AI enabled
    const config = await fetchMutation(api.ari.toggleAiEnabled, {
      workspace_id: workspace._id,
      enabled: body.enabled,
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error in ari-config PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
