'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SyncStatusIndicator } from '@/components/settings/sync-status-indicator'
import { Bot, Loader2, Plus, X, Tag, Activity, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { isDevMode, getMockWorkspaceSettings, updateMockWorkspaceSettings } from '@/lib/mock-data'
import { backupSettings } from '@/lib/settings-backup'

interface SettingsClientProps {
  workspaceId: string
  workspaceSlug: string
}

export function SettingsClient({ workspaceId, workspaceSlug }: SettingsClientProps) {
  const [internName, setInternName] = useState('Sarah')
  const [saving, setSaving] = useState(false)

  // Lead statuses
  const [statuses, setStatuses] = useState<string[]>(['new', 'hot', 'warm', 'cold', 'converted', 'lost'])
  const [newStatus, setNewStatus] = useState('')

  // Tags
  const [tags, setTags] = useState<string[]>(['Student', 'Parent', 'Hot Lead', 'Follow Up'])
  const [newTag, setNewTag] = useState('')

  // Activity tracking
  const [trackActivities, setTrackActivities] = useState({
    messages: true,
    statusChanges: true,
    notes: true,
    assignments: true,
  })

  // Load bot names
  useEffect(() => {
    async function loadBotNames() {
      try {
        if (isDevMode()) {
          const settings = getMockWorkspaceSettings()
          setInternName(settings.intern_name || 'Sarah')
          return
        }

        // Production: fetch from API
        const res = await fetch(`/api/workspaces/${workspaceId}/bot-config`)
        if (!res.ok) return
        const data = await res.json()
        setInternName(data.intern_name || 'Sarah')
      } catch (error) {
        console.error('Failed to load bot names:', error)
      }
    }
    loadBotNames()
  }, [workspaceId])

  // Auto-save on change
  const handleSave = async () => {
    setSaving(true)
    try {
      // Always call API (even in dev mode) to keep server and client in sync
      const res = await fetch(`/api/workspaces/${workspaceId}/bot-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_name: internName,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      // Backup settings (non-blocking, production only)
      if (!isDevMode()) {
        backupSettings(workspaceSlug, 'bot_names', {
          intern_name: internName,
        })
      }

      toast.success('Bot names saved')
    } catch (error) {
      console.error('Failed to save bot names:', error)
      toast.error('Failed to save bot names')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header with Sync Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspace configuration
          </p>
        </div>
        <SyncStatusIndicator workspaceId={workspaceId} />
      </div>

      {/* Bot Names Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Intern Name</CardTitle>
          <CardDescription>
            Customize the name of your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intern Name */}
          <div className="space-y-2">
            <Label htmlFor="intern-name" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Intern / Chat Bot Name
            </Label>
            <Input
              id="intern-name"
              value={internName}
              onChange={(e) => setInternName(e.target.value)}
              onBlur={handleSave}
              placeholder="Sarah"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              The AI assistant that handles conversations and qualifies leads
            </p>
          </div>

          {/* Save Button (for manual save if needed) */}
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full max-w-md"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Bot Name'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead Status Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Lead Statuses
          </CardTitle>
          <CardDescription>
            Customize your lead pipeline stages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Badge key={status} variant="secondary" className="gap-2">
                {status}
                <button
                  onClick={() => setStatuses(statuses.filter((s) => s !== status))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add new status..."
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStatus.trim()) {
                  setStatuses([...statuses, newStatus.trim().toLowerCase()])
                  setNewStatus('')
                  toast.success('Status added')
                }
              }}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newStatus.trim()) {
                  setStatuses([...statuses, newStatus.trim().toLowerCase()])
                  setNewStatus('')
                  toast.success('Status added')
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </CardTitle>
          <CardDescription>
            Manage tags for organizing leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-2">
                {tag}
                <button
                  onClick={() => {
                    setTags(tags.filter((t) => t !== tag))
                    toast.success('Tag removed')
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add new tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  setTags([...tags, newTag.trim()])
                  setNewTag('')
                  toast.success('Tag added')
                }
              }}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newTag.trim()) {
                  setTags([...tags, newTag.trim()])
                  setNewTag('')
                  toast.success('Tag added')
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tracker Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Tracking
          </CardTitle>
          <CardDescription>
            Choose which activities to track for leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackActivities.messages}
                onChange={(e) => setTrackActivities({ ...trackActivities, messages: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">Track WhatsApp conversations</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackActivities.statusChanges}
                onChange={(e) => setTrackActivities({ ...trackActivities, statusChanges: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Status Changes</p>
                <p className="text-sm text-muted-foreground">Track when lead status is updated</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackActivities.notes}
                onChange={(e) => setTrackActivities({ ...trackActivities, notes: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">Track when notes are added to leads</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackActivities.assignments}
                onChange={(e) => setTrackActivities({ ...trackActivities, assignments: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Assignments</p>
                <p className="text-sm text-muted-foreground">Track when leads are assigned to team members</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
