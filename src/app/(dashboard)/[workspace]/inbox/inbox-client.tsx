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

  const data = useQuery(api.conversations.listWithFilters, {
    workspace_id: workspaceId as any,
    statusFilters: statusFilters.length > 0 ? statusFilters : undefined,
  })

  if (data === undefined) {
    return <InboxSkeleton />
  }

  const { conversations, members } = data

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel - Conversation list */}
      <div className="w-80 border-r flex flex-col bg-background">
        {/* Filter Header */}
        <div className="p-3 border-b flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status
                {statusFilters.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 rounded">
                    {statusFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="space-y-1">
                {LEAD_STATUSES.map((status) => {
                  const config = LEAD_STATUS_CONFIG[status]
                  const isSelected = statusFilters.includes(status)
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setStatusFilters(prev =>
                          isSelected
                            ? prev.filter(s => s !== status)
                            : [...prev, status]
                        )
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  )
                })}
                {statusFilters.length > 0 && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => setStatusFilters([])}
                      className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Conversation List */}
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
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
