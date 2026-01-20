/**
 * Individual Knowledge Entry API
 * PUT - Update entry
 * DELETE - Delete entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: KnowledgeEntryUpdate = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.content !== undefined) updateData.content = body.content.trim()
    if (body.category_id !== undefined) updateData.category_id = body.category_id || null
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: entry, error } = await supabase
      .from('ari_knowledge_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }
      console.error('Failed to update entry:', error)
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

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

    const supabase = await createClient()

    const { error } = await supabase
      .from('ari_knowledge_entries')
      .delete()
      .eq('id', entryId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Failed to delete entry:', error)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in entry DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
