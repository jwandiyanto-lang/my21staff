'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Loader2, Cpu } from 'lucide-react'
import { toast } from 'sonner'

interface AIToggleProps {
  workspaceId: string
  initialEnabled?: boolean
}

export function AIToggle({ workspaceId, initialEnabled = true }: AIToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch initial enabled state from API on mount
  useEffect(() => {
    async function fetchAiStatus() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/ari-config`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setEnabled(data.config?.enabled ?? true)
      } catch (error) {
        console.error('Failed to fetch AI status:', error)
        // Keep default state on error
      } finally {
        setIsInitialLoad(false)
      }
    }

    fetchAiStatus()
  }, [workspaceId])

  // Handle toggle change
  async function handleToggleChange(checked: boolean) {
    setIsLoading(true)
    setEnabled(checked)

    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

    // Dev mode: skip API call, just toggle locally
    if (isDevMode && workspaceId === 'demo') {
      setIsLoading(false)
      toast.success(checked ? 'AI enabled' : 'AI disabled')
      return
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ari-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.success(checked ? 'AI enabled' : 'AI disabled')
    } catch (error: unknown) {
      // Revert state on error
      setEnabled(!checked)
      const message = error instanceof Error ? error.message : 'Failed to save'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialLoad) {
    return (
      <div className="bg-accent/50 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48"></div>
      </div>
    )
  }

  return (
    <div className="bg-accent rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* Label and Icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-green-500/10' : 'bg-muted'}`}>
            <Cpu className={`w-5 h-5 ${enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">AI Processing</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable AI responses for this workspace
            </p>
          </div>
        </div>

        {/* Toggle and Status Badge */}
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            enabled
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </div>

          {/* Switch */}
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleChange}
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
