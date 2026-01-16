import { NextRequest, NextResponse } from 'next/server'
import { createClient, createApiAdminClient } from '@/lib/supabase/server'
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
    const { lead_status, lead_score, tags, name, email, phone } = body

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
        assigned_to: null,
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
    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null
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
        assigned_to: null,
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

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    if (isDevMode()) {
      // Dev mode: simulate deletion
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch contact to verify it exists and get workspace_id
    const { data: contact, error: fetchError } = await adminClient
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
    const { data: membership } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to delete this contact' },
        { status: 403 }
      )
    }

    // Delete associated conversations first (this will cascade to messages due to FK)
    const { error: convDeleteError } = await adminClient
      .from('conversations')
      .delete()
      .eq('contact_id', id)

    if (convDeleteError) {
      console.error('Error deleting conversations:', convDeleteError)
      // Continue anyway - we'll try to delete the contact
    }

    // Delete contact notes
    const { error: notesDeleteError } = await adminClient
      .from('contact_notes')
      .delete()
      .eq('contact_id', id)

    if (notesDeleteError) {
      console.error('Error deleting contact notes:', notesDeleteError)
      // Continue anyway
    }

    // Delete the contact
    const { error: deleteError } = await adminClient
      .from('contacts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting contact:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      )
    }

    console.log(`[Delete] Successfully deleted contact ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/contacts/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
