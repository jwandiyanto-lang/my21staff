'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Calendar as CalendarIcon, User, Loader2, Tag, Pencil, Check, X, Clock, GitMerge, PanelRightClose, StickyNote, ChevronRight, ArrowLeft, Trash2, Send } from 'lucide-react'
import { ScoreBreakdown } from './score-breakdown'
import { format, formatDistanceToNow } from 'date-fns'
import { formatWIB, DATE_FORMATS } from '@/lib/utils/timezone'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Contact, WorkspaceMember, Profile } from '@/types/database'

type TeamMember = WorkspaceMember & { profile: Profile | null }

// Note type for display (simplified)
interface DisplayNote {
  id: string
  content: string
  due_date: string | null
  is_completed: boolean
  created_at: string
}

interface InfoSidebarProps {
  contact: Contact
  messagesCount: number
  lastActivity: string | null
  conversationStatus: string
  contactTags?: string[]
  teamMembers?: TeamMember[]
  assignedTo?: string | null
  conversationId?: string
  onContactUpdate?: (contactId: string, updates: Partial<Contact>) => void
  onAssignmentChange?: (userId: string | null) => void
  onMergeComplete?: (targetContactId: string) => void
  onClose?: () => void
  ariScoreData?: {
    score: number;
    breakdown?: {
      basic_score?: number;
      qualification_score?: number;
      document_score?: number;
      engagement_score?: number;
    };
    reasons?: string[];
  };
  // For merge functionality - list of other contacts to merge with
  availableContacts?: Contact[]
  // Notes for this contact
  recentNotes?: DisplayNote[]
}

// Helper function for avatar color - uses phone for stability (doesn't change when name is edited)
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

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return phone.slice(-2)
}

