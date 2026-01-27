'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, MailOpen, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FilterTabs } from '@/components/inbox/filter-tabs'
import { TagFilterDropdown } from '@/components/inbox/tag-filter-dropdown'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { InfoSidebar } from '@/components/contact/info-sidebar'
import { InboxSkeleton } from '@/components/skeletons/inbox-skeleton'
import { LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Id } from 'convex/_generated/dataModel'
import type { Contact } from '@/types/database'
import { isDevMode, MOCK_CONVERSATIONS, MOCK_TEAM_MEMBERS, MOCK_CONTACTS, getNotesForContact } from '@/lib/mock-data'

// Mock data formatted for inbox in dev mode
const MOCK_INBOX_DATA = {
  conversations: MOCK_CONVERSATIONS.map((conv) => ({
    _id: conv.id as Id<'conversations'>,
    contact_id: conv.contact_id as Id<'contacts'>,
    status: conv.status,
    unread_count: conv.unread_count,
    last_message_at: new Date(conv.last_message_at!).getTime(),
    last_message_preview: conv.last_message_preview,
    assigned_to: conv.assigned_to,
    contact: conv.contact ? {
      _id: conv.contact.id as Id<'contacts'>,
      name: conv.contact.name,
      kapso_name: conv.contact.kapso_name,
      phone: conv.contact.phone,
      email: conv.contact.email,
      lead_status: conv.contact.lead_status,
      lead_score: conv.contact.lead_score,
      tags: conv.contact.tags,
      assigned_to: conv.contact.assigned_to,
      metadata: conv.contact.metadata as Record<string, unknown> | undefined,
      created_at: new Date(conv.contact.created_at!).getTime(),
    } : null,
  })),
  members: MOCK_TEAM_MEMBERS.map((m) => ({
    user_id: m.user_id,
    role: m.role,
    created_at: Date.now(),
    profile: m.profile ? {
      full_name: m.profile.full_name,
      email: m.profile.email,
    } : null,
  })),
}

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
  showInfoSidebar,
  onToggleSidebar,
  onStatusChange,
}: {
  conversationId: Id<'conversations'>
  workspaceId: Id<'workspaces'>
  conversations: Conversation[]
  showInfoSidebar: boolean
  onToggleSidebar: () => void
  onStatusChange: () => void
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
      onStatusChange={onStatusChange}
      showInfoSidebar={showInfoSidebar}
      onToggleSidebar={onToggleSidebar}
    />
  )
}

