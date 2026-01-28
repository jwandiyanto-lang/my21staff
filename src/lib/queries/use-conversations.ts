// @ts-nocheck
'use client'

import { useQuery, useMutation } from 'convex/react'
import type { ConversationWithContact, WorkspaceMember, Profile } from '@/types/database'
import { isDevMode, MOCK_CONVERSATIONS } from '@/lib/mock-data'

// Types matching Convex query responses
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
  members: TeamMember[]
  tags: string[]
}

const PAGE_SIZE = 50

/**
 * Use Convex real-time subscriptions for conversations.
 *
 * The useQuery hook automatically subscribes to data changes, so when
 * new messages arrive via Kapso webhook, the conversation list
 * updates instantly without manual subscription management.
 */
export function useConversations(
  workspaceId: string,
  page: number = 0,
  filters: ConversationFilters = {}
) {
  const devMode = isDevMode()

  // Use Convex useQuery with real-time subscriptions (skip in dev mode)
  // @ts-ignore - Convex types will be generated when dev server runs
  const response = useQuery(
    devMode ? 'skip' : 'conversations:listWithFilters',
    devMode ? 'skip' : {
      workspace_id: workspaceId,
      active: filters.active,
      statusFilters: filters.statusFilters,
      tagFilters: filters.tagFilters,
      assignedTo: filters.assignedTo,
      limit: PAGE_SIZE,
      page,
    }
  )

  // In dev mode, return mock data
  if (devMode) {
    return {
      data: {
        conversations: filters.active
          ? MOCK_CONVERSATIONS.filter(c => (c.unread_count ?? 0) > 0)
          : MOCK_CONVERSATIONS,
        totalCount: MOCK_CONVERSATIONS.length,
        activeCount: MOCK_CONVERSATIONS.filter(c => (c.unread_count ?? 0) > 0).length,
        members: [],
        tags: [],
      } as ConversationsResponse,
      isLoading: false,
      error: null,
    }
  }

  // Transform response to match expected format
  const data = response
    ? {
        conversations: (response.conversations || []).map((conv: any) => ({
          ...conv,
          // Map Convex timestamps to ISO strings for compatibility
          created_at: conv.created_at ? new Date(conv.created_at).toISOString() : undefined,
          updated_at: conv.updated_at ? new Date(conv.updated_at).toISOString() : undefined,
          last_message_at: conv.last_message_at ? new Date(conv.last_message_at).toISOString() : undefined,
          // Map contact data
          contact: conv.contact ? {
            ...conv.contact,
            created_at: conv.contact.created_at ? new Date(conv.contact.created_at).toISOString() : undefined,
            updated_at: conv.contact.updated_at ? new Date(conv.contact.updated_at).toISOString() : undefined,
          } : null,
        })),
        totalCount: response.totalCount || 0,
        activeCount: response.activeCount || 0,
        members: (response.members || []).map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          created_at: m.created_at ? new Date(m.created_at).toISOString() : undefined,
          profile: null, // Profile data comes from auth context
        })),
        tags: response.tags || [],
      } as ConversationsResponse
    : undefined

  return {
    data,
    isLoading: response === undefined,
    error: null, // Convex useQuery handles errors internally
  }
}

/**
 * Mutations for conversation updates.
 *
 * These mutations are used for optimistic updates in UI.
 * Convex automatically handles consistency and broadcasts changes to all clients.
 */
export function useConversationMutations() {
  // @ts-ignore - Convex types will be generated when dev server runs
  const updateStatus = useMutation('updateConversationStatus')
  // @ts-ignore
  const assignConversation = useMutation('assignConversation')
  // @ts-ignore
  const markAsRead = useMutation('markConversationRead')

  return {
    updateStatus,
    assignConversation,
    markAsRead,
  }
}