export function InfoSidebar({
  contact,
  messagesCount,
  lastActivity,
  conversationStatus,
  contactTags = [],
  teamMembers = [],
  assignedTo,
  conversationId,
  onContactUpdate,
  onAssignmentChange,
  onMergeComplete,
  onClose,
  ariScoreData,
  availableContacts = [],
  recentNotes = [],
}: InfoSidebarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isActive = conversationStatus === 'open' || conversationStatus === 'handover'

  // Local state for optimistic updates
  const [localStatus, setLocalStatus] = useState<LeadStatus>(contact.lead_status as LeadStatus || 'prospect')
  const [localScore, setLocalScore] = useState(contact.lead_score ?? 0)
  const [localTags, setLocalTags] = useState<string[]>(contact.tags || [])
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdatingScore, setIsUpdatingScore] = useState(false)
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [localAssignedTo, setLocalAssignedTo] = useState<string | null>(assignedTo || null)
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false)

  // Editable contact info
  const [localName, setLocalName] = useState(contact.name || '')
  const [localPhone, setLocalPhone] = useState(contact.phone || '')
  const [localEmail, setLocalEmail] = useState(contact.email || '')
  const [editingField, setEditingField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

  // Note dialog state
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteDueDate, setNewNoteDueDate] = useState<Date | undefined>(undefined)
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Notes panel state (shows recent notes overlay)
  const [showNotesPanel, setShowNotesPanel] = useState(false)

  // Merge dialog state
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<string | null>(null)
  const [mergeStep, setMergeStep] = useState<'select' | 'compare'>('select')
  const [mergeSelections, setMergeSelections] = useState<Record<string, 'current' | 'target'>>({})
  const [isMerging, setIsMerging] = useState(false)

  // Quick note input (for chat-bar style)
  const [quickNoteInput, setQuickNoteInput] = useState('')
  const [quickNoteDueDate, setQuickNoteDueDate] = useState<Date | undefined>(undefined)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [isAddingQuickNote, setIsAddingQuickNote] = useState(false)

  // Sync local state when contact changes
  useEffect(() => {
    setLocalStatus(contact.lead_status as LeadStatus || 'prospect')
    setLocalScore(contact.lead_score ?? 0)
    setLocalTags(contact.tags || [])
    setLocalName(contact.name || '')
    setLocalPhone(contact.phone || '')
    setLocalEmail(contact.email || '')
    setEditingField(null)
  }, [contact.id, contact.lead_status, contact.lead_score, contact.tags, contact.name, contact.phone, contact.email])

  // Sync assigned to when it changes from parent
  useEffect(() => {
    setLocalAssignedTo(assignedTo || null)
  }, [assignedTo])

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.new || { label: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }

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
              setLocalScore(contact.lead_score ?? 0)
            } else {
              onContactUpdate?.(contact.id, { lead_score: score })
              startTransition(() => router.refresh())
            }
          } catch {
            setLocalScore(contact.lead_score ?? 0)
          } finally {
            setIsUpdatingScore(false)
          }
        }, 500)
      }
    })(),
    [contact.lead_score, contact.id, router, onContactUpdate]
  )

  // Status update handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
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
      } else {
        onContactUpdate?.(contact.id, { lead_status: newStatus })
        startTransition(() => router.refresh())
      }
    } catch {
      setLocalStatus(previousStatus)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Score change handler
  const handleScoreChange = (value: number[]) => {
    const newScore = value[0]
    setLocalScore(newScore)
    debouncedScoreUpdate(contact.id, newScore)
  }

  // Tag management
  // Toggle tag (add if not present, remove if present)
  const handleToggleTag = async (tag: string) => {
    const hasTag = localTags.includes(tag)
    const newTags = hasTag
      ? localTags.filter(t => t !== tag)
      : [...localTags, tag]
    const previousTags = localTags
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
      } else {
        onContactUpdate?.(contact.id, { tags: newTags })
        startTransition(() => router.refresh())
      }
    } catch {
      setLocalTags(previousTags)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  // Handle assignment change in info panel
  const handleAssignmentInPanel = async (userId: string) => {
    if (!conversationId) return
    const newAssignedTo = userId === 'unassigned' ? null : userId
    const previousAssigned = localAssignedTo
    setLocalAssignedTo(newAssignedTo)
    setIsUpdatingAssignment(true)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: newAssignedTo }),
      })

      if (!response.ok) {
        setLocalAssignedTo(previousAssigned)
      } else {
        onAssignmentChange?.(newAssignedTo)
      }
    } catch {
      setLocalAssignedTo(previousAssigned)
    } finally {
      setIsUpdatingAssignment(false)
    }
  }

  // Contact info update handler
  const handleSaveField = async (field: 'name' | 'phone' | 'email') => {
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
      } else {
        onContactUpdate?.(contact.id, { [field]: value || null })
        startTransition(() => router.refresh())
      }
    } catch {
      // Revert on error
      if (field === 'name') setLocalName(contact.name || '')
      if (field === 'phone') setLocalPhone(contact.phone || '')
      if (field === 'email') setLocalEmail(contact.email || '')
    } finally {
      setIsUpdatingInfo(false)
      setEditingField(null)
    }
  }

  const handleCancelEdit = (field: 'name' | 'phone' | 'email') => {
    if (field === 'name') setLocalName(contact.name || '')
    if (field === 'phone') setLocalPhone(contact.phone || '')
    if (field === 'email') setLocalEmail(contact.email || '')
    setEditingField(null)
  }

  // Add note handler
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

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
        toast.success('Note added')
        setNewNoteContent('')
        setNewNoteDueDate(undefined)
        setIsNoteDialogOpen(false)
        startTransition(() => router.refresh())
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

  // Quick note handler (for chat-bar style input)
  const handleQuickNote = async () => {
    if (!quickNoteInput.trim()) return

    setIsAddingQuickNote(true)
    try {
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      if (isDevMode) {
        toast.success(quickNoteDueDate ? 'Note with reminder added (dev mode)' : 'Note added (dev mode)')
        setQuickNoteInput('')
        setQuickNoteDueDate(undefined)
        setShowDueDatePicker(false)
        return
      }

      const response = await fetch(`/api/contacts/${contact.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: quickNoteInput.trim(),
          due_date: quickNoteDueDate ? quickNoteDueDate.toISOString() : null,
        }),
      })

      if (response.ok) {
        toast.success('Note added')
        setQuickNoteInput('')
        setQuickNoteDueDate(undefined)
        setShowDueDatePicker(false)
        startTransition(() => router.refresh())
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsAddingQuickNote(false)
    }
  }

  // Merge handler
  const handleMerge = async () => {
    if (!selectedMergeTarget) return

    setIsMerging(true)
    try {
      // In dev mode, just show a toast
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      if (isDevMode) {
        toast.success('Contacts merged (dev mode)')
        setIsMergeDialogOpen(false)
        setSelectedMergeTarget(null)
        onMergeComplete?.(selectedMergeTarget)
        return
      }

      const response = await fetch(`/api/contacts/${contact.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetContactId: selectedMergeTarget }),
      })

      if (response.ok) {
        toast.success('Contacts merged successfully')
        setIsMergeDialogOpen(false)
        setSelectedMergeTarget(null)
        onMergeComplete?.(selectedMergeTarget)
        startTransition(() => router.refresh())
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to merge contacts')
      }
    } catch (error) {
      console.error('Error merging contacts:', error)
      toast.error('Failed to merge contacts')
    } finally {
      setIsMerging(false)
    }
  }

  // Filter contacts for merge (exclude current contact)
  const mergeableContacts = availableContacts.filter(c => c.id !== contact.id)

  // Get selected target contact for comparison
  const targetContact = selectedMergeTarget
    ? mergeableContacts.find(c => c.id === selectedMergeTarget)
    : null

  // Fields to compare in merge
  const mergeFields = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'lead_status', label: 'Status' },
    { key: 'lead_score', label: 'Score' },
  ] as const

  // Initialize merge selections when target changes
  const initializeMergeSelections = (target: Contact) => {
    const selections: Record<string, 'current' | 'target'> = {}
    mergeFields.forEach(field => {
      // Default to current contact's value if it exists, otherwise use target's
      const currentValue = contact[field.key as keyof Contact]
      selections[field.key] = currentValue ? 'current' : 'target'
    })
    setMergeSelections(selections)
  }

  // Handle proceeding to compare step
  const handleProceedToCompare = () => {
    if (targetContact) {
      initializeMergeSelections(targetContact)
      setMergeStep('compare')
    }
  }

  // Extract form responses from metadata
  const metadata = contact.metadata as Record<string, unknown> | null
  const innerMetadata = (metadata?.metadata as Record<string, unknown>) || metadata
  let formAnswersData: Record<string, unknown> = {}
  if (innerMetadata?.form_answers && typeof innerMetadata.form_answers === 'object') {
    formAnswersData = innerMetadata.form_answers as Record<string, unknown>
  } else if (metadata?.form_answers && typeof metadata.form_answers === 'object') {
    formAnswersData = metadata.form_answers as Record<string, unknown>
  } else if (metadata) {
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

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    if (score >= 40) return '#3B82F6'
    return '#6B7280'
  }

  // Calculate lead age
  const leadAge = contact.created_at
    ? formatDistanceToNow(new Date(contact.created_at), { addSuffix: false })
    : 'Unknown age'

  return (
    <div className="w-80 shrink-0 border-l bg-background flex flex-col h-full overflow-hidden relative">
      {/* Sidebar header with lead age + status */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate flex-1">
            {leadAge} old
          </span>
          {/* Editable status badge */}
          <Select
            value={localStatus}
            onValueChange={(value) => handleStatusChange(value as LeadStatus)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger
              className="h-6 w-auto gap-1 px-2 text-[10px] border-0"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusConfig.color }}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((status) => {
                const config = LEAD_STATUS_CONFIG[status]
                return (
                  <SelectItem key={status} value={status} className="text-xs">
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
          {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin" />}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
              title="Close sidebar"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-b shrink-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setIsMergeDialogOpen(true)}
            disabled={mergeableContacts.length === 0}
            title={mergeableContacts.length === 0 ? 'No other contacts to merge with' : 'Merge this contact with another'}
          >
            <GitMerge className="h-3 w-3 mr-1" />
            Merge
          </Button>
          <Button
            variant={showNotesPanel ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowNotesPanel(!showNotesPanel)}
          >
            <StickyNote className="h-3 w-3 mr-1" />
            Note
            {recentNotes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {recentNotes.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Notes panel overlay - covers full sidebar */}
      {showNotesPanel && (
        <div className="absolute inset-0 z-20 bg-amber-50 dark:bg-amber-950/30 flex flex-col">
          {/* Notes header */}
          <div className="px-3 pt-3 pb-2 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">Notes</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              onClick={() => setShowNotesPanel(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Scrollable notes list */}
          <div className="flex-1 overflow-y-auto">
            {recentNotes.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300 py-8 text-center">No notes yet</p>
            ) : (
              <div className="p-2 space-y-2">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      'p-2 rounded-md border text-xs',
                      note.is_completed
                        ? 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 line-through opacity-60'
                        : 'bg-white dark:bg-amber-900/50 border-amber-200 dark:border-amber-700'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-amber-900 dark:text-amber-100">{note.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-amber-600 dark:text-amber-400">
                      <span>{format(new Date(note.created_at), 'MMM d')}</span>
                      {note.due_date && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Due {format(new Date(note.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat-bar style input with due date toggle */}
          <div className="p-2 border-t border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/50">
            {/* Due date picker row */}
            {showDueDatePicker && (
              <div className="mb-2 p-2 rounded-md bg-white dark:bg-amber-950 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-700 dark:text-amber-300">Set reminder</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs"
                    onClick={() => {
                      setQuickNoteDueDate(undefined)
                      setShowDueDatePicker(false)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={quickNoteDueDate}
                  onSelect={(date) => {
                    setQuickNoteDueDate(date)
                  }}
                  className="rounded-md border-0 p-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center text-xs",
                    caption_label: "text-xs font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.7rem]",
                    row: "flex w-full mt-1",
                    cell: "text-center text-xs p-0 relative",
                    day: "h-7 w-7 p-0 font-normal text-xs hover:bg-amber-100 dark:hover:bg-amber-800 rounded-md",
                    day_selected: "bg-amber-500 text-white hover:bg-amber-600",
                    day_today: "bg-amber-100 dark:bg-amber-900",
                    day_outside: "opacity-50",
                  }}
                />
              </div>
            )}

            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 shrink-0",
                  quickNoteDueDate
                    ? "text-orange-600 bg-orange-100 dark:bg-orange-900/50"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800"
                )}
                onClick={() => setShowDueDatePicker(!showDueDatePicker)}
                title={quickNoteDueDate ? `Due: ${format(quickNoteDueDate, 'MMM d')}` : 'Add reminder'}
              >
                <Clock className="h-3.5 w-3.5" />
                {quickNoteDueDate && (
                  <span className="ml-1 text-xs">{format(quickNoteDueDate, 'MMM d')}</span>
                )}
              </Button>
              <Input
                value={quickNoteInput}
                onChange={(e) => setQuickNoteInput(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 h-8 text-xs bg-white dark:bg-amber-950 border-amber-200 dark:border-amber-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleQuickNote()
                  }
                }}
              />
              <Button
                size="sm"
                className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleQuickNote}
                disabled={!quickNoteInput.trim() || isAddingQuickNote}
              >
                {isAddingQuickNote ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

          {/* Lead Background - Form Responses */}
          {formResponses.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lead Background
                </h3>
                <div className="space-y-2">
                  {formResponses.slice(0, 5).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-muted-foreground capitalize block">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}


          {/* ARI Score - shows breakdown if available, falls back to manual slider */}
          <div className="space-y-2">
            {ariScoreData ? (
              <ScoreBreakdown
                score={ariScoreData.score}
                breakdown={ariScoreData.breakdown}
                reasons={ariScoreData.reasons}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Lead Score
                  </h3>
                  <div className="flex items-center gap-2">
                    {isUpdatingScore && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    <span
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: getScoreColor(localScore) }}
                    >
                      {localScore}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
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
              </>
            )}
          </div>

          <Separator />

          {/* Assigned To */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned To
                </h3>
                {isUpdatingAssignment && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <Select
                value={localAssignedTo || 'unassigned'}
                onValueChange={handleAssignmentInPanel}
                disabled={isUpdatingAssignment}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.full_name || member.profile?.email || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {teamMembers.length > 0 && <Separator />}

          {/* Tags - Display only */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tags
            </h3>
            {localTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {localTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tags
              </p>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note for {contact.name || contact.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write a note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isAddingNote}
            >
              {isAddingNote ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog - Two Step Process */}
      <Dialog
        open={isMergeDialogOpen}
        onOpenChange={(open) => {
          setIsMergeDialogOpen(open)
          if (!open) {
            setSelectedMergeTarget(null)
            setMergeStep('select')
            setMergeSelections({})
          }
        }}
      >
        <DialogContent className={cn(mergeStep === 'compare' && 'max-w-2xl')}>
          {mergeStep === 'select' ? (
            <>
              {/* Step 1: Select contact */}
              <DialogHeader>
                <DialogTitle>Merge Contact</DialogTitle>
                <DialogDescription>
                  Select another contact to merge with {contact.name || contact.phone}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {mergeableContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other contacts available to merge with.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {mergeableContacts.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedMergeTarget === c.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedMergeTarget(c.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={getAvatarColor(c.phone)}>
                              {getInitials(c.name, c.phone)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {c.name || c.phone}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.phone}
                              {c.email && ` • ${c.email}`}
                            </p>
                          </div>
                          {selectedMergeTarget === c.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMergeDialogOpen(false)
                    setSelectedMergeTarget(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToCompare}
                  disabled={!selectedMergeTarget}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Step 2: Compare and select fields */}
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMergeStep('select')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <DialogTitle>Compare & Merge</DialogTitle>
                    <DialogDescription>
                      Select which values to keep for the merged contact.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4">
                {/* Header row */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-2 border-b">
                  <div className="text-xs font-medium text-muted-foreground uppercase">Field</div>
                  <div className="text-center">
                    <Badge variant="default" className="text-xs">Keep</Badge>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {contact.name || contact.phone}
                    </p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {targetContact?.name || targetContact?.phone}
                    </p>
                  </div>
                </div>

                {/* Field comparison rows */}
                <div className="space-y-3">
                  {mergeFields.map((field) => {
                    const currentValue = String(contact[field.key as keyof Contact] || '-')
                    const targetValue = String(targetContact?.[field.key as keyof Contact] || '-')
                    const selection = mergeSelections[field.key] || 'current'

                    return (
                      <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-sm font-medium">{field.label}</div>
                        <button
                          className={cn(
                            'p-2 rounded-lg border text-sm text-center transition-all',
                            selection === 'current'
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-muted hover:border-muted-foreground/50'
                          )}
                          onClick={() => setMergeSelections(prev => ({
                            ...prev,
                            [field.key]: 'current'
                          }))}
                        >
                          <span className="truncate block">{currentValue}</span>
                        </button>
                        <button
                          className={cn(
                            'p-2 rounded-lg border text-sm text-center transition-all',
                            selection === 'target'
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-muted hover:border-muted-foreground/50'
                          )}
                          onClick={() => setMergeSelections(prev => ({
                            ...prev,
                            [field.key]: 'target'
                          }))}
                        >
                          <span className="truncate block">{targetValue}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive">
                    <strong>Warning:</strong> The contact &quot;{targetContact?.name || targetContact?.phone}&quot; will be deleted after merge. This action cannot be undone.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setMergeStep('select')}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleMerge}
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <GitMerge className="h-4 w-4 mr-2" />
                  )}
                  Merge & Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
