/**
 * Flow Stages API
 * GET - List all stages (or return defaults if none exist)
 * POST - Create new stage
 * PUT - Update stage or batch reorder
 * DELETE - Delete stage by id
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get existing stages from Convex
    const stages = await fetchQuery(api.ari.getFlowStages, {
      workspace_id: workspace._id,
    })

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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get current max order from existing stages
    const existingStages = await fetchQuery(api.ari.getFlowStages, {
      workspace_id: workspace._id,
    })

    const nextOrder = existingStages && existingStages.length > 0
      ? Math.max(...existingStages.map(s => s.stage_order)) + 1
      : 0

    // Create stage in Convex
    const stage = await fetchMutation(api.ari.createFlowStage, {
      workspace_id: workspace._id,
      name: body.name.trim(),
      goal: body.goal.trim(),
      sample_script: body.sample_script?.trim() || undefined,
      exit_criteria: body.exit_criteria?.trim() || undefined,
      stage_order: nextOrder,
      is_active: body.is_active ?? true,
    })

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

    const body = await request.json()

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

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

      // Update each stage with new order
      for (const update of updates) {
        await fetchMutation(api.ari.updateFlowStage, {
          stage_id: update.id,
          workspace_id: workspace._id,
          stage_order: update.stage_order,
        })
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

    // Update stage in Convex
    const stage = await fetchMutation(api.ari.updateFlowStage, {
      stage_id: body.id,
      workspace_id: workspace._id,
      name: body.name !== undefined ? body.name.trim() : undefined,
      goal: body.goal !== undefined ? body.goal.trim() : undefined,
      sample_script: body.sample_script !== undefined ? (body.sample_script?.trim() || undefined) : undefined,
      exit_criteria: body.exit_criteria !== undefined ? (body.exit_criteria?.trim() || undefined) : undefined,
      is_active: body.is_active,
    })

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

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Delete the stage in Convex
    await fetchMutation(api.ari.deleteFlowStage, {
      stage_id: stageId,
      workspace_id: workspace._id,
    })

    // Note: Reordering is now handled by the UI when needed via batch update
    // No automatic reordering to avoid conflicts

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in flow-stages DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
