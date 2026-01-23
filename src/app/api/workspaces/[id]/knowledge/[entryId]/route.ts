/**
 * Individual Knowledge Entry API
 * PUT - Update entry
 * DELETE - Delete entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { KnowledgeEntryUpdate } from '@/lib/ari/types'

interface RouteParams {
  params: Promise<{ id: string; entryId: string }>
}

// PUT /api/workspaces/[id]/knowledge/[entryId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, entryId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()

    // Check if there are fields to update
    if (body.title === undefined && body.content === undefined &&
        body.category_id === undefined && body.is_active === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update entry in Convex
    const entry = await fetchMutation(api.ari.updateKnowledgeEntry, {
      entry_id: entryId,
      workspace_id: workspace._id,
      title: body.title !== undefined ? body.title.trim() : undefined,
      content: body.content !== undefined ? body.content.trim() : undefined,
      category_id: body.category_id !== undefined ? (body.category_id || undefined) : undefined,
      is_active: body.is_active,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error in entry PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/knowledge/[entryId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId, entryId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Delete entry in Convex
    await fetchMutation(api.ari.deleteKnowledgeEntry, {
      entry_id: entryId,
      workspace_id: workspace._id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in entry DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
