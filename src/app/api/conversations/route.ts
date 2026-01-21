import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

async function getHandler(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const workspaceId = searchParams.get('workspace')
  const page = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '50')

  // New filter parameters
  const active = searchParams.get('active') === 'true'
  const statusFilters = searchParams.getAll('status')
  const tagFilters = searchParams.getAll('tags')
  const assignedFilter = searchParams.get('assigned')

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace required' }, { status: 400 })
  }

  // Verify membership
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const from = page * limit
  const to = from + limit - 1

  const metrics = createRequestMetrics()

  // Build base query
  let query = supabase
    .from('conversations')
    .select('*, contact:contacts!inner(*)', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  // Active filter (unread only)
  if (active) {
    query = query.gt('unread_count', 0)
  }

  // Status filter (if provided) - filter by contact's lead_status
  if (statusFilters.length > 0) {
    query = query.in('contact.lead_status', statusFilters)
  }

  // Tag filter (if provided) - uses array overlap for OR logic
  if (tagFilters.length > 0) {
    // Supabase overlaps filter for array column
    query = query.overlaps('contact.tags', tagFilters)
  }

  // Assigned filter
  if (assignedFilter) {
    if (assignedFilter === 'unassigned') {
      query = query.is('assigned_to', null)
    } else {
      query = query.eq('assigned_to', assignedFilter)
    }
  }

  // Apply pagination
  query = query.range(from, to)

  // Query 1: Main conversations query with contacts
  let queryStart = performance.now()
  const { data: conversations, error, count: totalCount } = await query
  logQuery(metrics, 'conversations', Math.round(performance.now() - queryStart))

  if (error) {
    console.error('Conversations query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Query 2: Get activeCount (unread conversations) for sidebar badge
  queryStart = performance.now()
  const { count: activeCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gt('unread_count', 0)
  logQuery(metrics, 'activeCount', Math.round(performance.now() - queryStart))

  // Query 3: Get team members for the workspace
  queryStart = performance.now()
  const { data: teamMembers } = await supabase
    .from('workspace_members')
    .select('*, profile:profiles(*)')
    .eq('workspace_id', workspaceId)
  logQuery(metrics, 'teamMembers', Math.round(performance.now() - queryStart))

  // Quick replies - table not yet created, return empty for now
  const quickReplies: { id: string; label: string; text: string }[] = []

  // Query 4: Get unique contact tags for filter dropdown
  queryStart = performance.now()
  const { data: contactsWithTags } = await supabase
    .from('contacts')
    .select('tags')
    .eq('workspace_id', workspaceId)
    .not('tags', 'is', null)
  logQuery(metrics, 'contactsWithTags', Math.round(performance.now() - queryStart))

  const contactTags = contactsWithTags
    ? [...new Set(contactsWithTags.flatMap(c => c.tags || []))]
    : []

  // Log query summary before returning
  logQuerySummary('/api/conversations', metrics)

  return NextResponse.json({
    conversations: conversations ?? [],
    totalCount: totalCount ?? 0,
    activeCount: activeCount ?? 0,
    teamMembers: teamMembers ?? [],
    quickReplies: quickReplies ?? [],
    contactTags,
  })
}

// Export wrapped handler with timing instrumentation
export const GET = withTiming('/api/conversations', getHandler)
