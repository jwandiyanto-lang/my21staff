/**
 * Message status indicator (read receipts).
 *
 * Shows WhatsApp-style checkmarks for message delivery status:
 * - sent: single gray checkmark
 * - delivered: double gray checkmarks
 * - read: double blue checkmarks
 */

import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageStatusProps {
  status?: 'sent' | 'delivered' | 'read'
}

export function MessageStatus({ status }: MessageStatusProps) {
  if (!status) return null

  if (status === 'sent') {
    return <Check className="h-3 w-3 text-muted-foreground" />
  }

  const isRead = status === 'read'

  return (
    <CheckCheck
      className={cn(
        'h-3 w-3',
        isRead ? 'text-blue-500' : 'text-muted-foreground'
      )}
    />
  )
}
