// API route: Search and get Kapso contacts
// GET /api/kapso/contacts?q={query}&workspace={workspaceId}
// GET /api/kapso/contacts/{identifier}?workspace={workspaceId}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { convexQuery } from '@/lib/convex-client'
import { api } from 'convex/_generated/api'
import { createKapsoClient } from '@/lib/kapso-client'
import { isDevMode, MOCK_CONTACTS } from '@/lib/mock-data'

// Search contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const workspaceId = searchParams.get('workspace')
    const identifier = searchParams.get('identifier')

    // In dev mode, search mock contacts
    if (isDevMode()) {
      if (identifier) {
        // Get specific contact context
        const contact = MOCK_CONTACTS.find(
          (c) => c.phone === identifier || c.id === identifier
        )

        if (!contact) {
          return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }

        return NextResponse.json({
          contact: {
            id: contact.id,
            phone: contact.phone,
            name: contact.name,
            kapso_name: contact.kapso_name,
            email: contact.email,
            leadStatus: contact.lead_status,
            leadScore: contact.lead_score,
            tags: contact.tags,
            assignedTo: contact.assigned_to,
            metadata: contact.metadata,
            kapsoIsOnline: contact.kapso_is_online,
            kapsoLastSeen: contact.kapso_last_seen,
            kapsoProfilePic: contact.kapso_profile_pic,
          },
          recentMessages: [],
          tags: contact.tags || [],
          leadScore: contact.lead_score || 0,
          lastActivity: contact.updated_at || contact.created_at,
        })
      } else if (query) {
        // Search contacts
        const lowerQuery = query.toLowerCase()
        const contacts = MOCK_CONTACTS.filter(
          (c) =>
            c.name?.toLowerCase().includes(lowerQuery) ||
            c.kapso_name?.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(query)
        )

        return NextResponse.json({
          contacts: contacts.map((c) => ({
            id: c.id,
            phone: c.phone,
            name: c.name,
            kapso_name: c.kapso_name,
            email: c.email,
            leadStatus: c.lead_status,
            leadScore: c.lead_score,
            tags: c.tags,
            assignedTo: c.assigned_to,
            metadata: c.metadata,
          })),
        })
      }

      return NextResponse.json({ contacts: [] })
    }

    // Verify auth in production
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Fetch workspace settings with Kapso credentials
    const workspace = await convexQuery(api.workspaces.getForKapso, {
      workspaceId,
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get Kapso client from workspace settings
    const kapsoClient = createKapsoClient({
      kapso_api_key: workspace.settings?.kapso_api_key,
      projectId: workspaceId,
    })

    if (!kapsoClient) {
      return NextResponse.json({ error: 'Kapso not configured' }, { status: 400 })
    }

    if (identifier) {
      // Get contact context
      const context = await kapsoClient.getContactContext(identifier)
      return NextResponse.json(context)
    } else if (query) {
      // Search contacts
      const contacts = await kapsoClient.searchContacts(query)
      return NextResponse.json({ contacts })
    }

    return NextResponse.json({ error: 'Query or identifier required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching Kapso contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
