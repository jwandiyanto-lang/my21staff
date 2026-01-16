'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, MessageCircle, Mail, MailOpen, ChevronDown } from 'lucide-react'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Workspace, ConversationWithContact, Message } from '@/types/database'

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
}

export function InboxClient({ workspace, conversations: initialConversations }: InboxClientProps) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Count unread conversations
  const unreadCount = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0).length
  }, [conversations])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    // Find current unread count for potential revert
    const conversation = conversations.find(c => c.id === conversationId)
    const previousCount = conversation?.unread_count || 0

    // Optimistically update local state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      )
    )

    // Also update selected conversation if it matches
    setSelectedConversation((prev) =>
      prev && prev.id === conversationId ? { ...prev, unread_count: 0 } : prev
    )

    // Call API to persist
    try {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
      // Revert on error
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: previousCount } : c
        )
      )
      setSelectedConversation((prev) =>
        prev && prev.id === conversationId ? { ...prev, unread_count: previousCount } : prev
      )
    }
  }, [conversations])

  // Filter conversations by status and unread
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Filter by unread
    if (showUnreadOnly) {
      filtered = filtered.filter((conv) => conv.unread_count > 0)
    }

    // Filter by status
    if (statusFilter.length > 0) {
      filtered = filtered.filter((conv) =>
        statusFilter.includes(conv.contact.lead_status as LeadStatus)
      )
    }

    return filtered
  }, [conversations, statusFilter, showUnreadOnly])

  const handleStatusToggle = (status: LeadStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages(conversationId: string) {
      setIsLoadingMessages(true)

      if (isDevMode()) {
        // Dev mode: filter mock messages
        const filtered = MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
        // Sort by created_at ascending
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setMessages(filtered)
      } else {
        // Production: query Supabase
        const supabase = createClient()
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(100)
        setMessages(data || [])
      }

      setIsLoadingMessages(false)
    }

    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      // Mark as read when viewing
      if (selectedConversation.unread_count > 0) {
        markAsRead(selectedConversation.id)
      }
    } else {
      setMessages([])
    }
  }, [selectedConversation, markAsRead])

  // Handle message sent (optimistic or real)
  const handleMessageSent = useCallback((message: Message & { _optimisticId?: string }, isOptimistic: boolean) => {
    if (isOptimistic) {
      // Add optimistic message
      setMessages((prev) => [...prev, message])
    } else {
      // Replace optimistic message with real one
      const optimisticId = message._optimisticId
      if (optimisticId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? message : m))
        )
      } else {
        // Just append if no optimistic ID (shouldn't happen normally)
        setMessages((prev) => [...prev, message])
      }
    }
  }, [])

  // Handle message error (remove optimistic message)
  const handleMessageError = useCallback((optimisticId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
  }, [])

  // Handle handover status change
  const handleHandoverChange = useCallback((aiPaused: boolean) => {
    if (!selectedConversation) return
    const newStatus = aiPaused ? 'handover' : 'open'
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, status: newStatus } : c
      )
    )
    setSelectedConversation((prev) =>
      prev ? { ...prev, status: newStatus } : null
    )
  }, [selectedConversation])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Search and filter header */}
        <div className="p-4 border-b space-y-3">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unread toggle */}
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                showUnreadOnly
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {showUnreadOnly ? (
                <Mail className="h-3.5 w-3.5" />
              ) : (
                <MailOpen className="h-3.5 w-3.5" />
              )}
              Unread
              {unreadCount > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px]',
                  showUnreadOnly ? 'bg-white/20' : 'bg-primary/10 text-primary'
                )}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Status filter dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    statusFilter.length > 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {statusFilter.length > 0 ? (
                    <>
                      {statusFilter.length} status{statusFilter.length > 1 ? 'es' : ''}
                    </>
                  ) : (
                    'All Status'
                  )}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-2">
                  <p className="font-medium text-sm">Filter by status</p>
                  {LEAD_STATUSES.map((status) => {
                    const config = LEAD_STATUS_CONFIG[status]
                    return (
                      <label
                        key={status}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                      </label>
                    )
                  })}
                  {statusFilter.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setStatusFilter([])}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          searchQuery={searchQuery}
          hasStatusFilter={statusFilter.length > 0}
        />
      </div>

      {/* Right area - Message thread */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedConversation ? (
          <>
            <MessageThread
              messages={messages}
              conversationContact={selectedConversation.contact}
              conversationId={selectedConversation.id}
              conversationStatus={selectedConversation.status}
              isLoading={isLoadingMessages}
              onHandoverChange={handleHandoverChange}
            />
            <MessageInput
              conversationId={selectedConversation.id}
              contactPhone={selectedConversation.contact.phone}
              workspaceId={workspace.id}
              onMessageSent={handleMessageSent}
              onMessageError={handleMessageError}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">
                Choose a conversation from the sidebar to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
