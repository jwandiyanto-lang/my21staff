'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useEnsureUser } from '@/hooks/use-ensure-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Check, AlertCircle, Trash2, Settings, Zap, Plus, Pencil, Tag, Download, FileSpreadsheet, Upload, Loader2, X, Users, Bot, Palette, ChevronUp, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { DEFAULT_LEAD_STATUSES } from '@/lib/lead-status'
import { cn } from '@/lib/utils'
import { updateMockWorkspaceSettings, getMockWorkspaceSettings } from '@/lib/mock-data'
import { toast } from 'sonner'

interface QuickReply {
  _id: string
  shortcut: string
  message: string
}

interface WorkspaceSettings {
  kapso_api_key?: string
  quick_replies?: QuickReply[]
  contact_tags?: string[]
  main_form_fields?: string[]
  form_field_scores?: Record<string, number>
}

// Default contact tags
const DEFAULT_CONTACT_TAGS = ['Community', '1on1']

// Form field configuration with dropdown choices and scores
type FieldChoice = {
  value: string
  label: string
  defaultScore: number
}

type FormFieldConfig = {
  key: string
  label: string
  type: 'dropdown' | 'open-ended'
  choices?: FieldChoice[]
  defaultMaxScore?: number // for open-ended fields
}

const FORM_FIELD_CONFIGS: FormFieldConfig[] = [
  {
    key: 'Pendidikan',
    label: 'Education Level',
    type: 'dropdown',
    choices: [
      { value: 'SMA', label: 'SMA', defaultScore: 2 },
      { value: 'D3', label: 'D3', defaultScore: 4 },
      { value: 'S1', label: 'S1 (Sarjana)', defaultScore: 6 },
      { value: 'S2', label: 'S2 (Magister)', defaultScore: 8 },
      { value: 'S3', label: 'S3 (Doktor)', defaultScore: 10 },
    ]
  },
  {
    key: 'Jurusan',
    label: 'Major / Field of Study',
    type: 'open-ended',
    defaultMaxScore: 5
  },
  {
    key: 'Aktivitas',
    label: 'Current Activity',
    type: 'dropdown',
    choices: [
      { value: 'kuliah', label: 'Kuliah', defaultScore: 5 },
      { value: 'gap_year', label: 'Gap Year', defaultScore: 8 },
      { value: 'working', label: 'Working', defaultScore: 15 },
      { value: 'fresh_graduate', label: 'Fresh Graduate', defaultScore: 12 },
      { value: 'others', label: 'Others', defaultScore: 10 },
    ]
  },
  {
    key: 'Negara Tujuan',
    label: 'Target Country',
    type: 'open-ended',
    defaultMaxScore: 5
  },
  {
    key: 'Budget',
    label: 'Budget Range',
    type: 'dropdown',
    choices: [
      { value: '<100jt', label: '<100 Juta', defaultScore: 4 },
      { value: '100-300jt', label: '100-300 Juta', defaultScore: 8 },
      { value: '300-500jt', label: '300-500 Juta', defaultScore: 12 },
      { value: '500jt-1m', label: '500 Juta - 1 Miliar', defaultScore: 16 },
      { value: '>1m', label: '>1 Miliar', defaultScore: 20 },
      { value: 'beasiswa', label: 'Mencari Beasiswa', defaultScore: 4 },
    ]
  },
  {
    key: 'Target Berangkat',
    label: 'Target Departure',
    type: 'dropdown',
    choices: [
      { value: '<3bulan', label: '<3 Bulan', defaultScore: 15 },
      { value: '3-6bulan', label: '3-6 Bulan', defaultScore: 12 },
      { value: '6-12bulan', label: '6-12 Bulan', defaultScore: 9 },
      { value: '1-2tahun', label: '1-2 Tahun', defaultScore: 6 },
      { value: 'fleksibel', label: 'Fleksibel', defaultScore: 3 },
    ]
  },
  {
    key: 'Level Bahasa Inggris',
    label: 'English Level',
    type: 'dropdown',
    choices: [
      { value: 'pemula', label: 'Pemula', defaultScore: 5 },
      { value: 'menengah', label: 'Menengah', defaultScore: 10 },
      { value: 'mahir', label: 'Mahir', defaultScore: 15 },
      { value: 'native', label: 'Native/Bilingual', defaultScore: 25 },
      { value: 'skor', label: 'Sudah Ada Skor IELTS/TOEFL', defaultScore: 25 },
    ]
  },
  {
    key: 'Goals',
    label: 'Study Goals',
    type: 'open-ended',
    defaultMaxScore: 5
  },
]

