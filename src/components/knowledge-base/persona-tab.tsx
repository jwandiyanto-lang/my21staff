'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Bot, Save } from 'lucide-react'
import { toast } from 'sonner'

interface PersonaTabProps {
  workspaceId: string
}

interface ARIConfig {
  workspace_id: string
  bot_name: string
  tone?: {
    description?: string
    greeting_template?: string
  }
  community_link: string | null
}

export function PersonaTab({ workspaceId }: PersonaTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [botName, setBotName] = useState('ARI')
  const [toneDescription, setToneDescription] = useState('')
  const [greetingTemplate, setGreetingTemplate] = useState('')
  const [communityLink, setCommunityLink] = useState('')

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    botName: 'ARI',
    toneDescription: '',
    greetingTemplate: '',
    communityLink: '',
  })

  // Fetch config on mount
  useEffect(() => {
    fetchConfig()
  }, [workspaceId])

  // Track changes
  useEffect(() => {
    const changed =
      botName !== originalValues.botName ||
      toneDescription !== originalValues.toneDescription ||
      greetingTemplate !== originalValues.greetingTemplate ||
      communityLink !== originalValues.communityLink
    setHasChanges(changed)
  }, [botName, toneDescription, greetingTemplate, communityLink, originalValues])

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ari-config`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const config: ARIConfig = data.config

      const newValues = {
        botName: config.bot_name || 'ARI',
        toneDescription: config.tone?.description || '',
        greetingTemplate: config.tone?.greeting_template || '',
        communityLink: config.community_link || '',
      }

      setBotName(newValues.botName)
      setToneDescription(newValues.toneDescription)
      setGreetingTemplate(newValues.greetingTemplate)
      setCommunityLink(newValues.communityLink)
      setOriginalValues(newValues)
    } catch (error) {
      console.error('Failed to fetch config:', error)
      toast.error('Failed to load persona settings')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    // Validate bot name
    if (!botName.trim()) {
      toast.error("Your intern's name is required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ari-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_name: botName.trim(),
          tone_description: toneDescription.trim(),
          greeting_template: greetingTemplate.trim(),
          community_link: communityLink.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      // Update original values to reflect saved state
      setOriginalValues({
        botName: botName.trim(),
        toneDescription: toneDescription.trim(),
        greetingTemplate: greetingTemplate.trim(),
        communityLink: communityLink.trim(),
      })

      toast.success('Persona settings saved')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Persona Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure how your intern introduces itself
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Intern Name */}
        <div className="space-y-2">
          <Label htmlFor="botName">Your Intern&apos;s Name</Label>
          <Input
            id="botName"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="ARI"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            This name will be used when introducing itself to leads
          </p>
        </div>

        {/* Tone Description */}
        <div className="space-y-2">
          <Label htmlFor="toneDescription">Tone Description</Label>
          <Textarea
            id="toneDescription"
            value={toneDescription}
            onChange={(e) => setToneDescription(e.target.value)}
            placeholder="e.g., Friendly and supportive, explains things clearly, uses casual Indonesian..."
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Describe how your intern should communicate ({toneDescription.length}/500)
          </p>
        </div>

        {/* Greeting Template */}
        <div className="space-y-2">
          <Label htmlFor="greetingTemplate">Greeting Template</Label>
          <Textarea
            id="greetingTemplate"
            value={greetingTemplate}
            onChange={(e) => setGreetingTemplate(e.target.value)}
            placeholder="e.g., Selamat {waktu}! Saya {nama}, asisten virtual dari {workspace}. Ada yang bisa saya bantu?"
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            First message template. Use {'{waktu}'} for time, {'{nama}'} for intern name ({greetingTemplate.length}/500)
          </p>
        </div>

        {/* Community Link */}
        <div className="space-y-2">
          <Label htmlFor="communityLink">Community Link (Optional)</Label>
          <Input
            id="communityLink"
            type="url"
            value={communityLink}
            onChange={(e) => setCommunityLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-muted-foreground">
            WhatsApp group link for cold leads who don&apos;t qualify for consultation
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Info card */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How It Works</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your intern uses these settings for all conversations</li>
          <li>The tone description guides communication style</li>
          <li>Cold leads receive the community link if they don&apos;t qualify</li>
        </ul>
      </div>
    </div>
  )
}
