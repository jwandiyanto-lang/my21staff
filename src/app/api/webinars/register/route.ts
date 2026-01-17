import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// Type assertion helper (until Supabase types are regenerated)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseClient = any

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

    // Normalize phone number - remove spaces and ensure it starts with +
    const normalizedPhone = phone.trim().replace(/\s+/g, '')

    if (isDevMode()) {
      // Dev mode: return mock success
      const now = new Date().toISOString()
      return NextResponse.json({
        success: true,
        registration_id: `reg-${Date.now()}`,
        contact_id: `contact-${Date.now()}`,
        is_new_contact: true,
        message: 'Registration successful (dev mode)',
        created_at: now,
      }, { status: 201 })
    }

    const supabase = await createClient()
    const client = supabase as unknown as DatabaseClient

    // Step 1: Validate webinar exists and is published
    const { data: webinar, error: webinarError } = await client
      .from('webinars')
      .select(`
        id,
        workspace_id,
        status,
        max_registrations,
        scheduled_at,
        webinar_registrations (count)
      `)
      .eq('id', webinar_id)
      .single()

    if (webinarError || !webinar) {
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
    if (new Date(webinar.scheduled_at) < new Date()) {
      return NextResponse.json(
        { error: 'This webinar has already ended' },
        { status: 400 }
      )
    }

    // Use workspace_id from webinar if not provided
    const actualWorkspaceId = workspace_id || webinar.workspace_id

    // Step 2: Check registration limit
    const currentRegistrations = webinar.webinar_registrations?.[0]?.count ?? 0
    if (webinar.max_registrations && currentRegistrations >= webinar.max_registrations) {
      return NextResponse.json(
        { error: 'This webinar is at full capacity' },
        { status: 400 }
      )
    }

    // Step 3: Check if contact exists by phone in workspace
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('workspace_id', actualWorkspaceId)
      .eq('phone', normalizedPhone)
      .single()

    let contactId: string
    let isNewContact = false

    if (existingContact) {
      // Contact exists - use existing contact_id
      contactId = existingContact.id

      // Optionally update name/email if they were empty
      const updates: Record<string, string> = {}
      if (!existingContact.name && name.trim()) {
        updates.name = name.trim()
      }
      if (!existingContact.email && email?.trim()) {
        updates.email = email.trim()
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('contacts')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactId)
      }
    } else {
      // Create new contact - THIS IS THE LEAD GENERATION!
      const now = new Date().toISOString()
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          workspace_id: actualWorkspaceId,
          phone: normalizedPhone,
          name: name.trim(),
          email: email?.trim() || null,
          lead_score: 50, // Default score for webinar registrations
          lead_status: 'new',
          tags: ['webinar-lead'],
          metadata: {
            source: 'webinar_registration',
            webinar_id: webinar_id,
          },
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        console.error('Create contact error:', contactError)
        return NextResponse.json(
          { error: 'Failed to create contact' },
          { status: 500 }
        )
      }

      contactId = newContact.id
      isNewContact = true
    }

    // Step 4: Check if already registered for this webinar
    const { data: existingRegistration } = await client
      .from('webinar_registrations')
      .select('id')
      .eq('webinar_id', webinar_id)
      .eq('contact_id', contactId)
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this webinar' },
        { status: 400 }
      )
    }

    // Step 5: Create webinar_registration record
    const now = new Date().toISOString()
    const { data: registration, error: regError } = await client
      .from('webinar_registrations')
      .insert({
        webinar_id: webinar_id,
        contact_id: contactId,
        workspace_id: actualWorkspaceId,
        registered_at: now,
        attended: false,
      })
      .select('id')
      .single()

    if (regError || !registration) {
      console.error('Create registration error:', regError)
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      registration_id: registration.id,
      contact_id: contactId,
      is_new_contact: isNewContact,
      message: 'Registration successful',
      created_at: now,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/webinars/register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
