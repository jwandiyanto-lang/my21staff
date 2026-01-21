import { NextRequest, NextResponse } from 'next/server'
import { createApiAdminClient } from '@/lib/supabase/server'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'

/**
 * GET /api/contacts/by-phone?phone=628xxx&workspace_id=xxx
 *
 * Contact lookup API for Kapso bot integration.
 * Returns contact info with CRM context for AI personalization.
 *
 * Authentication: X-API-Key header with CRM_API_KEY secret
 */
async function getHandler(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.CRM_API_KEY

    if (!expectedKey) {
      console.error('[ContactLookup] CRM_API_KEY not configured')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const workspaceId = searchParams.get('workspace_id')

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing phone parameter' },
        { status: 400 }
      )
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspace_id parameter' },
        { status: 400 }
      )
    }

    // Normalize phone (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '')

    const supabase = createApiAdminClient()
    const metrics = createRequestMetrics()

    // Look up contact by phone
    let queryStart = performance.now()
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        phone,
        email,
        lead_status,
        lead_score,
        tags,
        metadata,
        created_at
      `)
      .eq('workspace_id', workspaceId)
      .eq('phone', normalizedPhone)
      .single()
    logQuery(metrics, 'contacts', Math.round(performance.now() - queryStart))

    if (contactError || !contact) {
      // Contact not found - return empty context
      return NextResponse.json({
        found: false,
        context: null,
      })
    }

    // Get contact notes (team notes)
    queryStart = performance.now()
    const { data: notes } = await supabase
      .from('contact_notes')
      .select('content, created_at')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false })
      .limit(5)
    logQuery(metrics, 'contact_notes', Math.round(performance.now() - queryStart))

    // Get recent conversation history
    queryStart = performance.now()
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, last_message_preview, last_message_at')
      .eq('contact_id', contact.id)
      .single()
    logQuery(metrics, 'conversations', Math.round(performance.now() - queryStart))

    let recentMessages: { content: string; direction: string; created_at: string }[] = []
    if (conversation) {
      queryStart = performance.now()
      const { data: messages } = await supabase
        .from('messages')
        .select('content, direction, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10)
      logQuery(metrics, 'messages', Math.round(performance.now() - queryStart))

      // Filter out null values and map to correct type
      recentMessages = (messages || [])
        .filter(m => m.content && m.created_at)
        .map(m => ({
          content: m.content!,
          direction: m.direction,
          created_at: m.created_at!,
        }))
    }

    // Build CRM context for AI
    const crmContext = {
      found: true,
      contact: {
        name: contact.name,
        lead_status: contact.lead_status,
        lead_score: contact.lead_score,
        tags: contact.tags,
        is_returning: !!conversation?.last_message_at,
        first_contact_date: contact.created_at,
      },
      notes: (notes || []).map(n => n.content),
      conversation_summary: recentMessages.length > 0
        ? summarizeConversation(recentMessages)
        : null,
      last_interaction: conversation?.last_message_at || null,
    }

    // Log query summary before returning
    logQuerySummary('/api/contacts/by-phone', metrics)

    return NextResponse.json(crmContext)
  } catch (error) {
    console.error('[ContactLookup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Summarize recent conversation for AI context
 */
function summarizeConversation(
  messages: { content: string; direction: string; created_at: string }[]
): string {
  // Get topics discussed from recent messages
  const topics: string[] = []

  for (const msg of messages) {
    const content = msg.content.toLowerCase()

    // Detect common education topics
    if (content.includes('australia') || content.includes('aussie')) {
      topics.push('Australia')
    }
    if (content.includes('uk') || content.includes('inggris') || content.includes('england')) {
      topics.push('UK')
    }
    if (content.includes('kanada') || content.includes('canada')) {
      topics.push('Canada')
    }
    if (content.includes('beasiswa') || content.includes('scholarship')) {
      topics.push('Scholarship')
    }
    if (content.includes('ielts') || content.includes('toefl')) {
      topics.push('English test')
    }
    if (content.includes('visa')) {
      topics.push('Visa')
    }
    if (content.includes('mba') || content.includes('master')) {
      topics.push('Postgraduate')
    }
    if (content.includes('s1') || content.includes('bachelor') || content.includes('undergraduate')) {
      topics.push('Undergraduate')
    }
  }

  // Deduplicate topics
  const uniqueTopics = [...new Set(topics)]

  if (uniqueTopics.length === 0) {
    return 'General inquiry'
  }

  return `Discussed: ${uniqueTopics.join(', ')}`
}

// Export wrapped handler with timing instrumentation
export const GET = withTiming('/api/contacts/by-phone', getHandler)
