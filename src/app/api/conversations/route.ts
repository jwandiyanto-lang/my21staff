import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/server'
import { api } from '@/convex/_generated/api'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

/**
 * GET /api/conversations?workspace_id=xxx&status=open&assigned_to=user_id
 *
 * Inbox conversations API using Convex.
 *
 * Returns conversations list with contacts, pagination, and metadata.
 * Authentication: X-API-Key header with CRM_API_KEY secret
 */
async function getHandler(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.CRM_API_KEY

    if (!expectedKey) {
      console.error('[Conversations] CRM_API_KEY not configured')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace_id parameter' },
        { status: 400 }
      )
    }

    // Parse filters
    const active = searchParams.get('active') === 'true'
    const statusFilters = searchParams.getAll('status')
    const assignedTo = searchParams.get('assigned_to')
    const tagFilters = searchParams.getAll('tag')
    const page = parseInt(searchParams.get('page') || '0')

    const metrics = createRequestMetrics()

    // Call Convex query
    let queryStart = performance.now()
    const result = await fetchQuery(
      api.conversations.listWithFilters,
      {
        workspace_id: workspaceId,
        active,
        statusFilters,
        assignedTo: assignedTo === 'unassigned' ? null : assignedTo,
        tagFilters,
        limit: 50,
        page,
      }
    )
    logQuery(metrics, 'convex.conversations.listWithFilters', Math.round(performance.now() - queryStart))

    // Log query summary before returning
    logQuerySummary('/api/conversations', metrics)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Conversations] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withTiming('/api/conversations', getHandler)
