// @ts-nocheck - Type generation pending from new Convex deployment
import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

/**
 * POST /api/conversations/[id]/handover
 *
 * Hand over a conversation to AI bot (ARI).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const { ai_paused } = await request.json()

    if (typeof ai_paused !== 'boolean') {
      return NextResponse.json(
        { error: 'ai_paused must be a boolean' },
        { status: 400 }
      )
    }

    const metrics = { start: performance.now() }

    // Update conversation status via Convex
    const result = await fetchMutation(
      api.conversations.updateConversationStatus,
      {
        id: conversationId,
        status: ai_paused ? 'handover' : 'open'
      }
    )

    return NextResponse.json({
      success: true,
      conversation: result,
      metrics: { duration_ms: Math.round(performance.now() - metrics.start) }
    })
  } catch (error) {
    console.error('[ConversationsHandover] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
