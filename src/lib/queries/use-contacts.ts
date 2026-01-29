'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Contact } from '@/types/database'

const PAGE_SIZE = 25

interface ContactsResponse {
  contacts: Contact[]
  total: number
}

export function useContacts(workspaceId: string, page: number) {
  return useQuery({
    queryKey: ['contacts', workspaceId, page],
    queryFn: async (): Promise<ContactsResponse> => {
      const response = await fetch(
        `/api/contacts?workspace=${workspaceId}&page=${page}&limit=${PAGE_SIZE}`
      )
      if (!response.ok) {
        throw new Error('Failed to load contacts')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - leads change less frequently
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  })
}

// Mutation for updating contact (status, tags, assignee)
export function useUpdateContact(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: Partial<Contact> }) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('Failed to update contact')
      }
      return response.json()
    },
    onMutate: async ({ contactId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts', workspaceId] })

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({ queryKey: ['contacts', workspaceId] })

      // Optimistically update only the specific contact across all cached pages
      previousQueries.forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (old: ContactsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            contacts: old.contacts.map((c) =>
              c.id === contactId ? { ...c, ...updates } : c
            ),
          }
        })
      })

      return { previousQueries }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}

// Mutation for creating contact
export function useCreateContact(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newContact: { name: string; phone: string; email?: string }) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContact, workspace: workspaceId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contact')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all contact queries to refetch
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] })
    },
  })
}

// Mutation for deleting contact
export function useDeleteContact(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete contact')
      }
      return response.json()
    },
    onMutate: async (contactId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['contacts', workspaceId] })

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({ queryKey: ['contacts', workspaceId] })

      // Optimistically remove from all cached pages
      previousQueries.forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (old: ContactsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            contacts: old.contacts.filter((c) => c.id !== contactId),
            total: old.total - 1,
          }
        })
      })

      return { previousQueries }
    },
    onError: (_err, _contactId, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}
