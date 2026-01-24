import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace')

  if (!workspaceId) {
    return new Response('Missing workspace parameter', { status: 400 })
  }

  try {
    const contacts = await convex.query(api.contacts.listByWorkspaceInternal, {
      workspace_id: workspaceId
    })

    // Convert to CSV
    const headers = ['name', 'phone', 'email', 'lead_status', 'lead_score', 'tags', 'assigned_to', 'created_at']
    const csvRows = [headers.join(',')]

    for (const contact of contacts) {
      const row = [
        contact.name || '',
        contact.phone || '',
        contact.email || '',
        contact.lead_status || 'new',
        contact.lead_score?.toString() || '0',
        (contact.tags || []).join(';'),
        contact.assigned_to || '',
        new Date(contact.created_at).toISOString()
      ].map(v => `"${v.replace(/"/g, '""')}"`)
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    const timestamp = Date.now()

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${timestamp}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export contacts' }, { status: 500 })
  }
}
