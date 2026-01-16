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
import { Filter, MessageCircle, Mail, MailOpen, ChevronDown, Phone, Calendar, Star, User, MessageSquare } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { isDevMode, MOCK_MESSAGES } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Workspace, ConversationWithContact, Message } from '@/types/database'

interface QuickReply {
  id: string
  label: string
  text: string
}

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  conversations: ConversationWithContact[]
  quickReplies?: QuickReply[]
}

export function InboxClient({ workspace, conversations: initialConversations, quickReplies }: InboxClientProps) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(
    conversations[0] || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  // Count unread conversations
  const unreadCount = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0).length
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
    } else {
      setMessages([])
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
            if (prev.some((m) => m.id === newMessage.id)) return prev
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

  // Handle conversation selection - mark as read instantly
  const handleSelectConversation = useCallback((conversation: ConversationWithContact) => {
    setSelectedConversation(conversation)

    // Instantly mark as read in UI (optimistic)
    if (conversation.unread_count > 0) {
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
      </div>

      {/* Right area - Message thread */}
      <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
        {selectedConversation ? (
          <>
            <MessageThread
              messages={messages}
              conversationContact={selectedConversation.contact}
              conversationId={selectedConversation.id}
              conversationStatus={selectedConversation.status}
              workspaceId={workspace.id}
              isLoading={isLoadingMessages}
              onHandoverChange={handleHandoverChange}
              showInfoPanel={showInfoPanel}
              onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
            />
            <MessageInput
              conversationId={selectedConversation.id}
              contactPhone={selectedConversation.contact.phone}
              workspaceId={workspace.id}
              quickReplies={quickReplies}
              onMessageSent={handleMessageSent}
              onMessageError={handleMessageError}
              conversationStatus={selectedConversation.status}
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
          conversationStatus={selectedConversation.status}
        />
      )}
    </div>
  )
}

// Helper function for avatar color
function getAvatarColor(name: string | null, phone: string): string {
  const str = name || phone
  const colors = [
    'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return phone.slice(-2)
}

// Info Sidebar Component (Kapso style)
function InfoSidebar({
  contact,
  messagesCount,
  lastActivity,
  conversationStatus,
}: {
  contact: ConversationWithContact['contact']
  messagesCount: number
  lastActivity: string | null
  conversationStatus: string
}) {
  const isActive = conversationStatus === 'open' || conversationStatus === 'handover'
  const statusConfig = LEAD_STATUS_CONFIG[contact.lead_status as LeadStatus] || LEAD_STATUS_CONFIG.prospect

  return (
    <div className="w-72 border-l bg-background flex flex-col">
      {/* Contact header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className={cn('h-12 w-12', getAvatarColor(contact.name, contact.phone))}>
            <AvatarFallback className="text-white font-medium bg-transparent">
              {getInitials(contact.name, contact.phone)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{contact.name || contact.phone}</p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            View conversations
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            + Add note
          </Button>
        </div>
      </div>

      {/* Assignment */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User className="h-4 w-4" />
          <span>Assignment</span>
        </div>
        <p className="text-sm">Not assigned</p>
      </div>

      {/* Status */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MessageSquare className="h-4 w-4" />
          <span>Status</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            isActive ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : ''
          )}
        >
          {isActive ? 'Active' : 'Closed'}
        </Badge>
      </div>

      {/* Lead Status */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Star className="h-4 w-4" />
          <span>Lead Status</span>
        </div>
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
        {contact.lead_score > 0 && (
          <p className="text-xs text-muted-foreground mt-1">Score: {contact.lead_score}</p>
        )}
      </div>

      {/* Activity */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4" />
          <span>Activity</span>
        </div>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Last active: </span>
            {lastActivity
              ? formatDistanceToNow(new Date(lastActivity), { addSuffix: false }) + ' ago'
              : 'Never'}
          </p>
          <p>
            <span className="text-muted-foreground">Total messages: </span>
            {messagesCount}
          </p>
        </div>
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="p-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