// Default main form fields (shown in Form Score summary)
const DEFAULT_MAIN_FIELDS = ['Pendidikan', 'Negara Tujuan', 'Budget', 'Target Berangkat']

// Build default field scores from configs
const DEFAULT_FIELD_SCORES = FORM_FIELD_CONFIGS.reduce((acc, field) => {
  if (field.type === 'dropdown' && field.choices) {
    field.choices.forEach(choice => {
      acc[`${field.key}:${choice.value}`] = choice.defaultScore
    })
  } else if (field.type === 'open-ended' && field.defaultMaxScore) {
    acc[field.key] = field.defaultMaxScore
  }
  return acc
}, {} as Record<string, number>)

// Import types
interface ValidatedRow {
  row: number
  data: Record<string, unknown>
  valid: boolean
  errors: { path: string; message: string }[]
  normalized?: {
    phone: string
    tags: string[]
  }
}

interface ImportPreview {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicatesInFile: number
  preview: ValidatedRow[]
  allValidated: ValidatedRow[]
}

interface LeadStatusConfig {
  key: string
  label: string
  color: string
  bgColor: string
  temperature: "hot" | "warm" | "cold" | null
}

interface SettingsClientProps {
  workspace: {
    id: string
    name: string
    slug: string
    kapso_phone_id: string | null
    settings: WorkspaceSettings | null
  }
}

// Color gradient for lead stages (cold blue -> warm orange -> hot red)
const STAGE_COLORS = [
  { color: '#3B82F6', bgColor: '#DBEAFE' }, // Blue (cold)
  { color: '#06B6D4', bgColor: '#CFFAFE' }, // Cyan
  { color: '#10B981', bgColor: '#D1FAE5' }, // Green
  { color: '#F59E0B', bgColor: '#FEF3C7' }, // Amber (warm)
  { color: '#F97316', bgColor: '#FED7AA' }, // Orange
  { color: '#EF4444', bgColor: '#FEE2E2' }, // Red (hot)
  { color: '#DC2626', bgColor: '#FECACA' }, // Dark red
  { color: '#9333EA', bgColor: '#E9D5FF' }, // Purple (extra)
]

function getStageColor(index: number, total: number): { color: string; bgColor: string } {
  if (total <= 1) return STAGE_COLORS[0]
  // Map index to color gradient
  const colorIndex = Math.round((index / (total - 1)) * (STAGE_COLORS.length - 1))
  return STAGE_COLORS[Math.min(colorIndex, STAGE_COLORS.length - 1)]
}

// Default quick replies (for display only - not used when fetching from DB)
const DEFAULT_QUICK_REPLIES: QuickReply[] = []

