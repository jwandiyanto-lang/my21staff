import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { sendMediaMessage } from '@/lib/kapso/client'
import type { KapsoCredentials } from '@/lib/kapso/client'
import { safeDecrypt } from '@/lib/crypto'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string
    const workspaceId = formData.get('workspaceId') as string
    const caption = formData.get('caption') as string | null

    // Validate input
    if (!file || !conversationId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, conversationId, and workspaceId' },
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

    // Get conversation from Convex
    const conversation = await convex.query(api.conversations.getById, {
      conversation_id: conversationId,
      workspace_id: workspaceId,
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get workspace to get Kapso credentials
    const workspace = await convex.query(api.workspaces.getById, {
      id: (conversation as any).workspace_id,
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Get contact phone
    const contact = await convex.query(api.contacts.getById, {
      id: (conversation as any).contact_id,
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Upload file to Supabase Storage (file storage remains on Supabase for now)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${(workspace as any)._id}/${conversationId}/${Date.now()}.${fileExt}`
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
    const contactPhone = (contact as any).phone
    let kapsoMessageId: string | null = null

    // Send via Kapso (unless dev mode)
    if (isDevMode()) {
      kapsoMessageId = `mock-media-${Date.now()}`
      console.log(`[DEV MODE] Skipping Kapso media send. Mock ID: ${kapsoMessageId}`)
    } else {
      const settings = (workspace as any).settings as { kapso_api_key?: string } | null
      const encryptedKey = settings?.kapso_api_key
      const phoneId = (workspace as any).kapso_phone_id

      if (!encryptedKey || !phoneId) {
        return NextResponse.json(
          { error: 'WhatsApp credentials not configured' },
          { status: 500 }
        )
      }

      // Decrypt API key
      const apiKey = safeDecrypt(encryptedKey)
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

    // Create message in Convex
    const messageId = await convex.mutation(api.mutations.createOutboundMessage, {
      workspace_id: workspaceId,
      conversation_id: conversationId,
      sender_id: userId,
      content: caption?.trim() || `[${mediaType}]`,
      message_type: mediaType,
      media_url: mediaUrl,
      kapso_message_id: kapsoMessageId,
    })

    return NextResponse.json({
      success: true,
      messageId,
    })
  } catch (error) {
    console.error('Send media error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
