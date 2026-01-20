import { createApiAdminClient } from '@/lib/supabase/server'

/**
 * Server-side function to broadcast typing indicator from webhook
 * Called when Kapso sends typing status update
 */
export async function broadcastTypingFromServer(
  workspaceId: string,
  phone: string,
  isTyping: boolean
) {
  const supabase = createApiAdminClient()

  const channel = supabase.channel(`typing:${workspaceId}`)
  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { phone, isTyping },
  })
}
