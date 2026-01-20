'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDevMode } from '@/lib/mock-data'

interface TypingState {
  phone: string
  timestamp: number
}

/**
 * Hook for managing typing indicators via Supabase Broadcast
 * Uses ephemeral broadcast channel - no database storage
 *
 * @param workspaceId - Workspace to subscribe to
 * @returns Map of phone -> timestamp for typing contacts
 */
export function useTypingIndicator(workspaceId: string) {
  // Map of phone number -> last typing timestamp
  const [typingContacts, setTypingContacts] = useState<Map<string, number>>(new Map())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  // Clear stale typing indicators (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingContacts((prev) => {
        const updated = new Map(prev)
        let changed = false

        for (const [phone, timestamp] of updated.entries()) {
          if (now - timestamp > 5000) {
            updated.delete(phone)
            changed = true
          }
        }

        return changed ? updated : prev
      })
    }, 1000) // Check every second

    return () => clearInterval(interval)
  }, [])

  // Subscribe to typing broadcast channel
  useEffect(() => {
    if (isDevMode() || !workspaceId) return

    const supabase = createClient()
    const channel = supabase.channel(`typing:${workspaceId}`)

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { phone, isTyping } = payload.payload as { phone: string; isTyping: boolean }

        setTypingContacts((prev) => {
          const updated = new Map(prev)
          if (isTyping) {
            updated.set(phone, Date.now())
          } else {
            updated.delete(phone)
          }
          return updated
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workspaceId])

  // Broadcast typing event (for when we type - optional)
  const broadcastTyping = useCallback(
    async (phone: string, isTyping: boolean) => {
      if (!channelRef.current) return

      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { phone, isTyping },
      })
    },
    []
  )

  // Check if a specific contact is typing
  const isContactTyping = useCallback(
    (phone: string): boolean => {
      const timestamp = typingContacts.get(phone)
      if (!timestamp) return false
      return Date.now() - timestamp < 5000
    },
    [typingContacts]
  )

  return {
    typingContacts,
    isContactTyping,
    broadcastTyping,
  }
}

