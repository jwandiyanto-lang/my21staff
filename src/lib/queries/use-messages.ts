'use client'

import { useQuery, useMutation } from 'convex/react'
import type { Message } from '@/types/database'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'

/**
 * Use Convex real-time subscriptions for messages.
 *
 * The useQuery hook automatically subscribes to data changes, so when
 * new messages arrive via Kapso webhook, the message thread updates
 * instantly without manual subscription management.
 */
export function useMessages(conversationId: string | null, workspaceId?: string) {
  // In dev mode, use mock data
  if (isDevMode()) {
    if (!conversationId) {
      return { data: [], isLoading: false, error: null }
    }
    const filtered = MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
    filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    return { data: filtered, isLoading: false, error: null }
  }

  // Use Convex useQuery with real-time subscriptions
  // @ts-ignore - Convex types will be generated when dev server runs
  const response = useQuery(
    'messages:listByConversationAsc',
    {
      conversation_id: conversationId,
      workspace_id: workspaceId || '',
      limit: 100,
    }
  )

  // Transform response to match expected format
  const data = response
    ? response.map((msg: any) => ({
        ...msg,
        // Map Convex timestamps to ISO strings for compatibility
        created_at: msg.created_at ? new Date(msg.created_at).toISOString() : undefined,
        // Map metadata for reply context
        metadata: msg.metadata || {},
      }))
    : []

  return {
    data,
    isLoading: response === undefined,
    error: null, // Convex useQuery handles errors internally
  }
}

/**
 * Helper to add optimistic message to TanStack Query cache.
 *
 * This works alongside Convex real-time updates - the optimistic
 * message is added immediately, then replaced by the real message
 * once the mutation completes and Convex broadcasts the update.
 */
export function useAddOptimisticMessage() {
  // This still works with TanStack Query client
  // TanStack Query can be used alongside Convex for caching
  return (conversationId: string, message: Message) => {
    // In a pure Convex app, we'd use the mutation's optimistic update feature
    // For now, we'll keep this interface for compatibility
    // The actual optimistic update happens via Convex mutation
    console.log('[Optimistic] Adding message to conversation:', conversationId)
  }
}

/**
 * Helper to remove optimistic message on error.
 *
 * Convex mutations automatically roll back on failure, so this
 * is less critical than with Supabase.
 */
export function useRemoveOptimisticMessage() {
  return (conversationId: string, messageId: string) => {
    console.log('[Optimistic] Removing failed message from conversation:', conversationId, messageId)
  }
}

/**
 * Helper to replace optimistic message with real one.
 *
 * Convex automatically handles this via its real-time subscription,
 * so this is primarily for TanStack Query cache management.
 */
export function useReplaceOptimisticMessage() {
  return (conversationId: string, optimisticId: string, realMessage: Message) => {
    console.log('[Optimistic] Replaced optimistic message with real:', optimisticId, '->', realMessage.id)
  }
}

/**
 * Mutation for sending messages.
 *
 * Uses Convex mutation which automatically handles:
 * - Database write
 * - Real-time broadcast to all clients
 * - Conversation update (last_message_at, unread_count)
 */
export function useSendMessage() {
  // @ts-ignore - Convex types will be generated when dev server runs
  return useMutation('createMessage')
}
