import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/kapso/client'
import type { KapsoCredentials } from '@/lib/kapso/client'

interface SendMessageBody {
  conversationId: string
  content: string
}

interface WorkspaceSettings {
  kapso_api_key?: string
}

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageBody = await request.json()
    const { conversationId, content } = body

    // Validate input
    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId and content' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch conversation to get workspace_id and contact info
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        workspace_id,
        contact_id,
        contact:contacts!inner(phone)
      `)
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check user has access to this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', conversation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this conversation' },
        { status: 403 }
      )
    }

    // Fetch workspace for Kapso credentials
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('kapso_phone_id, settings')
      .eq('id', conversation.workspace_id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const contactPhone = (conversation.contact as { phone: string }).phone
    let kapsoMessageId: string | null = null

    // Send via Kapso (unless dev mode)
    if (isDevMode()) {
      // Dev mode: skip actual Kapso call, generate mock ID
      kapsoMessageId = `mock-${Date.now()}`
      console.log(`[DEV MODE] Skipping Kapso send. Mock ID: ${kapsoMessageId}`)
    } else {
      // Production: call Kapso API
      const settings = workspace.settings as WorkspaceSettings | null
      const apiKey = settings?.kapso_api_key
      const phoneId = workspace.kapso_phone_id

      if (!apiKey || !phoneId) {
        return NextResponse.json(
          { error: 'Workspace missing Kapso credentials' },
          { status: 500 }
        )
      }

      const credentials: KapsoCredentials = { apiKey, phoneId }

      try {
        const kapsoResponse = await sendMessage(credentials, contactPhone, content.trim())
        kapsoMessageId = kapsoResponse.messages[0]?.id || null
      } catch (kapsoError) {
        console.error('Kapso send error:', kapsoError)
        return NextResponse.json(
          { error: 'Failed to send message via Kapso' },
          { status: 500 }
        )
      }
    }

    // Insert message to database
    const now = new Date().toISOString()
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        workspace_id: conversation.workspace_id,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: user.id,
        content: content.trim(),
        message_type: 'text',
        kapso_message_id: kapsoMessageId,
        created_at: now,
      })
      .select()
      .single()

    if (insertError || !message) {
      console.error('Message insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Update conversation last_message_at and preview
    const preview = content.trim().substring(0, 100)
    await supabase
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: preview,
        updated_at: now,
      })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
