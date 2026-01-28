'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { format } from 'date-fns'
import { formatWIB, formatDistanceWIB, DATE_FORMATS } from '@/lib/utils/timezone'
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
  Calendar as CalendarIcon,
  Tag,
  Loader2,
  X,
  Plus,
  FileText,
  Send,
  StickyNote,
  TrendingUp,
  GitMerge,
  ClipboardList,
  Pencil,
  Check,
  User,
  Trash2,
  Clock,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import type { Contact, Message, ContactNote, Profile, WorkspaceMember } from '@/types/database'

type TeamMember = WorkspaceMember & { profile: Profile | null }

// Activity item type for timeline
interface ActivityItem {
  id: string
  type: 'form_submission' | 'note' | 'status_change' | 'score_change' | 'merge' | 'message' | 'message_summary'
  content: string
  metadata?: Record<string, unknown>
  author?: { full_name: string | null; email: string | null }
  created_at: string
}

// Message type for grouping
interface MessageItem {
  id: string
  content: string
  direction: string
  message_type: string
  media_url: string | null
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
  contactTags?: string[]
  teamMembers?: TeamMember[]
}

export function ContactDetailSheet({
  contact,
  workspace,
  open,
  onOpenChange,
  contactTags = [],
  teamMembers = [],
}: ContactDetailSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state for optimistic updates
  const [localStatus, setLocalStatus] = useState<LeadStatus>(contact?.lead_status as LeadStatus || 'prospect')
  const [localScore, setLocalScore] = useState(contact?.lead_score ?? 0)
  const [localTags, setLocalTags] = useState<string[]>(contact?.tags || [])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingScore, setIsUpdatingScore] = useState(false)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)

  // Editable contact info
  const [localName, setLocalName] = useState(contact?.name || '')
  const [localPhone, setLocalPhone] = useState(contact?.phone || '')
  const [localEmail, setLocalEmail] = useState(contact?.email || '')
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

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
  const [newNoteDueDate, setNewNoteDueDate] = useState<Date | undefined>(undefined)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [expandedMessageDays, setExpandedMessageDays] = useState<Set<string>>(new Set())

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync local state when contact changes
  useEffect(() => {
    if (contact) {
      setLocalStatus(contact.lead_status as LeadStatus)
      setLocalScore(contact.lead_score)
      setLocalTags(contact.tags || [])
      setLocalName(contact.name || '')
      setLocalPhone(contact.phone || '')
      setLocalEmail(contact.email || '')
      setEditingField(null)
      // Reset messages state for new contact
      setMessages([])
      setMessagesLoaded(false)
      // Reset activity state for new contact
      setActivities([])
      setActivitiesLoaded(false)
      setNewNoteContent('')
      setExpandedForms(new Set())
      setExpandedMessageDays(new Set())
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

  // Tag toggle handler (for predefined tags)
  const handleToggleTag = async (tag: string) => {
    if (!contact) return

    const hasTag = localTags.includes(tag)
    const newTags = hasTag
      ? localTags.filter(t => t !== tag)
      : [...localTags, tag]
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
        console.error('Failed to update tags')
      } else {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      setLocalTags(previousTags)
      console.error('Error updating tags:', error)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  // Contact info update handler
  const handleSaveField = async (field: 'name' | 'phone' | 'email') => {
    if (!contact) return
    const value = field === 'name' ? localName : field === 'phone' ? localPhone : localEmail
    const originalValue = field === 'name' ? (contact.name || '') : field === 'phone' ? contact.phone : (contact.email || '')

    // Skip if unchanged
    if (value === originalValue) {
      setEditingField(null)
      return
    }

    setIsUpdatingInfo(true)
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      })

      if (!response.ok) {
        // Revert on error
        if (field === 'name') setLocalName(contact.name || '')
        if (field === 'phone') setLocalPhone(contact.phone || '')
        if (field === 'email') setLocalEmail(contact.email || '')
        toast.error('Failed to update contact')
      } else {
        toast.success('Contact updated')
        startTransition(() => router.refresh())
      }
    } catch {
      // Revert on error
      if (field === 'name') setLocalName(contact.name || '')
      if (field === 'phone') setLocalPhone(contact.phone || '')
      if (field === 'email') setLocalEmail(contact.email || '')
      toast.error('Failed to update contact')
    } finally {
      setIsUpdatingInfo(false)
      setEditingField(null)
    }
  }

  const handleCancelEdit = (field: 'name' | 'phone' | 'email') => {
    if (!contact) return
    if (field === 'name') setLocalName(contact.name || '')
    if (field === 'phone') setLocalPhone(contact.phone || '')
    if (field === 'email') setLocalEmail(contact.email || '')
    setEditingField(null)
  }

  // Load messages when Messages tab is selected
  const loadMessages = useCallback(async () => {
    if (!contact || messagesLoaded || isLoadingMessages) return

    setIsLoadingMessages(true)
    try {
      // Fetch messages via API route
      const response = await fetch(`/api/contacts/${contact.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
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
          const { notes } = await response.json() as { notes: (ContactNoteWithAuthor & { due_date: string | null })[] }
          notes.forEach((note) => {
            activityList.push({
              id: note.id,
              type: note.note_type as ActivityItem['type'],
              content: note.content,
              metadata: {
                ...(note.metadata as Record<string, unknown>),
                ...(note.due_date ? { due_date: note.due_date } : {}),
              },
              author: note.author ? { full_name: note.author.full_name, email: note.author.email } : undefined,
              created_at: note.created_at,
            })
          })
        }
      } catch (error) {
        console.error('Error loading notes:', error)
      }

      // 3. WhatsApp messages from conversation - grouped by day
      try {
        const response = await fetch(`/api/contacts/${contact.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          const messages = data.messages || []

          if (messages.length > 0) {
            // Group messages by day
            const messagesByDay = new Map<string, MessageItem[]>()

            messages.forEach((msg: MessageItem & { created_at: string }) => {
              const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd')
              if (!messagesByDay.has(dateKey)) {
                messagesByDay.set(dateKey, [])
              }
              messagesByDay.get(dateKey)!.push({
                id: msg.id,
                content: msg.content || '',
                direction: msg.direction,
                message_type: msg.message_type || 'text',
                media_url: msg.media_url,
                created_at: msg.created_at,
              })
            })

            // Create summary activity for each day
            messagesByDay.forEach((dayMessages, dateKey) => {
              const inboundCount = dayMessages.filter(m => m.direction === 'inbound').length
              const outboundCount = dayMessages.filter(m => m.direction === 'outbound').length

              // Sort messages chronologically for display (oldest first within day)
              const sortedMessages = [...dayMessages].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )

              // Get first message time for the day's timestamp
              const firstMessageTime = sortedMessages[0].created_at

              activityList.push({
                id: `msg-summary-${dateKey}`,
                type: 'message_summary',
                content: `${dayMessages.length} messages`,
                metadata: {
                  date: dateKey,
                  inbound_count: inboundCount,
                  outbound_count: outboundCount,
                  messages: sortedMessages,
                },
                created_at: firstMessageTime,
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
        body: JSON.stringify({
          content: newNoteContent.trim(),
          due_date: newNoteDueDate ? newNoteDueDate.toISOString() : null,
        }),
      })

      if (response.ok) {
        const { note } = await response.json() as { note: ContactNoteWithAuthor & { due_date: string | null } }
        // Add to activities list
        setActivities((prev) => [{
          id: note.id,
          type: 'note',
          content: note.content,
          metadata: note.due_date ? { due_date: note.due_date } : undefined,
          author: note.author ? { full_name: note.author.full_name, email: note.author.email } : undefined,
          created_at: note.created_at,
        }, ...prev])
        setNewNoteContent('')
        setNewNoteDueDate(undefined)
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

  // Delete contact handler
  const handleDeleteContact = async () => {
    if (!contact) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete contact')
      }

      toast.success('Contact deleted successfully')
      onOpenChange(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete contact')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!contact) return null

  const initials = contact.name
    ? contact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : contact.phone.slice(-2)

  // Avatar color based on phone for stability (doesn't change when name is edited)
  const getAvatarColor = (phone: string): string => {
    const colors = [
      'bg-orange-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
      'bg-pink-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500'
    ]
    let hash = 0
    for (let i = 0; i < phone.length; i++) {
      hash = phone.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.new || { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }

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
            <Avatar className={cn('h-14 w-14', getAvatarColor(contact.phone))}>
              <AvatarFallback className="text-lg text-white font-medium bg-transparent">
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
                {/* Contact Info - Editable */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Contact Information
                    </h3>
                    {isUpdatingInfo && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="space-y-3">
                    {/* Name field */}
                    <div className="flex items-center gap-3 group">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {editingField === 'name' ? (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField('name')
                              if (e.key === 'Escape') handleCancelEdit('name')
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveField('name')} disabled={isUpdatingInfo}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancelEdit('name')}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{localName || 'No name'}</span>
                          <button onClick={() => setEditingField('name')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone field */}
                    <div className="flex items-center gap-3 group">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {editingField === 'phone' ? (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            value={localPhone}
                            onChange={(e) => setLocalPhone(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Phone"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField('phone')
                              if (e.key === 'Escape') handleCancelEdit('phone')
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveField('phone')} disabled={isUpdatingInfo}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancelEdit('phone')}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{localPhone}</span>
                          <button onClick={() => setEditingField('phone')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email field */}
                    <div className="flex items-center gap-3 group">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {editingField === 'email' ? (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            value={localEmail}
                            onChange={(e) => setLocalEmail(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Email"
                            type="email"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField('email')
                              if (e.key === 'Escape') handleCancelEdit('email')
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveField('email')} disabled={isUpdatingInfo}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancelEdit('email')}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{localEmail || 'No email'}</span>
                          <button onClick={() => setEditingField('email')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Created date - not editable */}
                    <div className="text-sm text-muted-foreground">
                      Added {formatWIB(contact.created_at, DATE_FORMATS.DATE_LONG)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lead Score with Tabs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Lead Score
                  </h3>

                  {/* Score Type Tabs */}
                  <Tabs defaultValue="total" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9">
                      <TabsTrigger value="total" className="text-xs">Total</TabsTrigger>
                      <TabsTrigger value="form" className="text-xs">Form</TabsTrigger>
                      <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                    </TabsList>

                    {/* Total Score Tab */}
                    <TabsContent value="total" className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-muted-foreground">Combined Score</h4>
                        <div className="flex items-center gap-2">
                          {isUpdatingScore && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                          <span
                            className="text-2xl font-semibold tabular-nums"
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

                      {/* Score Components */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Score Components</h4>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Form Score</span>
                            <span className="font-medium" style={{ color: getScoreColor(calculatedScore) }}>
                              {calculatedScore} pts
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Chat Score</span>
                            <span className="font-medium" style={{ color: getScoreColor(35) }}>
                              35 pts
                            </span>
                          </div>
                          <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                            <span>Average</span>
                            <span style={{ color: getScoreColor(displayScore) }}>
                              {displayScore} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Form Score Tab */}
                    <TabsContent value="form" className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-muted-foreground">Questionnaire Score</h4>
                        <span
                          className="text-2xl font-semibold tabular-nums"
                          style={{ color: getScoreColor(calculatedScore) }}
                        >
                          {calculatedScore}
                        </span>
                      </div>
                      {scoreBreakdown.length > 0 ? (
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
                            <span style={{ color: getScoreColor(calculatedScore) }}>
                              {calculatedScore} pts
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No questionnaire data available</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Chat Score Tab */}
                    <TabsContent value="chat" className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-muted-foreground">Bot Conversation Score</h4>
                        <span
                          className="text-2xl font-semibold tabular-nums"
                          style={{ color: getScoreColor(35) }}
                        >
                          35
                        </span>
                      </div>

                      {/* Dummy Chat Score Breakdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Response Quality</span>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              Good
                            </span>
                          </div>
                          <span className="font-medium tabular-nums text-foreground">
                            +15<span className="text-muted-foreground text-xs">/20</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Engagement Level</span>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              Medium
                            </span>
                          </div>
                          <span className="font-medium tabular-nums text-foreground">
                            +10<span className="text-muted-foreground text-xs">/15</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Intent Clarity</span>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              High
                            </span>
                          </div>
                          <span className="font-medium tabular-nums text-green-600">
                            +10<span className="text-muted-foreground text-xs">/10</span>
                          </span>
                        </div>
                        <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                          <span>Total</span>
                          <span style={{ color: getScoreColor(35) }}>
                            35 pts
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground italic text-center pt-2">
                        * Dummy data - real scoring coming soon
                      </p>
                    </TabsContent>
                  </Tabs>
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
                  {contactTags.length > 0 ? (
                    <div className="space-y-2">
                      {contactTags.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={localTags.includes(tag)}
                            onCheckedChange={() => handleToggleTag(tag)}
                            disabled={isUpdatingTags}
                          />
                          <Badge variant={localTags.includes(tag) ? 'default' : 'secondary'}>
                            <Tag className="mr-1 h-3 w-3" />
                            {tag}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tags configured. Add tags in Settings.
                    </p>
                  )}
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
                          {formatWIB(message.created_at, DATE_FORMATS.DATETIME)}
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
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    disabled={isAddingNote}
                  />
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 text-xs gap-1.5",
                            newNoteDueDate && "text-orange-600 border-orange-200 bg-orange-50"
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {newNoteDueDate ? formatWIB(newNoteDueDate, DATE_FORMATS.DATETIME) : 'Set due date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newNoteDueDate}
                          onSelect={setNewNoteDueDate}
                          initialFocus
                        />
                        {newNoteDueDate && (
                          <div className="p-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-muted-foreground"
                              onClick={() => setNewNoteDueDate(undefined)}
                            >
                              Clear due date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim() || isAddingNote}
                  className="h-[88px] w-[60px]"
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
                        case 'message_summary':
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
                        case 'message_summary':
                          return 'bg-teal-100 text-teal-700'
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
                              ) : activity.type === 'message_summary' ? (
                                <button
                                  onClick={() => {
                                    setExpandedMessageDays(prev => {
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
                                  WhatsApp ({activity.metadata?.inbound_count as number || 0} received, {activity.metadata?.outbound_count as number || 0} sent)
                                  <span className={cn(
                                    "text-muted-foreground transition-transform text-xs",
                                    expandedMessageDays.has(activity.id) && "rotate-180"
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
                            <div className="text-xs text-muted-foreground whitespace-nowrap text-right">
                              {activity.type === 'message_summary' ? (
                                formatWIB(activity.created_at, DATE_FORMATS.DATE_SHORT)
                              ) : (
                                <>
                                  {formatDistanceWIB(activity.created_at, { addSuffix: true })}
                                  <span className="mx-1">·</span>
                                  {formatWIB(activity.created_at, DATE_FORMATS.DATETIME)}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Note content or form answers */}
                          {activity.type === 'note' && (
                            <div className="mt-1">
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {activity.content}
                              </p>
                              {typeof activity.metadata?.due_date === 'string' && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {formatWIB(activity.metadata.due_date, DATE_FORMATS.DATETIME_LONG)}</span>
                                </div>
                              )}
                            </div>
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

                          {/* Message summary expanded view */}
                          {activity.type === 'message_summary' && expandedMessageDays.has(activity.id) && Array.isArray(activity.metadata?.messages) && (
                            <div className="mt-2 space-y-2">
                              {(activity.metadata.messages as MessageItem[]).map((msg) => (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    "p-2 rounded-lg text-xs max-w-[85%]",
                                    msg.direction === 'inbound'
                                      ? "bg-muted mr-auto"
                                      : "bg-primary/10 ml-auto text-right"
                                  )}
                                >
                                  <p className="whitespace-pre-wrap break-words">
                                    {msg.content || (msg.message_type !== 'text' ? `[${msg.message_type}]` : '')}
                                  </p>
                                  <span className="text-muted-foreground text-[10px] mt-1 block">
                                    {formatWIB(msg.created_at, DATE_FORMATS.TIME)}
                                  </span>
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
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
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
          {/* Delete Contact */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{contact.name || contact.phone}</strong>?
                  This will also delete all associated conversations and messages. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteContact}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
