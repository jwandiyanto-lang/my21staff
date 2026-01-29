import { NextRequest, NextResponse } from 'next/server'
import { fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'

/**
 * POST /api/sync/kapso-history
 *
 * Syncs all Kapso message history into Convex.
 * Fetches all messages from Kapso API and imports them.
 *
 * Usage: node scripts/sync-kapso-history.js
 */
export async function POST(request: NextRequest) {
  const metrics = { start: performance.now() }

  try {
    const body = await request.json()
    const { workspace_id, messages } = body

    if (!workspace_id || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, messages (array)' },
        { status: 400 }
      )
    }

    console.log(`[Kapso Sync] Processing ${messages.length} messages for workspace ${workspace_id}`)

    let contactsCreated = 0
    let conversationsCreated = 0
    let messagesImported = 0
    let errors = 0

    // Process each message
    for (const msg of messages) {
      // Skip if message doesn't have required fields
      if (!msg.id || !msg.direction || !msg.timestamp) {
        errors++
        continue
      }

      const phone = msg.from || msg.to
      if (!phone) {
        errors++
        continue
      }

      try {
        // 1. Get or create contact
        const contactResult = await fetchMutation(
          api.contacts.findOrCreateByPhone,
          {
            workspace_id: workspace_id,
            phone: phone,
            name: msg.contact_name,
            kapso_name: msg.contact_name,
          }
        )

        if (!contactResult.success) {
          errors++
          continue
        }

        const contactId = contactResult.data?._id

        // 2. Get or create conversation
        const conversationResult = await fetchMutation(
          api.conversations.findOrCreate,
          {
            workspace_id: workspace_id,
            contact_id: contactId,
          }
        )

        if (!conversationResult.success) {
          errors++
          continue
        }

        const conversationId = conversationResult.data?._id

        // 3. Create message
        const content = msg.text || msg.content || ''
        const messageType = msg.type || 'text'
        const mediaUrl = msg.media_url
        const kapsoMessageId = msg.id
        const createdAt = msg.timestamp ? Math.floor(msg.timestamp / 1000) : Date.now()

        const messageResult = await fetchMutation(
          api.messages.create,
          {
            conversation_id: conversationId,
            workspace_id: workspace_id,
            direction: msg.direction === 'inbound' ? 'inbound' : 'outbound',
            sender_type: msg.direction === 'inbound' ? 'contact' : 'bot',
            sender_id: msg.from || msg.to,
            content,
            message_type: messageType,
            media_url: mediaUrl,
            kapso_message_id: kapsoMessageId,
            metadata: msg.metadata,
            created_at: createdAt,
          }
        )

        if (messageResult.success) {
          messagesImported++
        } else {
          errors++
        }
      } catch (error) {
        console.error(`[Kapso Sync] Error processing message ${msg.id}:`, error)
        errors++
      }
    }

    const duration = Math.round(performance.now() - metrics.start)

    console.log(`[Kapso Sync] Complete: ${messagesImported} imported, ${contactsCreated} contacts, ${conversationsCreated} conversations, ${errors} errors (${duration}ms)`)

    return NextResponse.json({
      success: true,
      imported: messagesImported,
      contactsCreated,
      conversationsCreated,
      errors,
      metrics: { duration_ms: duration }
    })

  } catch (error) {
    console.error('[Kapso Sync] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
