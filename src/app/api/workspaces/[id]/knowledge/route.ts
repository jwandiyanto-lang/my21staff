/**
 * Knowledge Base API
 * GET - List all categories and entries
 * POST - Create category or entry
 * PUT - Update category
 * DELETE - Delete category (with cascade warning)
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { KnowledgeCategoryInsert, KnowledgeEntryInsert } from '@/lib/ari/types'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workspaces/[id]/knowledge
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params

    // Dev mode: return mock data without auth
    if (isDevMode() && workspaceId === 'demo') {
      return NextResponse.json({ categories: [], entries: [] })
    }

    // Verify user has access to workspace
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get categories and entries from Convex
    const [categories, entries] = await Promise.all([
      fetchQuery(api.ari.getKnowledgeCategories, { workspace_id: workspace._id }),
      fetchQuery(api.ari.getKnowledgeEntries, { workspace_id: workspace._id }),
    ])

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

    // Dev mode: return mock success without auth
    if (isDevMode() && workspaceId === 'demo') {
      const body = await request.json()
      if (body.type === 'category') {
        return NextResponse.json({
          category: {
            id: `mock-category-${Date.now()}`,
            workspace_id: workspaceId,
            name: body.name || 'New Category',
            description: body.description || null,
            display_order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }, { status: 201 })
      }
      return NextResponse.json({
        entry: {
          id: `mock-entry-${Date.now()}`,
          workspace_id: workspaceId,
          category_id: body.category_id || null,
          title: body.title || 'New Entry',
          content: body.content || '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }, { status: 201 })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Type determines what we're creating
    if (body.type === 'category') {
      // Create category
      if (!body.name?.trim()) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
      }

      // Get max display_order for workspace
      const existingCategories = await fetchQuery(api.ari.getKnowledgeCategories, {
        workspace_id: workspace._id,
      })

      const nextOrder = existingCategories && existingCategories.length > 0
        ? Math.max(...existingCategories.map(c => c.display_order)) + 1
        : 0

      // Create category in Convex
      const category = await fetchMutation(api.ari.createKnowledgeCategory, {
        workspace_id: workspace._id,
        name: body.name.trim(),
        description: body.description?.trim() || undefined,
        display_order: nextOrder,
      })

      return NextResponse.json({ category }, { status: 201 })
    } else if (body.type === 'entry') {
      // Create entry
      if (!body.title?.trim()) {
        return NextResponse.json({ error: 'Entry title is required' }, { status: 400 })
      }
      if (!body.content?.trim()) {
        return NextResponse.json({ error: 'Entry content is required' }, { status: 400 })
      }

      // Create entry in Convex
      const entry = await fetchMutation(api.ari.createKnowledgeEntry, {
        workspace_id: workspace._id,
        category_id: body.category_id || undefined,
        title: body.title.trim(),
        content: body.content.trim(),
        is_active: body.is_active ?? true,
      })

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

    // Dev mode: return mock success without auth
    if (isDevMode() && workspaceId === 'demo') {
      const body = await request.json()
      return NextResponse.json({
        category: {
          id: body.category_id,
          workspace_id: workspaceId,
          name: body.name || 'Updated Category',
          description: body.description || null,
          display_order: body.display_order ?? 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()

    if (!body.category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    }

    // Check if there are fields to update
    if (body.name === undefined && body.description === undefined && body.display_order === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update category in Convex
    const category = await fetchMutation(api.ari.updateKnowledgeCategory, {
      category_id: body.category_id,
      workspace_id: workspace._id,
      name: body.name !== undefined ? body.name.trim() : undefined,
      description: body.description !== undefined ? (body.description?.trim() || undefined) : undefined,
      display_order: body.display_order,
    })

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

    // Dev mode: return mock success without auth
    if (isDevMode() && workspaceId === 'demo') {
      return NextResponse.json({ success: true, entriesDeleted: 0 })
    }

    // Verify user has access
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId query param is required' }, { status: 400 })
    }

    // Get workspace to get Convex ID
    const workspace = await fetchQuery(api.workspaces.getBySlug, { slug: workspaceId })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get entry count before deleting (for info)
    const entries = await fetchQuery(api.ari.getKnowledgeEntries, {
      workspace_id: workspace._id,
      category_id: categoryId,
    })
    const entryCount = entries?.length || 0

    // Delete category in Convex (entries must be unlinked first by UI or deleted separately)
    await fetchMutation(api.ari.deleteKnowledgeCategory, {
      category_id: categoryId,
      workspace_id: workspace._id,
    })

    return NextResponse.json({
      success: true,
      entriesDeleted: entryCount,
    })
  } catch (error) {
    console.error('Error in knowledge DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
