// API route: Send message via Kapso
// POST /api/kapso/send

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { toast } from 'sonner'
import { createKapsoClient } from '@/lib/kapso-client'
import { isDevMode } from '@/lib/mock-data'
import type { Id } from 'convex/_generated/dataModel'

interface SendRequestBody {
  workspace_id: string
  conversation_id: string
  content: string
  sender_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendRequestBody = await request.json()

    // Validate required fields
    if (!body.workspace_id || !body.conversation_id || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In dev mode, simulate sending
    if (isDevMode()) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return NextResponse.json({
        message: {
          _id: `mock-msg-${Date.now()}`,
          conversation_id: body.conversation_id,
          workspace_id: body.workspace_id,
          direction: 'outbound',
          sender_type: 'user',
          sender_id: body.sender_id,
          content: body.content,
          message_type: 'text',
          created_at: Date.now(),
          isOptimistic: false,
        },
        success: true,
      })
    }

    // Verify auth in production
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify sender ID matches authenticated user
    if (userId !== body.sender_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Import convexQuery dynamically to avoid Edge runtime issues
    const { convexQuery } = await import('@/lib/convex-client')
    const { api } = await import('convex/_generated/api')

    // Fetch workspace settings with Kapso credentials
    const workspace = await convexQuery(api.workspaces.getForKapso, {
      workspaceId: body.workspace_id,
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get Kapso client from workspace settings
    const kapsoClient = createKapsoClient({
      kapso_api_key: workspace.settings?.kapso_api_key,
      projectId: body.workspace_id,
    })

    if (!kapsoClient) {
      return NextResponse.json({ error: 'Kapso not configured' }, { status: 400 })
    }

    // Send message via Kapso
    const result = await kapsoClient.sendTextMessage(
      body.conversation_id,
      body.content
    )

    // Return the message in Convex format for consistency
    return NextResponse.json({
      message: {
        _id: result.messageId,
        conversation_id: body.conversation_id,
        workspace_id: body.workspace_id,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: body.sender_id,
        content: body.content,
        message_type: 'text',
        created_at: new Date(result.timestamp).getTime(),
        status: result.status,
      },
      success: true,
    })
  } catch (error) {
    console.error('Error sending Kapso message:', error)
    return NextResponse.json(
      {
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
