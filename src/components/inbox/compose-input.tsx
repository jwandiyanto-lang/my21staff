'use client'

import { useState, useCallback } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface ComposeInputProps {
  workspaceId: string
  conversationId: string
  disabled?: boolean
}

export function ComposeInput({ workspaceId, conversationId, disabled }: ComposeInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { userId } = useAuth()

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending || !userId) return

    setIsSending(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          content: content.trim(),
          sender_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      setContent('')
    } catch (error) {
      console.error('Send error:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }, [content, workspaceId, conversationId, userId, isSending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t bg-background">
      <TextareaAutosize
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        minRows={1}
        maxRows={5}
        disabled={disabled || isSending}
        className="flex-1 resize-none rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || isSending || disabled}
        size="icon"
      >
        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </div>
  )
}
