import { NextRequest, NextResponse } from 'next/server'
import { createClient, createApiAdminClient } from '@/lib/supabase/server'

// Calculate completeness score for a contact
function calculateCompletenessScore(contact: {
  name: string | null
  email: string | null
  lead_score: number
  tags: string[] | null
  metadata: unknown
}): number {
  let score = 0

  // Has name (2 points)
  if (contact.name && contact.name.trim()) score += 2

  // Has email (2 points)
  if (contact.email && contact.email.trim()) score += 2

  // Lead score contributes directly
  score += contact.lead_score || 0

  // Has tags (1 point per tag, max 5)
  if (contact.tags && contact.tags.length > 0) {
    score += Math.min(contact.tags.length, 5)
  }

  // Has metadata/form_answers (5 points if has form data)
  const metadata = contact.metadata as Record<string, unknown> | null
  if (metadata) {
    const innerMeta = (metadata.metadata as Record<string, unknown>) || metadata
    const formAnswers = innerMeta?.form_answers || metadata?.form_answers
    if (formAnswers && typeof formAnswers === 'object' && Object.keys(formAnswers).length > 0) {
      score += 5
    }
    // Check for direct form fields
    const formFieldKeys = ['Pendidikan', 'Jurusan', 'Aktivitas', 'Negara Tujuan', 'Budget',
      'Target Berangkat', 'Level Bahasa Inggris', 'Goals', 'Education', 'Activity',
      'TargetCountry', 'TargetDeparture', 'EnglishLevel']
    for (const key of formFieldKeys) {
      if (metadata[key] !== undefined || innerMeta?.[key] !== undefined) {
        score += 5
        break
      }
    }
  }

  return score
}

export async function POST(request: NextRequest) {
  try {
    // activePhone is the phone number from the current conversation - must be preserved for WhatsApp
    const { keepContactId, mergeContactId, activePhone } = await request.json()

    if (!keepContactId || !mergeContactId) {
      return NextResponse.json(
        { error: 'Both keepContactId and mergeContactId are required' },
        { status: 400 }
      )
    }

    if (keepContactId === mergeContactId) {
      return NextResponse.json(
        { error: 'Cannot merge a contact into itself' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createApiAdminClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch both contacts using admin client to ensure we can read them
    let { data: keepContact, error: keepError } = await adminClient
      .from('contacts')
      .select('*')
      .eq('id', keepContactId)
      .single()

    let { data: mergeContact, error: mergeError } = await adminClient
      .from('contacts')
      .select('*')
      .eq('id', mergeContactId)
      .single()

    if (keepError || !keepContact) {
      return NextResponse.json(
        { error: 'Keep contact not found' },
        { status: 404 }
      )
    }

    if (mergeError || !mergeContact) {
      return NextResponse.json(
        { error: 'Merge contact not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the workspace
    const { data: membership } = await adminClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', keepContact.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this workspace' },
        { status: 403 }
      )
    }

    // Note: We no longer auto-swap - the user explicitly chose the direction in the UI
    // The activePhone parameter ensures we keep the WhatsApp number from the current conversation

    // Merge metadata
    const keepMetadata = (keepContact.metadata as Record<string, unknown>) || {}
    const mergeMetadata = (mergeContact.metadata as Record<string, unknown>) || {}
    const combinedMetadata = {
      ...mergeMetadata,
      ...keepMetadata,
      merged_from: [
        ...(keepMetadata.merged_from as string[] || []),
        mergeContactId,
      ],
      merged_phone: [
        ...(keepMetadata.merged_phone as string[] || []),
        mergeContact.phone,
      ],
      merged_at: new Date().toISOString(),
    }

    // Merge tags
    const keepTags = keepContact.tags || []
    const mergeTags = mergeContact.tags || []
    const combinedTags = [...new Set([...keepTags, ...mergeTags])]

    // Update the keep contact with merged data
    const updatedKeepContact = {
      // Prefer keep contact's data, but fill in missing fields from merge contact
      name: keepContact.name || mergeContact.name,
      email: keepContact.email || mergeContact.email,
      // Use activePhone if provided (from current conversation), otherwise keep existing phone
      // This ensures WhatsApp messages can still be sent to the conversation's number
      phone: activePhone || keepContact.phone,
      // Take the higher lead score
      lead_score: Math.max(keepContact.lead_score || 0, mergeContact.lead_score || 0),
      // Keep the more recent status if different
      lead_status: keepContact.lead_status !== 'prospect'
        ? keepContact.lead_status
        : mergeContact.lead_status,
      tags: combinedTags,
      metadata: combinedMetadata,
      updated_at: new Date().toISOString(),
    }

    // Use admin client for all database operations to bypass RLS
    const { error: updateError } = await adminClient
      .from('contacts')
      .update(updatedKeepContact)
      .eq('id', keepContactId)

    if (updateError) {
      console.error('Error updating keep contact:', updateError)
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      )
    }

    // Update all conversations from merge contact to point to keep contact
    const { error: convError } = await adminClient
      .from('conversations')
      .update({ contact_id: keepContactId })
      .eq('contact_id', mergeContactId)

    if (convError) {
      console.error('Error updating conversations:', convError)
      // Continue anyway - the merge is partially complete
    }

    // Delete the merged contact - CRITICAL: this must succeed to prevent duplicate contacts
    const { error: deleteError } = await adminClient
      .from('contacts')
      .delete()
      .eq('id', mergeContactId)

    if (deleteError) {
      console.error('Error deleting merged contact:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete merged contact. Please try again or delete manually.' },
        { status: 500 }
      )
    }

    // Verify the contact was actually deleted
    const { data: deletedCheck } = await adminClient
      .from('contacts')
      .select('id')
      .eq('id', mergeContactId)
      .single()

    if (deletedCheck) {
      console.error('Contact still exists after deletion attempt:', mergeContactId)
      return NextResponse.json(
        { error: 'Contact deletion failed. Please delete manually from lead management.' },
        { status: 500 }
      )
    }

    console.log(`[Merge] Successfully merged contact ${mergeContactId} into ${keepContactId}. Phone: ${updatedKeepContact.phone}`)

    return NextResponse.json({
      success: true,
      contact: { ...keepContact, ...updatedKeepContact },
      deletedContactId: mergeContactId
    })
  } catch (error) {
    console.error('Error merging contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
