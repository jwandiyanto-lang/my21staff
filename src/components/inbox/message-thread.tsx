/**
 * Message thread container with auto-scroll.
 *
 * Displays the message history for a selected conversation with:
 * - Contact header (avatar, name, phone)
 * - Scrollable message area with WhatsApp-style background
 * - Smart auto-scroll (only when user is at bottom)
 * - Date separators between message groups
 * - Placeholder for compose area (filled in Plan 03)
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'
import { format } from 'date-fns'
import { MessageBubble } from './message-bubble'
import { DateSeparator } from './date-separator'
import { ComposeInput } from './compose-input'

interface Contact {
  name?: string
  kapso_name?: string
  phone: string
}

interface MessageThreadProps {
  conversationId: string
  workspaceId: string
  contact: Contact
}

export function MessageThread({ conversationId, workspaceId, contact }: MessageThreadProps) {
  const messages = useQuery(api.messages.listByConversationAsc, {
    conversation_id: conversationId,
    workspace_id: workspaceId,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Track if user is at bottom of scroll container
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const threshold = 100 // pixels from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsAtBottom(atBottom)
  }

  // Auto-scroll to bottom when messages change (only if user was at bottom)
  useEffect(() => {
    if (isAtBottom && messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [conversationId]) // Re-run when conversation changes

  // Group messages by date for separator insertion
  const groupedMessages = messages ? groupMessagesByDate(messages) : new Map()

  const displayName = contact.name || contact.kapso_name || contact.phone || 'Unknown'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">{contact.phone}</p>
        </div>
      </div>

      {/* Messages area - WhatsApp style background */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-[#f0f2f5]"
      >
        {!messages ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={i % 2 === 0 ? 'flex justify-end' : 'flex justify-start'}>
                <Skeleton className="h-16 w-[70%] rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          // No messages yet
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No messages yet</p>
          </div>
        ) : (
          // Render messages grouped by date
          <div className="space-y-4">
            {Array.from(groupedMessages.entries()).map(([date, msgs]) => (
              <div key={date} className="space-y-2">
                <DateSeparator date={date} />
                {msgs.map((message) => (
                  <MessageBubble key={message._id} message={message} />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Compose area */}
      <ComposeInput
        workspaceId={workspaceId}
        conversationId={conversationId}
      />
    </div>
  )
}

/**
 * Group messages by date for DateSeparator insertion.
 * Returns a Map with date strings (yyyy-MM-dd) as keys and message arrays as values.
 */
function groupMessagesByDate(messages: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>()

  messages.forEach((msg) => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(msg)
  })

  return groups
}
