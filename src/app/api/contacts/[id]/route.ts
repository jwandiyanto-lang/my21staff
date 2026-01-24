import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { validateBody } from '@/lib/validations'
import { updateContactSchema } from '@/lib/validations/contact'
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

    // Validate input with Zod
    const validationResult = await validateBody(request, updateContactSchema)
    if (validationResult instanceof NextResponse) return validationResult

    const { lead_status, lead_score, tags, name, email, phone, assigned_to } = validationResult

    if (isDevMode()) {
      // Dev mode: return mock updated contact
      const now = new Date().toISOString()
      const mockContact: Contact = {
        id,
        workspace_id: 'dev-workspace-001',
        phone: '+6281234567890',
        phone_normalized: '+6281234567890',
        name: name ?? 'Dev Contact',
        email: email ?? null,
        lead_score: lead_score ?? 50,
        lead_status: lead_status ?? 'prospect',
        tags: tags ?? [],
        assigned_to: null,
        metadata: {},
        created_at: now,
        updated_at: now,
        cache_updated_at: null,
        kapso_is_online: null,
        kapso_last_seen: null,
        kapso_name: null,
        kapso_profile_pic: null,
      }
      return NextResponse.json(mockContact)
    }

    // Verify authentication via Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}

    if (lead_status !== undefined) updates.lead_status = lead_status
    if (lead_score !== undefined) updates.lead_score = Number(lead_score)
    if (tags !== undefined) updates.tags = tags
    if (name !== undefined) updates.name = name?.trim() || null
    if (email !== undefined) updates.email = email?.trim() || null
    if (phone !== undefined) updates.phone = phone?.trim() || null
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null

    // Update contact via Convex (internal mutation - API handles auth)
    const contact = await fetchMutation(api.mutations.updateContactInternal, {
      contact_id: id,
      updates,
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
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
        phone_normalized: '+6281234567890',
        name: 'Dev Contact',
        email: 'dev@example.com',
        lead_score: 50,
        lead_status: 'prospect',
        tags: ['dev'],
        assigned_to: null,
        metadata: {},
        created_at: now,
        updated_at: now,
        cache_updated_at: null,
        kapso_is_online: null,
        kapso_last_seen: null,
        kapso_name: null,
        kapso_profile_pic: null,
      }
      return NextResponse.json(mockContact)
    }

    // Verify authentication via Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch contact from Convex
    const contact = await fetchQuery(api.contacts.getByIdInternal, {
      contact_id: id,
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
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

    // Verify authentication via Clerk
    const { userId, orgRole } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - delete requires owner/admin
    if (orgRole !== 'org:admin') {
      return NextResponse.json(
        { error: 'Only workspace owners can delete contacts' },
        { status: 403 }
      )
    }

    // Delete contact via Convex (cascades to conversations, messages, notes)
    await fetchMutation(api.mutations.deleteContactCascade, {
      contact_id: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/contacts/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
