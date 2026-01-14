'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SendHorizonal, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Message } from '@/types/database'

interface MessageInputProps {
  conversationId: string
  contactPhone: string
  workspaceId: string
  onMessageSent: (message: Message, isOptimistic: boolean) => void
  onMessageError: (optimisticId: string) => void
}

export function MessageInput({
  conversationId,
  contactPhone,
  workspaceId,
  onMessageSent,
  onMessageError,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent || isSending) return

    // Create optimistic message
    const optimisticId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      workspace_id: workspaceId,
      direction: 'outbound',
      sender_type: 'user',
      sender_id: null,
      content: trimmedContent,
      message_type: 'text',
      media_url: null,
      kapso_message_id: null,
      metadata: { status: 'sending' },
      created_at: new Date().toISOString(),
    }

    // Clear input immediately and show optimistic message
    setContent('')
    onMessageSent(optimisticMessage, true)
    setIsSending(true)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: trimmedContent }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const { message } = await response.json()

      // Replace optimistic message with real one
      onMessageSent({ ...message, _optimisticId: optimisticId } as Message & { _optimisticId: string }, false)
    } catch (error) {
      console.error('Send error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
      // Remove optimistic message on error
      onMessageError(optimisticId)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="border-t p-4 bg-background">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSending || !content.trim()}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
