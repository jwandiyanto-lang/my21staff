import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import type { Article } from '@/types/database'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/articles - List articles for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceSlug = searchParams.get('workspace_id')

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspaceSlug)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get workspace by slug
    const workspace = await fetchQuery(api.workspaces.getBySlug, {
      slug: workspaceSlug,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Fetch articles from Convex
    const articles = await fetchQuery(api.cms.listArticles, {
      workspaceId: workspace._id as any,
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('GET /api/articles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, excerpt, content, cover_image_url, status, workspace_id } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Verify workspace membership
    const authResult = await requireWorkspaceMembership(workspace_id)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get workspace by slug
    const workspace = await fetchQuery(api.workspaces.getBySlug, {
      slug: workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || slugify(title)

    // Create article in Convex
    const articleId = await fetchMutation(api.cms.createArticle, {
      workspaceId: workspace._id as any,
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt?.trim() || undefined,
      content: content?.trim() || undefined,
      cover_image_url: cover_image_url?.trim() || undefined,
      status: status || 'draft',
    })

    // Fetch created article to return it
    const article = await fetchQuery(api.cms.getArticle, {
      articleId: articleId as any,
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('POST /api/articles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
