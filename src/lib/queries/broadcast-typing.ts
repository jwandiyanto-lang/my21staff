/**
 * Server-side function to broadcast typing indicator from webhook.
 * Called when Kapso sends typing status update.
 *
 * NOTE: Typing indicators are currently stubbed out as they require
 * a dedicated real-time infrastructure in Convex that doesn't exist yet.
 * This is a nice-to-have feature that can be implemented later.
 */
export async function broadcastTypingFromServer(
  workspaceId: string,
  phone: string,
  isTyping: boolean
) {
  // TODO: Implement with Convex real-time when needed
  // For now, this is a no-op
  console.log(`[Typing] ${phone} is ${isTyping ? 'typing' : 'stopped'} in ${workspaceId}`)
}
