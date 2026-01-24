/**
 * Message bubble component.
 *
 * Displays a single message with:
 * - Brand colors for outbound messages (not WhatsApp green)
 * - Muted background for inbound messages
 * - Support for text, image, document, video, audio types
 * - Timestamp and read receipt status
 * - WhatsApp-style bubble shape with tail
 */

'use client'

import { format } from 'date-fns'
import { FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageStatus } from './message-status'

interface Message {
  _id: string
  direction: string
  sender_type: string
  content?: string
  message_type: string
  media_url?: string
  created_at: number
  metadata?: {
    status?: 'sent' | 'delivered' | 'read'
    filename?: string
    [key: string]: any
  }
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 shadow-sm',
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-white rounded-tl-none'
        )}
      >
        {/* Content based on message_type */}
        {message.message_type === 'image' && message.media_url && (
          <div className="mb-2">
            <img
              src={message.media_url}
              alt="Image"
              className="rounded max-w-full h-auto"
              style={{ maxWidth: '300px' }}
            />
          </div>
        )}

        {message.message_type === 'document' && message.media_url && (
          <DocumentCard
            filename={message.metadata?.filename || 'Document'}
            url={message.media_url}
            isOutbound={isOutbound}
          />
        )}

        {message.message_type === 'video' && message.media_url && (
          <div className="mb-2">
            <video
              src={message.media_url}
              controls
              className="rounded max-w-full h-auto"
              style={{ maxWidth: '300px' }}
            />
          </div>
        )}

        {message.message_type === 'audio' && message.media_url && (
          <div className="mb-2">
            <audio src={message.media_url} controls className="max-w-full" />
          </div>
        )}

        {(message.message_type === 'text' || !message.message_type) && message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Footer: time + status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span
            className={cn(
              'text-xs',
              isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOutbound && <MessageStatus status={message.metadata?.status} />}
        </div>
      </div>
    </div>
  )
}

/**
 * Document card for document message type.
 * Shows file icon, filename, and download button.
 */
function DocumentCard({
  filename,
  url,
  isOutbound,
}: {
  filename: string
  url: string
  isOutbound: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded border mb-2',
        isOutbound
          ? 'bg-primary-foreground/10 border-primary-foreground/20'
          : 'bg-muted border-border'
      )}
    >
      <FileText className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{filename}</p>
      </div>
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <Download className="h-5 w-5" />
      </a>
    </div>
  )
}
