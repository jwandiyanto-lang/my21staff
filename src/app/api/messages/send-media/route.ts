import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMediaMessage } from '@/lib/kapso/client'
import type { KapsoCredentials } from '@/lib/kapso/client'
import type { Conversation, Contact, Workspace } from '@/types/database'
import { rateLimitByUser } from '@/lib/rate-limit'

interface WorkspaceSettings {
  kapso_api_key?: string
}

type MediaType = 'image' | 'video' | 'document' | 'audio'

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'document'
}

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string
    const caption = formData.get('caption') as string | null

    // Validate input
    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: file and conversationId' },
        { status: 400 }
      )
    }

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 16MB' },
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

    // Rate limit: 10 media messages per minute per user
    const rateLimitResponse = rateLimitByUser(user.id, 'messages/send-media', { limit: 10, windowMs: 60 * 1000 })
    if (rateLimitResponse) return rateLimitResponse

    // Fetch conversation to get workspace_id and contact_id
    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .select('id, workspace_id, contact_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conversation = conversationData as Pick<Conversation, 'id' | 'workspace_id' | 'contact_id'>

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

    // Fetch contact phone
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('phone')
      .eq('id', conversation.contact_id)
      .single()

    if (contactError || !contactData) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const contact = contactData as Pick<Contact, 'phone'>

    // Fetch workspace for Kapso credentials
    const { data: workspaceData, error: wsError } = await supabase
      .from('workspaces')
      .select('kapso_phone_id, settings')
      .eq('id', conversation.workspace_id)
      .single()

    if (wsError || !workspaceData) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const workspace = workspaceData as Pick<Workspace, 'kapso_phone_id' | 'settings'>

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${conversation.workspace_id}/${conversationId}/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(uploadData.path)

    const mediaUrl = urlData.publicUrl
    const mediaType = getMediaType(file.type)
    const contactPhone = contact.phone
    let kapsoMessageId: string | null = null

    // Send via Kapso (unless dev mode)
    if (isDevMode()) {
      kapsoMessageId = `mock-media-${Date.now()}`
      console.log(`[DEV MODE] Skipping Kapso media send. Mock ID: ${kapsoMessageId}`)
    } else {
      const settings = workspace.settings as WorkspaceSettings | null
      const apiKey = settings?.kapso_api_key
      const phoneId = workspace.kapso_phone_id

      if (!apiKey || !phoneId) {
        return NextResponse.json(
          { error: 'WhatsApp credentials not configured' },
          { status: 500 }
        )
      }

      const credentials: KapsoCredentials = { apiKey, phoneId }

      try {
        const kapsoResponse = await sendMediaMessage(
          credentials,
          contactPhone,
          mediaUrl,
          mediaType,
          caption || undefined,
          file.name
        )
        kapsoMessageId = kapsoResponse.messages[0]?.id || null
      } catch (kapsoError) {
        console.error('Kapso send error:', kapsoError)
        return NextResponse.json(
          { error: 'Failed to send WhatsApp media message' },
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
        content: caption?.trim() || null,
        message_type: mediaType,
        media_url: mediaUrl,
        kapso_message_id: kapsoMessageId,
        metadata: { filename: file.name, size: file.size, mimeType: file.type },
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
    const preview = caption?.trim() || `[${mediaType}]`
    await supabase
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: preview.substring(0, 100),
        updated_at: now,
      })
      .eq('id', conversationId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send media error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
