import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MESSAGES } from '@/lib/mock-data'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

/**
 * GET /api/messages/[conversationId] - Get messages for a conversation
 *
 * Returns all messages from the specified conversation.
 * In dev mode, returns mock messages for offline development.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params

    // Dev mode: return mock messages
    if (isDevMode()) {
      // Filter mock messages by conversation ID
      const conversationMessages = MOCK_MESSAGES.filter(
        msg => msg.conversation_id === conversationId
      )
      return NextResponse.json({ data: conversationMessages })
    }

    // Production mode: Would query Kapso or Convex here
    // For now, return empty array (inbox was built in Phase 2.5 but may not be fully integrated)
    return NextResponse.json({ data: [] })
  } catch (error) {
    console.error('GET /api/messages/[conversationId] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', data: [] },
      { status: 500 }
    )
  }
}
