// GET /api/whatsapp/messages/[id]?workspace={workspaceId}

import { NextResponse } from 'next/server'
import { createWhatsAppClient, getWhatsAppConfig } from '@/lib/whatsapp-client'
import { isDevMode, getMockMessages } from '@/lib/mock-whatsapp-data'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params

  // Dev mode: return mock messages
  if (isDevMode()) {
    const messages = getMockMessages(conversationId)
    return NextResponse.json({ messages, reactionMap: {} })
  }

  // Production: fetch from Kapso
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspace ID' }, { status: 400 })
    }

    const config = await getWhatsAppConfig(workspaceId)
    const client = createWhatsAppClient(config)

    const result = await client.messages.listByConversation({
      phoneNumberId: config.phoneNumberId,
      conversationId,
      limit: 100,
    })

    // Transform to match whatsapp-cloud-inbox format
    return NextResponse.json({ messages: result.data, reactionMap: {} })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
