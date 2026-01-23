import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/webinars/register
 *
 * PUBLIC endpoint - no auth required.
 * This is the KEY lead generation endpoint.
 *
 * 1. Validates webinar exists and is published
 * 2. Checks if contact exists by phone in workspace
 *    - If not: CREATE new contact (lead generation!)
 * 3. Checks registration limit if max_registrations set
 * 4. Creates webinar_registration record
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute per IP
    const rateLimitResponse = rateLimit(request, { limit: 10, windowMs: 60 * 1000 })
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { webinar_id, workspace_id, name, phone, email } = body

    // Validate required fields
    if (!webinar_id) {
      return NextResponse.json(
        { error: 'webinar_id is required' },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }

    // Normalize phone number - remove spaces
    const normalizedPhone = phone.trim().replace(/\s+/g, '')

    // Step 1: Validate webinar exists and is published
    const webinar = await fetchQuery(api.cms.getWebinar, {
      webinarId: webinar_id as any,
    })

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      )
    }

    if (webinar.status !== 'published') {
      return NextResponse.json(
        { error: 'Webinar is not open for registration' },
        { status: 400 }
      )
    }

    // Check if webinar is in the past
    if (webinar.scheduled_at < Date.now()) {
      return NextResponse.json(
        { error: 'This webinar has already ended' },
        { status: 400 }
      )
    }

    // Use workspace_id from webinar if not provided
    const actualWorkspaceId = workspace_id || webinar.workspace_id

    // Step 2: Check registration limit
    if (webinar.max_registrations) {
      const currentRegistrations = await fetchQuery(api.cms.countWebinarRegistrations, {
        webinarId: webinar_id as any,
      })
      if (currentRegistrations >= webinar.max_registrations) {
        return NextResponse.json(
          { error: 'This webinar is at full capacity' },
          { status: 400 }
        )
      }
    }

    // Step 3: Find or create contact (PUBLIC mutation - no auth required)
    const contactId = await fetchMutation(api.cms.findOrCreateContact, {
      workspaceId: actualWorkspaceId as any,
      phone: normalizedPhone,
      name: name.trim(),
      email: email?.trim() || undefined,
    })

    // Check if this was a new contact (for response)
    const contact = await fetchQuery(api.contacts.getByPhone, {
      phone: normalizedPhone,
      workspace_id: actualWorkspaceId,
    })
    const isNewContact = contact ? (Date.now() - contact.created_at < 1000) : false

    // Step 4 & 5: Register for webinar (checks for duplicates internally)
    const registrationId = await fetchMutation(api.cms.registerForWebinar, {
      webinarId: webinar_id as any,
      contactId: contactId as any,
      workspaceId: actualWorkspaceId as any,
    })

    return NextResponse.json({
      success: true,
      registration_id: registrationId,
      contact_id: contactId,
      is_new_contact: isNewContact,
      message: 'Registration successful',
      created_at: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/webinars/register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
