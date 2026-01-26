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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials, cn } from '@/lib/utils'
import { format } from 'date-fns'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import { MessageBubble } from './message-bubble'
import { DateSeparator } from './date-separator'
import { ComposeInput } from './compose-input'
import { Bot, User, Loader2, PanelRight, PanelRightClose } from 'lucide-react'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'

// Format mock messages for dev mode
const getMockMessagesForConversation = (conversationId: string) => {
  return MOCK_MESSAGES
    .filter((m) => m.conversation_id === conversationId)
    .map((m) => ({
      _id: m.id,
      conversation_id: m.conversation_id,
      workspace_id: m.workspace_id,
      direction: m.direction,
      sender_type: m.sender_type,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      created_at: new Date(m.created_at!).getTime(),
    }))
}

interface Contact {
  name?: string
  kapso_name?: string
  phone: string
  lead_status?: string
}

interface MessageThreadProps {
  conversationId: string
  workspaceId: string
  contact: Contact
  conversationStatus?: string
  onStatusChange?: () => void
  showInfoSidebar?: boolean
  onToggleSidebar?: () => void
}

export function MessageThread({
  conversationId,
  workspaceId,
  contact,
  conversationStatus = 'open',
  onStatusChange,
  showInfoSidebar = true,
  onToggleSidebar,
}: MessageThreadProps) {
  // Skip Convex query in dev mode - use mock messages
  const convexMessages = useQuery(
    api.messages.listByConversationAsc,
    isDevMode() ? 'skip' : {
      conversation_id: conversationId,
      workspace_id: workspaceId,
    }
  )
  const messages = isDevMode() ? getMockMessagesForConversation(conversationId) : convexMessages

  // Handover toggle state
  const [isToggling, setIsToggling] = useState(false)
  const isAiActive = conversationStatus !== 'handover'

  // Handle reply to message
  const handleReply = (message: any) => {
    // In dev mode, just log
    if (isDevMode()) {
      console.log('Reply to message:', message)
      return
    }
    // In production, would scroll to compose and populate with reply context
    console.log('Reply to message:', message)
  }

  // Handle AI/Human handover toggle
  const handleHandoverToggle = async () => {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: isAiActive }) // Toggle current state
      })
      if (res.ok) {
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Handover toggle failed:', error)
    } finally {
      setIsToggling(false)
    }
  }

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
  const status = (contact.lead_status || 'prospect') as LeadStatus
  const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new || { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{displayName}</p>
            <Badge
              variant="outline"
              style={{
                color: statusConfig.color,
                borderColor: statusConfig.color,
                backgroundColor: statusConfig.bgColor,
              }}
              className="text-xs"
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {contact.name && contact.phone}
          </p>
        </div>
        {/* AI/Human handover toggle */}
        <Button
          variant={isAiActive ? "default" : "outline"}
          size="sm"
          onClick={handleHandoverToggle}
          disabled={isToggling}
          className={cn(
            "text-xs shrink-0",
            isAiActive
              ? "bg-green-600 hover:bg-green-700"
              : "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
          )}
        >
          {isToggling ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : isAiActive ? (
            <Bot className="h-3 w-3 mr-1" />
          ) : (
            <User className="h-3 w-3 mr-1" />
          )}
          {isAiActive ? "ARI Active" : "Manual"}
        </Button>
        {/* Toggle info sidebar */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 shrink-0"
            title={showInfoSidebar ? 'Hide contact info' : 'Show contact info'}
          >
            {showInfoSidebar ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-muted/30 py-4"
      >
        {!messages ? (
          // Loading skeleton
          <div className="space-y-4 px-4">
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
          // Render messages grouped by date - max width container for better readability
          <div className="max-w-3xl mx-auto w-full px-6">
            <div className="flex flex-col gap-3">
              {Array.from(groupedMessages.entries()).map(([date, msgs]) => (
                <div key={date} className="space-y-2">
                  <DateSeparator date={date} />
                  {msgs.map((message) => (
                    <MessageBubble key={message._id} message={message} onReply={handleReply} />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
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
