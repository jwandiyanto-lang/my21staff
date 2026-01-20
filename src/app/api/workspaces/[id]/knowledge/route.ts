/**
 * Knowledge Base API
 * GET - List all categories and entries
 * POST - Create category or entry
 * PUT - Update category
 * DELETE - Delete category (with cascade warning)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { KnowledgeCategoryInsert, KnowledgeEntryInsert } from '@/lib/ari/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workspaces/[id]/knowledge
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()

    // Get categories ordered by display_order
    const { data: categories, error: catError } = await supabase
      .from('ari_knowledge_categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (catError) {
      console.error('Failed to fetch categories:', catError)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get entries ordered by created_at desc
    const { data: entries, error: entryError } = await supabase
      .from('ari_knowledge_entries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (entryError) {
      console.error('Failed to fetch entries:', entryError)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({
      categories: categories || [],
      entries: entries || [],
    })
  } catch (error) {
    console.error('Error in knowledge GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/knowledge
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    // Type determines what we're creating
    if (body.type === 'category') {
      // Create category
      if (!body.name?.trim()) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
      }

      // Get max display_order for workspace
      const { data: maxOrder } = await supabase
        .from('ari_knowledge_categories')
        .select('display_order')
        .eq('workspace_id', workspaceId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const nextOrder = (maxOrder?.display_order ?? -1) + 1

      const categoryData: KnowledgeCategoryInsert = {
        workspace_id: workspaceId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        display_order: nextOrder,
      }

      const { data: category, error } = await supabase
        .from('ari_knowledge_categories')
        .insert(categoryData)
        .select()
        .single()

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Category with this name already exists' },
            { status: 409 }
          )
        }
        console.error('Failed to create category:', error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
      }

      return NextResponse.json({ category }, { status: 201 })
    } else if (body.type === 'entry') {
      // Create entry
      if (!body.title?.trim()) {
        return NextResponse.json({ error: 'Entry title is required' }, { status: 400 })
      }
      if (!body.content?.trim()) {
        return NextResponse.json({ error: 'Entry content is required' }, { status: 400 })
      }

      const entryData: KnowledgeEntryInsert = {
        workspace_id: workspaceId,
        category_id: body.category_id || null,
        title: body.title.trim(),
        content: body.content.trim(),
        is_active: body.is_active ?? true,
      }

      const { data: entry, error } = await supabase
        .from('ari_knowledge_entries')
        .insert(entryData)
        .select()
        .single()

      if (error) {
        console.error('Failed to create entry:', error)
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
      }

      return NextResponse.json({ entry }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "category" or "entry"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in knowledge POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id]/knowledge (for updating categories)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const supabase = await createClient()
    const body = await request.json()

    if (!body.category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.display_order !== undefined) updateData.display_order = body.display_order

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: category, error } = await supabase
      .from('ari_knowledge_categories')
      .update(updateData)
      .eq('id', body.category_id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
      console.error('Failed to update category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error in knowledge PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/knowledge?categoryId=xxx (for deleting categories)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId query param is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get entry count before deleting (for info)
    const { count } = await supabase
      .from('ari_knowledge_entries')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('workspace_id', workspaceId)

    // Delete category (entries cascade automatically)
    const { error } = await supabase
      .from('ari_knowledge_categories')
      .delete()
      .eq('id', categoryId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Failed to delete category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      entriesDeleted: count || 0,
    })
  } catch (error) {
    console.error('Error in knowledge DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
