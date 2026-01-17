'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ConversationWithContact } from '@/types/database'

interface ConversationListProps {
  conversations: ConversationWithContact[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithContact) => void
  searchQuery: string
  hasStatusFilter?: boolean
  workspaceName?: string
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

// Uses phone for color stability - doesn't change when name is edited
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
  searchQuery,
  hasStatusFilter = false,
  workspaceName = 'Workspace',
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conv) =>
    conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.phone.includes(searchQuery)
  )

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
        {searchQuery ? (
          <div>
            <p className="font-medium mb-1">No results found</p>
            <p className="text-sm">No conversations match "{searchQuery}"</p>
          </div>
        ) : hasStatusFilter ? (
          <div>
            <p className="font-medium mb-1">No matching conversations</p>
            <p className="text-sm">No conversations match the selected filters</p>
          </div>
        ) : (
          <div>
            <p className="font-medium mb-1">No conversations yet</p>
            <p className="text-sm">
              Messages will appear when leads contact you via WhatsApp
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div>
        {filteredConversations.map((conversation) => {
          const isSelected = selectedId === conversation.id
          const isActive = conversation.status === 'open' || conversation.status === 'handover'

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                'w-full p-3 text-left transition-colors border-l-2',
                isSelected
                  ? 'bg-primary/10 border-l-primary'
                  : 'hover:bg-muted/50 border-l-transparent'
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className={cn('h-10 w-10', getAvatarColor(conversation.contact.phone))}>
                  <AvatarFallback className="text-sm text-white font-medium bg-transparent">
                    {getInitials(conversation.contact.name, conversation.contact.phone)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {/* Row 1: Name + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate text-sm">
                      {conversation.contact.name || conversation.contact.phone}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: false,
                          }).replace('about ', '').replace('less than a minute', '1m')
                        : ''}
                    </span>
                  </div>

                  {/* Row 2: Preview text */}
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conversation.last_message_preview || 'No messages yet'}
                  </p>

                  {/* Row 3: Status + Source */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {isActive ? 'Active' : 'Closed'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {workspaceName}
                    </span>
                    {conversation.unread_count > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {conversation.unread_count}
                      </span>
                    )}
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