export function InboxClient({ workspaceId }: InboxClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [showInfoSidebar, setShowInfoSidebar] = useState(true)

  // Track conversation status changes in dev mode
  const [conversationStatusOverrides, setConversationStatusOverrides] = useState<Record<string, string>>({})

  // Skip Convex query in dev mode - use mock data
  const convexData = useQuery(
    api.conversations.listWithFilters,
    isDevMode() ? 'skip' : {
      workspace_id: workspaceId as any,
      active: viewMode === 'active',
      statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
      tagFilters: tagFilter.length > 0 ? tagFilter : undefined,
    }
  )

  const data = isDevMode() ? MOCK_INBOX_DATA : convexData

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

  // Filter conversations by search query, status, and tags (client-side for dev mode)
  const filteredConversations = useMemo(() => {
    if (!data?.conversations) return []

    // Cast to any to handle type differences between mock and convex data
    let filtered = [...data.conversations] as any[]

    // Apply status overrides in dev mode
    if (isDevMode() && Object.keys(conversationStatusOverrides).length > 0) {
      filtered = filtered.map((conv: any) => {
        const overrideStatus = conversationStatusOverrides[conv._id]
        if (overrideStatus) {
          return { ...conv, status: overrideStatus }
        }
        return conv
      })
    }

    // Filter by view mode (active = has unread messages)
    if (viewMode === 'active') {
      filtered = filtered.filter((conv: any) => conv.unread_count > 0 || conv.status === 'open')
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((conv: any) => {
        const contact = conv.contact
        if (!contact) return false
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.kapso_name?.toLowerCase().includes(query) ||
          contact.phone.toLowerCase().includes(query)
        )
      })
    }

    // Filter by lead status
    if (statusFilter.length > 0) {
      filtered = filtered.filter((conv: any) => {
        const contact = conv.contact
        if (!contact) return false
        const contactStatus = (contact.lead_status || 'prospect') as LeadStatus
        return statusFilter.includes(contactStatus)
      })
    }

    // Filter by tags
    if (tagFilter.length > 0) {
      filtered = filtered.filter((conv: any) => {
        const contact = conv.contact
        if (!contact?.tags) return false
        return tagFilter.some((tag: string) => contact.tags?.includes(tag))
      })
    }

    return filtered
  }, [data?.conversations, searchQuery, statusFilter, tagFilter, viewMode, conversationStatusOverrides])

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

  // Handle merge completion
  const handleMergeComplete = useCallback((targetContactId: string) => {
    // After merge, clear selection or refresh
    // For dev mode, just log
    console.log('Merged with contact:', targetContactId)
  }, [])

  // Handle conversation status change (toggle AI/Human mode)
  const handleStatusChange = useCallback(() => {
    if (!selectedConversationId) return

    // Get current status
    const currentConversation = filteredConversations.find((c) => c._id === selectedConversationId)
    const currentStatus = currentConversation?.status || 'open'

    // Toggle status
    const newStatus = currentStatus === 'handover' ? 'open' : 'handover'

    // Update status override
    setConversationStatusOverrides((prev) => ({
      ...prev,
      [selectedConversationId]: newStatus,
    }))
  }, [selectedConversationId, filteredConversations])

  // Get available contacts for merge (all contacts except selected one)
  const availableContacts = useMemo(() => {
    if (isDevMode()) {
      return MOCK_CONTACTS.map(c => ({
        ...c,
        id: c.id,
      })) as Contact[]
    }
    // In production, would get from query - for now return empty
    return []
  }, [])

  // Get recent notes for the selected contact
  const recentNotes = useMemo(() => {
    if (!contactForSidebar) return []
    if (isDevMode()) {
      return getNotesForContact(contactForSidebar.id)
    }
    // In production, would fetch from API
    return []
  }, [contactForSidebar])

  if (data === undefined) {
    return <InboxSkeleton />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] relative">
      {/* Left sidebar - Conversation list */}
      <div className="w-80 border-r bg-background flex flex-col">
        {/* Search and filter header */}
        <div className="p-4 border-b space-y-3">
          {/* Search at top */}
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Status filter dropdown */}
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            workspaceId={workspaceId}
            activeOnly={viewMode === 'active'}
          />

          {/* Active/All toggle + Tag filter in one row */}
          <div className="flex items-center gap-2">
            {/* Active/All toggle */}
            <div className="flex items-center rounded-full bg-muted p-1 shrink-0">
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

            {/* Tag filter dropdown */}
            <TagFilterDropdown
              value={tagFilter}
              onChange={setTagFilter}
              workspaceId={workspaceId}
            />
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
      <div className="flex-1 flex flex-col bg-muted/30 min-w-0 relative">
        {selectedConversationId ? (
          <MessageThreadWrapper
            conversationId={selectedConversationId}
            workspaceId={workspaceId}
            conversations={filteredConversations}
            showInfoSidebar={showInfoSidebar}
            onToggleSidebar={() => setShowInfoSidebar(!showInfoSidebar)}
            onStatusChange={handleStatusChange}
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

      {/* Right sidebar - Contact info (overlay) */}
      {showInfoSidebar && selectedConversationId && contactForSidebar && (
        <div className="absolute right-0 top-0 h-full z-10 shadow-lg">
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
            onMergeComplete={handleMergeComplete}
            onClose={() => setShowInfoSidebar(false)}
            availableContacts={availableContacts}
            recentNotes={recentNotes}
          />
        </div>
      )}
    </div>
  )
}
