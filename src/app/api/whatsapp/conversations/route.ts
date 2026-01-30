// GET /api/whatsapp/conversations?workspace={workspaceId}

import { NextResponse } from 'next/server'
import { createWhatsAppClient, getWhatsAppConfig } from '@/lib/whatsapp-client'
import { isDevMode, MOCK_WHATSAPP_CONVERSATIONS } from '@/lib/mock-whatsapp-data'

export async function GET(request: Request) {
  // Dev mode: return mock data
  if (isDevMode()) {
    return NextResponse.json({ conversations: MOCK_WHATSAPP_CONVERSATIONS })
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

    const result = await client.conversations.list({
      phoneNumberId: config.phoneNumberId,
      status: 'active',
      limit: 50,
    })

    return NextResponse.json({ conversations: result.data })
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
