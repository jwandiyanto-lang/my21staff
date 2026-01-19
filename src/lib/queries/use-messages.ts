'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { Message } from '@/types/database'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []

      if (isDevMode()) {
        const filtered = MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
        return filtered
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)
      return data || []
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds - messages are critical real-time
  })

  // Real-time subscription - invalidate query on new messages
  useEffect(() => {
    if (isDevMode() || !conversationId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Add new message to cache directly (optimistic-friendly)
          queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
            if (!old) return [payload.new as Message]
            // Avoid duplicates
            if (old.some((m) => m.id === (payload.new as Message).id)) return old
            return [...old, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])

  return query
}

// Helper to add optimistic message
export function useAddOptimisticMessage() {
  const queryClient = useQueryClient()

  return (conversationId: string, message: Message) => {
    queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
      if (!old) return [message]
      return [...old, message]
    })
  }
}

// Helper to remove optimistic message on error
export function useRemoveOptimisticMessage() {
  const queryClient = useQueryClient()

  return (conversationId: string, messageId: string) => {
    queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
      if (!old) return []
      return old.filter((m) => m.id !== messageId)
    })
  }
}

// Helper to replace optimistic message with real one
export function useReplaceOptimisticMessage() {
  const queryClient = useQueryClient()

  return (conversationId: string, optimisticId: string, realMessage: Message) => {
    queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
      if (!old) return [realMessage]
      // Remove both the optimistic message AND any duplicate that came via real-time
      const filtered = old.filter((m) => m.id !== optimisticId && m.id !== realMessage.id)
      return [...filtered, realMessage]
    })
  }
}
