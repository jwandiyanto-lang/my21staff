import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { setHandover } from '@/lib/kapso/client'

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

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, workspace_id, contact_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError)
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get contact phone
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('phone')
      .eq('id', conversation.contact_id)
      .single()

    if (contactError) {
      console.error('Error fetching contact:', contactError)
    }

    // Get workspace Kapso credentials
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('kapso_phone_id, settings')
      .eq('id', conversation.workspace_id)
      .single()

    if (wsError) {
      console.error('Error fetching workspace:', wsError)
    }

    // Update conversation status locally
    // Using 'handover' when AI is paused, 'open' when AI is active
    const newStatus = ai_paused ? 'handover' : 'open'

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('id', conversationId)

    if (updateError) {
      console.error('Error updating handover status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update handover status' },
        { status: 500 }
      )
    }

    // Call Kapso API to pause/resume AI workflow
    let kapsoResult: { success: boolean; message?: string } = { success: true, message: 'No Kapso credentials' }
    const settings = workspace?.settings as { kapso_api_key?: string } | null
    const apiKey = settings?.kapso_api_key
    const phoneId = workspace?.kapso_phone_id

    if (apiKey && phoneId && contact?.phone) {
      kapsoResult = await setHandover(
        { apiKey, phoneId },
        contact.phone,
        ai_paused
      )
      console.log(`Kapso handover result for ${contact.phone}:`, kapsoResult)
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      ai_paused,
      kapso: kapsoResult,
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
