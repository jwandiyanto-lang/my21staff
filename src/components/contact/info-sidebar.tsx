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
import { Phone, Mail, Calendar as CalendarIcon, User, Loader2, Tag, Pencil, Check, X, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { formatWIB, DATE_FORMATS } from '@/lib/utils/timezone'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Contact, WorkspaceMember, Profile } from '@/types/database'

type TeamMember = WorkspaceMember & { profile: Profile | null }

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

  const statusConfig = LEAD_STATUS_CONFIG[localStatus] || LEAD_STATUS_CONFIG.prospect

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
        toast.success('Catatan ditambahkan')
        setNewNoteContent('')
        setNewNoteDueDate(undefined)
        setIsNoteDialogOpen(false)
        startTransition(() => router.refresh())
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menambah catatan')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Gagal menambah catatan')
    } finally {
      setIsAddingNote(false)
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

  return (
    <div className="w-80 shrink-0 border-l bg-background flex flex-col overflow-hidden">
      {/* Contact header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className={cn('h-12 w-12', getAvatarColor(contact.phone))}>
            <AvatarFallback className="text-white font-medium bg-transparent">
              {getInitials(contact.name, contact.phone)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{contact.name || contact.phone}</p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            View conversations
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setIsNoteDialogOpen(true)}
          >
            + Add note
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Contact Info - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Contact Info
              </h3>
              {isUpdatingInfo && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-2 text-sm">
              {/* Name field */}
              <div className="flex items-center gap-2 group">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'name' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('name')
                        if (e.key === 'Escape') handleCancelEdit('name')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('name')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('name')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{localName || 'No name'}</span>
                    <button
                      onClick={() => setEditingField('name')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Phone field */}
              <div className="flex items-center gap-2 group">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'phone' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Phone"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('phone')
                        if (e.key === 'Escape') handleCancelEdit('phone')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('phone')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('phone')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{localPhone}</span>
                    <button
                      onClick={() => setEditingField('phone')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email field */}
              <div className="flex items-center gap-2 group">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                {editingField === 'email' ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Email"
                      type="email"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('email')
                        if (e.key === 'Escape') handleCancelEdit('email')
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSaveField('email')}
                      disabled={isUpdatingInfo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancelEdit('email')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{localEmail || 'No email'}</span>
                    <button
                      onClick={() => setEditingField('email')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Created date - not editable */}
              <div className="text-sm text-muted-foreground">
                Added {contact.created_at ? format(new Date(contact.created_at), 'MMM d, yyyy') : 'Unknown'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Conversation Status */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conversation
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isActive ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : ''
              )}
            >
              {isActive ? 'Active' : 'Closed'}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {lastActivity
                ? `Last active: ${formatDistanceToNow(new Date(lastActivity), { addSuffix: false })} ago`
                : 'No activity'}
              {' • '}{messagesCount} messages
            </div>
          </div>

          <Separator />

          {/* Lead Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Lead Status
              </h3>
              {isUpdatingStatus && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={localStatus}
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger
                className="w-full h-8 text-xs"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                  borderColor: statusConfig.color,
                }}
              >
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
          </div>

          <Separator />

          {/* Lead Score */}
          <div className="space-y-2">
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

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tags
              </h3>
              {isUpdatingTags && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            {contactTags.length > 0 ? (
              <div className="space-y-2">
                {contactTags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={localTags.includes(tag)}
                      onCheckedChange={() => handleToggleTag(tag)}
                      disabled={isUpdatingTags}
                    />
                    <Badge variant={localTags.includes(tag) ? 'default' : 'secondary'} className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tags configured. Add tags in Settings.
              </p>
            )}
          </div>

          {/* Form Responses */}
          {formResponses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Form Responses
                </h3>
                <div className="space-y-2">
                  {formResponses.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground capitalize truncate">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-right truncate max-w-[120px]">
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

      {/* Add Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Catatan</DialogTitle>
            <DialogDescription>
              Tambah catatan untuk {contact.name || contact.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Tulis catatan..."
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
                        Hapus due date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || isAddingNote}
            >
              {isAddingNote ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
