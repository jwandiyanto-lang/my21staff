/**
 * ARI Config API
 * GET - Fetch config or return defaults
 * PUT - Upsert config (create if not exists, update if exists)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

// ARI Config insert type matching database schema
interface ARIConfigInsert {
  workspace_id: string
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

    // TEMP: Return defaults immediately to test if request completes
    return NextResponse.json({
      config: {
        workspace_id: workspaceId,
        ...DEFAULT_CONFIG,
      },
    })

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    // Get existing config
    const { data: config, error } = await supabase
      .from('ari_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new workspaces)
      console.error('Failed to fetch ARI config:', error)
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }

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

    const supabase = await createClient()
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

    // Build the config update with proper type
    const configData: ARIConfigInsert = {
      workspace_id: workspaceId,
      bot_name: body.bot_name || DEFAULT_CONFIG.bot_name,
      greeting_style: DEFAULT_CONFIG.greeting_style,
      language: DEFAULT_CONFIG.language,
      tone: toneData,
      community_link: body.community_link !== undefined ? (body.community_link || null) : null,
    }

    // Upsert: insert if not exists, update if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: config, error } = await supabase
      .from('ari_config')
      .upsert(configData as any, {
        onConflict: 'workspace_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to upsert ARI config:', error)
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error in ari-config PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
