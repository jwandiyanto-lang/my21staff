'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { format, formatDistanceToNow, isToday, isYesterday, isSameDay } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, MessageSquare, Clock, Bot, User, FileText, Film, Download, MoreVertical, Merge, Search, Check, StickyNote, Send, ChevronDown, ChevronUp, X, Phone, Mail, MapPin, Calendar, Star, Info, XCircle, Reply } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LEAD_STATUS_CONFIG, type LeadStatus } from '@/lib/lead-status'
import { createClient } from '@/lib/supabase/client'
import type { Contact, Message, Profile, ContactNote } from '@/types/database'

type ContactNoteWithAuthor = ContactNote & {
  author?: Profile
}

interface MessageThreadProps {
  messages: Message[]
  conversationContact: Contact
  conversationId: string
  conversationStatus: string
  workspaceId: string
  isLoading: boolean
  onHandoverChange?: (aiPaused: boolean) => void
  onContactMerged?: () => void
  onClose?: () => void
  showInfoPanel?: boolean
  onToggleInfoPanel?: () => void
  onReply?: (message: Message) => void
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

function getAvatarColor(name: string | null, phone: string): string {
  const str = name || phone
  const colors = [
    'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
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

function getFirstName(name: string | null, phone: string): string {
  if (name) {
    return name.split(' ')[0]
  }
  return phone
}

function isSendingMessage(message: Message): boolean {
  return (
    typeof message.metadata === 'object' &&
    message.metadata !== null &&
    'status' in message.metadata &&
    message.metadata.status === 'sending'
  )
}

function MessageBubble({ message, contactName, contactPhone, onReply, allMessages }: { message: Message; contactName?: string | null; contactPhone?: string; onReply?: (message: Message) => void; allMessages?: Message[] }) {
  const isOutbound = message.direction === 'outbound'
  const isSending = isSendingMessage(message)
  const metadata = message.metadata as Record<string, unknown> | null

  // Check if this message is a reply to another message
  const replyToKapsoId = metadata?.reply_to_kapso_id as string | undefined
  const replyToId = metadata?.replyToId as string | undefined // For messages we sent with reply

  // Find the original message being replied to
  const quotedMessage = allMessages?.find(m =>
    (replyToKapsoId && m.kapso_message_id === replyToKapsoId) ||
    (replyToId && m.id === replyToId)
  )

  // Render quoted message preview
  const renderQuotedMessage = () => {
    if (!quotedMessage) return null

    const isQuotedOutbound = quotedMessage.direction === 'outbound'
    const quotedContent = quotedMessage.content?.slice(0, 100) || `[${quotedMessage.message_type}]`
    const displayContent = quotedContent.length > 100 ? quotedContent + '...' : quotedContent

    return (
      <div
        className={cn(
          'mb-2 p-2 rounded-lg border-l-2 text-xs',
          isOutbound
            ? 'bg-white/10 border-white/40'
            : 'bg-muted-foreground/10 border-muted-foreground/40'
        )}
      >
        <p className={cn(
          'font-medium mb-0.5',
          isOutbound ? 'text-white/70' : 'text-muted-foreground'
        )}>
          {isQuotedOutbound ? 'You' : (contactName || contactPhone || 'Contact')}
        </p>
        <p className={cn(
          'line-clamp-2',
          isOutbound ? 'text-white/60' : 'text-muted-foreground'
        )}>
          {displayContent}
        </p>
      </div>
    )
  }

  const renderMedia = () => {
    if (!message.media_url) return null

    switch (message.message_type) {
      case 'image':
        return (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
            <img
              src={message.media_url}
              alt="Image"
              className="max-w-full rounded-lg max-h-64 object-cover"
            />
          </a>
        )
      case 'video':
        return (
          <div className="mb-2">
            <video
              src={message.media_url}
              controls
              className="max-w-full rounded-lg max-h-64"
            />
          </div>
        )
      case 'document':
        const filename = metadata?.filename as string | undefined
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 mb-2 p-2 rounded-lg',
              isOutbound ? 'bg-white/10' : 'bg-muted-foreground/10'
            )}
          >
            <FileText className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{filename || 'Document'}</p>
              <p className="text-xs opacity-70">Click to download</p>
            </div>
            <Download className="h-4 w-4" />
          </a>
        )
      default:
        return null
    }
  }

