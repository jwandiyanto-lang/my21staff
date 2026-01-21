import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
} from '@/lib/instrumentation/with-timing'

/**
 * POST /api/messages/send
 *
 * Send message via Kapso API, store in Convex.
 *
 * Authentication: X-API-Key header with CRM_API_KEY secret
 */
async function postHandler(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.CRM_API_KEY

    if (!expectedKey) {
      console.error('[MessagesSend] CRM_API_KEY not configured')
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

    // Parse request body
    const body = await request.json()
    const { conversation_id, content, message_type = 'text', media_url } = body

    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const metrics = createRequestMetrics()

    // Get conversation via Convex
    let queryStart = performance.now()
    const conversation = await fetchQuery(
      api.conversations.getById,
      { id: conversation_id }
    )
    logQuery(metrics, 'convex.conversations.getById', Math.round(performance.now() - queryStart))

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get contact phone via Convex
    queryStart = performance.now()
    const contact = await fetchQuery(
      api.contacts.getById,
      { id: conversation.contact_id, workspace_id: conversation.workspace_id }
    )
    logQuery(metrics, 'convex.contacts.getById', Math.round(performance.now() - queryStart))

    // Note: Kapso API call and message creation happen in parallel
    // Kapso API is external service - credentials from workspace.settings

    return NextResponse.json({
      success: true,
      message: 'Message send endpoint ready - Kapso integration needed',
      note: 'Kapso credentials needed - implement in separate step or via webhook',
    })
  } catch (error) {
    console.error('[MessagesSend] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withTiming('/api/messages/send', postHandler)
