import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/types/database'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// Type assertion helper for articles table (until Supabase types are regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArticleClient = any

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/articles/[id] - Get a single article
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (isDevMode()) {
      // Dev mode: return mock not found (since we don't have real data)
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch article (using type assertion until types are regenerated)
    const client = supabase as unknown as ArticleClient
    const { data: article, error } = await client
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', article.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this article' },
        { status: 403 }
      )
    }

    return NextResponse.json(article as Article, {
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

    if (isDevMode()) {
      // Dev mode: return mock updated article
      const now = new Date().toISOString()
      const mockArticle: Article = {
        id,
        workspace_id: body.workspace_id || 'dev-workspace-001',
        title: title?.trim() || 'Untitled',
        slug: slug?.trim() || 'untitled',
        excerpt: excerpt?.trim() || null,
        content: content?.trim() || null,
        cover_image_url: cover_image_url?.trim() || null,
        status: status || 'draft',
        published_at: status === 'published' ? now : null,
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockArticle)
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch existing article (using type assertion until types are regenerated)
    const client = supabase as unknown as ArticleClient
    const { data: existingArticle, error: fetchError } = await client
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingArticle.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to update this article' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // If status is changing to published and published_at is null, set it
    let publishedAt = existingArticle.published_at
    if (status === 'published' && !publishedAt) {
      publishedAt = now
    }

    const updateData = {
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(excerpt !== undefined && { excerpt: excerpt?.trim() || null }),
      ...(content !== undefined && { content: content?.trim() || null }),
      ...(cover_image_url !== undefined && { cover_image_url: cover_image_url?.trim() || null }),
      ...(status !== undefined && { status }),
      published_at: publishedAt,
      updated_at: now,
    }

    const { data: article, error } = await client
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update article error:', error)
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 500 }
      )
    }

    return NextResponse.json(article as Article)
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

    if (isDevMode()) {
      // Dev mode: return mock success
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch existing article (using type assertion until types are regenerated)
    const client = supabase as unknown as ArticleClient
    const { data: existingArticle, error: fetchError } = await client
      .from('articles')
      .select('workspace_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingArticle.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to delete this article' },
        { status: 403 }
      )
    }

    const { error } = await client
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete article error:', error)
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/articles/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
