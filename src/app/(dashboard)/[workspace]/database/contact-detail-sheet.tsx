'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Tag,
  ArrowRight,
  Loader2,
  X,
  Plus,
} from 'lucide-react'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Contact, Message } from '@/types/database'

interface ContactDetailSheetProps {
  contact: Contact | null
  workspace: { slug: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailSheet({
  contact,
  workspace,
  open,
  onOpenChange,
}: ContactDetailSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state for optimistic updates
  const [localStatus, setLocalStatus] = useState<LeadStatus>(contact?.lead_status as LeadStatus || 'prospect')
  const [localScore, setLocalScore] = useState(contact?.lead_score || 50)
  const [localTags, setLocalTags] = useState<string[]>(contact?.tags || [])
  const [newTagInput, setNewTagInput] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingScore, setIsUpdatingScore] = useState(false)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Messages state
  const [activeTab, setActiveTab] = useState('details')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [messagesLoaded, setMessagesLoaded] = useState(false)

  // Sync local state when contact changes
  useEffect(() => {
    if (contact) {
      setLocalStatus(contact.lead_status as LeadStatus)
      setLocalScore(contact.lead_score)
      setLocalTags(contact.tags || [])
      // Reset messages state for new contact
      setMessages([])
      setMessagesLoaded(false)
      setActiveTab('details')
    }
  }, [contact])

  // Debounced score update
  const debouncedScoreUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return (contactId: string, score: number) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          setIsUpdatingScore(true)
          try {
            const response = await fetch(`/api/contacts/${contactId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lead_score: score }),
            })
            if (!response.ok) {
              // Revert on error
              if (contact) setLocalScore(contact.lead_score)
              console.error('Failed to update score')
            } else {
              // Refresh data
              startTransition(() => {
                router.refresh()
              })
            }
          } catch (error) {
            // Revert on error
            if (contact) setLocalScore(contact.lead_score)
            console.error('Error updating score:', error)
          } finally {
            setIsUpdatingScore(false)
          }
        }, 500)
      }
    })(),
    [contact, router]
  )

  // Status update handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!contact) return

    // Optimistic update
    const previousStatus = localStatus
    setLocalStatus(newStatus)
    setIsUpdatingStatus(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
        setLocalStatus(previousStatus)
        console.error('Failed to update status')
      } else {
        // Refresh data
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      // Revert on error
      setLocalStatus(previousStatus)
      console.error('Error updating status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Score change handler
  const handleScoreChange = (value: number[]) => {
    if (!contact) return
    const newScore = value[0]
    setLocalScore(newScore)
    debouncedScoreUpdate(contact.id, newScore)
  }

  // Tag management handlers
  const handleAddTag = async () => {
    if (!contact) return
    const trimmedTag = newTagInput.trim()
    if (!trimmedTag) return

    // Prevent duplicates (case-insensitive)
    if (localTags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      setNewTagInput('')
      return
    }

    const newTags = [...localTags, trimmedTag]

    // Optimistic update
    setLocalTags(newTags)
    setNewTagInput('')
    setIsUpdatingTags(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })

      if (!response.ok) {
        // Revert on error
        setLocalTags(contact.tags || [])
        console.error('Failed to add tag')
      } else {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      setLocalTags(contact.tags || [])
      console.error('Error adding tag:', error)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!contact) return

    const newTags = localTags.filter(t => t !== tagToRemove)
    const previousTags = localTags

    // Optimistic update
    setLocalTags(newTags)
    setIsUpdatingTags(true)

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })

      if (!response.ok) {
        setLocalTags(previousTags)
        console.error('Failed to remove tag')
      } else {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      setLocalTags(previousTags)
      console.error('Error removing tag:', error)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Load messages when Messages tab is selected
  const loadMessages = useCallback(async () => {
    if (!contact || messagesLoaded || isLoadingMessages) return

    setIsLoadingMessages(true)
    try {
      const supabase = createClient()

      // First, find conversation for this contact
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .single()

      if (conversation) {
        // Load messages for this conversation
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
          .limit(100)

        setMessages(messagesData || [])
      }
      setMessagesLoaded(true)
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessagesLoaded(true)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [contact, messagesLoaded, isLoadingMessages])

  // Handle tab change - lazy load messages
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'messages' && !messagesLoaded) {
      loadMessages()
    }
  }

  if (!contact) return null

  const initials = contact.name
    ? contact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : contact.phone.slice(-2)

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.prospect

  const openWhatsApp = () => {
    const phone = contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  // Extract form responses from metadata if present
  const metadata = contact.metadata as Record<string, unknown> | null
  const formResponses = metadata && typeof metadata === 'object'
    ? Object.entries(metadata).filter(([key]) => !key.startsWith('_'))
    : []

  // Lead score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // green
    if (score >= 60) return '#F59E0B' // yellow
    if (score >= 40) return '#3B82F6' // blue
    return '#6B7280' // gray
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">
                {contact.name || contact.phone}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Select
                  value={localStatus}
                  onValueChange={(value) => handleStatusChange(value as LeadStatus)}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger
                    className="w-auto h-7 text-xs border-none shadow-none px-2"
                    style={{
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => {
                      const config = LEAD_STATUS_CONFIG[status]
                      return (
                        <SelectItem
                          key={status}
                          value={status}
                          className="text-xs"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: config.color }}
                          />
                          {config.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {isUpdatingStatus && (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={openWhatsApp}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-12">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 m-0 overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Added {format(new Date(contact.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lead Score */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Lead Score
                    </h3>
                    <div className="flex items-center gap-2">
                      {isUpdatingScore && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      <span
                        className="text-xl font-semibold tabular-nums"
                        style={{ color: getScoreColor(localScore) }}
                      >
                        {localScore}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(localScore, 100)}%`,
                          backgroundColor: getScoreColor(localScore),
                        }}
                      />
                    </div>
                    <Slider
                      value={[localScore]}
                      onValueChange={handleScoreChange}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tags */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Tags
                    </h3>
                    {isUpdatingTags && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {localTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {localTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="pr-1">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                            disabled={isUpdatingTags}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                  {/* Add tag input */}
                  <div className="flex gap-2">
                    <Input
                      ref={tagInputRef}
                      type="text"
                      placeholder="Add a tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="h-8 text-sm"
                      disabled={isUpdatingTags}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!newTagInput.trim() || isUpdatingTags}
                      className="h-8 px-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Form Responses (from metadata) */}
                {formResponses.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Form Responses
                      </h3>
                      <div className="space-y-3">
                        {formResponses.map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-4">
                            <span className="text-sm text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-medium text-right">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 m-0 overflow-hidden flex flex-col">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="mt-4 text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-3">
                  {messages.map((message) => {
                    const isOutbound = message.direction === 'outbound'
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'max-w-[85%] rounded-lg px-3 py-2',
                          isOutbound
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <span className={cn(
                          'text-xs block mt-1',
                          isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {format(new Date(message.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start a conversation in the Inbox
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Activity timeline coming soon
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button asChild className="w-full">
            <Link href={`/${workspace.slug}/inbox?contact=${contact.id}`}>
              Open in Inbox
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
