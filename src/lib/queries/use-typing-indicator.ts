'use client'

import { useState, useEffect, useCallback } from 'react'

interface TypingState {
  phone: string
  timestamp: number
}

/**
 * Hook for managing typing indicators.
 *
 * NOTE: Typing indicators are currently stubbed out as they require
 * a dedicated real-time infrastructure in Convex that doesn't exist yet.
 * This is a nice-to-have feature that can be implemented later.
 *
 * @param workspaceId - Workspace to subscribe to
 * @returns Map of phone -> timestamp for typing contacts
 */
export function useTypingIndicator(workspaceId: string) {
  // Map of phone number -> last typing timestamp
  const [typingContacts, setTypingContacts] = useState<Map<string, number>>(new Map())

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

  // Broadcast typing event (stubbed - no backend implementation)
  const broadcastTyping = useCallback(
    async (phone: string, isTyping: boolean) => {
      // TODO: Implement with Convex real-time when needed
      // For now, just update local state
      setTypingContacts((prev) => {
        const updated = new Map(prev)
        if (isTyping) {
          updated.set(phone, Date.now())
        } else {
          updated.delete(phone)
        }
        return updated
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
