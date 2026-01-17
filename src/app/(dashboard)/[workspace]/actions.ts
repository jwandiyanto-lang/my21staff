'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeTask(noteId: string, workspaceSlug: string) {
  const supabase = await createClient()

  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Update the note with completed_at timestamp
  const { error } = await supabase
    .from('contact_notes')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', noteId)

  if (error) throw new Error(error.message)

  revalidatePath(`/${workspaceSlug}`)
}

export async function completeTaskWithFollowup(
  noteId: string,
  followupText: string,
  workspaceSlug: string
) {
  const supabase = await createClient()

  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get the original note to find contact_id and workspace_id
  const { data: originalNote, error: fetchError } = await supabase
    .from('contact_notes')
    .select('contact_id, workspace_id')
    .eq('id', noteId)
    .single()

  if (fetchError || !originalNote) throw new Error('Note not found')

  // Mark original note as completed
  const { error: updateError } = await supabase
    .from('contact_notes')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', noteId)

  if (updateError) throw new Error(updateError.message)

  // Create follow-up note
  const { error: insertError } = await supabase
    .from('contact_notes')
    .insert({
      contact_id: originalNote.contact_id,
      workspace_id: originalNote.workspace_id,
      content: `Follow-up: ${followupText}`,
      author_id: user.id,
    })

  if (insertError) throw new Error(insertError.message)

  revalidatePath(`/${workspaceSlug}`)
  revalidatePath(`/${workspaceSlug}/database`)
}
