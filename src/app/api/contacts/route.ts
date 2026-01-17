import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

// GET /api/contacts - Get paginated contacts for a workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace required' }, { status: 400 })
    }

    if (isDevMode()) {
      // Dev mode: return empty array for pagination
      return NextResponse.json({ contacts: [] })
    }

    // Verify membership
    const authResult = await requireWorkspaceMembership(workspaceId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    const from = page * limit
    const to = from + limit - 1

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('GET /api/contacts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
