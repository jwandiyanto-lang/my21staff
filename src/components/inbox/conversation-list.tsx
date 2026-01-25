'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import type { Id } from 'convex/_generated/dataModel'

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

interface Member {
  user_id: string
  role: string
  created_at: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: Id<'conversations'> | null
  onSelect: (id: Id<'conversations'>) => void
  members: Member[]
}

function getInitials(name: string | null | undefined, phone: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return phone.slice(-2)
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <p className="mb-2">No conversations yet</p>
          <p className="text-sm">
            Conversations will appear here when leads message your WhatsApp number
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {conversations.map((conversation) => {
          const contact = conversation.contact
          if (!contact) return null

          const displayName = contact.name || contact.kapso_name || contact.phone
          const status = (contact.lead_status || 'prospect') as LeadStatus
          const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.prospect

          return (
            <button
              key={conversation._id}
              onClick={() => onSelect(conversation._id)}
              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                selectedId === conversation._id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {getInitials(contact.name || contact.kapso_name, contact.phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {displayName}
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
