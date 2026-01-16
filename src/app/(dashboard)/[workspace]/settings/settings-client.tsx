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
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Check, AlertCircle } from 'lucide-react'

interface WorkspaceSettings {
  kapso_api_key?: string
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

export function SettingsClient({ workspace }: SettingsClientProps) {
  const [phoneId, setPhoneId] = useState(workspace.kapso_phone_id || '')
  const [apiKey, setApiKey] = useState(workspace.settings?.kapso_api_key || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your workspace integrations
        </p>
      </div>

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
    </div>
  )
}
