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
      // Dev mode: return empty array for pagination
      return NextResponse.json({ contacts: [] })
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
    // @ts-ignore - workspace_id is Id type
    const contacts = await fetchQuery(api.contacts.listByWorkspaceInternal, {
      workspace_id: workspace._id as any,
    })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedContacts = contacts.slice(from, to)

    logQuerySummary('/api/contacts', metrics)
    return NextResponse.json({ contacts: paginatedContacts })
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
