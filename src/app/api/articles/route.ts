import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Article } from '@/types/database'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Type assertion helper for articles table (until Supabase types are regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ArticleClient = any

// GET /api/articles - List articles for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    if (isDevMode()) {
      // Dev mode: return mock success
      return NextResponse.json([])
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

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this workspace' },
        { status: 403 }
      )
    }

    // Fetch articles (using type assertion until types are regenerated)
    const client = supabase as unknown as ArticleClient
    const { data: articles, error } = await client
      .from('articles')
      .select(`
        id, title, slug, excerpt, content,
        cover_image_url, status, published_at,
        created_at, updated_at
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch articles error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    return NextResponse.json(articles as Article[])
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

    // Generate slug if not provided
    const finalSlug = slug?.trim() || slugify(title)

    if (isDevMode()) {
      // Dev mode: return mock created article
      const now = new Date().toISOString()
      const mockArticle: Article = {
        id: `article-${Date.now()}`,
        workspace_id,
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt?.trim() || null,
        content: content?.trim() || null,
        cover_image_url: cover_image_url?.trim() || null,
        status: status || 'draft',
        published_at: status === 'published' ? now : null,
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockArticle, { status: 201 })
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

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this workspace' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()
    const articleData = {
      workspace_id,
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt?.trim() || null,
      content: content?.trim() || null,
      cover_image_url: cover_image_url?.trim() || null,
      status: status || 'draft',
      published_at: status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    }

    // Insert article (using type assertion until types are regenerated)
    const client = supabase as unknown as ArticleClient
    const { data: article, error } = await client
      .from('articles')
      .insert(articleData)
      .select()
      .single()

    if (error) {
      console.error('Create article error:', error)
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 500 }
      )
    }

    return NextResponse.json(article as Article, { status: 201 })
  } catch (error) {
    console.error('POST /api/articles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
