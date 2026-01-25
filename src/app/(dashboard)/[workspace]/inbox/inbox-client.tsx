'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, MessageSquare, Mail, MailOpen, ChevronDown, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { InfoSidebar } from '@/components/contact/info-sidebar'
import { MergeContactsDialog } from '@/app/(dashboard)/[workspace]/database/merge-contacts-dialog'
import { InboxSkeleton } from '@/components/skeletons/inbox-skeleton'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Id } from 'convex/_generated/dataModel'
import type { Contact } from '@/types/database'

interface InboxClientProps {
  workspaceId: Id<'workspaces'>
}

interface ConversationContact {
  _id: Id<'contacts'>
  name?: string
  kapso_name?: string
  phone: string
  email?: string
  lead_status?: string
  lead_score?: number
  tags?: string[]
  assigned_to?: string
  metadata?: Record<string, unknown>
  created_at?: number
}

interface Conversation {
  _id: Id<'conversations'>
  contact_id: Id<'contacts'>
  status: string
  unread_count: number
  last_message_at?: number
  last_message_preview?: string
  assigned_to?: string
  contact: ConversationContact | null
}

/**
 * Wrapper to extract contact from conversation for MessageThread.
 */
function MessageThreadWrapper({
  conversationId,
  workspaceId,
  conversations,
}: {
  conversationId: Id<'conversations'>
  workspaceId: Id<'workspaces'>
  conversations: Conversation[]
}) {
  const conversation = conversations.find((c) => c._id === conversationId)
  const contact = conversation?.contact

  if (!contact) {
    return (
      <div className="flex-1 bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Contact not found</p>
      </div>
    )
  }

  return (
    <MessageThread
      conversationId={conversationId as unknown as string}
      workspaceId={workspaceId as unknown as string}
      contact={{
        name: contact.name,
        kapso_name: contact.kapso_name,
        phone: contact.phone,
        lead_status: contact.lead_status,
      }}
      conversationStatus={conversation?.status || 'open'}
    />
  )
}

export function InboxClient({ workspaceId }: InboxClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [mergeTargetContact, setMergeTargetContact] = useState<Contact | null>(null)

  const data = useQuery(api.conversations.listWithFilters, {
    workspace_id: workspaceId as any,
    active: viewMode === 'active',
    statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
    tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
  })

  // Extract data from query response
  const activeCount = useMemo(() => {
    if (!data?.conversations) return 0
    return data.conversations.filter((c) => c.unread_count > 0).length
  }, [data?.conversations])

  const contactTags = useMemo(() => {
    if (!data?.conversations) return []
    const tags = new Set<string>()
    data.conversations.forEach((conv) => {
      if (conv.contact?.tags) {
        conv.contact.tags.forEach((tag) => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [data?.conversations])

  // Filter conversations by search query (client-side)
  const filteredConversations = useMemo(() => {
    if (!data?.conversations) return []
    if (!searchQuery.trim()) return data.conversations

    const query = searchQuery.toLowerCase()
    return data.conversations.filter((conv) => {
      const contact = conv.contact
      if (!contact) return false
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.kapso_name?.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query)
      )
    })
  }, [data?.conversations, searchQuery])

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

  // Get the selected conversation and contact
  const selectedConversation = useMemo(() => {
    if (!selectedConversationId || !filteredConversations) return null
    return filteredConversations.find((c) => c._id === selectedConversationId) || null
  }, [selectedConversationId, filteredConversations])

  const selectedContact = selectedConversation?.contact

  // Get messages count for selected conversation
  const messagesCount = useMemo(() => {
    // We don't have direct access to messages count here, so return 0 for now
    // The MessageThread component fetches its own messages
    return 0
  }, [])

  // Convert Convex contact to Contact type for InfoSidebar
  const contactForSidebar = useMemo(() => {
    if (!selectedContact) return null
    return {
      id: String(selectedContact._id),
      workspace_id: String(workspaceId),
      phone: selectedContact.phone,
      name: selectedContact.name || null,
      kapso_name: selectedContact.kapso_name,
      email: selectedContact.email || null,
      lead_status: selectedContact.lead_status || null,
      lead_score: selectedContact.lead_score ?? null,
      tags: selectedContact.tags || null,
      assigned_to: selectedContact.assigned_to || null,
      metadata: selectedContact.metadata || null,
      created_at: selectedContact.created_at ? new Date(selectedContact.created_at).toISOString() : null,
      updated_at: null,
      phone_normalized: null,
      kapso_is_online: null,
      kapso_last_seen: null,
      kapso_profile_pic: null,
      cache_updated_at: null,
    } as Contact
  }, [selectedContact, workspaceId])

  // Handle contact updates from InfoSidebar
  const handleContactUpdate = useCallback((contactId: string, updates: Partial<Contact>) => {
    // Updates are handled via API calls in InfoSidebar
    // The Convex query will automatically refresh
  }, [])

  // Handle assignment change
  const handleAssignmentChange = useCallback((userId: string | null) => {
    // Handled via API calls in InfoSidebar
  }, [])

  // Handle opening merge dialog
  const handleOpenMergeDialog = useCallback(() => {
    if (contactForSidebar) {
      setMergeTargetContact(contactForSidebar)
      setShowMergeDialog(true)
    }
  }, [contactForSidebar])

  if (data === undefined) {
    return <InboxSkeleton />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Search and filter header */}
        <div className="p-4 border-b space-y-3">
          {/* Search input */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Filter bar with toggles and dropdowns */}
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
                  <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px] h-5">
                    {activeCount}
                  </Badge>
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

            {/* Tags filter dropdown */}
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
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          members={data.members}
        />
      </div>

      {/* Center area - Message thread */}
      <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
        {selectedConversationId ? (
          <MessageThreadWrapper
            conversationId={selectedConversationId}
            workspaceId={workspaceId}
            conversations={filteredConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-2">
                Choose a conversation from the sidebar to view messages
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar - Contact info */}
      {selectedConversationId && contactForSidebar && (
        <InfoSidebar
          contact={contactForSidebar}
          messagesCount={messagesCount}
          lastActivity={selectedConversation?.last_message_at
            ? new Date(selectedConversation.last_message_at).toISOString()
            : null}
          conversationStatus={selectedConversation?.status || 'open'}
          contactTags={contactTags}
          teamMembers={[]}
          assignedTo={selectedConversation?.assigned_to}
          conversationId={String(selectedConversationId)}
          onContactUpdate={handleContactUpdate}
          onAssignmentChange={handleAssignmentChange}
          onMergeClick={handleOpenMergeDialog}
        />
      )}

      {/* Merge contacts dialog */}
      {showMergeDialog && mergeTargetContact && (
        <MergeContactsDialog
          contact1={mergeTargetContact}
          contact2={mergeTargetContact} // User selects second contact in dialog
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          onMergeComplete={() => {
            setShowMergeDialog(false)
            setMergeTargetContact(null)
          }}
        />
      )}
    </div>
  )
}
