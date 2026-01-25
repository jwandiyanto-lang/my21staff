'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { ConversationList } from '@/components/inbox/conversation-list'
import { InboxSkeleton } from '@/components/skeletons/inbox-skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES } from '@/lib/lead-status'
import type { Id } from 'convex/_generated/dataModel'

interface InboxClientProps {
  workspaceId: Id<'workspaces'>
}

export function InboxClient({ workspaceId }: InboxClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<'conversations'> | null>(null)
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])

  const data = useQuery(api.conversations.listWithFilters, {
    workspace_id: workspaceId as any,
    statusFilters: statusFilters.length > 0 ? statusFilters : undefined,
    tagFilters: tagFilters.length > 0 ? tagFilters : undefined,
  })

  if (data === undefined) {
    return <InboxSkeleton />
  }

  const { conversations, members, tags } = data

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel - Conversation list */}
      <div className="w-80 border-r flex flex-col bg-background">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          statusFilters={statusFilters}
          tagFilters={tagFilters}
          onStatusFiltersChange={setStatusFilters}
          onTagFiltersChange={setTagFilters}
          availableTags={tags}
          members={members}
        />
      </div>

      {/* Right panel - Message thread placeholder */}
      <div className="flex-1 bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          {selectedConversationId ? (
            <p>Loading message thread...</p>
          ) : (
            <p>Select a conversation to view messages</p>
          )}
        </div>
      </div>
    </div>
  )
}
