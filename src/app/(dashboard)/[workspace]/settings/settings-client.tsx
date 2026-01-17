'use client'

import { useState } from 'react'
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
import { MessageCircle, Check, AlertCircle, UserPlus, Mail, Trash2, Users, Settings, Zap, Plus, Pencil, Tag, Download, FileSpreadsheet, Upload, Loader2, X, RefreshCw } from 'lucide-react'
import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'

interface QuickReply {
  id: string
  label: string
  text: string
}

interface WorkspaceSettings {
  kapso_api_key?: string
  quick_replies?: QuickReply[]
  contact_tags?: string[]
}

// Default contact tags
const DEFAULT_CONTACT_TAGS = ['Community', '1on1']

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

interface TeamMember {
  id: string
  role: string
  created_at: string
  profiles: {
    id: string
    email: string | null
    full_name: string | null
  } | null
}

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string
}

interface SettingsClientProps {
  workspace: {
    id: string
    name: string
    slug: string
    kapso_phone_id: string | null
    settings: WorkspaceSettings | null
  }
  members: TeamMember[]
  invitations: Invitation[]
}

// Default quick replies
const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', label: 'Greeting', text: 'Halo! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu?' },
  { id: '2', label: 'Follow Up', text: 'Halo, kami ingin follow up mengenai percakapan kita sebelumnya. Apakah ada pertanyaan yang bisa kami bantu?' },
  { id: '3', label: 'Thank You', text: 'Terima kasih banyak! Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali.' },
  { id: '4', label: 'Busy', text: 'Terima kasih sudah menghubungi. Saat ini kami sedang sibuk, akan kami balas secepatnya.' },
  { id: '5', label: 'Schedule', text: 'Apakah Anda bersedia untuk jadwalkan panggilan? Mohon informasikan waktu yang tersedia.' },
]

