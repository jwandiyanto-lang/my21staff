// API route: List Kapso conversations
// GET /api/kapso/conversations?workspace={workspaceId}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { convexQuery } from '@/lib/convex-client'
import { api } from 'convex/_generated/api'
import { createKapsoClient } from '@/lib/kapso-client'
import { isDevMode } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    // In dev mode, return mock conversations
    if (isDevMode()) {
      const { MOCK_CONVERSATIONS } = await import('@/lib/mock-data')

      const conversations = MOCK_CONVERSATIONS.map((conv) => ({
        id: conv.id,
        phone: conv.contact?.phone || '+62 xxx xxxx xxxx',
        contactName: conv.contact?.name,
        kapso_name: conv.contact?.kapso_name,
        lastMessageAt: conv.last_message_at || new Date().toISOString(),
        lastMessagePreview: conv.last_message_preview,
        status: conv.status as 'active' | 'ended' | 'open' | 'handover' | 'closed',
        unreadCount: conv.unread_count || 0,
        assignedTo: conv.assigned_to,
        tags: conv.contact?.tags || [],
        leadStatus: conv.contact?.lead_status || 'prospect',
      }))

      return NextResponse.json({ conversations })
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
      projectId: workspaceId, // Use workspace ID as project ID
    })

    if (!kapsoClient) {
      return NextResponse.json({ error: 'Kapso not configured' }, { status: 400 })
    }

    // Fetch conversations from Kapso
    const status = searchParams.get('status') as 'active' | 'ended' | undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined

    const conversations = await kapsoClient.listConversations({
      status,
      limit,
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching Kapso conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
