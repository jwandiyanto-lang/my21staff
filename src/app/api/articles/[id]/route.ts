import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { Article } from '@/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/articles/[id] - Get a single article
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Fetch article from Convex
    const article = await fetchQuery(api.cms.getArticle, {
      articleId: id as any,
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: article.workspace_id,
    }) as { slug: string } | null

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    return NextResponse.json(article, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('GET /api/articles/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/articles/[id] - Update an article
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { title, slug, excerpt, content, cover_image_url, status } = body

    // Fetch existing article to get workspace
    const existingArticle = await fetchQuery(api.cms.getArticle, {
      articleId: id as any,
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: existingArticle.workspace_id,
    }) as { slug: string } | null

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Build update object with only defined fields
    const updates: any = {}
    if (title !== undefined) updates.title = title.trim()
    if (slug !== undefined) updates.slug = slug.trim()
    if (excerpt !== undefined) updates.excerpt = excerpt?.trim() || undefined
    if (content !== undefined) updates.content = content?.trim() || undefined
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url?.trim() || undefined
    if (status !== undefined) updates.status = status

    // Update article in Convex
    await fetchMutation(api.cms.updateArticle, {
      articleId: id as any,
      ...updates,
    })

    // Fetch updated article to return it
    const article = await fetchQuery(api.cms.getArticle, {
      articleId: id as any,
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('PUT /api/articles/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/articles/[id] - Delete an article
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Fetch existing article to get workspace
    const existingArticle = await fetchQuery(api.cms.getArticle, {
      articleId: id as any,
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get workspace to check slug for auth
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: existingArticle.workspace_id,
    }) as { slug: string } | null

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace.slug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Delete article from Convex
    await fetchMutation(api.cms.deleteArticle, {
      articleId: id as any,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
