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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SyncStatusIndicator } from '@/components/settings/sync-status-indicator'
import { Bot, Loader2, Plus, X, Tag, Activity } from 'lucide-react'
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

  // Load bot names, status config, and tags
  useEffect(() => {
    async function loadSettings() {
      try {
        // Load bot names and statuses
        if (isDevMode()) {
          const settings = getMockWorkspaceSettings()
          setInternName(settings.intern_name || 'Sarah')
          // Load tags from mock settings
          if (settings.contact_tags) {
            setTags(settings.contact_tags)
          }
        } else {
          // Production: fetch bot config
          const botRes = await fetch(`/api/workspaces/${workspaceSlug}/bot-config`)
          if (botRes.ok) {
            const botData = await botRes.json()
            setInternName(botData.intern_name || 'Sarah')
          }

          // Production: fetch workspace settings to get tags
          const settingsRes = await fetch(`/api/workspaces/${workspaceSlug}/settings`)
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json()
            if (settingsData.contact_tags) {
              setTags(settingsData.contact_tags)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    loadSettings()
  }, [workspaceId])

  // Save bot name
  const handleSave = async () => {
    setSaving(true)
    try {
      // Always call API (even in dev mode) to keep server and client in sync
      const res = await fetch(`/api/workspaces/${workspaceSlug}/bot-config`, {
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

  // Save tags configuration
  const handleSaveTags = async (updatedTags: string[]) => {
    try {
      if (isDevMode()) {
        // Update mock settings in dev mode
        updateMockWorkspaceSettings({ contact_tags: updatedTags })
      } else {
        // Production: save to API
        const res = await fetch(`/api/workspaces/${workspaceSlug}/tags`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: updatedTags }),
        })

        if (!res.ok) {
          throw new Error('Failed to save tags')
        }

        // Trigger settings update event for reactive components
        // This notifies useWorkspaceSettings to refetch data
        window.dispatchEvent(new CustomEvent('workspaceSettingsUpdated'))
      }
    } catch (error) {
      console.error('Failed to save tags:', error)
      toast.error('Failed to save tags')
      throw error
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

      {/* Settings Tabs */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6 mt-6">
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
                  onClick={async () => {
                    const updatedTags = tags.filter((t) => t !== tag)
                    setTags(updatedTags)
                    try {
                      await handleSaveTags(updatedTags)
                      toast.success('Tag removed')
                    } catch {
                      // Error already handled in handleSaveTags
                      setTags(tags) // Rollback on error
                    }
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
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  const updatedTags = [...tags, newTag.trim()]
                  setTags(updatedTags)
                  setNewTag('')
                  try {
                    await handleSaveTags(updatedTags)
                    toast.success('Tag added')
                  } catch {
                    // Error already handled in handleSaveTags
                    setTags(tags) // Rollback on error
                    setNewTag(newTag) // Restore input
                  }
                }
              }}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={async () => {
                if (newTag.trim()) {
                  const updatedTags = [...tags, newTag.trim()]
                  setTags(updatedTags)
                  setNewTag('')
                  try {
                    await handleSaveTags(updatedTags)
                    toast.success('Tag added')
                  } catch {
                    // Error already handled in handleSaveTags
                    setTags(tags) // Rollback on error
                    setNewTag(newTag) // Restore input
                  }
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
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-6 mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
