import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const body = await request.json()
    const { ai_paused } = body

    if (typeof ai_paused !== 'boolean') {
      return NextResponse.json(
        { error: 'ai_paused must be a boolean' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update conversation status
    // Using 'handover' when AI is paused, 'open' when AI is active
    const newStatus = ai_paused ? 'handover' : 'open'

    const { data, error } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating handover status:', error)
      return NextResponse.json(
        { error: 'Failed to update handover status' },
        { status: 500 }
      )
    }

    // TODO: Call Kapso API to pause/resume AI workflow
    // This would use: PATCH /workflow_executions/{execution_id}
    // with status: "handoff" | "waiting"
    // For now, we track state locally in our database

    return NextResponse.json({
      success: true,
      status: newStatus,
      ai_paused
    })
  } catch (error) {
    console.error('Error in handover API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('conversations')
      .select('status')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching handover status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch handover status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ai_paused: data.status === 'handover'
    })
  } catch (error) {
    console.error('Error in handover GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
