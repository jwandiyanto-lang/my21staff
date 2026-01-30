'use client'

import { useState, useEffect } from 'react'
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
import { SyncStatusIndicator } from '@/components/settings/sync-status-indicator'
import { Bot, Brain, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { isDevMode, getMockWorkspaceSettings, updateMockWorkspaceSettings } from '@/lib/mock-data'
import { backupSettings } from '@/lib/settings-backup'

interface SettingsClientProps {
  workspaceId: string
  workspaceSlug: string
}

export function SettingsClient({ workspaceId, workspaceSlug }: SettingsClientProps) {
  const [internName, setInternName] = useState('Sarah')
  const [brainName, setBrainName] = useState('Grok')
  const [saving, setSaving] = useState(false)

  // Load bot names
  useEffect(() => {
    async function loadBotNames() {
      try {
        if (isDevMode()) {
          const settings = getMockWorkspaceSettings()
          setInternName(settings.intern_name || 'Sarah')
          setBrainName(settings.brain_name || 'Grok')
          return
        }

        // Production: fetch from API
        const res = await fetch(`/api/workspaces/${workspaceId}/bot-config`)
        if (!res.ok) return
        const data = await res.json()
        setInternName(data.intern_name || 'Sarah')
        setBrainName(data.brain_name || 'Grok')
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
          brain_name: brainName,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      // Backup settings (non-blocking, production only)
      if (!isDevMode()) {
        backupSettings(workspaceSlug, 'bot_names', {
          intern_name: internName,
          brain_name: brainName,
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
          <CardTitle>Bot Names</CardTitle>
          <CardDescription>
            Customize the names of your AI team members
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

          {/* Brain Name */}
          <div className="space-y-2">
            <Label htmlFor="brain-name" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Brain / Manager Bot Name
            </Label>
            <Input
              id="brain-name"
              value={brainName}
              onChange={(e) => setBrainName(e.target.value)}
              onBlur={handleSave}
              placeholder="Grok"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              The AI manager that analyzes leads and generates insights
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
                'Save Bot Names'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
