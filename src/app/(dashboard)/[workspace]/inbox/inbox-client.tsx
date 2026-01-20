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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Filter, MessageCircle, Mail, MailOpen, ChevronDown, User, Loader2, Tag, Bookmark, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { MessageInput } from './message-input'
import { InfoSidebar } from '@/components/contact/info-sidebar'
import { InboxSkeleton } from '@/components/skeletons/inbox-skeleton'
import { isDevMode } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import { useMessages, useAddOptimisticMessage, useRemoveOptimisticMessage, useReplaceOptimisticMessage } from '@/lib/queries/use-messages'
import { useTypingIndicator } from '@/lib/queries/use-typing-indicator'
import { useConversations, type ConversationFilters } from '@/lib/queries/use-conversations'
import { toast } from 'sonner'
import type { Workspace, ConversationWithContact, Message } from '@/types/database'

// Filter preset interface
interface FilterPreset {
  id: string
  name: string
  filters: {
    active: boolean
    statusFilters: string[]
    tagFilters: string[]
    assignedTo: string
  }
}

interface InboxClientProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  currentUserId: string
}

export function InboxClient({ workspace, currentUserId }: InboxClientProps) {
  // View mode: 'active' (unread only) or 'all'
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [assignedFilter, setAssignedFilter] = useState<string>('all')

  // Filter presets state
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [presetName, setPresetName] = useState('')

  // Build filters object for server-side filtering
  const filters: ConversationFilters = useMemo(() => ({
    active: viewMode === 'active',
    statusFilters: statusFilter,
    tagFilters: tagFilter,
    assignedTo: assignedFilter,
  }), [viewMode, statusFilter, tagFilter, assignedFilter])

  // TanStack Query for conversations with filters
  const [page, setPage] = useState(0)
  const { data, isLoading: isLoadingConversations } = useConversations(workspace.id, page, filters)

  // Extract data from query result
  const conversationsFromQuery = data?.conversations ?? []
  const totalCount = data?.totalCount ?? 0
  const activeCount = data?.activeCount ?? 0
  const quickReplies = data?.quickReplies ?? []
  const teamMembers = data?.teamMembers ?? []
  const contactTags = data?.contactTags ?? ['Community', '1on1']

  // Local state for conversations (for real-time updates and pagination)
  const [conversations, setConversations] = useState<ConversationWithContact[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)

  // ARI score data for the selected contact
  const [ariScoreData, setAriScoreData] = useState<{
    score: number;
    breakdown?: {
      basic_score?: number;
      qualification_score?: number;
      document_score?: number;
      engagement_score?: number;
    };
    reasons?: string[];
  } | undefined>(undefined)

  // Pagination state
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const PAGE_SIZE = 50

  // Load filter presets from workspace_members.settings on mount
  useEffect(() => {
    if (isDevMode()) return

    const loadPresets = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('workspace_members')
        .select('settings')
        .eq('workspace_id', workspace.id)
        .eq('user_id', currentUserId)
        .single()

      if (error) {
        console.error('Failed to load presets:', error)
        return
      }

      // settings is JSONB, filterPresets is nested inside
      const settings = data?.settings as Record<string, unknown> | null
      if (settings?.filterPresets && Array.isArray(settings.filterPresets)) {
        setPresets(settings.filterPresets as FilterPreset[])
      }
    }
    loadPresets()
  }, [workspace.id, currentUserId])

  // Save preset function
  const savePreset = async () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      filters: {
        active: viewMode === 'active',
        statusFilters: statusFilter,
        tagFilters: tagFilter,
        assignedTo: assignedFilter,
      },
    }

    // Limit to 10 presets max (per RESEARCH.md pitfall #6)
    const updatedPresets = [...presets, newPreset].slice(-10)

    if (!isDevMode()) {
      const supabase = createClient()

      // Get current settings first to preserve other settings
      const { data: currentData } = await supabase
        .from('workspace_members')
        .select('settings')
        .eq('workspace_id', workspace.id)
        .eq('user_id', currentUserId)
        .single()

      const currentSettings = (currentData?.settings && typeof currentData.settings === 'object' && !Array.isArray(currentData.settings))
        ? (currentData.settings as Record<string, unknown>)
        : {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSettings = { ...currentSettings, filterPresets: updatedPresets } as any
      const { data: updateResult, error } = await supabase
        .from('workspace_members')
        .update({ settings: newSettings })
        .eq('workspace_id', workspace.id)
        .eq('user_id', currentUserId)
        .select('settings')
        .single()

      if (error) {
        console.error('Failed to save preset:', error)
        toast.error('Failed to save preset')
        return
      }

      if (!updateResult) {
        console.error('No row updated - check workspace_id and user_id match')
        toast.error('Failed to save preset')
        return
      }
    }

    setPresets(updatedPresets)
    setPresetName('')
    setShowSavePresetDialog(false)
    toast.success('Filter preset saved')
  }

  // Load preset function
  const loadPreset = (preset: FilterPreset) => {
    setViewMode(preset.filters.active ? 'active' : 'all')
    setStatusFilter(preset.filters.statusFilters as LeadStatus[])
    setTagFilter(preset.filters.tagFilters)
    setAssignedFilter(preset.filters.assignedTo)
  }

  // Delete preset function
  const deletePreset = async (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId)

    if (!isDevMode()) {
      const supabase = createClient()

      // Get current settings first to preserve other settings
      const { data: currentData } = await supabase
        .from('workspace_members')
        .select('settings')
        .eq('workspace_id', workspace.id)
        .eq('user_id', currentUserId)
        .single()

      const currentSettings = (currentData?.settings && typeof currentData.settings === 'object' && !Array.isArray(currentData.settings))
        ? (currentData.settings as Record<string, unknown>)
        : {}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSettings = { ...currentSettings, filterPresets: updatedPresets } as any
      await supabase
        .from('workspace_members')
        .update({ settings: newSettings })
        .eq('workspace_id', workspace.id)
        .eq('user_id', currentUserId)
    }

    setPresets(updatedPresets)
    toast.success('Preset deleted')
  }

  // Sync conversations from query to local state
  useEffect(() => {
    if (conversationsFromQuery.length > 0) {
      setConversations(conversationsFromQuery)
      // Select first conversation if none selected
      if (!selectedConversation && conversationsFromQuery.length > 0) {
        setSelectedConversation(conversationsFromQuery[0])
      }
    } else if (!isLoadingConversations) {
      // Clear conversations when filter returns empty
      setConversations([])
    }
  }, [conversationsFromQuery, isLoadingConversations]) // eslint-disable-line react-hooks/exhaustive-deps

  // TanStack Query for messages with real-time subscription
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(selectedConversation?.id ?? null)

  // Typing indicators via Supabase Broadcast
  const { typingContacts, isContactTyping } = useTypingIndicator(workspace.id)

  // Optimistic update helpers
  const addOptimisticMessage = useAddOptimisticMessage()
  const removeOptimisticMessage = useRemoveOptimisticMessage()
  const replaceOptimisticMessage = useReplaceOptimisticMessage()

  // Check if any filters are active (for empty state message)
  const hasFilters = viewMode === 'active' || statusFilter.length > 0 || tagFilter.length > 0 || assignedFilter !== 'all'

  // Filter conversations by search query (client-side for instant feedback)
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    return conversations.filter((conv) =>
      conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.phone.includes(searchQuery)
    )
  }, [conversations, searchQuery])

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

  // Real-time subscription for conversation updates (new messages, unread counts)
  // Uses idempotent updates with ID deduplication to prevent chat disappearance (INBOX-07)
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
              // Idempotent insert - check if conversation already exists (prevents duplicates)
              setConversations((prev) => {
                const exists = prev.some(c => c.id === newConv.id)
                if (exists) return prev
                return [newConv as unknown as ConversationWithContact, ...prev]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            // Idempotent update - update in place (prevents chat disappearance)
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
          } else if (payload.eventType === 'DELETE') {
            // Only remove if actually deleted
            setConversations((prev) =>
              prev.filter(c => c.id !== (payload.old as { id: string }).id)
            )
            // Deselect if this was the selected conversation
            setSelectedConversation((prev) =>
              prev && prev.id === (payload.old as { id: string }).id ? null : prev
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
    if (!selectedConversation) return

    if (isOptimistic) {
      // Add optimistic message using TanStack Query cache helper
      addOptimisticMessage(selectedConversation.id, message)
    } else {
      // Replace optimistic message with real one using TanStack Query cache helper
      const optimisticId = message._optimisticId
      if (optimisticId) {
        replaceOptimisticMessage(selectedConversation.id, optimisticId, message)
      }
    }
  }, [selectedConversation, addOptimisticMessage, replaceOptimisticMessage])

  // Handle message error (remove optimistic message)
  // Takes conversationId as parameter to ensure rollback targets correct conversation
  // even if user switches conversations during API call
  const handleMessageError = useCallback((conversationId: string, optimisticId: string) => {
    removeOptimisticMessage(conversationId, optimisticId)
  }, [removeOptimisticMessage])

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
      // Build params with current filters
      const params = new URLSearchParams({
        workspace: workspace.id,
        page: nextPage.toString(),
        limit: PAGE_SIZE.toString(),
      })
      if (filters.active) params.set('active', 'true')
      if (filters.statusFilters?.length) {
        filters.statusFilters.forEach(s => params.append('status', s))
      }
      if (filters.tagFilters?.length) {
        filters.tagFilters.forEach(t => params.append('tags', t))
      }
      if (filters.assignedTo && filters.assignedTo !== 'all') {
        params.set('assigned', filters.assignedTo)
      }

      const response = await fetch(`/api/conversations?${params.toString()}`)
      if (response.ok) {
        const responseData = await response.json()
        setConversations(prev => [...prev, ...responseData.conversations])
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

  // Fetch ARI score data when conversation changes
  useEffect(() => {
    if (!selectedConversation || isDevMode()) {
      setAriScoreData(undefined)
      return
    }

    const fetchAriScore = async () => {
      const supabase = createClient()
      const { data: ariConversation } = await supabase
        .from('ari_conversations')
        .select('lead_score, lead_temperature, context')
        .eq('contact_id', selectedConversation.contact_id)
        .eq('workspace_id', workspace.id)
        .single()

      if (ariConversation) {
        const context = ariConversation.context as Record<string, unknown> | null
        setAriScoreData({
          score: ariConversation.lead_score || 0,
          breakdown: context?.score_breakdown as {
            basic_score?: number;
            qualification_score?: number;
            document_score?: number;
            engagement_score?: number;
          } | undefined,
          reasons: context?.score_reasons as string[] | undefined,
        })
      } else {
        setAriScoreData(undefined)
      }
    }

    fetchAriScore()
  }, [selectedConversation?.id, selectedConversation?.contact_id, workspace.id])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [viewMode, statusFilter, tagFilter, assignedFilter])

  // Show skeleton while loading (first visit only - cached visits skip this)
  if (isLoadingConversations && conversations.length === 0) {
    return <InboxSkeleton />
  }

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
            {/* Active/All toggle */}
            <div className="flex items-center rounded-full bg-muted p-1">
              <button
                onClick={() => setViewMode('active')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  viewMode === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                Active
                {activeCount > 0 && (
                  <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                    {activeCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  viewMode === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MailOpen className="h-3.5 w-3.5" />
                All
              </button>
            </div>

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

            {/* Filter presets dropdown - HIDDEN: needs debugging, see UAT Phase 01 Test 5 */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 rounded-full text-xs font-medium">
                  <Bookmark className="h-3.5 w-3.5" />
                  Presets
                  {presets.length > 0 && (
                    <span className="text-muted-foreground">({presets.length})</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {presets.length === 0 ? (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    No saved presets
                  </DropdownMenuItem>
                ) : (
                  presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      className="flex items-center justify-between group"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span
                        onClick={() => loadPreset(preset)}
                        className="flex-1 cursor-pointer"
                      >
                        {preset.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePreset(preset.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSavePresetDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Save current filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          hasFilters={hasFilters}
          workspaceName={workspace.name}
          typingContacts={typingContacts}
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
              isContactTyping={isContactTyping(selectedConversation.contact.phone)}
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
          ariScoreData={ariScoreData}
        />
      )}

      {/* Save preset dialog */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Preset name (e.g., 'Hot leads with unread')"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                savePreset()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePreset} disabled={!presetName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
