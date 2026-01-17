import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const workspaceId = searchParams.get('workspace')
  const page = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace required' }, { status: 400 })
  }

  // Verify membership
  const authResult = await requireWorkspaceMembership(workspaceId)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const from = page * limit
  const to = from + limit - 1

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*, contact:contacts(*)')
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversations })
}