export function SettingsClient({ workspace }: SettingsClientProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Track which field is expanded in Form Fields accordion
  const [expandedField, setExpandedField] = useState<string | null>(null)

  // Ensure current user exists in database before running queries
  // This prevents race conditions where queries run before user document exists
  const userInitialized = useEnsureUser()

  // Fetch AI config on client side with Clerk auth context
  // IMPORTANT: Skip query until user is initialized to avoid race condition
  const ariConfig = useQuery(
    api.ari.getAriConfig,
    !userInitialized ? 'skip' : { workspace_id: workspace.id as any }
  )

  // In dev mode, default to enabled. In production, wait for query result.
  const aiEnabled = isDevMode ? true : (ariConfig?.enabled !== false)

  // Fetch quick replies from Convex
  const quickRepliesData = useQuery(
    api.quickReplies.list,
    !userInitialized ? 'skip' : { workspace_id: workspace.id as any }
  )

  // Convex mutations for quick replies
  const createQuickReply = useMutation(api.quickReplies.create)
  const updateQuickReply = useMutation(api.quickReplies.update)
  const deleteQuickReply = useMutation(api.quickReplies.remove)

  // WhatsApp settings state
  const [phoneId, setPhoneId] = useState(workspace.kapso_phone_id || '')
  const [apiKey, setApiKey] = useState(workspace.settings?.kapso_api_key || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // AI settings state
  const [isTogglingAi, setIsTogglingAi] = useState(false)

  // Quick replies state
  const quickReplies = quickRepliesData || DEFAULT_QUICK_REPLIES
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null)
  const [newReply, setNewReply] = useState({ shortcut: '', message: '' })
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [isSavingReplies, setIsSavingReplies] = useState(false)

  // Contact tags state
  const [contactTags, setContactTags] = useState<string[]>(
    workspace.settings?.contact_tags || DEFAULT_CONTACT_TAGS
  )
  const [newTag, setNewTag] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isSavingTags, setIsSavingTags] = useState(false)

  // Main form fields state
  const [mainFormFields, setMainFormFields] = useState<string[]>(() => {
    const settings = isDevMode ? getMockWorkspaceSettings() : workspace.settings
    return settings?.main_form_fields || DEFAULT_MAIN_FIELDS
  })
  const [originalMainFormFields, setOriginalMainFormFields] = useState<string[]>(() => {
    const settings = isDevMode ? getMockWorkspaceSettings() : workspace.settings
    return settings?.main_form_fields || DEFAULT_MAIN_FIELDS
  })
  const [isSavingFields, setIsSavingFields] = useState(false)

  // Form field scores state
  const [fieldScores, setFieldScores] = useState<Record<string, number>>(() => {
    const settings = isDevMode ? getMockWorkspaceSettings() : workspace.settings
    return settings?.form_field_scores || DEFAULT_FIELD_SCORES
  })
  const [originalFieldScores, setOriginalFieldScores] = useState<Record<string, number>>(() => {
    const settings = isDevMode ? getMockWorkspaceSettings() : workspace.settings
    return settings?.form_field_scores || DEFAULT_FIELD_SCORES
  })
  const [isSavingScores, setIsSavingScores] = useState(false)

  // Track unsaved changes for form fields
  const [hasUnsavedFormFieldChanges, setHasUnsavedFormFieldChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    updated: number
  } | null>(null)

  // Lead stages state
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusConfig[]>([])
  const [leadStagesEnabled, setLeadStagesEnabled] = useState(true)
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true)
  const [isSavingStatuses, setIsSavingStatuses] = useState(false)
  const [editingStatus, setEditingStatus] = useState<LeadStatusConfig | null>(null)
  const [newStatusName, setNewStatusName] = useState('')
  const [isAddingStatus, setIsAddingStatus] = useState(false)

  const isConnected = !!workspace.kapso_phone_id && !!workspace.settings?.kapso_api_key

  // Load lead statuses on mount (use defaults if API fails or returns empty)
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/status-config`)
        if (res.ok) {
          const data = await res.json()
          // Use defaults if API returns empty array
          if (Array.isArray(data) && data.length > 0) {
            setLeadStatuses(data)
          } else {
            setLeadStatuses(DEFAULT_LEAD_STATUSES)
          }
        } else {
          setLeadStatuses(DEFAULT_LEAD_STATUSES)
        }
      } catch (error) {
        console.error('Failed to load lead statuses:', error)
        setLeadStatuses(DEFAULT_LEAD_STATUSES)
      } finally {
        setIsLoadingStatuses(false)
      }
    }
    loadStatuses()
  }, [workspace.id])

  // Sync with mock settings updates in dev mode
  useEffect(() => {
    if (!isDevMode) return

    const handleSettingsUpdate = () => {
      const settings = getMockWorkspaceSettings()
      const newMainFields = settings?.main_form_fields || DEFAULT_MAIN_FIELDS
      const newFieldScores = settings?.form_field_scores || DEFAULT_FIELD_SCORES

      setMainFormFields(newMainFields)
      setOriginalMainFormFields(newMainFields)
      setFieldScores(newFieldScores)
      setOriginalFieldScores(newFieldScores)
    }

    window.addEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)
  }, [isDevMode])

  // Detect unsaved changes in form fields
  useEffect(() => {
    const fieldsChanged = JSON.stringify(mainFormFields.sort()) !== JSON.stringify(originalMainFormFields.sort())
    const scoresChanged = JSON.stringify(fieldScores) !== JSON.stringify(originalFieldScores)
    setHasUnsavedFormFieldChanges(fieldsChanged || scoresChanged)

    // Clear save success message after 3 seconds
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [mainFormFields, fieldScores, originalMainFormFields, originalFieldScores, saveSuccess])

  // AI toggle handler
  const handleToggleAi = async (enabled: boolean) => {
    setIsTogglingAi(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.slug}/ari-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      if (!response.ok) {
        // Error handling - the query will refetch automatically
        console.error('Failed to toggle AI')
      }
      // Success - the Convex query will automatically refetch and update aiEnabled
    } catch (error) {
      console.error('Failed to toggle AI:', error)
    } finally {
      setIsTogglingAi(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kapso_phone_id: phoneId,
          settings: { kapso_api_key: apiKey },
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Quick replies handlers
  const handleAddReply = async () => {
    if (!newReply.shortcut.trim() || !newReply.message.trim()) return
    setIsSavingReplies(true)
    try {
      await createQuickReply({
        workspace_id: workspace.id as any,
        shortcut: newReply.shortcut.trim(),
        message: newReply.message.trim(),
      })
      setNewReply({ shortcut: '', message: '' })
      setIsAddingReply(false)
      toast.success('Quick reply added')
    } catch (error: any) {
      console.error('Failed to add quick reply:', error)
      toast.error(error?.message || 'Failed to add quick reply')
    } finally {
      setIsSavingReplies(false)
    }
  }

  const handleUpdateReply = async () => {
    if (!editingReply || !editingReply.shortcut.trim() || !editingReply.message.trim()) return
    setIsSavingReplies(true)
    try {
      await updateQuickReply({
        id: editingReply._id,
        shortcut: editingReply.shortcut.trim(),
        message: editingReply.message.trim(),
      })
      setEditingReply(null)
      toast.success('Quick reply updated')
    } catch (error: any) {
      console.error('Failed to update quick reply:', error)
      toast.error(error?.message || 'Failed to update quick reply')
    } finally {
      setIsSavingReplies(false)
    }
  }

  const handleDeleteReply = async (id: string) => {
    setIsSavingReplies(true)
    try {
      await deleteQuickReply({ id: id as any })
      toast.success('Quick reply deleted')
    } catch (error: any) {
      console.error('Failed to delete quick reply:', error)
      toast.error(error?.message || 'Failed to delete quick reply')
    } finally {
      setIsSavingReplies(false)
    }
  }

  // Contact tags handlers
  const saveContactTags = async (tags: string[]) => {
    setIsSavingTags(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...workspace.settings,
            contact_tags: tags
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setContactTags(tags)
    } catch (error) {
      console.error('Failed to save contact tags:', error)
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    if (contactTags.includes(newTag.trim())) {
      setNewTag('')
      setIsAddingTag(false)
      return
    }
    await saveContactTags([...contactTags, newTag.trim()])
    setNewTag('')
    setIsAddingTag(false)
  }

  const handleDeleteTag = async (tag: string) => {
    const updated = contactTags.filter(t => t !== tag)
    await saveContactTags(updated)
  }

  // Main form fields handlers
  const saveMainFormFields = async (fields: string[]) => {
    setIsSavingFields(true)
    try {
      // In dev mode, just update local state (no API)
      if (isDevMode) {
        setMainFormFields(fields)
        return
      }

      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...workspace.settings,
            main_form_fields: fields
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setMainFormFields(fields)
    } catch (error) {
      console.error('Failed to save main form fields:', error)
    } finally {
      setIsSavingFields(false)
    }
  }

  const handleToggleField = (fieldKey: string) => {
    const updated = mainFormFields.includes(fieldKey)
      ? mainFormFields.filter(f => f !== fieldKey)
      : [...mainFormFields, fieldKey]
    setMainFormFields(updated)
  }

  const saveFieldScores = async (scores: Record<string, number>) => {
    setIsSavingScores(true)
    try {
      // In dev mode, just update local state (no API)
      if (isDevMode) {
        setFieldScores(scores)
        return
      }

      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...workspace.settings,
            form_field_scores: scores
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setFieldScores(scores)
    } catch (error) {
      console.error('Failed to save field scores:', error)
    } finally {
      setIsSavingScores(false)
    }
  }

  // Calculate max possible total score (taking highest score from each field)
  const calculateMaxPossibleScore = (scores: Record<string, number>) => {
    const fieldMaxScores: Record<string, number> = {}

    // For each field, find the highest score among its choices or use the open-ended score
    Object.entries(scores).forEach(([key, score]) => {
      if (key.includes(':')) {
        // Dropdown choice (e.g., "Pendidikan:S1")
        const fieldKey = key.split(':')[0]
        fieldMaxScores[fieldKey] = Math.max(fieldMaxScores[fieldKey] || 0, score)
      } else {
        // Open-ended field (e.g., "Jurusan")
        fieldMaxScores[key] = score
      }
    })

    return Object.values(fieldMaxScores).reduce((sum, score) => sum + score, 0)
  }

  const handleScoreChange = (scoreKey: string, newScore: number) => {
    const updated = { ...fieldScores, [scoreKey]: newScore }

    // Calculate max possible total with new scores
    const maxTotal = calculateMaxPossibleScore(updated)

    // Don't allow max total to exceed 100
    if (maxTotal > 100) {
      return
    }

    setFieldScores(updated)
  }

  // Combined save function for form fields and scores
  const saveFormFieldSettings = async () => {
    setIsSavingFields(true)
    setIsSavingScores(true)
    setSaveSuccess(false)
    try {
      // In dev mode, update mock workspace settings
      if (isDevMode) {
        updateMockWorkspaceSettings({
          main_form_fields: mainFormFields,
          form_field_scores: fieldScores
        })
        setOriginalMainFormFields(mainFormFields)
        setOriginalFieldScores(fieldScores)
        setSaveSuccess(true)
        return
      }

      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...workspace.settings,
            main_form_fields: mainFormFields,
            form_field_scores: fieldScores
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to save')

      // Update original values to match current (marks as saved)
      setOriginalMainFormFields(mainFormFields)
      setOriginalFieldScores(fieldScores)
      setSaveSuccess(true)
    } catch (error) {
      console.error('Failed to save form field settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSavingFields(false)
      setIsSavingScores(false)
    }
  }

  // Lead stages handlers
  const saveLeadStatuses = async (statuses: LeadStatusConfig[]) => {
    setIsSavingStatuses(true)
    try {
      // In dev mode, just update local state (no API)
      if (isDevMode) {
        setLeadStatuses(statuses)
        return
      }
      const res = await fetch(`/api/workspaces/${workspace.id}/status-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStatuses: statuses }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setLeadStatuses(statuses)
    } catch (error) {
      console.error('Failed to save lead statuses:', error)
    } finally {
      setIsSavingStatuses(false)
    }
  }

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return

    const key = newStatusName.trim().toLowerCase().replace(/\s+/g, '_')

    // Check for duplicate key
    if (leadStatuses.some(s => s.key === key)) {
      alert('A stage with this name already exists')
      return
    }

    // Get color based on position (will be at end of list)
    const colors = getStageColor(leadStatuses.length, leadStatuses.length + 1)

    const status: LeadStatusConfig = {
      key,
      label: newStatusName.trim(),
      color: colors.color,
      bgColor: colors.bgColor,
      temperature: null,
    }

    await saveLeadStatuses([...leadStatuses, status])
    setNewStatusName('')
    setIsAddingStatus(false)
  }

  const handleUpdateStatus = async () => {
    if (!editingStatus) return
    const updated = leadStatuses.map(s =>
      s.key === editingStatus.key ? { ...s, label: editingStatus.label } : s
    )
    await saveLeadStatuses(updated)
    setEditingStatus(null)
  }

  const handleDeleteStatus = async (key: string) => {
    if (leadStatuses.length <= 2) {
      alert('You must have at least 2 stages')
      return
    }
    const filtered = leadStatuses.filter(s => s.key !== key)
    // Recalculate colors for remaining stages
    const updated = filtered.map((s, i) => ({
      ...s,
      ...getStageColor(i, filtered.length),
    }))
    await saveLeadStatuses(updated)
  }

  const handleMoveStatus = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= leadStatuses.length) return

    const reordered = [...leadStatuses]
    ;[reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]]
    // Recalculate colors based on new positions
    const updated = reordered.map((s, i) => ({
      ...s,
      ...getStageColor(i, reordered.length),
    }))
    await saveLeadStatuses(updated)
  }

  // Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setImportPreview(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspace', workspace.id)

      const res = await fetch('/api/contacts/import/preview', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to process CSV')
      }

      const data = await res.json()
      setImportPreview(data)
    } catch (error) {
      console.error('Failed to preview CSV:', error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleConfirmImport = async () => {
    if (!importPreview) return

    setIsImporting(true)

    try {
      const validRows = importPreview.allValidated.filter(r => r.valid)

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: workspace.id,
          rows: validRows,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to import contacts')
      }

      const result = await res.json()
      setImportResult(result)

      // Reset after 5 seconds
      setTimeout(() => {
        setImportPreview(null)
        setImportResult(null)
      }, 5000)
    } catch (error) {
      console.error('Failed to import contacts:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setImportPreview(null)
    setImportResult(null)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace settings and team
          </p>
        </div>
        <Link href={`/${workspace.slug}/team`}>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations" className="gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="quick-replies" className="gap-2">
            <Zap className="h-4 w-4" />
            Quick Replies
            <Badge variant="secondary" className="ml-1 text-xs">
              {quickReplies.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
            <Badge variant="secondary" className="ml-1 text-xs">
              {contactTags.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="lead-stages" className="gap-2">
            <Palette className="h-4 w-4" />
            Lead Stages
            <Badge variant="secondary" className="ml-1 text-xs">
              {leadStatuses.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="form-fields" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Form Fields
            <Badge variant="secondary" className="ml-1 text-xs">
              {mainFormFields.length}
            </Badge>
          </TabsTrigger>
          {/* Data tab hidden for now - export features need fixes */}
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* WhatsApp / Meta Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                    <CardDescription>
                      Connect your WhatsApp Business account via Meta
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneId">Meta Phone Number ID</Label>
                <Input
                  id="phoneId"
                  placeholder="Enter your Meta WhatsApp Phone Number ID"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Meta Business Suite under WhatsApp settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your secure API key for WhatsApp messaging
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                {saved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Settings saved
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Toggle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    <CardDescription>
                      Automatic AI responses for incoming messages
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={aiEnabled ? 'default' : 'secondary'}>
                  {aiEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enable AI Responses</p>
                  <p className="text-xs text-muted-foreground">
                    When enabled, AI will automatically respond to incoming WhatsApp messages
                  </p>
                </div>
                <Switch
                  checked={aiEnabled}
                  onCheckedChange={handleToggleAi}
                  disabled={isTogglingAi}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Replies Tab */}
        <TabsContent value="quick-replies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Quick Replies</CardTitle>
                  <CardDescription>
                    Manage message templates for fast responses
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingReply(true)} disabled={isAddingReply}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reply
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new reply form */}
              {isAddingReply && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div className="space-y-2">
                    <Label>Shortcut</Label>
                    <Input
                      placeholder="e.g., /greeting, /followup"
                      value={newReply.shortcut}
                      onChange={(e) => setNewReply({ ...newReply, shortcut: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Start with "/" for easy typing (e.g., /hi, /thanks)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter your message template..."
                      value={newReply.message}
                      onChange={(e) => setNewReply({ ...newReply, message: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddReply} disabled={isSavingReplies}>
                      {isSavingReplies ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsAddingReply(false)
                      setNewReply({ shortcut: '', message: '' })
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* List of quick replies */}
              <div className="space-y-3">
                {quickReplies.map((reply) => (
                  <div key={reply._id} className="border rounded-lg p-4">
                    {editingReply?._id === reply._id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Shortcut</Label>
                          <Input
                            value={editingReply.shortcut}
                            onChange={(e) => setEditingReply({ ...editingReply, shortcut: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            value={editingReply.message}
                            onChange={(e) => setEditingReply({ ...editingReply, message: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateReply} disabled={isSavingReplies}>
                            {isSavingReplies ? 'Saving...' : 'Save'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingReply(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {reply.shortcut}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {reply.message}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingReply(reply)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteReply(reply._id)}
                            disabled={isSavingReplies}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {quickReplies.length === 0 && !isAddingReply && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quick replies yet</p>
                    <p className="text-sm mt-1">Click "Add Reply" to create your first template</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Contact Tags</CardTitle>
                  <CardDescription>
                    Manage tags for categorizing contacts
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddingTag(true)} disabled={isAddingTag}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new tag form */}
              {isAddingTag && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div className="space-y-2">
                    <Label>Tag Name</Label>
                    <Input
                      placeholder="e.g., VIP, Hot Lead"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddTag} disabled={isSavingTags}>
                      {isSavingTags ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsAddingTag(false)
                      setNewTag('')
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* List of tags */}
              <div className="flex flex-wrap gap-2">
                {contactTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-sm py-1.5 px-3 gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      disabled={isSavingTags}
                      className="hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {contactTags.length === 0 && !isAddingTag && (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tags yet</p>
                  <p className="text-sm mt-1">Click "Add Tag" to create your first tag</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Stages Tab */}
        <TabsContent value="lead-stages" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lead Stages</CardTitle>
                  <CardDescription>
                    Organize your contacts into stages. Colors are assigned automatically (cold → hot).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="lead-stages-toggle" className="text-sm">Enable</Label>
                    <Switch
                      id="lead-stages-toggle"
                      checked={leadStagesEnabled}
                      onCheckedChange={setLeadStagesEnabled}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStatuses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !leadStagesEnabled ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Lead stages are disabled</p>
                  <p className="text-sm mt-1">Turn on the toggle above to use lead stages</p>
                </div>
              ) : (
                <>
                  {/* Add new stage - simple inline */}
                  {isAddingStatus ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <Input
                        placeholder="Stage name..."
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddStatus()
                          if (e.key === 'Escape') {
                            setIsAddingStatus(false)
                            setNewStatusName('')
                          }
                        }}
                        autoFocus
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleAddStatus} disabled={isSavingStatuses || !newStatusName.trim()}>
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setIsAddingStatus(false)
                        setNewStatusName('')
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsAddingStatus(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stage
                    </Button>
                  )}

                  {/* List of stages - simple list */}
                  <div className="space-y-1">
                    {leadStatuses.map((status, index) => {
                      const colors = getStageColor(index, leadStatuses.length)
                      return (
                        <div key={status.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                          {/* Reorder buttons */}
                          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleMoveStatus(index, 'up')}
                              disabled={index === 0 || isSavingStatuses}
                              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMoveStatus(index, 'down')}
                              disabled={index === leadStatuses.length - 1 || isSavingStatuses}
                              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Color indicator */}
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors.color }}
                          />

                          {/* Label - editable inline */}
                          {editingStatus?.key === status.key ? (
                            <Input
                              value={editingStatus.label}
                              onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateStatus()
                                if (e.key === 'Escape') setEditingStatus(null)
                              }}
                              onBlur={handleUpdateStatus}
                              autoFocus
                              className="h-7 flex-1"
                            />
                          ) : (
                            <span
                              className="flex-1 cursor-pointer hover:underline"
                              onClick={() => setEditingStatus(status)}
                            >
                              {status.label}
                            </span>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteStatus(status.key)}
                            disabled={isSavingStatuses || leadStatuses.length <= 2}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {leadStatuses.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No stages yet. Add your first stage above.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Fields Tab */}
        <TabsContent value="form-fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Main Form Fields</CardTitle>
              <CardDescription>
                Select which questionnaire fields should be displayed in the Form Score summary. All fields will still be visible in Activity timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Score Display */}
              {(() => {
                const maxTotal = calculateMaxPossibleScore(fieldScores)
                const remaining = 100 - maxTotal
                return (
                  <div className={cn(
                    "p-3 rounded-lg border-2",
                    maxTotal === 100 ? "bg-green-50 border-green-200" :
                    maxTotal > 100 ? "bg-red-50 border-red-200" :
                    "bg-blue-50 border-blue-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          Max Possible Score: <span className="text-lg">{maxTotal}</span> / 100
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          (Taking the highest score from each field)
                        </div>
                        {remaining > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {remaining} points remaining
                          </div>
                        )}
                        {remaining < 0 && (
                          <div className="text-xs text-red-600 mt-0.5">
                            Over by {Math.abs(remaining)} points - reduce some scores
                          </div>
                        )}
                      </div>
                      {maxTotal === 100 && (
                        <Badge variant="default" className="bg-green-600">
                          Perfect
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Field configuration cards - Collapsible */}
              <div className="space-y-2">
                {FORM_FIELD_CONFIGS.map((field) => {
                  const isMain = mainFormFields.includes(field.key)
                  const isExpanded = expandedField === field.key

                  // Calculate max score for this field
                  let maxScore = 0
                  if (field.type === 'dropdown' && field.choices) {
                    // For dropdown, find the highest score among choices
                    maxScore = Math.max(...field.choices.map(choice => {
                      const scoreKey = `${field.key}:${choice.value}`
                      return fieldScores[scoreKey] ?? choice.defaultScore
                    }))
                  } else {
                    // For open-ended, it's just the field score
                    maxScore = fieldScores[field.key] ?? field.defaultMaxScore ?? 0
                  }

                  return (
                    <div key={field.key} className="border rounded-lg overflow-hidden">
                      {/* Field header - clickable to expand */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedField(isExpanded ? null : field.key)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={isMain}
                            onCheckedChange={(checked) => {
                              handleToggleField(field.key)
                            }}
                            disabled={isSavingFields}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{field.label}</div>
                            <div className="text-xs text-muted-foreground">{field.type === 'dropdown' ? 'Multiple choice' : 'Open-ended'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-lg tabular-nums">{maxScore}</div>
                            <div className="text-xs text-muted-foreground">max pts</div>
                          </div>
                          {isMain && (
                            <Badge variant="default" className="text-xs">
                              Main
                            </Badge>
                          )}
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform",
                              isExpanded && "transform rotate-180"
                            )}
                          />
                        </div>
                      </div>

                      {/* Score configuration - expandable */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t bg-muted/20">
                          {field.type === 'dropdown' && field.choices ? (
                            <div className="space-y-2 mt-3">
                              <div className="text-sm font-medium text-muted-foreground mb-2">Score for each answer:</div>
                              {field.choices.map((choice) => {
                                const scoreKey = `${field.key}:${choice.value}`
                                const currentScore = fieldScores[scoreKey] ?? choice.defaultScore
                                return (
                                  <div key={choice.value} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background border">
                                    <span className="text-sm">{choice.label}</span>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={currentScore}
                                        onChange={(e) => handleScoreChange(scoreKey, parseInt(e.target.value) || 0)}
                                        disabled={isSavingScores}
                                        className="w-16 h-8 text-sm"
                                      />
                                      <span className="text-xs text-muted-foreground">pts</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="mt-3">
                              <div className="flex items-center gap-3 p-2 rounded-lg bg-background border">
                                <Label className="text-sm text-muted-foreground flex-1">Max score if answered:</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={fieldScores[field.key] ?? field.defaultMaxScore ?? 0}
                                    onChange={(e) => handleScoreChange(field.key, parseInt(e.target.value) || 0)}
                                    disabled={isSavingScores}
                                    className="w-16 h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground">pts</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {mainFormFields.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/30">
                  <p className="text-sm">No main fields selected. At least one field should be marked as main.</p>
                </div>
              )}

              {/* Save button - appears when there are unsaved changes */}
              {hasUnsavedFormFieldChanges && (
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className="text-sm text-blue-900">
                    You have unsaved changes
                  </div>
                  <Button
                    onClick={saveFormFieldSettings}
                    disabled={isSavingFields || isSavingScores}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {(isSavingFields || isSavingScores) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Success message */}
              {saveSuccess && !hasUnsavedFormFieldChanges && (
                <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-green-200 bg-green-50 text-green-900 text-sm">
                  <Check className="h-4 w-4" />
                  Settings saved successfully
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab - Hidden for now */}
        <TabsContent value="data" className="space-y-6 hidden">
          {/* Export Data Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Data</CardTitle>
              <CardDescription>
                Download your contacts and notes as CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/api/contacts/export?workspace=${workspace.id}`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Contacts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/api/notes/export?workspace=${workspace.id}`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Notes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Contacts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Contacts</CardTitle>
              <CardDescription>
                Upload a CSV file to import contacts in bulk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Initial state - no preview */}
              {!importPreview && !importResult && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Select CSV File
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/api/contacts/template', '_blank')}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    CSV should have columns: name, phone, email, tags, lead_status, lead_score
                  </p>
                </div>
              )}

              {/* Preview state */}
              {importPreview && !importResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary">
                      {importPreview.totalRows} total rows
                    </Badge>
                    <Badge variant="default" className="bg-green-600">
                      {importPreview.validRows} valid
                    </Badge>
                    {importPreview.invalidRows > 0 && (
                      <Badge variant="destructive">
                        {importPreview.invalidRows} invalid
                      </Badge>
                    )}
                    {importPreview.duplicatesInFile > 0 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {importPreview.duplicatesInFile} duplicates in file
                      </Badge>
                    )}
                  </div>

                  {/* Preview table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.preview.slice(0, 5).map((row) => (
                          <TableRow
                            key={row.row}
                            className={!row.valid ? 'bg-red-50' : ''}
                          >
                            <TableCell className="font-mono text-sm">
                              {row.row}
                            </TableCell>
                            <TableCell>
                              {(row.data.name as string) || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {row.valid && row.normalized
                                ? row.normalized.phone
                                : (row.data.phone as string) || '-'}
                            </TableCell>
                            <TableCell>
                              {(row.data.email as string) || '-'}
                            </TableCell>
                            <TableCell>
                              {row.valid ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="h-3 w-3 mr-1" />
                                  Invalid
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-red-600 text-sm">
                              {row.errors.map(e => e.message).join(', ')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {importPreview.totalRows > 5 && (
                    <p className="text-sm text-muted-foreground">
                      Showing first 5 of {importPreview.totalRows} rows
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirmImport}
                      disabled={isImporting || importPreview.validRows === 0}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import {importPreview.validRows} Contacts
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelImport}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Result state */}
              {importResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Import complete!</span>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="default" className="bg-green-600">
                      {importResult.created} created
                    </Badge>
                    <Badge variant="secondary">
                      {importResult.updated} updated
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This message will disappear in a few seconds...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
