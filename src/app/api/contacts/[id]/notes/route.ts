import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET notes for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get contact to verify workspace access
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('workspace_id')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this contact' },
        { status: 403 }
      )
    }

    // Get notes
    const { data: notes, error } = await supabase
      .from('contact_notes')
      .select('id, content, note_type, metadata, due_date, author_id, created_at, updated_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notes: notes || [] })
  } catch (error) {
    console.error('Error in notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params
    const { content, note_type = 'note', metadata = {}, due_date = null } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get contact to verify access and get workspace_id
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('workspace_id')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', contact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this contact' },
        { status: 403 }
      )
    }

    // Insert note
    const { data: note, error: insertError } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contactId,
        workspace_id: contact.workspace_id,
        author_id: user.id,
        content: content.trim(),
        note_type,
        metadata,
        due_date,
      })
      .select('id, content, note_type, metadata, due_date, author_id, created_at, updated_at')
      .single()

    if (insertError) {
      console.error('Error creating note:', insertError)
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      )
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error in notes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
