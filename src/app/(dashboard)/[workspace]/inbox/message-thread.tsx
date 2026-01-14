'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import type { Contact, Message } from '@/types/database'

interface MessageThreadProps {
  messages: Message[]
  conversationContact: Contact
  isLoading: boolean
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return phone.slice(-2)
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div
      className={cn(
        'max-w-[70%] rounded-lg px-4 py-2',
        isOutbound
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted'
      )}
    >
      {message.message_type === 'image' && message.media_url && (
        <div className="mb-2">
          <div className="text-xs opacity-70 mb-1">[Image]</div>
          {message.metadata && typeof message.metadata === 'object' && 'caption' in message.metadata && (
            <p className="text-sm">{String(message.metadata.caption)}</p>
          )}
        </div>
      )}
      {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
      <span className={cn(
        'text-xs block mt-1',
        isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {format(new Date(message.created_at), 'HH:mm')}
      </span>
    </div>
  )
}

export function MessageThread({ messages, conversationContact, isLoading }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusConfig = LEAD_STATUS_CONFIG[conversationContact.lead_status as LeadStatus]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-muted">
            {getInitials(conversationContact.name, conversationContact.phone)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {conversationContact.name || conversationContact.phone}
            </p>
            {statusConfig && (
              <Badge
                variant="outline"
                style={{
                  color: statusConfig.color,
                  borderColor: statusConfig.color,
                  backgroundColor: statusConfig.bgColor,
                }}
                className="text-xs"
              >
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {conversationContact.name && conversationContact.phone}
            {conversationContact.lead_score > 0 && (
              <span className="ml-2">• Score: {conversationContact.lead_score}</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
