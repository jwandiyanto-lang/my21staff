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
import { Filter, MessageCircle } from 'lucide-react'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import type { Workspace, ConversationWithContact, Message } from '@/types/database'

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
}

export function InboxClient({ workspace, conversations }: InboxClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Filter conversations by status
  const filteredConversations = useMemo(() => {
    if (statusFilter.length === 0) return conversations
    return conversations.filter((conv) =>
      statusFilter.includes(conv.contact.lead_status as LeadStatus)
    )
  }, [conversations, statusFilter])

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
    } else {
      setMessages([])
    }
  }, [selectedConversation])

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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Search and filter header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="h-4 w-4" />
                  {statusFilter.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {statusFilter.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
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
              isLoading={isLoadingMessages}
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
