/**
 * Message bubble component.
 *
 * Displays a single message with:
 * - Brand colors for outbound messages (not WhatsApp green)
 * - Muted background for inbound messages
 * - Support for text, image, document, video, audio types
 * - Timestamp and read receipt status
 * - WhatsApp-style bubble shape with tail
 * - Reply functionality on hover
 */

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Download, Reply } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onReply?: (message: Message) => void
}

export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const [isHovered, setIsHovered] = useState(false)

  const handleReply = () => {
    onReply?.(message)
  }

  return (
    <div
      className={cn('flex group', isOutbound ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Reply button - left side for outbound, shows on hover */}
      {isOutbound && isHovered && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity mr-1 self-end mb-1"
          onClick={handleReply}
          title="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
        </Button>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-3 py-2 shadow-sm',
          isOutbound
            ? 'bg-emerald-500 text-white rounded-tr-sm'
            : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
        )}
      >
        {/* Content based on message_type */}
        {message.message_type === 'image' && message.media_url && (
          <>
            {message.content && (
              <p className="mb-2 whitespace-pre-wrap break-words text-sm">{message.content}</p>
            )}
            <div className="mb-2 overflow-hidden rounded-lg">
              <img
                src={message.media_url}
                alt="Image"
                className="max-w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                style={{ maxWidth: '280px' }}
              />
            </div>
          </>
        )}
        {message.message_type === 'image' && !message.media_url && (
          <div className="mb-2 p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm font-medium">Image attached</p>
            <p className="text-xs text-muted-foreground mt-1">View on your phone to see the image</p>
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
          <div className="mb-2 overflow-hidden rounded-lg">
            <video
              src={message.media_url}
              controls
              className="max-w-full h-auto"
              style={{ maxWidth: '280px' }}
            />
          </div>
        )}

        {message.message_type === 'audio' && message.media_url && (
          <div className="mb-2">
            <audio src={message.media_url} controls className="max-w-full h-8" />
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
              isOutbound ? 'text-white/70' : 'text-gray-500'
            )}
          >
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
          {isOutbound && <MessageStatus status={message.metadata?.status} />}
        </div>
      </div>

      {/* Reply button - right side for inbound, shows on hover */}
      {!isOutbound && isHovered && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ml-1 self-end mb-1"
          onClick={handleReply}
          title="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
        </Button>
      )}
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
