import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

/**
 * POST /api/conversations/[id]/read
 *
 * Mark a conversation as read (clears unread count).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params

    const metrics = { start: performance.now() }

    // Mark conversation as read via Convex
    const result = await fetchMutation(
      api.conversations.markConversationRead,
      { id: conversationId }
    )

    return NextResponse.json({
      success: true,
      conversation: result,
      metrics: { duration_ms: Math.round(performance.now() - metrics.start) }
    })
  } catch (error) {
    console.error('[ConversationsRead] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
