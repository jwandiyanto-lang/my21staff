import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchQuery } from 'convex/server'
import { api } from '@/convex/_generated/api'
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

  // Verify membership with Supabase (auth still via Supabase)
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const metrics = createRequestMetrics()

  // Call Convex query for inbox data
  let queryStart = performance.now()
  const result = await fetchQuery(
    api.conversations.listWithFiltersInternal,
    {
      workspace_id: workspaceId,
      active,
      statusFilters,
      tagFilters,
      assignedTo: assignedFilter,
      limit,
      page,
    }
  )
  logQuery(metrics, 'convex.conversations.listWithFiltersInternal', Math.round(performance.now() - queryStart))

  // Merge Convex data with Supabase profile data for team members
  // (profiles still in Supabase until migration is complete)
  const userIds = result.members.map(m => m.user_id)
  let teamMembers = result.members

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds)

    teamMembers = result.members.map(m => ({
      ...m,
      profile: profiles?.find(p => p.id === m.user_id) || null,
    }))
  }

  // Quick replies - table not yet created, return empty for now
  const quickReplies: { id: string; label: string; text: string }[] = []

  // Log query summary before returning
  logQuerySummary('/api/conversations', metrics)

  return NextResponse.json({
    conversations: result.conversations ?? [],
    totalCount: result.totalCount ?? 0,
    activeCount: result.activeCount ?? 0,
    teamMembers: teamMembers ?? [],
    quickReplies: quickReplies ?? [],
    contactTags: result.tags ?? [],
  })
}

// Export wrapped handler with timing instrumentation
export const GET = withTiming('/api/conversations', getHandler)
