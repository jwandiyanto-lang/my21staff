import { NextRequest } from 'next/server'
import Papa from 'papaparse'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/permissions/check'

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

  // Check export permission - owners and admins only
  const permError = requirePermission(
    authResult.role,
    'leads:export',
    'Only workspace owners and admins can export data'
  )
  if (permError) return permError

  const supabase = await createClient()

  // Fetch all contacts for the workspace
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('name, phone, email, lead_status, lead_score, tags, assigned_to, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
    return new Response('Failed to fetch contacts', { status: 500 })
  }

  // Transform data for CSV (convert tags array to comma-separated string)
  const csvData = (contacts || []).map(contact => ({
    name: contact.name || '',
    phone: contact.phone,
    email: contact.email || '',
    lead_status: contact.lead_status,
    lead_score: contact.lead_score,
    tags: (contact.tags || []).join(', '),
    assigned_to: contact.assigned_to || '',
    created_at: contact.created_at,
  }))

  // Generate CSV
  const csv = Papa.unparse(csvData)
  const timestamp = Date.now()

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${timestamp}.csv"`,
    },
  })
}
