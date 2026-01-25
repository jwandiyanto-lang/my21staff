'use client'

import { ConversationItem } from './conversation-item'
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

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Conversation items */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No conversations</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              conversation={conversation}
              isSelected={selectedId === conversation._id}
              onClick={() => onSelect(conversation._id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