  const ReplyButton = () => (
    <button
      onClick={() => onReply?.(message)}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-muted"
      title="Reply"
    >
      <Reply className="h-4 w-4 text-muted-foreground" />
    </button>
  )

  // Outbound messages with avatar (like Kapso)
  if (isOutbound) {
    return (
      <div className="flex items-end gap-2 justify-end group">
        {onReply && <ReplyButton />}
        <div
          className={cn(
            'max-w-[70%] rounded-2xl rounded-br-sm px-4 py-2 bg-[#2D4B3E] text-white',
            isSending && 'opacity-70'
          )}
        >
          {renderQuotedMessage()}
          {renderMedia()}
          {message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}
          <span className="text-xs block mt-1 text-white/60">
            {isSending ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sending...
              </span>
            ) : (
              format(new Date(message.created_at), 'hh:mm a')
            )}
          </span>
        </div>
      </div>
    )
  }

  // Inbound messages with avatar
  return (
    <div className="flex items-end gap-2 group">
      <Avatar className={cn('h-8 w-8 flex-shrink-0', getAvatarColor(contactName || null, contactPhone || ''))}>
        <AvatarFallback className="text-xs text-white font-medium bg-transparent">
          {getInitials(contactName || null, contactPhone || '')}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-2 bg-muted'
        )}
      >
        {renderQuotedMessage()}
        {renderMedia()}
        {message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}
        <span className="text-xs block mt-1 text-muted-foreground">
          {format(new Date(message.created_at), 'hh:mm a')}
        </span>
      </div>
      {onReply && <ReplyButton />}
    </div>
  )
}

