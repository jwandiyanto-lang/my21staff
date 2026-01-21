import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

/**
 * PUT /api/conversations/[id]/assign
 *
 * Assign a conversation to a team member.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const { assigned_to } = await request.json()

    if (typeof assigned_to !== 'string') {
      return NextResponse.json(
        { error: 'assigned_to must be a string (user_id or null)' },
        { status: 400 }
      )
    }

    const metrics = { start: performance.now() }

    // Update conversation via Convex
    const result = await fetchMutation(
      api.conversations.assignConversation,
      { id: conversationId, assigned_to: assigned_to || null }
    )

    return NextResponse.json({
      success: true,
      conversation: result,
      metrics: { duration_ms: Math.round(performance.now() - metrics.start) }
    })
  } catch (error) {
    console.error('[ConversationsAssign] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
