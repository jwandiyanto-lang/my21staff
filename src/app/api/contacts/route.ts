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

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// Mock contacts for dev mode
const MOCK_CONTACTS = [
  {
    id: 'contact-001',
    workspace_id: 'dev-workspace-001',
    phone: '+6281234567890',
    phone_normalized: '+6281234567890',
    name: 'Budi Santoso',
    email: 'budi@gmail.com',
    lead_score: 85,
    lead_status: 'hot',
    tags: ['Student', 'Hot Lead'],
    assigned_to: 'dev-user-001',
    metadata: { source: 'Website' },
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
  },
  {
    id: 'contact-002',
    workspace_id: 'dev-workspace-001',
    phone: '+6282345678901',
    phone_normalized: '+6282345678901',
    name: 'Siti Rahayu',
    email: 'siti.rahayu@yahoo.com',
    lead_score: 60,
    lead_status: 'warm',
    tags: ['Parent', 'Follow Up'],
    assigned_to: null,
    metadata: { source: 'WhatsApp' },
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
  },
  {
    id: 'contact-003',
    workspace_id: 'dev-workspace-001',
    phone: '+6283456789012',
    phone_normalized: '+6283456789012',
    name: 'Ahmad Wijaya',
    email: null,
    lead_score: 40,
    lead_status: 'new',
    tags: ['Student'],
    assigned_to: null,
    metadata: { source: 'Facebook' },
    created_at: '2026-01-20T15:00:00Z',
    updated_at: '2026-01-20T15:00:00Z',
  },
  {
    id: 'contact-004',
    workspace_id: 'dev-workspace-001',
    phone: '+6284567890123',
    phone_normalized: '+6284567890123',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@gmail.com',
    lead_score: 75,
    lead_status: 'hot',
    tags: ['Hot Lead', 'Student'],
    assigned_to: 'dev-user-001',
    metadata: { source: 'Webinar' },
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-25T16:00:00Z',
  },
  {
    id: 'contact-005',
    workspace_id: 'dev-workspace-001',
    phone: '+6285678901234',
    phone_normalized: '+6285678901234',
    name: 'Rizky Pratama',
    email: 'rizky.p@outlook.com',
    lead_score: 20,
    lead_status: 'cold',
    tags: [],
    assigned_to: null,
    metadata: { source: 'Referral' },
    created_at: '2026-01-05T12:00:00Z',
    updated_at: '2026-01-05T12:00:00Z',
  },
]

// GET /api/contacts - Get paginated contacts for a workspace
export async function GET(request: NextRequest) {
  const metrics = createRequestMetrics()

  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace required' }, { status: 400 })
    }

    if (isDevMode()) {
      // Dev mode: return mock contacts
      return NextResponse.json({ contacts: MOCK_CONTACTS, total: MOCK_CONTACTS.length })
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
    const contacts = await fetchQuery(api.contacts.listByWorkspaceInternal, {
      workspace_id: workspace._id as any,
      limit: 10000, // Fetch all contacts, paginate in API layer
    })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedContacts = contacts.slice(from, to)

    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json({ contacts: paginatedContacts, total: contacts.length })
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
