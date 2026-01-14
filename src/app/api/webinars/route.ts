import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Webinar } from '@/types/database'

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

// Type assertion helper for webinars table (until Supabase types are regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebinarClient = any

// Extended type with registration count
interface WebinarWithCount extends Webinar {
  registration_count: number
}

// GET /api/webinars - List webinars for a workspace with registration counts
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
      // Dev mode: return mock webinars with registration counts
      const mockWebinars: WebinarWithCount[] = [
        {
          id: 'webinar-1',
          workspace_id: workspaceId,
          title: 'Study in Australia Info Session',
          slug: 'study-australia-info',
          description: 'Learn about studying in Australia, visa requirements, and scholarship opportunities.',
          cover_image_url: null,
          scheduled_at: '2026-01-25T14:00:00Z',
          duration_minutes: 60,
          meeting_url: 'https://zoom.us/j/example',
          max_registrations: 100,
          status: 'published',
          published_at: '2026-01-14T10:00:00Z',
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-14T10:00:00Z',
          registration_count: 12,
        },
        {
          id: 'webinar-2',
          workspace_id: workspaceId,
          title: 'UK University Application Workshop',
          slug: 'uk-application-workshop',
          description: 'Hands-on workshop for applying to UK universities through UCAS.',
          cover_image_url: null,
          scheduled_at: '2026-02-01T15:00:00Z',
          duration_minutes: 90,
          meeting_url: null,
          max_registrations: 50,
          status: 'draft',
          published_at: null,
          created_at: '2026-01-14T10:00:00Z',
          updated_at: '2026-01-14T10:00:00Z',
          registration_count: 0,
        },
      ]
      return NextResponse.json(mockWebinars)
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

    // Fetch webinars with registration counts using a left join
    const client = supabase as unknown as WebinarClient
    const { data: webinars, error } = await client
      .from('webinars')
      .select(`
        *,
        webinar_registrations (count)
      `)
      .eq('workspace_id', workspaceId)
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Fetch webinars error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch webinars' },
        { status: 500 }
      )
    }

    // Transform the response to include registration_count as a flat field
    const webinarsWithCount: WebinarWithCount[] = webinars.map((w: { webinar_registrations: { count: number }[] } & Webinar) => ({
      ...w,
      registration_count: w.webinar_registrations?.[0]?.count ?? 0,
      webinar_registrations: undefined, // Remove the nested object
    }))

    return NextResponse.json(webinarsWithCount)
  } catch (error) {
    console.error('GET /api/webinars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/webinars - Create a new webinar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      slug,
      description,
      cover_image_url,
      scheduled_at,
      duration_minutes,
      meeting_url,
      max_registrations,
      status,
      workspace_id,
    } = body

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

    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug?.trim() || slugify(title)

    if (isDevMode()) {
      // Dev mode: return mock created webinar
      const now = new Date().toISOString()
      const mockWebinar: Webinar = {
        id: `webinar-${Date.now()}`,
        workspace_id,
        title: title.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        cover_image_url: cover_image_url?.trim() || null,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        meeting_url: meeting_url?.trim() || null,
        max_registrations: max_registrations || null,
        status: status || 'draft',
        published_at: status === 'published' ? now : null,
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockWebinar, { status: 201 })
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
    const webinarData = {
      workspace_id,
      title: title.trim(),
      slug: finalSlug,
      description: description?.trim() || null,
      cover_image_url: cover_image_url?.trim() || null,
      scheduled_at,
      duration_minutes: duration_minutes || 60,
      meeting_url: meeting_url?.trim() || null,
      max_registrations: max_registrations || null,
      status: status || 'draft',
      published_at: status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    }

    // Insert webinar
    const client = supabase as unknown as WebinarClient
    const { data: webinar, error } = await client
      .from('webinars')
      .insert(webinarData)
      .select()
      .single()

    if (error) {
      console.error('Create webinar error:', error)
      return NextResponse.json(
        { error: 'Failed to create webinar' },
        { status: 500 }
      )
    }

    return NextResponse.json(webinar as Webinar, { status: 201 })
  } catch (error) {
    console.error('POST /api/webinars error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
