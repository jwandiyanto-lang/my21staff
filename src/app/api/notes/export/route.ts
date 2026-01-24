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
    // Get all contacts for workspace first
    const contacts = await convex.query(api.contacts.listByWorkspaceInternal, {
      workspace_id: workspaceId
    })

    // Get notes for each contact
    const allNotes: Array<{
      contact_name: string
      contact_phone: string
      content: string
      created_at: string
    }> = []

    for (const contact of contacts) {
      const notes = await convex.query(api.contacts.getNotes, { contact_id: contact._id })

      for (const note of notes) {
        allNotes.push({
          contact_name: contact.name || contact.phone || '',
          contact_phone: contact.phone || '',
          content: note.content,
          created_at: new Date(note.created_at).toISOString(),
        })
      }
    }

    // Convert to CSV
    const headers = ['contact_name', 'contact_phone', 'content', 'created_at']
    const csvRows = [headers.join(',')]

    for (const note of allNotes) {
      const row = [
        note.contact_name,
        note.contact_phone,
        note.content,
        note.created_at
      ].map(v => `"${v.replace(/"/g, '""')}"`)
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    const timestamp = Date.now()

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="notes-${timestamp}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export notes' }, { status: 500 })
  }
}
