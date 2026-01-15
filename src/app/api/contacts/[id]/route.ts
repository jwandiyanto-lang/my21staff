import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import type { Contact } from '@/types/database'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH /api/contacts/[id] - Update a contact
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { lead_status, lead_score, tags, name, email } = body

    // Validate lead_status if provided
    if (lead_status !== undefined && !LEAD_STATUSES.includes(lead_status as LeadStatus)) {
      return NextResponse.json(
        { error: `Invalid lead_status. Must be one of: ${LEAD_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate lead_score if provided
    if (lead_score !== undefined) {
      const score = Number(lead_score)
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'lead_score must be a number between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Validate tags if provided
    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'tags must be an array of strings' },
        { status: 400 }
      )
    }

    if (isDevMode()) {
      // Dev mode: return mock updated contact
      const now = new Date().toISOString()
      const mockContact: Contact = {
        id,
        workspace_id: 'dev-workspace-001',
        phone: '+6281234567890',
        name: name ?? 'Dev Contact',
        email: email ?? null,
        lead_score: lead_score ?? 50,
        lead_status: lead_status ?? 'prospect',
        tags: tags ?? [],
        metadata: {},
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockContact)
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

    // Fetch existing contact
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', existingContact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to update this contact' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: now,
    }

    if (lead_status !== undefined) {
      updateData.lead_status = lead_status
    }
    if (lead_score !== undefined) {
      updateData.lead_score = Number(lead_score)
    }
    if (tags !== undefined) {
      updateData.tags = tags
    }
    if (name !== undefined) {
      updateData.name = name?.trim() || null
    }
    if (email !== undefined) {
      updateData.email = email?.trim() || null
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update contact error:', error)
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('PATCH /api/contacts/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/contacts/[id] - Get a single contact
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (isDevMode()) {
      // Dev mode: return mock contact
      const now = new Date().toISOString()
      const mockContact: Contact = {
        id,
        workspace_id: 'dev-workspace-001',
        phone: '+6281234567890',
        name: 'Dev Contact',
        email: 'dev@example.com',
        lead_score: 50,
        lead_status: 'prospect',
        tags: ['dev'],
        metadata: {},
        created_at: now,
        updated_at: now,
      }
      return NextResponse.json(mockContact)
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

    // Fetch contact
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this contact' },
        { status: 403 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('GET /api/contacts/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
