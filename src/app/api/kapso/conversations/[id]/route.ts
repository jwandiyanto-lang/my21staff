// API route: Get Kapso conversation and messages
// GET /api/kapso/conversations/[id]?workspace={workspaceId}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { convexQuery } from '@/lib/convex-client'
import { api } from 'convex/_generated/api'
import { createKapsoClient } from '@/lib/kapso-client'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // In dev mode, return mock messages
    if (isDevMode()) {
      const messages = MOCK_MESSAGES
        .filter((m) => m.conversation_id === id)
        .map((m) => ({
          id: m.id,
          conversationId: m.conversation_id,
          content: m.content,
          direction: m.direction,
          timestamp: m.created_at,
          messageType: m.message_type,
          mediaUrl: m.media_url,
          senderType: m.sender_type,
          senderId: m.sender_id,
          status: 'sent' as const,
        }))

      return NextResponse.json({
        conversation: {
          id,
          phone: '+62 xxx xxxx xxxx',
          contactName: 'Demo Contact',
          kapso_name: 'Demo Contact',
          lastMessageAt: new Date().toISOString(),
          status: 'open',
          unreadCount: 0,
        },
        messages,
      })
    }

    // Verify auth in production
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace ID from query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Fetch workspace settings with Kapso credentials
    const workspace = await convexQuery(api.workspaces.getForKapso, {
      workspaceId,
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get Kapso client from workspace settings
    const kapsoClient = createKapsoClient({
      kapso_api_key: workspace.settings?.kapso_api_key,
      projectId: workspaceId,
    })

    if (!kapsoClient) {
      return NextResponse.json({ error: 'Kapso not configured' }, { status: 400 })
    }

    // Fetch conversation details
    const conversation = await kapsoClient.getConversation(id)

    // Fetch messages for the conversation
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined

    const messages = await kapsoClient.getMessages(id, { limit })

    return NextResponse.json({ conversation, messages })
  } catch (error) {
    console.error('Error fetching Kapso conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
