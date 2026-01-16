import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark conversation as read by setting unread_count to 0
    const { data, error } = await supabase
      .from('conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error marking conversation as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark conversation as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, conversation: data })
  } catch (error) {
    console.error('Error in mark-as-read API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
