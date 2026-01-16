'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
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
import { Loader2, MessageSquare, Clock, Bot, User, FileText, Film, Download, MoreVertical, Merge, Search, Check, StickyNote, Send, ChevronDown, ChevronUp, X, Phone, Mail, MapPin, Calendar, Star } from 'lucide-react'
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

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound'
  const isSending = isSendingMessage(message)
  const metadata = message.metadata as Record<string, unknown> | null

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

  return (
    <div
      className={cn(
        'max-w-[70%] rounded-lg px-4 py-2',
        isOutbound
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted',
        isSending && 'opacity-70'
      )}
    >
      {renderMedia()}
      {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
      <span className={cn(
        'text-xs block mt-1 flex items-center gap-1',
        isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {isSending ? (
          <>
            <Clock className="h-3 w-3" />
            Sending...
          </>
        ) : (
          format(new Date(message.created_at), 'HH:mm')
        )}
      </span>
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
  onContactMerged
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusConfig = LEAD_STATUS_CONFIG[conversationContact.lead_status as LeadStatus] || LEAD_STATUS_CONFIG.prospect
  const [isTogglingHandover, setIsTogglingHandover] = useState(false)

  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeContacts, setMergeContacts] = useState<Contact[]>([])
  const [isSearchingContacts, setIsSearchingContacts] = useState(false)
  const [selectedMergeContact, setSelectedMergeContact] = useState<Contact | null>(null)
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

  // Handle merge
  const handleMerge = async () => {
    if (!selectedMergeContact) return
    setIsMerging(true)
    try {
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepContactId: conversationContact.id,
          mergeContactId: selectedMergeContact.id,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to merge contacts')
      }
      toast.success(`Merged ${selectedMergeContact.name || selectedMergeContact.phone} into ${conversationContact.name || conversationContact.phone}`)
      setMergeDialogOpen(false)
      setSelectedMergeContact(null)
      setMergeSearch('')
      onContactMerged?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to merge contacts')
    } finally {
      setIsMerging(false)
    }
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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background flex items-center gap-3">
        <button
          onClick={() => setShowContactDetails(!showContactDetails)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted">
              {getInitials(conversationContact.name, conversationContact.phone)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {getFirstName(conversationContact.name, conversationContact.phone)}
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
        </button>

        {/* Notes Toggle */}
        <Button
          variant={showNotesPanel ? 'default' : 'outline'}
          size="sm"
          onClick={toggleNotesPanel}
          className="gap-2"
        >
          <StickyNote className="h-4 w-4" />
          Notes
          {notes.length > 0 && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px]',
              showNotesPanel ? 'bg-white/20' : 'bg-primary/10 text-primary'
            )}>
              {notes.length}
            </span>
          )}
          {showNotesPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>

        {/* Handover Toggle */}
        <Button
          variant={aiPaused ? 'default' : 'outline'}
          size="sm"
          onClick={handleHandoverToggle}
          disabled={isTogglingHandover}
          className="gap-2"
        >
          {isTogglingHandover ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : aiPaused ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          {aiPaused ? 'Anda merespons' : 'AI Aktif'}
        </Button>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Merge Contact Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Merge Contact</DialogTitle>
            <DialogDescription>
              Merge another contact into {conversationContact.name || conversationContact.phone}. Messages and data from the merged contact will be combined.
            </DialogDescription>
          </DialogHeader>
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

            {/* Merge button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!selectedMergeContact || isMerging}
              >
                {isMerging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Merge className="h-4 w-4 mr-2" />
                    Merge
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
