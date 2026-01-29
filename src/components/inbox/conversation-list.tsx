'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import type { Id } from 'convex/_generated/dataModel'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Avatar color based on phone (matches database) - stable color that doesn't change
function getAvatarColor(phone: string): string {
  const colors = [
    'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
  ]
  let hash = 0
  for (let i = 0; i < phone.length; i++) {
    hash = phone.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
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
      <div>
        {conversations.map((conversation) => {
          const contact = conversation.contact
          if (!contact) return null

          // Kapso v2 provides kapso.contact_name directly, prioritize it over name/phone
          const displayName = contact.kapso_name || contact.name || contact.phone
          const status = (contact.lead_status || 'prospect') as LeadStatus
          const statusConfig = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.new || { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }

          // Determine AI/Human mode from conversation status
          const isAiMode = conversation.status !== 'handover'

          return (
            <button
              key={conversation._id}
              onClick={() => onSelect(conversation._id)}
              className={`w-full pl-4 pr-12 py-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${
                selectedId === conversation._id ? 'bg-muted' : ''
              }`}
            >
              <div className="flex gap-3 pr-6 relative">
                {/* Avatar - phone-based color (matches database) */}
                <Avatar className={cn('h-12 w-12 shrink-0', getAvatarColor(contact.phone))}>
                  <AvatarFallback className="text-base font-medium text-white bg-transparent">
                    {getInitials(contact.name || contact.kapso_name, contact.phone)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden pr-2">
                  {/* Row 1: Name + Timestamp */}
                  <div className="flex items-start justify-between gap-8 mb-1">
                    <span className="font-semibold text-[15px] truncate block max-w-[50%]">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })
                        : ''}
                    </span>
                  </div>

                  {/* Row 2: Message preview + Status/Unread */}
                  <div className="flex items-center gap-4 mb-1.5">
                    <p className="text-sm text-muted-foreground truncate block flex-1 min-w-0 max-w-[55%]">
                      {conversation.last_message_preview || 'No messages yet'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  {/* Row 3: Status tag + Mode badge */}
                  <div className="flex items-center gap-2">
                    {/* Status display - matches database (shows "---" for prospect/default status) */}
                    {status === 'prospect' ? (
                      <span className="text-xs text-muted-foreground">---</span>
                    ) : (
                      <Badge
                        className="text-xs"
                        style={{
                          color: statusConfig.color,
                          backgroundColor: statusConfig.bgColor,
                        }}
                      >
                        {statusConfig.label}
                      </Badge>
                    )}
                    {/* AI/Human mode badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs gap-1 px-1.5 py-0",
                        isAiMode
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}
                    >
                      {isAiMode ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      <span className="font-medium">{isAiMode ? 'AI' : 'Human'}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