export function SettingsClient({ workspace, members, invitations }: SettingsClientProps) {
  // WhatsApp settings state
  const [phoneId, setPhoneId] = useState(workspace.kapso_phone_id || '')
  const [apiKey, setApiKey] = useState(workspace.settings?.kapso_api_key || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Team invite state
  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [localInvitations, setLocalInvitations] = useState<Invitation[]>(invitations)
  const [localMembers, setLocalMembers] = useState<TeamMember[]>(members)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [deletingInvitationId, setDeletingInvitationId] = useState<string | null>(null)
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null)

  // Quick replies state
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(
    workspace.settings?.quick_replies || DEFAULT_QUICK_REPLIES
  )
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null)
  const [newReply, setNewReply] = useState({ label: '', text: '' })
  const [isAddingReply, setIsAddingReply] = useState(false)
  const [isSavingReplies, setIsSavingReplies] = useState(false)

  // Contact tags state
  const [contactTags, setContactTags] = useState<string[]>(
    workspace.settings?.contact_tags || DEFAULT_CONTACT_TAGS
  )
  const [newTag, setNewTag] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isSavingTags, setIsSavingTags] = useState(false)

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    created: number
    updated: number
  } | null>(null)

  const isConnected = !!workspace.kapso_phone_id && !!workspace.settings?.kapso_api_key

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

  const handleInvite = async () => {
    if (!email.trim()) return

    setIsInviting(true)
    setInviteSent(false)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          workspaceId: workspace.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send invitation')
      }

      const data = await res.json()

      // Add to local state
      setLocalInvitations(prev => [{
        id: data.invitation.id,
        email: data.invitation.email,
        status: data.invitation.status,
        created_at: new Date().toISOString(),
        expires_at: data.invitation.expires_at,
      }, ...prev])

      setEmail('')
      setInviteSent(true)
      setTimeout(() => setInviteSent(false), 3000)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to invite')
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    setDeletingMemberId(memberId)
    try {
      const res = await fetch(`/api/workspace-members/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove member')
      }

      setLocalMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setDeletingMemberId(null)
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    setDeletingInvitationId(invitationId)
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel invitation')
      }

      setLocalInvitations(prev => prev.filter(i => i.id !== invitationId))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel invitation')
    } finally {
      setDeletingInvitationId(null)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    setResendingInvitationId(invitationId)
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to resend invitation')
      }

      alert('Invitation resent successfully!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to resend invitation')
    } finally {
      setResendingInvitationId(null)
    }
  }

  // Quick replies handlers
  const saveQuickReplies = async (replies: QuickReply[]) => {
    setIsSavingReplies(true)
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...workspace.settings,
            quick_replies: replies
          },
        }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setQuickReplies(replies)
    } catch (error) {
      console.error('Failed to save quick replies:', error)
    } finally {
      setIsSavingReplies(false)
    }
  }

  const handleAddReply = async () => {
    if (!newReply.label.trim() || !newReply.text.trim()) return
    const reply: QuickReply = {
      id: Date.now().toString(),
      label: newReply.label.trim(),
      text: newReply.text.trim(),
    }
    await saveQuickReplies([...quickReplies, reply])
    setNewReply({ label: '', text: '' })
    setIsAddingReply(false)
  }

  const handleUpdateReply = async () => {
    if (!editingReply || !editingReply.label.trim() || !editingReply.text.trim()) return
    const updated = quickReplies.map(r => r.id === editingReply.id ? editingReply : r)
    await saveQuickReplies(updated)
    setEditingReply(null)
  }

  const handleDeleteReply = async (id: string) => {
    const updated = quickReplies.filter(r => r.id !== id)
    await saveQuickReplies(updated)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace settings and team
        </p>
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
          <TabsTrigger value="data" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
            <Badge variant="secondary" className="ml-1 text-xs">
              {localMembers.length}
            </Badge>
          </TabsTrigger>
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
                    <Label>Label</Label>
                    <Input
                      placeholder="e.g., Greeting, Follow Up"
                      value={newReply.label}
                      onChange={(e) => setNewReply({ ...newReply, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter your message template..."
                      value={newReply.text}
                      onChange={(e) => setNewReply({ ...newReply, text: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddReply} disabled={isSavingReplies}>
                      {isSavingReplies ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsAddingReply(false)
                      setNewReply({ label: '', text: '' })
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* List of quick replies */}
              <div className="space-y-3">
                {quickReplies.map((reply) => (
                  <div key={reply.id} className="border rounded-lg p-4">
                    {editingReply?.id === reply.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={editingReply.label}
                            onChange={(e) => setEditingReply({ ...editingReply, label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            value={editingReply.text}
                            onChange={(e) => setEditingReply({ ...editingReply, text: e.target.value })}
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
                          <p className="font-medium">{reply.label}</p>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {reply.text}
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
                            onClick={() => handleDeleteReply(reply.id)}
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

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
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

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Invite Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invite Team Member</CardTitle>
              <CardDescription>
                Add a new member to your workspace by email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="inviteEmail" className="sr-only">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button onClick={handleInvite} disabled={isInviting || !email.trim()}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isInviting ? 'Inviting...' : 'Invite'}
                </Button>
                {inviteSent && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Invitation sent!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
              <CardDescription>
                {localMembers.length} member{localMembers.length !== 1 ? 's' : ''} in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No team members yet. Invite someone to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    localMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.profiles?.full_name || 'Unnamed'}
                        </TableCell>
                        <TableCell>{member.profiles?.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteMember(member.id)}
                              disabled={deletingMemberId === member.id}
                            >
                              {deletingMemberId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {localInvitations.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Pending Invitations</CardTitle>
                <CardDescription>
                  {localInvitations.length} pending invitation{localInvitations.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localInvitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleResendInvitation(inv.id)}
                              disabled={resendingInvitationId === inv.id}
                              title="Resend invitation"
                            >
                              {resendingInvitationId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteInvitation(inv.id)}
                              disabled={deletingInvitationId === inv.id}
                              title="Cancel invitation"
                            >
                              {deletingInvitationId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
