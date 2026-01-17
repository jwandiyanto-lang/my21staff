import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireWorkspaceMembership } from '@/lib/auth/workspace-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const { assigned_to } = await request.json()

    const supabase = await createClient()

    // Fetch conversation to get workspace_id
    const { data: conversation } = await supabase
      .from('conversations')
      .select('workspace_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify workspace access
    const authResult = await requireWorkspaceMembership(conversation.workspace_id)
    if (authResult instanceof NextResponse) return authResult

    // Update the conversation's assigned_to field
    const { error } = await supabase
      .from('conversations')
      .update({ assigned_to: assigned_to || null })
      .eq('id', conversationId)

    if (error) {
      console.error('Failed to update assignment:', error)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, assigned_to })
  } catch (error) {
    console.error('Assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
