'use server'

import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { revalidatePath } from 'next/cache'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function completeTask(noteId: string, workspaceSlug: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get workspace ID from slug
  // @ts-ignore - Type instantiation is excessively deep (Convex known issue)
  const workspace = await convex.query(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })
  if (!workspace) throw new Error('Workspace not found')

  // Complete the task
  await convex.mutation(api.mutations.completeContactNote, {
    note_id: noteId,
    workspace_id: workspace._id,
  })

  revalidatePath(`/${workspaceSlug}`)
}

export async function completeTaskWithFollowup(
  noteId: string,
  followupText: string,
  workspaceSlug: string
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get workspace ID from slug
  // @ts-ignore - Type instantiation is excessively deep (Convex known issue)
  const workspace = await convex.query(api.workspaces.getBySlug, {
    slug: workspaceSlug,
  })
  if (!workspace) throw new Error('Workspace not found')

  // Complete task with follow-up
  await convex.mutation(api.mutations.completeContactNoteWithFollowup, {
    note_id: noteId,
    followup_text: followupText,
    workspace_id: workspace._id,
  })

  revalidatePath(`/${workspaceSlug}`)
  revalidatePath(`/${workspaceSlug}/database`)
}
