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
import { Plus, X, Tag, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { isDevMode, getMockWorkspaceSettings, updateMockWorkspaceSettings } from '@/lib/mock-data'

interface SettingsClientProps {
  workspaceId: string
  workspaceSlug: string
}

export function SettingsClient({ workspaceId, workspaceSlug }: SettingsClientProps) {
  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Activity tracking
  const [trackActivities, setTrackActivities] = useState({
    messages: true,
    statusChanges: true,
    notes: true,
    assignments: true,
  })

  // Load tags
  useEffect(() => {
    async function loadSettings() {
      try {
        if (isDevMode()) {
          const settings = getMockWorkspaceSettings()
          // Load tags from mock settings
          if (settings.contact_tags) {
            setTags(settings.contact_tags)
          }
        } else {
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
  }, [workspaceSlug])

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

      {/* Settings Content */}
      <div className="space-y-6">
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
      </div>
    </div>
  )
}
