import { NextRequest } from 'next/server'
import Papa from 'papaparse'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace')

  if (!workspaceId) {
    return new Response('Missing workspace parameter', { status: 400 })
  }

  // Verify workspace membership
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof Response) {
    return authResult
  }

  const supabase = await createClient()

  // Fetch all notes with contact names
  const { data: notes, error } = await supabase
    .from('contact_notes')
    .select(`
      content,
      note_type,
      due_date,
      completed_at,
      created_at,
      contacts!inner(name, phone)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    return new Response('Failed to fetch notes', { status: 500 })
  }

  // Transform data for CSV
  const csvData = (notes || []).map(note => {
    const contact = note.contacts as unknown as { name: string | null; phone: string }
    return {
      contact_name: contact.name || contact.phone,
      contact_phone: contact.phone,
      content: note.content,
      note_type: note.note_type,
      due_date: note.due_date || '',
      completed_at: note.completed_at || '',
      created_at: note.created_at,
    }
  })

  // Generate CSV
  const csv = Papa.unparse(csvData)
  const timestamp = Date.now()

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="notes-${timestamp}.csv"`,
    },
  })
}
