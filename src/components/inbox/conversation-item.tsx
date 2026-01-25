'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
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
    tags?: string[]
  } | null
}

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const contact = conversation.contact
  const displayName = contact?.name || contact?.kapso_name || contact?.phone || 'Unknown'
  const initials = displayName.charAt(0).toUpperCase()

  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      // Less than 24h: show relative time
      return formatDistanceToNow(date, { addSuffix: true })
    } else if (diffInHours < 168) {
      // Less than 7 days: show day name
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      // Older: show date
      return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
    }
  }

  // Get first 2 tags, show +N if more
  const displayTags = contact?.tags?.slice(0, 2) || []
  const remainingTags = (contact?.tags?.length || 0) - displayTags.length

  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 cursor-pointer border-b
        ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}
        transition-colors
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-base">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and timestamp row */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTimestamp(conversation.last_message_at)}
            </span>
          </div>

          {/* Message preview */}
          {conversation.last_message_preview && (
            <p className="text-sm text-muted-foreground truncate mb-1">
              {conversation.last_message_preview}
            </p>
          )}

          {/* Tags and unread badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {displayTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags}
              </Badge>
            )}
            {conversation.unread_count > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
