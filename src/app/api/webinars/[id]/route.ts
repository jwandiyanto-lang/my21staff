import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Webinar } from '@/types/database'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// Type assertion helper for webinars table (until Supabase types are regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebinarClient = any

type RouteContext = {
  params: Promise<{ id: string }>
}

// Extended type with registration count
interface WebinarWithCount extends Webinar {
  registration_count: number
}

// GET /api/webinars/[id] - Get a single webinar with registration count
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (isDevMode()) {
      // Dev mode: return mock not found (since we don't have real data)
      return NextResponse.json(
        { error: 'Webinar not found' },
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

    // Fetch webinar with registration count
    const client = supabase as unknown as WebinarClient
    const { data: webinar, error } = await client
      .from('webinars')
      .select(`
        *,
        webinar_registrations (count)
      `)
      .eq('id', id)
      .single()

    if (error || !webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', webinar.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this webinar' },
        { status: 403 }
      )
    }

    // Transform response to include registration_count as flat field
    const webinarWithCount: WebinarWithCount = {
      ...webinar,
      registration_count: webinar.webinar_registrations?.[0]?.count ?? 0,
      webinar_registrations: undefined,
    }

    return NextResponse.json(webinarWithCount)
  } catch (error) {
    console.error('GET /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/webinars/[id] - Update a webinar
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
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
    } = body

    if (isDevMode()) {
      // Dev mode: return mock updated webinar
      const now = new Date().toISOString()
      const mockWebinar: Webinar = {
        id,
        workspace_id: body.workspace_id || 'dev-workspace-001',
        title: title?.trim() || 'Untitled',
        slug: slug?.trim() || 'untitled',
        description: description?.trim() || null,
        cover_image_url: cover_image_url?.trim() || null,
        scheduled_at: scheduled_at || now,
        duration_minutes: duration_minutes || 60,
        meeting_url: meeting_url?.trim() || null,
        max_registrations: max_registrations || null,
        status: status || 'draft',
        published_at: status === 'published' ? now : null,
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockWebinar)
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

    // Fetch existing webinar
    const client = supabase as unknown as WebinarClient
    const { data: existingWebinar, error: fetchError } = await client
      .from('webinars')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingWebinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingWebinar.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to update this webinar' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // If status is changing to published and published_at is null, set it
    let publishedAt = existingWebinar.published_at
    if (status === 'published' && !publishedAt) {
      publishedAt = now
    }

    const updateData = {
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(cover_image_url !== undefined && { cover_image_url: cover_image_url?.trim() || null }),
      ...(scheduled_at !== undefined && { scheduled_at }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(meeting_url !== undefined && { meeting_url: meeting_url?.trim() || null }),
      ...(max_registrations !== undefined && { max_registrations: max_registrations || null }),
      ...(status !== undefined && { status }),
      published_at: publishedAt,
      updated_at: now,
    }

    const { data: webinar, error } = await client
      .from('webinars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update webinar error:', error)
      return NextResponse.json(
        { error: 'Failed to update webinar' },
        { status: 500 }
      )
    }

    return NextResponse.json(webinar as Webinar)
  } catch (error) {
    console.error('PUT /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/webinars/[id] - Delete a webinar (cascades to registrations)
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

    // Fetch existing webinar
    const client = supabase as unknown as WebinarClient
    const { data: existingWebinar, error: fetchError } = await client
      .from('webinars')
      .select('workspace_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingWebinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingWebinar.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to delete this webinar' },
        { status: 403 }
      )
    }

    // Delete webinar (registrations will cascade delete via FK)
    const { error } = await client
      .from('webinars')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete webinar error:', error)
      return NextResponse.json(
        { error: 'Failed to delete webinar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/webinars/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
