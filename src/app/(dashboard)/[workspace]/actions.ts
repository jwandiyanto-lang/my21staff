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
