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
import { Textarea } from '@/components/ui/textarea'
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
  FileText,
  Send,
  StickyNote,
  TrendingUp,
  GitMerge,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Contact, Message, ContactNote, Profile } from '@/types/database'

// Activity item type for timeline
interface ActivityItem {
  id: string
  type: 'form_submission' | 'note' | 'status_change' | 'score_change' | 'merge' | 'message'
  content: string
  metadata?: Record<string, unknown>
  author?: { full_name: string | null; email: string | null }
  created_at: string
}

type ContactNoteWithAuthor = ContactNote & {
  author?: Profile
}

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
  const [localScore, setLocalScore] = useState(contact?.lead_score ?? 0)
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

  // Activity & Notes state
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())

  // Sync local state when contact changes
  useEffect(() => {
    if (contact) {
      setLocalStatus(contact.lead_status as LeadStatus)
      setLocalScore(contact.lead_score)
      setLocalTags(contact.tags || [])
      // Reset messages state for new contact
      setMessages([])
      setMessagesLoaded(false)
      // Reset activity state for new contact
      setActivities([])
      setActivitiesLoaded(false)
      setNewNoteContent('')
      setExpandedForms(new Set())
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

  // Load activities for Activity tab
  const loadActivities = useCallback(async () => {
    if (!contact || activitiesLoaded || isLoadingActivities) return

    setIsLoadingActivities(true)
    try {
      // Build activity timeline from multiple sources
      const activityList: ActivityItem[] = []

      // 1. Form submission (from contact creation + questionnaire)
      // Handle multiple metadata structures:
      // - New n8n: { metadata: { notes, source, form_answers: {...} } }
      // - Old flat: { notes, source, imported_at }
      // - Direct fields: { Pendidikan, Aktivitas, Budget, ... }
      const meta = contact.metadata as Record<string, unknown> | null
      if (meta) {
        const innerMeta = (meta.metadata as Record<string, unknown>) || meta

        // Try to find form_answers in various locations
        let formAnswers: Record<string, unknown> = {}

        // Check nested form_answers first
        if (innerMeta.form_answers && typeof innerMeta.form_answers === 'object') {
          formAnswers = innerMeta.form_answers as Record<string, unknown>
        }
        // Check direct form_answers in metadata
        else if (meta.form_answers && typeof meta.form_answers === 'object') {
          formAnswers = meta.form_answers as Record<string, unknown>
        }
        // Check for Indonesian field names directly in metadata (old imports)
        else {
          const formFieldKeys = ['Pendidikan', 'Jurusan', 'Aktivitas', 'Negara Tujuan', 'Budget',
            'Target Berangkat', 'Level Bahasa Inggris', 'Goals', 'Catatan', 'Education',
            'Activity', 'TargetCountry', 'TargetDeparture', 'EnglishLevel']
          const directFields: Record<string, unknown> = {}
          for (const key of formFieldKeys) {
            if (meta[key] !== undefined && meta[key] !== null) directFields[key] = meta[key]
            if (innerMeta[key] !== undefined && innerMeta[key] !== null) directFields[key] = innerMeta[key]
          }
          if (Object.keys(directFields).length > 0) formAnswers = directFields
        }

        const hasFormAnswers = Object.keys(formAnswers).length > 0
        const source = innerMeta.source || meta.source

        if (hasFormAnswers || source === 'google_form' || source === 'google_sheets') {
          activityList.push({
            id: `form-${contact.id}`,
            type: 'form_submission',
            content: 'Submitted questionnaire',
            metadata: formAnswers,
            created_at: contact.created_at,
          })
        }
      }

      // 2. Notes from API
      try {
        const response = await fetch(`/api/contacts/${contact.id}/notes`)
        if (response.ok) {
          const { notes } = await response.json() as { notes: ContactNoteWithAuthor[] }
          notes.forEach((note: ContactNoteWithAuthor) => {
            activityList.push({
              id: note.id,
              type: note.note_type as ActivityItem['type'],
              content: note.content,
              metadata: note.metadata as Record<string, unknown>,
              author: note.author ? { full_name: note.author.full_name, email: note.author.email } : undefined,
              created_at: note.created_at,
            })
          })
        }
      } catch (error) {
        console.error('Error loading notes:', error)
      }

      // 3. WhatsApp messages from conversation
      try {
        const supabase = createClient()
        // First find the conversation for this contact
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', contact.id)
          .single()

        if (conversation) {
          // Get messages for this conversation (limit to recent 50 for performance)
          const { data: messages } = await supabase
            .from('messages')
            .select('id, content, direction, message_type, media_url, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(50)

          if (messages) {
            messages.forEach((msg) => {
              const direction = msg.direction === 'inbound' ? 'Received' : 'Sent'
              const msgType = msg.message_type || 'text'
              let content = msg.content || ''

              // For media messages, show type indicator
              if (msgType !== 'text' && !content) {
                content = `[${msgType.charAt(0).toUpperCase() + msgType.slice(1)}]`
              }

              activityList.push({
                id: msg.id,
                type: 'message',
                content: content,
                metadata: {
                  direction: msg.direction,
                  message_type: msgType,
                  media_url: msg.media_url,
                  label: direction
                },
                created_at: msg.created_at,
              })
            })
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }

      // Sort by created_at descending (newest first)
      activityList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivities(activityList)
      setActivitiesLoaded(true)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivitiesLoaded(true)
    } finally {
      setIsLoadingActivities(false)
    }
  }, [contact, activitiesLoaded, isLoadingActivities])

  // Add a new note
  const handleAddNote = async () => {
    if (!contact || !newNoteContent.trim()) return

    setIsAddingNote(true)
    try {
      const response = await fetch(`/api/contacts/${contact.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      })

      if (response.ok) {
        const { note } = await response.json() as { note: ContactNoteWithAuthor }
        // Add to activities list
        setActivities((prev) => [{
          id: note.id,
          type: 'note',
          content: note.content,
          author: note.author ? { full_name: note.author.full_name, email: note.author.email } : undefined,
          created_at: note.created_at,
        }, ...prev])
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

  // Handle tab change - lazy load data
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'messages' && !messagesLoaded) {
      loadMessages()
    }
    if (value === 'activity' && !activitiesLoaded) {
      loadActivities()
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
  // Handle multiple metadata structures from different import sources
  const metadata = contact.metadata as Record<string, unknown> | null
  const innerMetadata = (metadata?.metadata as Record<string, unknown>) || metadata

  // Try to find form_answers in various locations
  let formAnswersData: Record<string, unknown> = {}
  if (innerMetadata?.form_answers && typeof innerMetadata.form_answers === 'object') {
    formAnswersData = innerMetadata.form_answers as Record<string, unknown>
  } else if (metadata?.form_answers && typeof metadata.form_answers === 'object') {
    formAnswersData = metadata.form_answers as Record<string, unknown>
  } else if (metadata) {
    // Check for Indonesian field names directly in metadata
    const formFieldKeys = ['Pendidikan', 'Jurusan', 'Aktivitas', 'Negara Tujuan', 'Budget',
      'Target Berangkat', 'Level Bahasa Inggris', 'Goals', 'Catatan', 'Education',
      'Activity', 'TargetCountry', 'TargetDeparture', 'EnglishLevel']
    for (const key of formFieldKeys) {
      if (metadata[key] !== undefined && metadata[key] !== null) formAnswersData[key] = metadata[key]
      if (innerMetadata && innerMetadata[key] !== undefined && innerMetadata[key] !== null) {
        formAnswersData[key] = innerMetadata[key]
      }
    }
  }

  const formResponses = Object.keys(formAnswersData).length > 0
    ? Object.entries(formAnswersData).filter(([key]) => !key.startsWith('_'))
    : []

  // Lead score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // green
    if (score >= 60) return '#F59E0B' // yellow
    if (score >= 40) return '#3B82F6' // blue
    return '#6B7280' // gray
  }

  // Score breakdown calculation from questionnaire responses
  // Handles multiple metadata structures from different import sources
  const calculateScoreBreakdown = (meta: Record<string, unknown>) => {
    const breakdown: { label: string; value: string; points: number; maxPoints: number }[] = []

    // Navigate to form_answers if nested (from n8n)
    const innerMeta = (meta.metadata as Record<string, unknown>) || meta

    // Try to find form_answers in various locations
    let formAnswers: Record<string, unknown> = {}
    if (innerMeta.form_answers && typeof innerMeta.form_answers === 'object') {
      formAnswers = innerMeta.form_answers as Record<string, unknown>
    } else if (meta.form_answers && typeof meta.form_answers === 'object') {
      formAnswers = meta.form_answers as Record<string, unknown>
    }

    // Helper to get field value from multiple possible locations and names
    const getField = (
      directKeys: string[],
      formAnswerKeys: string[]
    ): unknown => {
      // First check direct metadata fields
      for (const key of directKeys) {
        if (meta[key] !== undefined && meta[key] !== null) return meta[key]
        if (innerMeta[key] !== undefined && innerMeta[key] !== null) return innerMeta[key]
      }
      // Then check form_answers with Indonesian names
      for (const key of formAnswerKeys) {
        if (formAnswers[key] !== undefined && formAnswers[key] !== null) return formAnswers[key]
      }
      return null
    }

    // English Level (30 pts max)
    const englishLevel = getField(
      ['EnglishLevel', 'english_level'],
      ['Level Bahasa Inggris', 'EnglishLevel']
    )
    if (englishLevel) {
      const englishMap: Record<string, number> = {
        'native': 30, 'has_score': 30, 'advanced': 25, 'intermediate': 15, 'beginner': 5
      }
      const points = englishMap[String(englishLevel)] || 0
      breakdown.push({ label: 'English Level', value: String(englishLevel), points, maxPoints: 30 })
    }

    // Budget (25 pts max)
    const budget = getField(
      ['Budget', 'budget'],
      ['Budget']
    )
    if (budget) {
      const budgetMap: Record<string, number> = {
        '500jt-1m': 25, '300-500jt': 20, '100-300jt': 15, '<100jt': 5, 'scholarship': 5
      }
      const points = budgetMap[String(budget)] || 0
      breakdown.push({ label: 'Budget', value: String(budget), points, maxPoints: 25 })
    }

    // Timeline (20 pts max)
    const timeline = getField(
      ['TargetDeparture', 'target_departure'],
      ['Target Berangkat', 'TargetDeparture']
    )
    if (timeline) {
      const timelineMap: Record<string, number> = {
        '3months': 20, '6months': 15, '1year': 10, '2years': 5, 'flexible': 5
      }
      const points = timelineMap[String(timeline)] || 0
      breakdown.push({ label: 'Timeline', value: String(timeline), points, maxPoints: 20 })
    }

    // Activity (15 pts max)
    const activity = getField(
      ['Activity', 'activity'],
      ['Aktivitas', 'Activity']
    )
    if (activity) {
      const activityMap: Record<string, number> = {
        'working': 15, 'fresh_grad': 12, 'other': 10, 'student': 5
      }
      const points = activityMap[String(activity)] || 0
      breakdown.push({ label: 'Activity', value: String(activity), points, maxPoints: 15 })
    }

    // Target Country (10 pts max)
    const targetCountry = getField(
      ['TargetCountry', 'target_country'],
      ['Negara Tujuan', 'TargetCountry']
    )
    if (targetCountry) {
      const points = String(targetCountry) === 'undecided' ? 3 : 10
      breakdown.push({ label: 'Target Country', value: String(targetCountry), points, maxPoints: 10 })
    }

    // Remardk Penalty (-20 pts)
    const remardk = getField(
      ['Remardk', 'remardk'],
      ['Catatan', 'Remardk']
    )
    if (remardk && String(remardk) !== 'No Response') {
      const badRemarks = ['Wrong Number', 'Ga mau Bayar']
      const isPenalty = badRemarks.includes(String(remardk))
      if (isPenalty) {
        breakdown.push({ label: 'Remark Penalty', value: String(remardk), points: -20, maxPoints: 0 })
      }
    }

    return breakdown
  }

  const scoreBreakdown = metadata ? calculateScoreBreakdown(metadata) : []

  // Calculate score from form answers if stored score is 0
  const calculatedScore = scoreBreakdown.reduce((sum, item) => sum + item.points, 0)
  const displayScore = localScore === 0 && calculatedScore > 0 ? calculatedScore : localScore

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
                        style={{ color: getScoreColor(displayScore) }}
                      >
                        {displayScore}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(displayScore, 100)}%`,
                          backgroundColor: getScoreColor(displayScore),
                        }}
                      />
                    </div>
                    <Slider
                      value={[displayScore]}
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

                  {/* Score Breakdown - only show if we have breakdown data */}
                  {scoreBreakdown.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Score Breakdown</h4>
                      <div className="space-y-1.5">
                        {scoreBreakdown.map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {item.value}
                              </span>
                            </div>
                            <span className={cn(
                              "font-medium tabular-nums",
                              item.points < 0 ? "text-red-500" :
                              item.points >= item.maxPoints ? "text-green-600" : "text-foreground"
                            )}>
                              {item.points > 0 ? '+' : ''}{item.points}
                              {item.maxPoints > 0 && (
                                <span className="text-muted-foreground text-xs">/{item.maxPoints}</span>
                              )}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                          <span>Total</span>
                          <span style={{ color: getScoreColor(displayScore) }}>
                            {calculatedScore} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
          <TabsContent value="activity" className="flex-1 m-0 overflow-hidden flex flex-col">
            {/* Add Note Input */}
            <div className="p-4 border-b bg-background">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                  disabled={isAddingNote}
                />
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim() || isAddingNote}
                  className="h-[60px] w-[60px]"
                >
                  {isAddingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Activity Timeline */}
            {isLoadingActivities ? (
              <div className="flex items-center justify-center flex-1 p-6">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="mt-4 text-muted-foreground">Loading activity...</p>
                </div>
              </div>
            ) : activities.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {activities.map((activity) => {
                    // Get icon and colors based on activity type
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case 'form_submission':
                          return <ClipboardList className="h-4 w-4" />
                        case 'note':
                          return <StickyNote className="h-4 w-4" />
                        case 'status_change':
                          return <TrendingUp className="h-4 w-4" />
                        case 'score_change':
                          return <TrendingUp className="h-4 w-4" />
                        case 'merge':
                          return <GitMerge className="h-4 w-4" />
                        case 'message':
                          return <MessageCircle className="h-4 w-4" />
                        default:
                          return <FileText className="h-4 w-4" />
                      }
                    }

                    const getActivityColor = () => {
                      switch (activity.type) {
                        case 'form_submission':
                          return 'bg-blue-100 text-blue-700'
                        case 'note':
                          return 'bg-yellow-100 text-yellow-700'
                        case 'status_change':
                          return 'bg-green-100 text-green-700'
                        case 'merge':
                          return 'bg-purple-100 text-purple-700'
                        case 'message':
                          return activity.metadata?.direction === 'inbound'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-emerald-100 text-emerald-700'
                        default:
                          return 'bg-muted text-muted-foreground'
                      }
                    }

                    return (
                      <div key={activity.id} className="flex gap-3">
                        {/* Icon */}
                        <div className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          getActivityColor()
                        )}>
                          {getActivityIcon()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {activity.type === 'form_submission' && activity.metadata && Object.keys(activity.metadata).length > 0 ? (
                                <button
                                  onClick={() => {
                                    setExpandedForms(prev => {
                                      const newSet = new Set(prev)
                                      if (newSet.has(activity.id)) {
                                        newSet.delete(activity.id)
                                      } else {
                                        newSet.add(activity.id)
                                      }
                                      return newSet
                                    })
                                  }}
                                  className="text-sm font-medium text-left hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  Form Submitted
                                  <span className={cn(
                                    "text-muted-foreground transition-transform",
                                    expandedForms.has(activity.id) && "rotate-180"
                                  )}>
                                    ▼
                                  </span>
                                </button>
                              ) : (
                                <p className="text-sm font-medium">
                                  {activity.type === 'form_submission' ? 'Form Submitted' :
                                   activity.type === 'note' ? 'Note' :
                                   activity.type === 'status_change' ? 'Status Changed' :
                                   activity.type === 'merge' ? 'Contact Merged' :
                                   activity.type === 'message' ? `WhatsApp ${activity.metadata?.label || 'Message'}` :
                                   'Activity'}
                                </p>
                              )}
                              {activity.author && (
                                <p className="text-xs text-muted-foreground">
                                  by {activity.author.full_name || activity.author.email}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                            </span>
                          </div>

                          {/* Note content or form answers */}
                          {activity.type === 'note' && (
                            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                              {activity.content}
                            </p>
                          )}

                          {/* Message content */}
                          {activity.type === 'message' && activity.content && (
                            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap line-clamp-2">
                              {activity.content}
                            </p>
                          )}

                          {activity.type === 'form_submission' && activity.metadata && Object.keys(activity.metadata).length > 0 && expandedForms.has(activity.id) && (
                            <div className="mt-2 p-2 bg-muted rounded-lg text-xs space-y-1">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-2">
                                  <span className="text-muted-foreground truncate">{key}</span>
                                  <span className="font-medium text-right">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center flex-1 p-6">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground font-medium">No activity yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a note to start tracking activity
                  </p>
                </div>
              </div>
            )}
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
