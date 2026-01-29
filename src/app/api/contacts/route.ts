import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  withTiming,
  createRequestMetrics,
  logQuery,
  logQuerySummary,
} from '@/lib/instrumentation/with-timing'
import { MOCK_CONTACTS } from '@/lib/mock-data'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// GET /api/contacts - Get paginated contacts for a workspace
export async function GET(request: NextRequest) {
  const metrics = createRequestMetrics()

  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search')?.toLowerCase()

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace required' }, { status: 400 })
    }

    if (isDevMode()) {
      // Dev mode: return mock contacts with search filter
      let filteredContacts = MOCK_CONTACTS
      if (search) {
        filteredContacts = MOCK_CONTACTS.filter(contact =>
          contact.name?.toLowerCase().includes(search) ||
          contact.phone?.toLowerCase().includes(search) ||
          contact.email?.toLowerCase().includes(search)
        )
      }
      // Map _id to id for consistency
      const contactsWithId = filteredContacts.slice(0, limit).map(contact => ({
        ...contact,
        id: contact._id,
      }))
      return NextResponse.json({ contacts: contactsWithId, total: filteredContacts.length })
    }

    // Verify authentication via Clerk
    const { userId, orgId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch workspace from Convex
    let queryStart = performance.now()
    const workspace = await fetchQuery(api.workspaces.getById, {
      id: workspaceId,
    })
    logQuery(metrics, 'convex.workspaces.getById', Math.round(performance.now() - queryStart))

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get all contacts for this workspace using internal query (auth handled above)
    // Pass high limit to fetch all contacts - pagination is done in this API layer
    // @ts-ignore - workspace_id is Id type
    let contacts = await fetchQuery(api.contacts.listByWorkspaceInternal, {
      workspace_id: workspace._id as any,
      limit: 10000, // Fetch all contacts, paginate in API layer
    })

    // Apply search filter if provided
    if (search) {
      contacts = contacts.filter((contact: any) =>
        contact.name?.toLowerCase().includes(search) ||
        contact.phone?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search)
      )
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedContacts = contacts.slice(from, to)

    // Map Convex _id to id for frontend compatibility
    const contactsWithId = paginatedContacts.map((contact: any) => ({
      ...contact,
      id: contact._id,
    }))

    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json({ contacts: contactsWithId, total: contacts.length })
  } catch (error) {
    console.error('GET /api/contacts error:', error)
    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts?id=xxx&workspace=yyy - Delete a contact (owner only)
export async function DELETE(request: NextRequest) {
  const metrics = createRequestMetrics()

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')
    const workspaceId = searchParams.get('workspace')

    if (!contactId || !workspaceId) {
      return NextResponse.json(
        { error: 'Contact ID and workspace ID required' },
        { status: 400 }
      )
    }

    // Verify authentication via Clerk
    const { userId, orgRole } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - delete requires owner/admin
    // orgRole from Clerk: 'org:admin' or 'org:member'
    if (orgRole !== 'org:admin') {
      return NextResponse.json(
        { error: 'Only workspace owners can delete leads' },
        { status: 403 }
      )
    }

    // Delete contact via Convex mutation
    let mutStart = performance.now()
    await fetchMutation(api.mutations.deleteContact, {
      contact_id: contactId,
      workspace_id: workspaceId,
    })
    logQuery(metrics, 'convex.contacts.deleteContact', Math.round(performance.now() - mutStart))

    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/contacts error:', error)
    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with timing instrumentation
export const GET_TIMED = withTiming('/api/contacts', GET)
export const DELETE_TIMED = withTiming('/api/contacts', DELETE)
