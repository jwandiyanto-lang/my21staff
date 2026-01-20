'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { ConversationWithContact, WorkspaceMember, Profile } from '@/types/database'
import { isDevMode, MOCK_CONVERSATIONS } from '@/lib/mock-data'

export type TeamMember = WorkspaceMember & { profile: Profile | null }

export interface ConversationFilters {
  active?: boolean
  statusFilters?: string[]
  tagFilters?: string[]
  assignedTo?: string
}

interface ConversationsResponse {
  conversations: ConversationWithContact[]
  totalCount: number
  activeCount: number
  teamMembers: TeamMember[]
  quickReplies: Array<{id: string, label: string, text: string}>
  contactTags: string[]
}

const PAGE_SIZE = 50

export function useConversations(
  workspaceId: string,
  page: number = 0,
  filters: ConversationFilters = {}
) {
  const queryClient = useQueryClient()

  const query = useQuery({
    // Include filters in query key for proper caching
    queryKey: ['conversations', workspaceId, page, filters],
    queryFn: async (): Promise<ConversationsResponse> => {
      if (isDevMode()) {
        let filtered = MOCK_CONVERSATIONS
        if (filters.active) {
          filtered = filtered.filter(c => (c.unread_count ?? 0) > 0)
        }
        return {
          conversations: filtered,
          totalCount: MOCK_CONVERSATIONS.length,
          activeCount: MOCK_CONVERSATIONS.filter(c => (c.unread_count ?? 0) > 0).length,
          teamMembers: [],
          quickReplies: [],
          contactTags: ['Community', '1on1'],
        }
      }

      // Build URL with filters
      const params = new URLSearchParams({
        workspace: workspaceId,
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      })

      if (filters.active) {
        params.set('active', 'true')
      }

      if (filters.statusFilters?.length) {
        filters.statusFilters.forEach(s => params.append('status', s))
      }

      if (filters.tagFilters?.length) {
        filters.tagFilters.forEach(t => params.append('tags', t))
      }

      if (filters.assignedTo && filters.assignedTo !== 'all') {
        params.set('assigned', filters.assignedTo)
      }

      const response = await fetch(`/api/conversations?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load conversations')
      }
      return response.json()
    },
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  })

  // Real-time subscription - invalidate on changes
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
          // Invalidate all conversation queries for this workspace
          queryClient.invalidateQueries({
            queryKey: ['conversations', workspaceId],
            exact: false, // Invalidate all pages and filter combinations
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient])

  return query
}
