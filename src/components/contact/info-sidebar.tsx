'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatWIB, formatDistanceWIB, DATE_FORMATS } from '@/lib/utils/timezone'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Send,
  StickyNote,
  ClipboardList,
  TrendingUp,
  GitMerge,
  Pencil,
  Check,
  User,
  Clock,
  PanelRightClose,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import type { Contact } from '@/types/database'
import { MergeContactFlow } from './merge-contact-flow'

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

interface ContactNoteWithAuthor {
  id: string
  content: string
  note_type: string
  metadata?: Record<string, unknown>
  due_date: string | null
  created_at: string
  author?: { full_name: string | null; email: string | null }
}

interface InfoSidebarProps {
  contact: Contact
  messagesCount: number
  lastActivity: string | null
  conversationStatus: string
  contactTags?: string[]
  conversationId?: string
  onClose?: () => void
}

// Helper function for avatar color
function getAvatarColor(phone: string): string {
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

export function InfoSidebar({
  contact,
  onClose,
}: InfoSidebarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state for optimistic updates
  const [localStatus, setLocalStatus] = useState<LeadStatus>(contact?.lead_status as LeadStatus || 'prospect')
  const [localScore, setLocalScore] = useState(contact?.lead_score ?? 0)
  const [localTags, setLocalTags] = useState<string[]>(contact?.tags || [])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Editable contact info
  const [localName, setLocalName] = useState(contact?.name || '')
  const [localPhone, setLocalPhone] = useState(contact?.phone || '')
  const [localEmail, setLocalEmail] = useState(contact?.email || '')
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

  // Activity & Notes state
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteDueDate, setNewNoteDueDate] = useState<Date | undefined>(undefined)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [expandedMessageDays, setExpandedMessageDays] = useState<Set<string>>(new Set())
  const [detailsOpen, setDetailsOpen] = useState(true) // true = Lead Score collapsed, false = Lead Score expanded
  const [showMergeDialog, setShowMergeDialog] = useState(false)

  // Load activities for Activity tab
  const loadActivities = useCallback(async () => {
    if (!contact || isLoadingActivities) return

    setIsLoadingActivities(true)

    // Skip API calls in dev mode - just show form submission
    const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

    try {
      const activityList: ActivityItem[] = []

      // 1. Form submission - always show this
      const meta = contact.metadata as Record<string, unknown> | null
      if (meta) {
        const innerMeta = (meta.metadata as Record<string, unknown>) || meta
        let formAnswers: Record<string, unknown> = {}

        if (innerMeta.form_answers && typeof innerMeta.form_answers === 'object') {
          formAnswers = innerMeta.form_answers as Record<string, unknown>
        } else if (meta.form_answers && typeof meta.form_answers === 'object') {
          formAnswers = meta.form_answers as Record<string, unknown>
        } else {
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

      // Skip API calls in dev mode, but add dummy activities for Budi
      if (isDev) {
        // Add 3 dummy activities for Budi Santoso in dev mode
        if (contact.id === 'contact-001') {
          activityList.push(
            {
              id: 'note-001',
              type: 'note',
              content: 'Follow up next week regarding Australia visa requirements. Student mentioned interest in Melbourne universities.',
              metadata: {
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              },
              author: {
                full_name: 'Budi Santoso',
                email: 'budi@my21staff.com',
              },
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            },
            {
              id: 'note-002',
              type: 'note',
              content: 'Called student to discuss scholarship opportunities. Very interested in engineering programs. Budget is flexible.',
              metadata: {},
              author: {
                full_name: 'Budi Santoso',
                email: 'budi@my21staff.com',
              },
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            },
            {
              id: 'note-003',
              type: 'note',
              content: 'Sent university brochures via email. Student requested more information about accommodation options.',
              metadata: {},
              author: {
                full_name: 'Budi Santoso',
                email: 'budi@my21staff.com',
              },
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            }
          )
        }
      } else {
        // 2. Notes from API
        try {
          const response = await fetch(`/api/contacts/${contact.id}/notes`)
          if (response.ok) {
            const { notes } = await response.json() as { notes: ContactNoteWithAuthor[] }
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

        // 3. WhatsApp messages grouped by day
        try {
          const response = await fetch(`/api/contacts/${contact.id}/messages`)
          if (response.ok) {
            const data = await response.json()
            const messages = data.messages || []

            if (messages.length > 0) {
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

              messagesByDay.forEach((dayMessages, dateKey) => {
                const inboundCount = dayMessages.filter(m => m.direction === 'inbound').length
                const outboundCount = dayMessages.filter(m => m.direction === 'outbound').length

                const sortedMessages = [...dayMessages].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )

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
      }

      activityList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivities(activityList)
      setActivitiesLoaded(true)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivitiesLoaded(true)
    } finally {
      setIsLoadingActivities(false)
    }
  }, [contact])

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
      setActivities([])
      setActivitiesLoaded(false)
      setNewNoteContent('')
      setExpandedForms(new Set())
      setExpandedMessageDays(new Set())
      // Load activities immediately when contact changes
      loadActivities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact])

  // Status update handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!contact) return

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
        setLocalStatus(previousStatus)
        console.error('Failed to update status')
      } else {
        startTransition(() => router.refresh())
      }
    } catch (error) {
      setLocalStatus(previousStatus)
      console.error('Error updating status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Contact info update handler
  const handleSaveField = async (field: 'name' | 'phone' | 'email') => {
    if (!contact) return
    const value = field === 'name' ? localName : field === 'phone' ? localPhone : localEmail
    const originalValue = field === 'name' ? (contact.name || '') : field === 'phone' ? contact.phone : (contact.email || '')

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
        if (field === 'name') setLocalName(contact.name || '')
        if (field === 'phone') setLocalPhone(contact.phone || '')
        if (field === 'email') setLocalEmail(contact.email || '')
        toast.error('Failed to update contact')
      } else {
        toast.success('Contact updated')
        startTransition(() => router.refresh())
      }
    } catch {
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
        const { note } = await response.json() as { note: ContactNoteWithAuthor }
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

  if (!contact) return null

  const initials = contact.name
    ? contact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : contact.phone.slice(-2)

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.new || { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }

  const openWhatsApp = () => {
    const phone = contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  // Extract form responses
  const metadata = contact.metadata as Record<string, unknown> | null

  // Lead score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    if (score >= 40) return '#3B82F6'
    return '#6B7280'
  }

  // Calculate form score from questionnaire data
  const calculateFormScore = (meta: Record<string, unknown> | null): number => {
    if (!meta) return 0

    const innerMeta = (meta.metadata as Record<string, unknown>) || meta
    const formAnswers = (innerMeta.form_answers as Record<string, unknown>) || meta

    let score = 0

    // Education Level (max 15 pts)
    const education = String(formAnswers['Pendidikan'] || '')
    if (education === 'S2' || education === 'S3') score += 15
    else if (education === 'S1') score += 10
    else if (education) score += 5

    // Major / Field (max 10 pts)
    const major = String(formAnswers['Jurusan'] || '')
    if (major.toLowerCase().includes('computer') || major.toLowerCase().includes('engineering')) score += 10
    else if (major) score += 5

    // Activity (max 15 pts)
    const activity = String(formAnswers['Aktivitas'] || '')
    if (activity === 'working') score += 15
    else if (activity === 'student') score += 10
    else if (activity) score += 5

    // Target Country (max 10 pts)
    const country = String(formAnswers['Negara Tujuan'] || '')
    if (country.toLowerCase().includes('australia') || country.toLowerCase().includes('uk')) score += 10
    else if (country) score += 5

    // Budget (max 15 pts)
    const budget = String(formAnswers['Budget'] || '')
    if (budget.includes('500') || budget.includes('300-500')) score += 15
    else if (budget.includes('200') || budget.includes('300')) score += 10
    else if (budget) score += 5

    // Target Departure (max 10 pts)
    const departure = String(formAnswers['Target Berangkat'] || '')
    if (departure.includes('3-6') || departure.includes('0-3')) score += 10
    else if (departure) score += 5

    // English Level (max 10 pts)
    const english = String(formAnswers['Level Bahasa Inggris'] || '')
    if (english === 'mahir' || english === 'advanced') score += 10
    else if (english === 'menengah' || english === 'intermediate') score += 7
    else if (english) score += 3

    // Goals (max 8 pts)
    const goals = String(formAnswers['Goals'] || '')
    if (goals) score += 8

    return score
  }

  const formScore = calculateFormScore(metadata)
  const chatScore = 47
  const displayScore = localScore === 0 && formScore > 0 ? formScore + chatScore : localScore || 0

  return (
    <div className="w-96 h-full bg-background border-l flex flex-col">
      {/* Header - Simplified */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Lead created</p>
          <p className="text-sm text-muted-foreground">{formatWIB(contact.created_at, DATE_FORMATS.DATE_LONG)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMergeDialog(true)}>
            <GitMerge className="h-4 w-4 mr-2" />
            Merge
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Single Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">

              {/* Lead Score - Collapsible */}
              <Collapsible open={!detailsOpen} onOpenChange={(open) => setDetailsOpen(!open)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded-md px-2 transition-colors">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Lead Score
                  </h3>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    !detailsOpen && "rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">

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
                      <span
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: getScoreColor(displayScore) }}
                      >
                        {displayScore}
                      </span>
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>100</span>
                        <span>200</span>
                      </div>
                    </div>

                    {/* Score Components */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Score Components</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Form Score</span>
                          <span className="font-medium" style={{ color: getScoreColor(formScore) }}>
                            {formScore} pts
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Chat Score</span>
                          <span className="font-medium" style={{ color: getScoreColor(chatScore) }}>
                            {chatScore} pts
                          </span>
                        </div>
                        <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                          <span>Total Lead Score</span>
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
                        style={{ color: getScoreColor(formScore) }}
                      >
                        {formScore}
                      </span>
                    </div>

                    {(() => {
                      const innerMeta = ((metadata?.metadata as Record<string, unknown>) || metadata) as Record<string, unknown>
                      const formAnswers = (innerMeta?.form_answers as Record<string, unknown>) || metadata || {}

                      const formFields = [
                        { key: 'Pendidikan', label: 'Education Level', max: 15 },
                        { key: 'Jurusan', label: 'Major', max: 10 },
                        { key: 'Aktivitas', label: 'Activity', max: 15 },
                        { key: 'Negara Tujuan', label: 'Target Country', max: 10 },
                        { key: 'Budget', label: 'Budget', max: 15 },
                        { key: 'Target Berangkat', label: 'Target Departure', max: 10 },
                        { key: 'Level Bahasa Inggris', label: 'English Level', max: 10 },
                        { key: 'Goals', label: 'Goals', max: 8 },
                      ]

                      const getFieldScore = (key: string, value: string): number => {
                        if (!value) return 0

                        switch (key) {
                          case 'Pendidikan':
                            if (value === 'S2' || value === 'S3') return 15
                            if (value === 'S1') return 10
                            return 5
                          case 'Jurusan':
                            if (value.toLowerCase().includes('computer') || value.toLowerCase().includes('engineering')) return 10
                            return 5
                          case 'Aktivitas':
                            if (value === 'working') return 15
                            if (value === 'student') return 10
                            return 5
                          case 'Negara Tujuan':
                            if (value.toLowerCase().includes('australia') || value.toLowerCase().includes('uk')) return 10
                            return 5
                          case 'Budget':
                            if (value.includes('500') || value.includes('300-500')) return 15
                            if (value.includes('200') || value.includes('300')) return 10
                            return 5
                          case 'Target Berangkat':
                            if (value.includes('3-6') || value.includes('0-3')) return 10
                            return 5
                          case 'Level Bahasa Inggris':
                            if (value === 'mahir' || value === 'advanced') return 10
                            if (value === 'menengah' || value === 'intermediate') return 7
                            return 3
                          case 'Goals':
                            return 8
                          default:
                            return 0
                        }
                      }

                      const hasAnyData = formFields.some(field => formAnswers[field.key])

                      return hasAnyData ? (
                        <div className="space-y-1.5">
                          {formFields.map((field) => {
                            const value = String(formAnswers[field.key] || '')
                            if (!value) return null

                            const earnedPoints = getFieldScore(field.key, value)

                            return (
                              <div key={field.key} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-muted-foreground">{field.label}</span>
                                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                                    {value}
                                  </span>
                                </div>
                                <span className={cn(
                                  "font-medium tabular-nums shrink-0",
                                  earnedPoints >= field.max ? "text-green-600" : "text-foreground"
                                )}>
                                  +{earnedPoints}
                                </span>
                              </div>
                            )
                          })}
                          <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                            <span>Total</span>
                            <span style={{ color: getScoreColor(formScore) }}>
                              {formScore} pts
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No questionnaire data available</p>
                        </div>
                      )
                    })()}
                  </TabsContent>

                  {/* Chat Score Tab */}
                  <TabsContent value="chat" className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-muted-foreground">Bot Conversation Score</h4>
                      <span
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: getScoreColor(chatScore) }}
                      >
                        {chatScore}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground">Located in Australia</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                            Greeting
                          </span>
                        </div>
                        <span className="font-medium tabular-nums shrink-0 text-green-600">
                          +15
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground">IELTS 6.5+</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                            Qualifying
                          </span>
                        </div>
                        <span className="font-medium tabular-nums shrink-0 text-green-600">
                          +10
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground">Budget 300-500 juta</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                            Qualifying
                          </span>
                        </div>
                        <span className="font-medium tabular-nums shrink-0 text-green-600">
                          +12
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground">Working professional</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded truncate">
                            Scoring
                          </span>
                        </div>
                        <span className="font-medium tabular-nums shrink-0 text-foreground">
                          +10
                        </span>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between text-sm font-medium">
                        <span>Total</span>
                        <span style={{ color: getScoreColor(chatScore) }}>
                          {chatScore} pts
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground italic text-center pt-2">
                      * Dummy data - real scoring coming soon
                    </p>
                  </TabsContent>
                </Tabs>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Activity Section - Always Visible */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Activity
                </h3>

                {/* Add Note Box - First for easy access */}
                <div className="pb-4 border-b">
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

                {/* Activity Timeline - Below add note box */}
                {isLoadingActivities ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                      <p className="mt-4 text-sm text-muted-foreground">Loading activity...</p>
                    </div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4 pr-2">
                {activities.map((activity) => {
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

                        {/* Note content */}
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

                        {/* Form submission expanded */}
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

                        {/* Message summary expanded */}
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
                ) : (
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground font-medium">No activity yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add a note to start tracking activity
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

      {/* Merge Contact Flow - Renders in portal at document root */}
      {showMergeDialog && (
        <MergeContactFlow
          currentContact={contact}
          workspace={contact.workspace_id}
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          onMergeComplete={() => {
            toast.success('Contacts merged successfully')
            // Refresh or redirect as needed
            if (onClose) onClose()
          }}
        />
      )}
    </div>
  )
}