export function MessageThread({
  messages,
  conversationContact,
  conversationId,
  conversationStatus,
  workspaceId,
  isLoading,
  onHandoverChange,
  onContactMerged,
  onClose,
  showInfoPanel = false,
  onToggleInfoPanel,
  onReply,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusConfig = LEAD_STATUS_CONFIG[conversationContact.lead_status as LeadStatus] || LEAD_STATUS_CONFIG.prospect
  const [isTogglingHandover, setIsTogglingHandover] = useState(false)

  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeStep, setMergeStep] = useState<'search' | 'confirm'>('search')
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeContacts, setMergeContacts] = useState<Contact[]>([])
  const [isSearchingContacts, setIsSearchingContacts] = useState(false)
  const [selectedMergeContact, setSelectedMergeContact] = useState<Contact | null>(null)
  const [keepContactId, setKeepContactId] = useState<string | null>(null) // Which contact to keep
  const [selectedPhone, setSelectedPhone] = useState<string>('') // Which phone to keep
  const [selectedEmail, setSelectedEmail] = useState<string>('') // Which email to keep
  const [isMerging, setIsMerging] = useState(false)

  // Notes panel state
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [notes, setNotes] = useState<ContactNoteWithAuthor[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Contact details panel state
  const [showContactDetails, setShowContactDetails] = useState(false)

  const aiPaused = conversationStatus === 'handover'

  // Search contacts for merge
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMergeContacts([])
      return
    }
    setIsSearchingContacts(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .neq('id', conversationContact.id) // Exclude current contact
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)
      setMergeContacts(data || [])
    } catch (error) {
      console.error('Error searching contacts:', error)
    } finally {
      setIsSearchingContacts(false)
    }
  }, [workspaceId, conversationContact.id])

  // Calculate completeness score for a contact
  const getCompletenessScore = (contact: Contact): number => {
    let score = 0
    if (contact.name?.trim()) score += 2
    if (contact.email?.trim()) score += 2
    score += contact.lead_score || 0
    if (contact.tags && contact.tags.length > 0) score += Math.min(contact.tags.length, 5)
    const metadata = contact.metadata as Record<string, unknown> | null
    if (metadata) {
      const innerMeta = (metadata.metadata as Record<string, unknown>) || metadata
      const formAnswers = innerMeta?.form_answers || metadata?.form_answers
      if (formAnswers && typeof formAnswers === 'object' && Object.keys(formAnswers).length > 0) {
        score += 5
      }
    }
    return score
  }

  // Proceed to confirmation step
  const handleProceedToConfirm = () => {
    if (!selectedMergeContact) return
    // Auto-select the more complete profile
    const currentScore = getCompletenessScore(conversationContact)
    const selectedScore = getCompletenessScore(selectedMergeContact)
    setKeepContactId(selectedScore > currentScore ? selectedMergeContact.id : conversationContact.id)
    // Default phone to current conversation (for WhatsApp continuity)
    setSelectedPhone(conversationContact.phone)
    // Default email to whichever contact has one
    setSelectedEmail(conversationContact.email || selectedMergeContact.email || '')
    setMergeStep('confirm')
  }

  // Handle merge with chosen direction
  const handleMerge = async () => {
    if (!selectedMergeContact || !keepContactId || !selectedPhone) return
    setIsMerging(true)

    const keepContact = keepContactId === conversationContact.id ? conversationContact : selectedMergeContact
    const mergeContact = keepContactId === conversationContact.id ? selectedMergeContact : conversationContact

    try {
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepContactId: keepContact.id,
          mergeContactId: mergeContact.id,
          // User-selected phone and email
          activePhone: selectedPhone,
          activeEmail: selectedEmail || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to merge contacts')
      }
      toast.success(`Merged ${mergeContact.name || mergeContact.phone} into ${keepContact.name || keepContact.phone}`)
      setMergeDialogOpen(false)
      setSelectedMergeContact(null)
      setMergeSearch('')
      setMergeStep('search')
      setKeepContactId(null)
      setSelectedPhone('')
      setSelectedEmail('')
      onContactMerged?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to merge contacts')
    } finally {
      setIsMerging(false)
    }
  }

  // Reset merge dialog
  const resetMergeDialog = () => {
    setMergeDialogOpen(false)
    setMergeStep('search')
    setSelectedMergeContact(null)
    setMergeSearch('')
    setKeepContactId(null)
    setSelectedPhone('')
    setSelectedEmail('')
  }

  const handleHandoverToggle = async () => {
    setIsTogglingHandover(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: !aiPaused }),
      })

      if (response.ok) {
        onHandoverChange?.(!aiPaused)
      }
    } catch (error) {
      console.error('Failed to toggle handover:', error)
    } finally {
      setIsTogglingHandover(false)
    }
  }

  // Load notes when panel is opened
  const loadNotes = useCallback(async () => {
    if (notesLoaded || isLoadingNotes) return

    setIsLoadingNotes(true)
    try {
      const response = await fetch(`/api/contacts/${conversationContact.id}/notes`)
      if (response.ok) {
        const { notes: notesData } = await response.json()
        setNotes(notesData || [])
      }
      setNotesLoaded(true)
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotesLoaded(true)
    } finally {
      setIsLoadingNotes(false)
    }
  }, [conversationContact.id, notesLoaded, isLoadingNotes])

  // Toggle notes panel
  const toggleNotesPanel = () => {
    const newState = !showNotesPanel
    setShowNotesPanel(newState)
    if (newState && !notesLoaded) {
      loadNotes()
    }
  }

  // Add a new note
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setIsAddingNote(true)
    try {
      const response = await fetch(`/api/contacts/${conversationContact.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      })

      if (response.ok) {
        const { note } = await response.json()
        setNotes((prev) => [note, ...prev])
        setNewNoteContent('')
        toast.success('Note added')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  // Reset panels when contact changes
  useEffect(() => {
    setNotes([])
    setNotesLoaded(false)
    setShowNotesPanel(false)
    setNewNoteContent('')
    setShowContactDetails(false)
  }, [conversationContact.id])

  // Track if this is initial load or new message
  const prevMessagesLengthRef = useRef<number>(0)
  const isInitialLoadRef = useRef<boolean>(true)

  useEffect(() => {
    // Reset initial load flag when conversation changes
    isInitialLoadRef.current = true
    prevMessagesLengthRef.current = 0
  }, [conversationId])

  useEffect(() => {
    if (messages.length === 0) return

    // Determine scroll behavior
    const isInitialLoad = isInitialLoadRef.current
    const isNewMessage = messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0

    // Update refs
    prevMessagesLengthRef.current = messages.length
    isInitialLoadRef.current = false

    // Instant scroll on initial load, smooth for new messages
    messagesEndRef.current?.scrollIntoView({
      behavior: isInitialLoad ? 'instant' : 'smooth'
    })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Calculate last activity time
  const lastActivityTime = messages.length > 0
    ? formatDistanceToNow(new Date(messages[messages.length - 1].created_at), { addSuffix: false })
    : null

  const isActive = conversationStatus === 'open' || conversationStatus === 'handover'

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header - Kapso style */}
      <div className="px-4 py-3 border-b bg-background flex items-center gap-3">
        {/* Avatar and contact info */}
        <Avatar className={cn('h-10 w-10', getAvatarColor(conversationContact.name, conversationContact.phone))}>
          <AvatarFallback className="text-sm text-white font-medium bg-transparent">
            {getInitials(conversationContact.name, conversationContact.phone)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {conversationContact.name || conversationContact.phone}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className={isActive ? 'text-emerald-600' : ''}>
              {isActive ? 'Active' : 'Closed'}
            </span>
            {lastActivityTime && (
              <> • {lastActivityTime} ago</>
            )}
            <> • {conversationContact.phone}</>
          </p>
        </div>

        {/* Close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="h-4 w-4" />
            Close
          </Button>
        )}

        {/* Info toggle */}
        {onToggleInfoPanel && (
          <Button
            variant={showInfoPanel ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggleInfoPanel}
            className="gap-1.5"
          >
            <Info className="h-4 w-4" />
            Info
          </Button>
        )}
      </div>

      {/* Secondary header with actions */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
        {/* Notes Toggle */}
        <Button
          variant={showNotesPanel ? 'secondary' : 'ghost'}
          size="sm"
          onClick={toggleNotesPanel}
          className="gap-1.5 h-8 text-xs"
        >
          <StickyNote className="h-3.5 w-3.5" />
          Notes
          {notes.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
              {notes.length}
            </span>
          )}
        </Button>

        {/* Handover Toggle */}
        <Button
          variant={aiPaused ? 'secondary' : 'ghost'}
          size="sm"
          onClick={handleHandoverToggle}
          disabled={isTogglingHandover}
          className="gap-1.5 h-8 text-xs"
        >
          {isTogglingHandover ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : aiPaused ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Bot className="h-3.5 w-3.5" />
          )}
          {aiPaused ? 'Manual mode' : 'AI Aktif'}
        </Button>

        <div className="flex-1" />

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowContactDetails(!showContactDetails)}>
              <User className="h-4 w-4 mr-2" />
              Contact Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMergeDialogOpen(true)}>
              <Merge className="h-4 w-4 mr-2" />
              Merge Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Details Panel (Collapsible) */}
      {showContactDetails && (
        <div className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Contact Details</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowContactDetails(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Full Name */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{conversationContact.name || '-'}</p>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{conversationContact.phone}</p>
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{conversationContact.email || '-'}</p>
              </div>
            </div>
            {/* Lead Score */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Lead Score</p>
                <p className="font-medium">{conversationContact.lead_score}</p>
              </div>
            </div>
            {/* Created */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">First Contact</p>
                <p className="font-medium">{format(new Date(conversationContact.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
          {/* Tags */}
          {conversationContact.tags && conversationContact.tags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {conversationContact.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes Panel (Collapsible) */}
      {showNotesPanel && (
        <div className="border-b bg-muted/30">
          {/* Add Note Input */}
          <div className="p-3 border-b">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note about this lead..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[50px] text-sm resize-none bg-background"
                disabled={isAddingNote}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    e.preventDefault()
                    handleAddNote()
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || isAddingNote}
                className="h-[50px] w-[50px]"
              >
                {isAddingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">⌘+Enter to save</p>
          </div>

          {/* Notes List */}
          <div className="max-h-48 overflow-auto">
            {isLoadingNotes ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length > 0 ? (
              <div className="divide-y">
                {notes.map((note) => (
                  <div key={note.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{note.author?.full_name || note.author?.email || 'Unknown'}</span>
                      <span>•</span>
                      <span>{format(new Date(note.created_at), 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notes yet. Add the first note above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => {
              const messageDate = new Date(message.created_at)
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showDaySeparator = !prevMessage || !isSameDay(messageDate, new Date(prevMessage.created_at))

              return (
                <div key={message.id}>
                  {/* Day separator */}
                  {showDaySeparator && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {getDayLabel(messageDate)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    contactName={conversationContact.name}
                    contactPhone={conversationContact.phone}
                    onReply={onReply}
                    allMessages={messages}
                  />
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Merge Contact Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={resetMergeDialog}>
        <DialogContent className={cn("sm:max-w-md", mergeStep === 'confirm' && "sm:max-w-2xl")}>
          <DialogHeader>
            <DialogTitle>
              {mergeStep === 'search' ? 'Merge Contact' : 'Confirm Merge Direction'}
            </DialogTitle>
            <DialogDescription>
              {mergeStep === 'search'
                ? 'Search for a contact to merge with this one.'
                : 'Choose which profile to keep. The other will be merged into it.'}
            </DialogDescription>
          </DialogHeader>

          {mergeStep === 'search' ? (
            <div className="space-y-4 py-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={mergeSearch}
                  onChange={(e) => {
                    setMergeSearch(e.target.value)
                    searchContacts(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>

              {/* Selected contact */}
              {selectedMergeContact && (
                <div className="border rounded-lg p-3 bg-primary/5 border-primary">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedMergeContact.name, selectedMergeContact.phone)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{selectedMergeContact.name || selectedMergeContact.phone}</p>
                      <p className="text-sm text-muted-foreground">{selectedMergeContact.phone}</p>
                    </div>
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}

              {/* Search results */}
              {isSearchingContacts ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : mergeContacts.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {mergeContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedMergeContact(contact)}
                      className={cn(
                        'w-full text-left border rounded-lg p-3 transition-colors',
                        selectedMergeContact?.id === contact.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted">
                            {getInitials(contact.name, contact.phone)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name || contact.phone}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.phone}
                            {contact.email && ` • ${contact.email}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : mergeSearch.trim() ? (
                <p className="text-center py-4 text-muted-foreground">No contacts found</p>
              ) : null}

              {/* Next button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetMergeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToConfirm}
                  disabled={!selectedMergeContact}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            /* Confirmation step - show both profiles side by side */
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Current contact */}
                <button
                  onClick={() => setKeepContactId(conversationContact.id)}
                  className={cn(
                    'border rounded-lg p-4 text-left transition-all',
                    keepContactId === conversationContact.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(conversationContact.name, conversationContact.phone)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conversationContact.name || conversationContact.phone}</p>
                      <p className="text-xs text-muted-foreground">{conversationContact.phone}</p>
                    </div>
                    {keepContactId === conversationContact.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className={conversationContact.email ? 'font-medium' : 'text-muted-foreground'}>
                        {conversationContact.email || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Score</span>
                      <span className="font-medium">{conversationContact.lead_score || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tags</span>
                      <span className="font-medium">{conversationContact.tags?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium capitalize">{conversationContact.lead_status || 'prospect'}</span>
                    </div>
                  </div>
                  {keepContactId === conversationContact.id && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs font-medium text-primary">✓ Keep this profile</span>
                    </div>
                  )}
                </button>

                {/* Selected merge contact */}
                {selectedMergeContact && (
                  <button
                    onClick={() => setKeepContactId(selectedMergeContact.id)}
                    className={cn(
                      'border rounded-lg p-4 text-left transition-all',
                      keepContactId === selectedMergeContact.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-muted">
                          {getInitials(selectedMergeContact.name, selectedMergeContact.phone)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{selectedMergeContact.name || selectedMergeContact.phone}</p>
                        <p className="text-xs text-muted-foreground">{selectedMergeContact.phone}</p>
                      </div>
                      {keepContactId === selectedMergeContact.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className={selectedMergeContact.email ? 'font-medium' : 'text-muted-foreground'}>
                          {selectedMergeContact.email || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lead Score</span>
                        <span className="font-medium">{selectedMergeContact.lead_score || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tags</span>
                        <span className="font-medium">{selectedMergeContact.tags?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{selectedMergeContact.lead_status || 'prospect'}</span>
                      </div>
                    </div>
                    {keepContactId === selectedMergeContact.id && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs font-medium text-primary">✓ Keep this profile</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Phone & Email Selection */}
              {selectedMergeContact && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium">Choose which to keep:</h4>

                  {/* Phone Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Phone Number (for WhatsApp)</label>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                        <input
                          type="radio"
                          name="phone"
                          checked={selectedPhone === conversationContact.phone}
                          onChange={() => setSelectedPhone(conversationContact.phone)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{conversationContact.phone}</span>
                        <span className="text-xs text-muted-foreground ml-auto">(Current chat)</span>
                      </label>
                      {selectedMergeContact.phone !== conversationContact.phone && (
                        <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                          <input
                            type="radio"
                            name="phone"
                            checked={selectedPhone === selectedMergeContact.phone}
                            onChange={() => setSelectedPhone(selectedMergeContact.phone)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{selectedMergeContact.phone}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Email Selection */}
                  {(conversationContact.email || selectedMergeContact.email) && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                      <div className="space-y-1">
                        {conversationContact.email && (
                          <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="radio"
                              name="email"
                              checked={selectedEmail === conversationContact.email}
                              onChange={() => setSelectedEmail(conversationContact.email || '')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm truncate">{conversationContact.email}</span>
                          </label>
                        )}
                        {selectedMergeContact.email && selectedMergeContact.email !== conversationContact.email && (
                          <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="radio"
                              name="email"
                              checked={selectedEmail === selectedMergeContact.email}
                              onChange={() => setSelectedEmail(selectedMergeContact.email || '')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm truncate">{selectedMergeContact.email}</span>
                          </label>
                        )}
                        <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                          <input
                            type="radio"
                            name="email"
                            checked={selectedEmail === ''}
                            onChange={() => setSelectedEmail('')}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-muted-foreground">No email</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {keepContactId && selectedMergeContact && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p>
                    <span className="font-medium">
                      {keepContactId === conversationContact.id
                        ? (selectedMergeContact.name || selectedMergeContact.phone)
                        : (conversationContact.name || conversationContact.phone)}
                    </span>
                    {' will be merged into '}
                    <span className="font-medium">
                      {keepContactId === conversationContact.id
                        ? (conversationContact.name || conversationContact.phone)
                        : (selectedMergeContact.name || selectedMergeContact.phone)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All messages and data will be combined. The merged contact will be deleted.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => setMergeStep('search')}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetMergeDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMerge}
                    disabled={!keepContactId || !selectedPhone || isMerging}
                  >
                    {isMerging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Merge className="h-4 w-4 mr-2" />
                        Confirm Merge
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
