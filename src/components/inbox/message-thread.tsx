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
import { Bot, User, Loader2, PanelRight, PanelRightClose, ChevronDown } from 'lucide-react'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TypingIndicator } from './typing-indicator'
import { SystemMessage } from './system-message'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [systemMessages, setSystemMessages] = useState<{ id: string; text: string; timestamp: number }[]>([])
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

  // Handle AI/Human handover toggle - show confirmation dialog first
  const handleToggleClick = () => {
    setShowConfirmDialog(true)
  }

  // Execute toggle after confirmation
  const handleConfirmToggle = async () => {
    setShowConfirmDialog(false)
    setIsToggling(true)

    try {
      // In dev mode, simulate the toggle with system message
      if (isDevMode()) {
        // Simulate AI typing indicator when switching to AI mode
        if (!isAiActive) {
          setShowTypingIndicator(true)
          setTimeout(() => {
            setShowTypingIndicator(false)
          }, 2000)
        }

        // Add system message to local state
        const newSystemMessage = {
          id: `system-${Date.now()}`,
          text: isAiActive
            ? 'You switched to Manual mode. You will handle responses manually.'
            : 'You enabled AI mode. AI will respond to new messages.',
          timestamp: Date.now()
        }
        setSystemMessages(prev => [...prev, newSystemMessage])

        // Trigger status change in parent (updates conversation status)
        onStatusChange?.()

        setIsToggling(false)
        return
      }

      // Production mode - API call
      const res = await fetch(`/api/conversations/${conversationId}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: isAiActive }) // Toggle current state
      })

      if (res.ok) {
        // Add system message after successful toggle
        const newSystemMessage = {
          id: `system-${Date.now()}`,
          text: isAiActive
            ? 'You switched to Manual mode. You will handle responses manually.'
            : 'You enabled AI mode. AI will respond to new messages.',
          timestamp: Date.now()
        }
        setSystemMessages(prev => [...prev, newSystemMessage])

        // Show typing indicator when switching to AI mode
        if (!isAiActive) {
          setShowTypingIndicator(true)
          setTimeout(() => {
            setShowTypingIndicator(false)
          }, 2000)
        }

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
  const [showNewIndicator, setShowNewIndicator] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)

  // Track if user is at bottom of scroll container
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const threshold = 100 // pixels from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsAtBottom(atBottom)

    // Hide new indicator when user scrolls to bottom
    if (atBottom) {
      setShowNewIndicator(false)
    }
  }

  // Auto-scroll to bottom when messages change (only if user was at bottom)
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Track if new messages arrived
      if (messages.length > lastMessageCount && !isAtBottom) {
        setShowNewIndicator(true)
      }
      setLastMessageCount(messages.length)

      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        setShowNewIndicator(false)
      }
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
            {/* Mode indicator badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs gap-1",
                isAiActive
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              )}
            >
              {isAiActive ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {isAiActive ? 'AI' : 'Human'}
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
          onClick={handleToggleClick}
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
              {Array.from(groupedMessages.entries()).map(([date, msgs], groupIndex) => (
                <div key={date} className="space-y-2">
                  <DateSeparator date={date} />
                  {msgs.map((message, msgIndex) => (
                    <div key={message._id}>
                      <MessageBubble message={message} onReply={handleReply} />
                      {/* Show system messages after corresponding real messages */}
                      {systemMessages
                        .filter(sm => {
                          const messageTime = new Date(message.created_at).getTime()
                          const systemTime = sm.timestamp
                          // Show system message after the message it corresponds to
                          const isLastMessageInGroup = msgIndex === msgs.length - 1
                          const isLastGroup = groupIndex === Array.from(groupedMessages.entries()).length - 1
                          return isLastMessageInGroup && isLastGroup && systemTime > messageTime
                        })
                        .map(sm => (
                          <SystemMessage key={sm.id} text={sm.text} />
                        ))
                      }
                    </div>
                  ))}
                </div>
              ))}
              {/* System messages that are newer than all messages */}
              {systemMessages
                .filter(sm => {
                  if (messages.length === 0) return true
                  const lastMessageTime = messages[messages.length - 1]?.created_at || 0
                  return sm.timestamp > lastMessageTime
                })
                .map(sm => (
                  <SystemMessage key={sm.id} text={sm.text} />
                ))
              }
              {/* Typing indicator - shows when AI is processing */}
              {showTypingIndicator && <TypingIndicator />}
              {/* New messages indicator - appears when scrolled up with new messages */}
              {showNewIndicator && (
                <button
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                    setShowNewIndicator(false)
                  }}
                  className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-sm font-medium">New messages</span>
                </button>
              )}
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

      {/* Confirmation dialog for mode toggle */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAiActive ? 'Switch to Manual mode?' : 'Enable AI mode?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAiActive
                ? 'AI will stop responding to new messages. You will need to respond manually.'
                : 'AI will automatically respond to new messages from this contact.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
