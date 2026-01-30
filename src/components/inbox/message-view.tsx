'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isDevMode, getMockMessages } from '@/lib/mock-whatsapp-data'
import type { Id } from 'convex/_generated/dataModel'

interface Message {
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  content: string
  timestamp: string
  type: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  mediaUrl?: string | null
}

interface MessageViewProps {
  workspaceId: Id<'workspaces'>
  conversationId?: string
}

export function MessageView({ workspaceId, conversationId }: MessageViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      setError(null)
      setLoading(true)

      // Dev mode: use mock data
      if (isDevMode()) {
        setMessages(getMockMessages(conversationId))
        setLoading(false)
        return
      }

      // Production: fetch from API
      const response = await fetch(`/api/whatsapp/messages/${conversationId}?workspace=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fall back to mock data on error
      setMessages(getMockMessages(conversationId))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    // Auto-poll every 5 seconds in production
    if (!isDevMode() && conversationId) {
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [conversationId, workspaceId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return

    setSending(true)
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      direction: 'outbound',
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sent',
    }

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage])
    setMessageText('')

    try {
      if (!isDevMode()) {
        // Production: send via Kapso API
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            conversationId,
            message: messageText,
            type: 'text',
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const data = await response.json()
        // Update with real message data
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? { ...tempMessage, ...data.message } : m))
        )
      } else {
        // Dev mode: keep optimistic update
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove temporary message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setError('Failed to send message')
    } finally {
      setSending(false)
      // Focus back on input
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString)
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${formatTime(dateString)}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Info className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            C
          </Avatar>
          <div>
            <h3 className="font-semibold">Conversation</h3>
            <p className="text-xs text-muted-foreground font-mono">{conversationId}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Video className="h-4 w-4 mr-2" />
              Video Call
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Info className="h-4 w-4 mr-2" />
              Contact Info
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dev mode indicator */}
      {isDevMode() && (
        <div className="px-4 py-2 bg-accent/10 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono">Offline Mode</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-border">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isFirstInGroup = index === 0 || messages[index - 1].direction !== message.direction
              return (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.direction === 'outbound'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words font-mono">{message.content}</p>
                    </div>

                    {/* Timestamp and status */}
                    <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                      message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="font-mono">{formatDate(message.timestamp)}</span>
                      {message.direction === 'outbound' && message.status && (
                        <span className="font-mono">
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'read' && '✓✓'}
                          {message.status === 'failed' && '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full min-h-[44px] max-h-32 px-4 py-3 pr-12 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={1}
              disabled={sending}
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="shrink-0"
          >
            {sending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
