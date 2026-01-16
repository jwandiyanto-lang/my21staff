'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Filter, MessageCircle, Mail, MailOpen, ChevronDown, Phone, Calendar, Star, User, MessageSquare, Loader2, X, Plus, Tag, Pencil, Check } from 'lucide-react'
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
  quickReplies?: QuickReply[]
  teamMembers?: TeamMember[]
  contactTags?: string[]
}

export function InboxClient({ workspace, conversations: initialConversations, quickReplies, teamMembers = [], contactTags = ['Community', '1on1'] }: InboxClientProps) {
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

  // Count unread conversations
  const unreadCount = useMemo(() => {
    return conversations.filter((c) => c.unread_count > 0).length
  }, [conversations])

  // Filter conversations by status, tags, assigned, and unread
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
              conversationStatus={selectedConversation.status}
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
          conversationStatus={selectedConversation.status}
          contactTags={contactTags}
          teamMembers={teamMembers}
          assignedTo={selectedConversation.assigned_to}
          conversationId={selectedConversation.id}
          onAssignmentChange={handleAssignmentChange}
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

// Info Sidebar Component (Full profile like Lead Management)
function InfoSidebar({
  contact,
  messagesCount,
  lastActivity,
  conversationStatus,
  onContactUpdate,
  contactTags = [],
  teamMembers = [],
  assignedTo,
  conversationId,
  onAssignmentChange,
}: {
  contact: ConversationWithContact['contact']
  messagesCount: number
  lastActivity: string | null
  conversationStatus: string
  onContactUpdate?: (updated: Partial<ConversationWithContact['contact']>) => void
  contactTags?: string[]
  teamMembers?: TeamMember[]
  assignedTo?: string | null
  conversationId?: string
  onAssignmentChange?: (userId: string | null) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isActive = conversationStatus === 'open' || conversationStatus === 'handover'

  // Local state for optimistic updates
  const [localStatus, setLocalStatus] = useState<LeadStatus>(contact.lead_status as LeadStatus || 'prospect')
  const [localScore, setLocalScore] = useState(contact.lead_score ?? 0)
  const [localTags, setLocalTags] = useState<string[]>(contact.tags || [])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingScore, setIsUpdatingScore] = useState(false)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [localAssignedTo, setLocalAssignedTo] = useState<string | null>(assignedTo || null)
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false)

  // Editable contact info
  const [localName, setLocalName] = useState(contact.name || '')
  const [localPhone, setLocalPhone] = useState(contact.phone || '')
  const [localEmail, setLocalEmail] = useState(contact.email || '')
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

  // Sync local state when contact changes
  useEffect(() => {
    setLocalStatus(contact.lead_status as LeadStatus || 'prospect')
    setLocalScore(contact.lead_score ?? 0)
    setLocalTags(contact.tags || [])
    setLocalName(contact.name || '')
    setLocalPhone(contact.phone || '')
    setLocalEmail(contact.email || '')
    setEditingField(null)
  }, [contact.id, contact.lead_status, contact.lead_score, contact.tags, contact.name, contact.phone, contact.email])

  // Sync assigned to when it changes from parent
  useEffect(() => {
    setLocalAssignedTo(assignedTo || null)
  }, [assignedTo])

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.prospect

  // Debounced score update
  const debouncedScoreUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return (contactId: string, score: number) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          setIsUpdatingScore(true)
          try {
            const response = await fetch(`/api/contacts/${contactId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead_score: score }),
            })
            if (!response.ok) {
              setLocalScore(contact.lead_score ?? 0)
            } else {
              onContactUpdate?.({ lead_score: score })
              startTransition(() => router.refresh())
            }
          } catch {
            setLocalScore(contact.lead_score ?? 0)
          } finally {
            setIsUpdatingScore(false)
          }
        }, 500)
      }
    })(),
    [contact.lead_score, router, onContactUpdate]
  )

  // Status update handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
    const previousStatus = localStatus
    setLocalStatus(newStatus)
    setIsUpdatingStatus(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_status: newStatus }),
      })

      if (!response.ok) {
        setLocalStatus(previousStatus)
      } else {
        onContactUpdate?.({ lead_status: newStatus })
        startTransition(() => router.refresh())
      }
    } catch {
      setLocalStatus(previousStatus)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Score change handler
  const handleScoreChange = (value: number[]) => {
    const newScore = value[0]
    setLocalScore(newScore)
    debouncedScoreUpdate(contact.id, newScore)
  }

  // Tag management
  // Toggle tag (add if not present, remove if present)
  const handleToggleTag = async (tag: string) => {
    const hasTag = localTags.includes(tag)
    const newTags = hasTag
      ? localTags.filter(t => t !== tag)
      : [...localTags, tag]
    const previousTags = localTags
    setLocalTags(newTags)
    setIsUpdatingTags(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })

      if (!response.ok) {
        setLocalTags(previousTags)
      } else {
        onContactUpdate?.({ tags: newTags })
        startTransition(() => router.refresh())
      }
    } catch {
      setLocalTags(previousTags)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  // Handle assignment change in info panel
  const handleAssignmentInPanel = async (userId: string) => {
    if (!conversationId) return
    const newAssignedTo = userId === 'unassigned' ? null : userId
    const previousAssigned = localAssignedTo
    setLocalAssignedTo(newAssignedTo)
    setIsUpdatingAssignment(true)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: newAssignedTo }),
      })

      if (!response.ok) {
        setLocalAssignedTo(previousAssigned)
      } else {
        onAssignmentChange?.(newAssignedTo)
      }
    } catch {
      setLocalAssignedTo(previousAssigned)
    } finally {
      setIsUpdatingAssignment(false)
    }
  }

  // Contact info update handler
  const handleSaveField = async (field: 'name' | 'phone' | 'email') => {
    const value = field === 'name' ? localName : field === 'phone' ? localPhone : localEmail
    const originalValue = field === 'name' ? (contact.name || '') : field === 'phone' ? contact.phone : (contact.email || '')

    // Skip if unchanged
    if (value === originalValue) {
      setEditingField(null)
      return
    }

    setIsUpdatingInfo(true)
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      })

      if (!response.ok) {
        // Revert on error
        if (field === 'name') setLocalName(contact.name || '')
        if (field === 'phone') setLocalPhone(contact.phone || '')
        if (field === 'email') setLocalEmail(contact.email || '')
      } else {
        onContactUpdate?.({ [field]: value || null })
        startTransition(() => router.refresh())
      }
    } catch {
      // Revert on error
      if (field === 'name') setLocalName(contact.name || '')
      if (field === 'phone') setLocalPhone(contact.phone || '')
      if (field === 'email') setLocalEmail(contact.email || '')
    } finally {
      setIsUpdatingInfo(false)
      setEditingField(null)
    }
  }

  const handleCancelEdit = (field: 'name' | 'phone' | 'email') => {
    if (field === 'name') setLocalName(contact.name || '')
    if (field === 'phone') setLocalPhone(contact.phone || '')
    if (field === 'email') setLocalEmail(contact.email || '')
    setEditingField(null)
  }

  // Extract form responses from metadata
  const metadata = contact.metadata as Record<string, unknown> | null
  const innerMetadata = (metadata?.metadata as Record<string, unknown>) || metadata
  let formAnswersData: Record<string, unknown> = {}
  if (innerMetadata?.form_answers && typeof innerMetadata.form_answers === 'object') {
    formAnswersData = innerMetadata.form_answers as Record<string, unknown>
  } else if (metadata?.form_answers && typeof metadata.form_answers === 'object') {
    formAnswersData = metadata.form_answers as Record<string, unknown>
  } else if (metadata) {
    const formFieldKeys = ['Pendidikan', 'Jurusan', 'Aktivitas', 'Negara Tujuan', 'Budget',
      'Target Berangkat', 'Level Bahasa Inggris', 'Goals', 'Catatan', 'Education',
      'Activity', 'TargetCountry', 'TargetDeparture', 'EnglishLevel']
    for (const key of formFieldKeys) {
      if (metadata[key] !== undefined && metadata[key] !== null) formAnswersData[key] = metadata[key]
      if (innerMetadata && innerMetadata[key] !== undefined && innerMetadata[key] !== null) {
        formAnswersData[key] = innerMetadata[key]
      }
    }
  }
  const formResponses = Object.keys(formAnswersData).length > 0
    ? Object.entries(formAnswersData).filter(([key]) => !key.startsWith('_'))
    : []

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    if (score >= 40) return '#3B82F6'
    return '#6B7280'
  }

  return (
    <div className="w-80 shrink-0 border-l bg-background flex flex-col overflow-hidden">
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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Contact Info - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact Info
              </h3>
              {isUpdatingInfo && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-2 text-sm">
              {/* Name field */}
              <div className="flex items-center gap-2 group">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'name' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('name')
                        if (e.key === 'Escape') handleCancelEdit('name')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('name')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('name')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{localName || 'No name'}</span>
                    <button
                      onClick={() => setEditingField('name')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Phone field */}
              <div className="flex items-center gap-2 group">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'phone' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Phone"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('phone')
                        if (e.key === 'Escape') handleCancelEdit('phone')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('phone')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('phone')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{localPhone}</span>
                    <button
                      onClick={() => setEditingField('phone')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email field */}
              <div className="flex items-center gap-2 group">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'email' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Email"
                      type="email"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('email')
                        if (e.key === 'Escape') handleCancelEdit('email')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('email')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('email')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{localEmail || 'No email'}</span>
                    <button
                      onClick={() => setEditingField('email')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Created date - not editable */}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Added {format(new Date(contact.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Conversation Status */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conversation
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isActive ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : ''
              )}
            >
              {isActive ? 'Active' : 'Closed'}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {lastActivity
                ? `Last active: ${formatDistanceToNow(new Date(lastActivity), { addSuffix: false })} ago`
                : 'No activity'}
              {' • '}{messagesCount} messages
            </div>
          </div>

          <Separator />

          {/* Lead Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Lead Status
              </h3>
              {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={localStatus}
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger
                className="w-full h-8 text-xs"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                  borderColor: statusConfig.color,
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((status) => {
                  const config = LEAD_STATUS_CONFIG[status]
                  return (
                    <SelectItem key={status} value={status} className="text-xs">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Lead Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Lead Score
              </h3>
              <div className="flex items-center gap-2">
                {isUpdatingScore && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                <span
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: getScoreColor(localScore) }}
                >
                  {localScore}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(localScore, 100)}%`,
                  backgroundColor: getScoreColor(localScore),
                }}
              />
            </div>
            <Slider
              value={[localScore]}
              onValueChange={handleScoreChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Assigned To */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned To
                </h3>
                {isUpdatingAssignment && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Select
                value={localAssignedTo || 'unassigned'}
                onValueChange={handleAssignmentInPanel}
                disabled={isUpdatingAssignment}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.full_name || member.profile?.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {teamMembers.length > 0 && <Separator />}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tags
              </h3>
              {isUpdatingTags && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            {contactTags.length > 0 ? (
              <div className="space-y-2">
                {contactTags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localTags.includes(tag)}
                      onCheckedChange={() => handleToggleTag(tag)}
                      disabled={isUpdatingTags}
                    />
                    <Badge variant={localTags.includes(tag) ? 'default' : 'secondary'} className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tags configured. Add tags in Settings.
              </p>
            )}
          </div>

          {/* Form Responses */}
          {formResponses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Form Responses
                </h3>
                <div className="space-y-2">
                  {formResponses.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground capitalize truncate">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-right truncate max-w-[120px]">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
