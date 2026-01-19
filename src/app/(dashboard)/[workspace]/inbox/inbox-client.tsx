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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, MessageCircle, Mail, MailOpen, ChevronDown, User, Loader2, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { InfoSidebar } from '@/components/contact/info-sidebar'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Workspace, ConversationWithContact, Message, WorkspaceMember, Profile } from '@/types/database'

interface QuickReply {
  id: string
  label: string
  text: string
}

type TeamMember = WorkspaceMember & { profile: Profile | null }

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
  totalCount: number
  quickReplies?: QuickReply[]
  teamMembers?: TeamMember[]
  contactTags?: string[]
}

export function InboxClient({ workspace, conversations: initialConversations, totalCount, quickReplies, teamMembers = [], contactTags = ['Community', '1on1'] }: InboxClientProps) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [assignedFilter, setAssignedFilter] = useState<string>('all') // 'all' | 'unassigned' | user_id
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)

  // Pagination state
  const [page, setPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const PAGE_SIZE = 50

  // Count unread conversations
  const unreadCount = useMemo(() => {
    return conversations.filter((c) => (c.unread_count ?? 0) > 0).length
  }, [conversations])

  // Filter conversations by status, tags, assigned, and unread
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Filter by unread
    if (showUnreadOnly) {
      filtered = filtered.filter((conv) => (conv.unread_count ?? 0) > 0)
    }

    // Filter by status
    if (statusFilter.length > 0) {
      filtered = filtered.filter((conv) =>
        statusFilter.includes(conv.contact.lead_status as LeadStatus)
      )
    }

    // Filter by tags
    if (tagFilter.length > 0) {
      filtered = filtered.filter((conv) =>
        conv.contact.tags?.some((tag) => tagFilter.includes(tag))
      )
    }

    // Filter by assigned
    if (assignedFilter !== 'all') {
      if (assignedFilter === 'unassigned') {
        filtered = filtered.filter((conv) => !conv.assigned_to)
      } else {
        filtered = filtered.filter((conv) => conv.assigned_to === assignedFilter)
      }
    }

    return filtered
  }, [conversations, statusFilter, tagFilter, assignedFilter, showUnreadOnly])

  const handleStatusToggle = (status: LeadStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const handleTagToggle = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  // Load messages when conversation changes
  useEffect(() => {
    // Clear messages immediately when conversation changes to prevent stale data showing
    setMessages([])

    async function loadMessages(conversationId: string) {
      setIsLoadingMessages(true)

      if (isDevMode()) {
        // Dev mode: filter mock messages
        const filtered = MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
        // Sort by created_at ascending
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
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
    }
  }, [selectedConversation?.id])

  // Real-time subscription for new messages in selected conversation
  useEffect(() => {
    if (isDevMode() || !selectedConversation) return

    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          // Avoid duplicates (optimistic updates)
          setMessages((prev) => {
            // Check for exact ID match first
            if (prev.some((m) => m.id === newMessage.id)) return prev

            // Check for optimistic message match (outbound + same content + sending status)
            if (newMessage.direction === 'outbound') {
              const optimisticMatch = prev.find((m) =>
                m.direction === 'outbound' &&
                m.content === newMessage.content &&
                (m.metadata as Record<string, unknown>)?.status === 'sending'
              )
              if (optimisticMatch) {
                // Replace optimistic with real message
                return prev.map((m) => m.id === optimisticMatch.id ? newMessage : m)
              }
            }

            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation?.id])

  // Real-time subscription for conversation updates (new messages, unread counts)
  useEffect(() => {
    if (isDevMode()) return

    const supabase = createClient()

    const channel = supabase
      .channel(`conversations:${workspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // New conversation - fetch with contact info
            const { data: newConv } = await supabase
              .from('conversations')
              .select('*, contact:contacts!inner(*)')
              .eq('id', payload.new.id)
              .single()

            if (newConv && newConv.contact) {
              setConversations((prev) => [newConv as unknown as ConversationWithContact, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing conversation
            const updated = payload.new
            setConversations((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? { ...c, ...updated, contact: c.contact }
                  : c
              )
            )
            // Also update selected if matches
            setSelectedConversation((prev) =>
              prev && prev.id === updated.id
                ? { ...prev, ...updated, contact: prev.contact }
                : prev
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspace.id])

  // Handle message sent (optimistic or real)
  const handleMessageSent = useCallback((message: Message & { _optimisticId?: string }, isOptimistic: boolean) => {
    if (isOptimistic) {
      // Add optimistic message
      setMessages((prev) => [...prev, message])
    } else {
      // Replace optimistic message with real one, ensuring no duplicates
      const optimisticId = message._optimisticId
      setMessages((prev) => {
        // Remove both the optimistic message AND any duplicate that came via real-time
        const filtered = prev.filter((m) =>
          m.id !== optimisticId && m.id !== message.id
        )
        return [...filtered, message]
      })
    }
  }, [])

  // Handle message error (remove optimistic message)
  const handleMessageError = useCallback((optimisticId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
  }, [])

  // Handle conversation selection - mark as read instantly
  const handleSelectConversation = useCallback((conversation: ConversationWithContact) => {
    setSelectedConversation(conversation)

    // Instantly mark as read in UI (optimistic)
    if ((conversation.unread_count ?? 0) > 0) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        )
      )
      // Fire and forget API call
      fetch(`/api/conversations/${conversation.id}/read`, { method: 'POST' })
        .catch((err) => console.error('Failed to mark as read:', err))
    }
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

  // Handle assignment change
  const handleAssignmentChange = useCallback((userId: string | null) => {
    if (!selectedConversation) return
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id ? { ...c, assigned_to: userId } : c
      )
    )
    setSelectedConversation((prev) =>
      prev ? { ...prev, assigned_to: userId } : null
    )
  }, [selectedConversation])

  // Handle contact merged - refresh to get updated data
  const handleContactMerged = useCallback(() => {
    // Refresh the page to get updated conversations and contacts
    window.location.reload()
  }, [])

  // Handle reply to message
  const handleReply = useCallback((message: Message) => {
    setReplyToMessage(message)
  }, [])

  // Handle contact update from InfoSidebar - sync back to conversations list
  const handleContactUpdate = useCallback((contactId: string, updates: Partial<ConversationWithContact['contact']>) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.contact_id === contactId && conv.contact
          ? { ...conv, contact: { ...conv.contact, ...updates } }
          : conv
      )
    )
    // Also update selected conversation if it matches
    setSelectedConversation((prev) =>
      prev && prev.contact_id === contactId && prev.contact
        ? { ...prev, contact: { ...prev.contact, ...updates } }
        : prev
    )
  }, [])

  // Load more conversations for pagination
  const loadMoreConversations = async () => {
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const response = await fetch(
        `/api/conversations?workspace=${workspace.id}&page=${nextPage}&limit=${PAGE_SIZE}`
      )
      if (response.ok) {
        const data = await response.json()
        setConversations(prev => [...prev, ...data.conversations])
        setPage(nextPage)
      }
    } catch (error) {
      console.error('Failed to load more conversations:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Clear reply when conversation changes
  useEffect(() => {
    setReplyToMessage(null)
  }, [selectedConversation?.id])

  return (
    <div className="flex h-full">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col min-h-0">
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

            {/* Tag filter dropdown */}
            {contactTags.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      tagFilter.length > 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {tagFilter.length > 0 ? (
                      <>
                        {tagFilter.length} tag{tagFilter.length > 1 ? 's' : ''}
                      </>
                    ) : (
                      'All Tags'
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="start">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Filter by tag</p>
                    {contactTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={tagFilter.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      </label>
                    ))}
                    {tagFilter.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setTagFilter([])}
                      >
                        Clear tags
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Assigned to filter */}
            {teamMembers.length > 0 && (
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger
                  className={cn(
                    'h-8 w-auto gap-1.5 px-3 rounded-full text-xs font-medium border-0',
                    assignedFilter !== 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.full_name || member.profile?.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          hasStatusFilter={statusFilter.length > 0}
          workspaceName={workspace.name}
        />

        {/* Load More Button */}
        {conversations.length < totalCount && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={loadMoreConversations}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More ({totalCount - conversations.length} remaining)</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right area - Message thread */}
      <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
        {selectedConversation ? (
          <>
            <MessageThread
              messages={messages}
              conversationContact={selectedConversation.contact}
              conversationId={selectedConversation.id}
              conversationStatus={selectedConversation.status || 'open'}
              workspaceId={workspace.id}
              isLoading={isLoadingMessages}
              assignedTo={selectedConversation.assigned_to}
              teamMembers={teamMembers}
              onHandoverChange={handleHandoverChange}
              onAssignmentChange={handleAssignmentChange}
              onContactMerged={handleContactMerged}
              showInfoPanel={showInfoPanel}
              onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
              onReply={handleReply}
            />
            <MessageInput
              conversationId={selectedConversation.id}
              contactPhone={selectedConversation.contact.phone}
              workspaceId={workspace.id}
              quickReplies={quickReplies}
              onMessageSent={handleMessageSent}
              onMessageError={handleMessageError}
              conversationStatus={selectedConversation.status || 'open'}
              replyToMessage={replyToMessage}
              onClearReply={() => setReplyToMessage(null)}
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

      {/* Right Info sidebar - Kapso style */}
      {showInfoPanel && selectedConversation && (
        <InfoSidebar
          contact={selectedConversation.contact}
          messagesCount={messages.length}
          lastActivity={messages.length > 0 ? messages[messages.length - 1].created_at : null}
          conversationStatus={selectedConversation.status || 'open'}
          contactTags={contactTags}
          teamMembers={teamMembers}
          assignedTo={selectedConversation.assigned_to}
          conversationId={selectedConversation.id}
          onContactUpdate={handleContactUpdate}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  )
}
