import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const { assigned_to } = await request.json()

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
