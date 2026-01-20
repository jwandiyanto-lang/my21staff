/**
 * Flow Stages API
 * GET - List all stages (or return defaults if none exist)
 * POST - Create new stage
 * PUT - Update stage or batch reorder
 * DELETE - Delete stage by id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { DEFAULT_FLOW_STAGES, type FlowStageInsert } from '@/lib/ari/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workspaces/[id]/flow-stages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    // Get existing stages ordered by stage_order
    const { data: stages, error } = await supabase
      .from('ari_flow_stages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('stage_order', { ascending: true })

    if (error) {
      console.error('Failed to fetch flow stages:', error)
      return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 })
    }

    // If no stages exist, return defaults (not saved to DB)
    if (!stages || stages.length === 0) {
      const defaultStages = DEFAULT_FLOW_STAGES.map((stage, index) => ({
        id: `default-${index}`,
        workspace_id: workspaceId,
        ...stage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      return NextResponse.json({ stages: defaultStages, isDefault: true })
    }

    return NextResponse.json({ stages, isDefault: false })
  } catch (error) {
    console.error('Error in flow-stages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/flow-stages
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Stage name is required' }, { status: 400 })
    }
    if (!body.goal?.trim()) {
      return NextResponse.json({ error: 'Stage goal is required' }, { status: 400 })
    }

    // Validate lengths
    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }

    // Get current max order
    const { data: existingStages } = await supabase
      .from('ari_flow_stages')
      .select('stage_order')
      .eq('workspace_id', workspaceId)
      .order('stage_order', { ascending: false })
      .limit(1)

    const nextOrder = existingStages && existingStages.length > 0
      ? existingStages[0].stage_order + 1
      : 0

    const stageData: FlowStageInsert = {
      workspace_id: workspaceId,
      name: body.name.trim(),
      goal: body.goal.trim(),
      sample_script: body.sample_script?.trim() || null,
      exit_criteria: body.exit_criteria?.trim() || null,
      stage_order: nextOrder,
      is_active: body.is_active ?? true,
    }

    const { data: stage, error } = await supabase
      .from('ari_flow_stages')
      .insert(stageData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create flow stage:', error)
      return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 })
    }

    return NextResponse.json({ stage }, { status: 201 })
  } catch (error) {
    console.error('Error in flow-stages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id]/flow-stages
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    // Check if this is a batch reorder request
    if (body.stages && Array.isArray(body.stages)) {
      // Batch reorder: { stages: [{ id, stage_order }, ...] }
      const updates = body.stages as Array<{ id: string; stage_order: number }>

      // Validate each update
      for (const update of updates) {
        if (!update.id || update.stage_order === undefined) {
          return NextResponse.json(
            { error: 'Each stage must have id and stage_order' },
            { status: 400 }
          )
        }
      }

      // Clear existing orders to avoid unique constraint violations during reorder
      // We'll set them to negative values temporarily
      for (let i = 0; i < updates.length; i++) {
        await supabase
          .from('ari_flow_stages')
          .update({ stage_order: -(i + 1000) })
          .eq('id', updates[i].id)
          .eq('workspace_id', workspaceId)
      }

      // Now set the correct orders
      for (const update of updates) {
        const { error } = await supabase
          .from('ari_flow_stages')
          .update({ stage_order: update.stage_order })
          .eq('id', update.id)
          .eq('workspace_id', workspaceId)

        if (error) {
          console.error('Failed to reorder stage:', error)
          return NextResponse.json({ error: 'Failed to reorder stages' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    // Single stage update: { id, name, goal, ... }
    if (!body.id) {
      return NextResponse.json({ error: 'Stage id is required' }, { status: 400 })
    }

    // Validate required fields if provided
    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: 'Stage name cannot be empty' }, { status: 400 })
    }
    if (body.goal !== undefined && !body.goal?.trim()) {
      return NextResponse.json({ error: 'Stage goal cannot be empty' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.goal !== undefined) updateData.goal = body.goal.trim()
    if (body.sample_script !== undefined) updateData.sample_script = body.sample_script?.trim() || null
    if (body.exit_criteria !== undefined) updateData.exit_criteria = body.exit_criteria?.trim() || null
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: stage, error } = await supabase
      .from('ari_flow_stages')
      .update(updateData)
      .eq('id', body.id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update flow stage:', error)
      return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 })
    }

    return NextResponse.json({ stage })
  } catch (error) {
    console.error('Error in flow-stages PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/flow-stages?id=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params
    const url = new URL(request.url)
    const stageId = url.searchParams.get('id')

    if (!stageId) {
      return NextResponse.json({ error: 'Stage id is required' }, { status: 400 })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    // Get the stage being deleted to know its order
    const { data: deletedStage, error: fetchError } = await supabase
      .from('ari_flow_stages')
      .select('stage_order')
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)
      .single()

    if (fetchError || !deletedStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 })
    }

    // Delete the stage
    const { error: deleteError } = await supabase
      .from('ari_flow_stages')
      .delete()
      .eq('id', stageId)
      .eq('workspace_id', workspaceId)

    if (deleteError) {
      console.error('Failed to delete flow stage:', deleteError)
      return NextResponse.json({ error: 'Failed to delete stage' }, { status: 500 })
    }

    // Reorder remaining stages to close the gap
    const { data: remainingStages } = await supabase
      .from('ari_flow_stages')
      .select('id, stage_order')
      .eq('workspace_id', workspaceId)
      .gt('stage_order', deletedStage.stage_order)
      .order('stage_order', { ascending: true })

    if (remainingStages && remainingStages.length > 0) {
      for (const stage of remainingStages) {
        await supabase
          .from('ari_flow_stages')
          .update({ stage_order: stage.stage_order - 1 })
          .eq('id', stage.id)
          .eq('workspace_id', workspaceId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in flow-stages DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
