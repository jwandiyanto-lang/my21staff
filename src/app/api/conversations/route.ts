import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'
import { MOCK_CONVERSATIONS } from '@/lib/mock-data'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

/**
 * GET /api/conversations?workspace_id=xxx&status=open&assigned_to=user_id
 *
 * Inbox conversations API using Convex.
 *
 * Returns conversations list with contacts, pagination, and metadata.
 * Authentication: X-API-Key header with CRM_API_KEY secret (bypassed in dev mode)
 */
async function getHandler(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace_id parameter' },
        { status: 400 }
      )
    }

    // Dev mode: return mock conversations for offline development
    if (isDevMode() && workspaceId === 'demo') {
      // Transform MOCK_CONVERSATIONS to match API response format
      const mockResponse = {
        conversations: MOCK_CONVERSATIONS.map(conv => ({
          id: conv.id,
          phoneNumber: conv.contact.phone,
          contactName: conv.contact.name,
          status: conv.conversation.status,
          lastActiveAt: conv.conversation.last_message_at,
          phoneNumberId: 'mock-phone-id',
          metadata: {},
          messagesCount: 5,
          lastMessage: {
            content: conv.conversation.last_message_preview,
            direction: 'inbound',
            type: 'text',
          },
        })),
        total: MOCK_CONVERSATIONS.length,
        page: 0,
        hasMore: false,
      }
      return NextResponse.json(mockResponse)
    }

    // Production mode: verify API key
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
      api.conversations.listWithFiltersInternal,
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
    logQuery(metrics, 'convex.conversations.listWithFiltersInternal', Math.round(performance.now() - queryStart))

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
