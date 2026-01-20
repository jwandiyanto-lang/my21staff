'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { ConversationWithContact, WorkspaceMember, Profile } from '@/types/database'
import { isDevMode, MOCK_CONVERSATIONS } from '@/lib/mock-data'

export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface ConversationsResponse {
  conversations: ConversationWithContact[]
  totalCount: number
  teamMembers: TeamMember[]
  quickReplies: Array<{id: string, label: string, text: string}>
  contactTags: string[]
}

const PAGE_SIZE = 50

export function useConversations(workspaceId: string, page: number = 0) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['conversations', workspaceId, page],
    queryFn: async (): Promise<ConversationsResponse> => {
      if (isDevMode()) {
        return {
          conversations: MOCK_CONVERSATIONS,
          totalCount: MOCK_CONVERSATIONS.length,
          teamMembers: [],
          quickReplies: [],
          contactTags: ['Community', '1on1'],
        }
      }

      const response = await fetch(
        `/api/conversations?workspace=${workspaceId}&page=${page}&limit=${PAGE_SIZE}`
      )
      if (!response.ok) {
        throw new Error('Failed to load conversations')
      }
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute - same as default
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  })

  // Real-time subscription - update cache on conversation changes
  useEffect(() => {
    if (isDevMode() || !workspaceId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`conversations-list:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate to refetch on changes
          queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient])

  return query
}
