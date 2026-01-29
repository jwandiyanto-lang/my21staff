'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Zap, X, Reply, Paperclip, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

interface ReplyContext {
  messageId: string
  content: string
  senderType: string
}

interface ComposeInputProps {
  workspaceId: string
  conversationId: string
  disabled?: boolean
  replyTo?: ReplyContext | null
  onClearReply?: () => void
}

// Dev mode version without Clerk
function ComposeInputDev({ workspaceId, conversationId, disabled }: ComposeInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [quickReplyOpen, setQuickReplyOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userId = 'dev-user-001'

  // Mock quick replies for dev mode
  const mockQuickReplies = [
    { _id: '1', shortcut: '/hi', message: 'Hello! How can I help you today?' },
    { _id: '2', shortcut: '/thanks', message: 'Thank you for contacting us!' },
  ]

  // Clear content when conversation changes
  useEffect(() => {
    setContent('')
  }, [conversationId])

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending) return
    // In dev mode, just simulate sending
    setIsSending(true)
    toast.success('Message sent (dev mode - not actually sent)')
    setContent('')
    setIsSending(false)
  }, [content, isSending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertQuickReply = (message: string) => {
    setContent(message)
    setQuickReplyOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t bg-background">
      {/* Reply context banner */}
      {replyTo && (
        <div className="px-4 pt-3 pb-2 border-b bg-muted/30">
          <div className="flex items-start gap-2 text-sm">
            <Reply className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Replying to {replyTo.senderType === 'contact' ? 'customer' : 'you'}
              </p>
              <p className="text-sm text-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onClearReply}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
      <Popover open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || isSending}
            className="flex-shrink-0"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start" side="top">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Quick Replies
            </div>
            {mockQuickReplies.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No quick replies yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create them in Settings → Quick Replies
                </p>
              </div>
            ) : (
              mockQuickReplies.map((reply) => (
                <button
                  key={reply._id}
                  onClick={() => insertQuickReply(reply.message)}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {reply.shortcut}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {reply.message}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <TextareaAutosize
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (dev mode)"
        minRows={1}
        maxRows={5}
        disabled={disabled || isSending}
        className="flex-1 resize-none rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || isSending || disabled}
        size="icon"
        className={cn(
          'transition-all duration-200',
          content.trim() && !isSending && 'scale-105 shadow-md'
        )}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className={cn(
            'h-4 w-4 transition-transform',
            content.trim() && 'scale-110'
          )} />
        )}
      </Button>
      </div>
    </div>
  )
}

// Production version with Clerk auth
function ComposeInputProd({ workspaceId, conversationId, disabled, replyTo, onClearReply }: ComposeInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [quickReplyOpen, setQuickReplyOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { userId } = useAuth()

  // Fetch quick replies from Convex
  const quickReplies = useQuery(api.quickReplies.list, { workspace_id: workspaceId })

  // Clear content when conversation changes
  useEffect(() => {
    setContent('')
    onClearReply?.()
  }, [conversationId, onClearReply])

  // Focus textarea when replying
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus()
    }
  }, [replyTo])

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending || !userId) return

    const messageContent = content.trim()
    const tempId = `temp-${Date.now()}`

    // Optimistic: Clear input immediately for snappy UX
    setContent('')
    setIsSending(true)

    // Create optimistic message event for instant feedback
    window.dispatchEvent(new CustomEvent('optimistic-message', {
      detail: {
        _id: tempId,
        conversation_id: conversationId,
        workspace_id: workspaceId,
        direction: 'outbound',
        sender_type: 'user',
        sender_id: userId,
        content: messageContent,
        message_type: 'text',
        created_at: Date.now(),
        isOptimistic: true,
      }
    }))

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          content: messageContent,
          sender_id: userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const result = await response.json()

      // Replace optimistic message with real one
      window.dispatchEvent(new CustomEvent('replace-optimistic-message', {
        detail: { tempId, realMessage: result.message }
      }))

      // Clear reply context after successful send
      onClearReply?.()

      // Success feedback (subtle, no intrusive toast)
    } catch (error) {
      console.error('Send error:', error)

      // Remove optimistic message on error
      window.dispatchEvent(new CustomEvent('remove-optimistic-message', {
        detail: { tempId }
      }))

      // Restore content so user can retry
      setContent(messageContent)
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

  const insertQuickReply = (message: string) => {
    setContent(message)
    setQuickReplyOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t bg-background">
      {/* Reply context banner */}
      {replyTo && (
        <div className="px-4 pt-3 pb-2 border-b bg-muted/30">
          <div className="flex items-start gap-2 text-sm">
            <Reply className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Replying to {replyTo.senderType === 'contact' ? 'customer' : 'you'}
              </p>
              <p className="text-sm text-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onClearReply}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
      <Popover open={quickReplyOpen} onOpenChange={setQuickReplyOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || isSending}
            className="flex-shrink-0"
            title="Quick replies"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start" side="top">
          <div className="space-y-1 max-h-96 overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Quick Replies
            </div>
            {!quickReplies || quickReplies.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No quick replies yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create them in Settings → Quick Replies
                </p>
              </div>
            ) : (
              quickReplies.map((reply) => (
                <button
                  key={reply._id}
                  onClick={() => insertQuickReply(reply.message)}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {reply.shortcut}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {reply.message}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <TextareaAutosize
        ref={textareaRef}
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
        className={cn(
          'transition-all duration-200',
          content.trim() && !isSending && 'scale-105 shadow-md'
        )}
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className={cn(
            'h-4 w-4 transition-transform',
            content.trim() && 'scale-110'
          )} />
        )}
      </Button>
      </div>
    </div>
  )
}

// Export the appropriate version based on dev mode
export function ComposeInput(props: ComposeInputProps) {
  if (isDevMode) {
    return <ComposeInputDev {...props} />
  }
  return <ComposeInputProd {...props} />
}
