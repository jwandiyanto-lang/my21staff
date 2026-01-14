'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import type { ConversationWithContact } from '@/types/database'

interface ConversationListProps {
  conversations: ConversationWithContact[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithContact) => void
  searchQuery: string
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

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conv) =>
    conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.phone.includes(searchQuery)
  )

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
        {searchQuery ? (
          <p>No conversations found</p>
        ) : (
          <div>
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm">
              Conversations will appear here when leads message your WhatsApp number
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {filteredConversations.map((conversation) => {
          const status = conversation.contact.lead_status as LeadStatus
          const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                selectedId === conversation.id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {getInitials(conversation.contact.name, conversation.contact.phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {conversation.contact.name || conversation.contact.phone}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: statusConfig.color }}
                        title={statusConfig.label}
                      />
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="h-5 px-1.5 text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conversation.last_message_preview || 'No messages yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {conversation.last_message_at
                      ? formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
