'use client'

import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, MessageSquare } from 'lucide-react'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { InboxSkeleton } from '@/components/skeletons/inbox-skeleton'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import type { Id } from 'convex/_generated/dataModel'

interface InboxClientProps {
  workspaceId: Id<'workspaces'>
}

interface Conversation {
  _id: Id<'conversations'>
  contact_id: Id<'contacts'>
  status: string
  unread_count: number
  last_message_at?: number
  last_message_preview?: string
  contact: {
    _id: Id<'contacts'>
    name?: string
    kapso_name?: string
    phone: string
    lead_status?: string
    tags?: string[]
  } | null
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
    />
  )
}

export function InboxClient({ workspaceId }: InboxClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([])

  const data = useQuery(api.conversations.listWithFilters, {
    workspace_id: workspaceId as any,
    statusFilters: statusFilter.length > 0 ? statusFilter : undefined,
  })

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

  if (data === undefined) {
    return <InboxSkeleton />
  }

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
                <Button variant="outline" size="icon" className="shrink-0 relative">
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
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          members={data.members}
        />
      </div>

      {/* Right area - Message thread */}
      <div className="flex-1 flex flex-col bg-muted/30">
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
    </div>
  )
}
