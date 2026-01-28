'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ScoringConfig } from '@/lib/ari/types'
import { DEFAULT_SCORING_CONFIG } from '@/lib/ari/types'

interface ScoringTabProps {
  workspaceId: string
}

type ScoringConfigValues = {
  hot_threshold: number
  warm_threshold: number
  weight_basic: number
  weight_qualification: number
  weight_document: number
  weight_engagement: number
}

export function ScoringTab({ workspaceId }: ScoringTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [config, setConfig] = useState<ScoringConfigValues>({
    hot_threshold: DEFAULT_SCORING_CONFIG.hot_threshold,
    warm_threshold: DEFAULT_SCORING_CONFIG.warm_threshold,
    weight_basic: DEFAULT_SCORING_CONFIG.weight_basic,
    weight_qualification: DEFAULT_SCORING_CONFIG.weight_qualification,
    weight_document: DEFAULT_SCORING_CONFIG.weight_document,
    weight_engagement: DEFAULT_SCORING_CONFIG.weight_engagement,
  })

  // Original values for change detection
  const [originalConfig, setOriginalConfig] = useState<ScoringConfigValues>({
    ...config,
  })

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = []

    // Weight validation
    const totalWeight = config.weight_basic + config.weight_qualification +
                       config.weight_document + config.weight_engagement
    if (totalWeight !== 100) {
      errors.push(`Weights must sum to 100 (currently ${totalWeight})`)
    }

    return {
      valid: errors.length === 0,
      errors,
      totalWeight,
    }
  }, [config])

  // Fetch config on mount
  useEffect(() => {
    fetchConfig()
  }, [workspaceId])

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig)
    setHasChanges(changed)
  }, [config, originalConfig])

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/scoring-config`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const fetchedConfig: ScoringConfig = data.config

      const newValues: ScoringConfigValues = {
        hot_threshold: fetchedConfig.hot_threshold ?? DEFAULT_SCORING_CONFIG.hot_threshold,
        warm_threshold: fetchedConfig.warm_threshold ?? DEFAULT_SCORING_CONFIG.warm_threshold,
        weight_basic: fetchedConfig.weight_basic ?? DEFAULT_SCORING_CONFIG.weight_basic,
        weight_qualification: fetchedConfig.weight_qualification ?? DEFAULT_SCORING_CONFIG.weight_qualification,
        weight_document: fetchedConfig.weight_document ?? DEFAULT_SCORING_CONFIG.weight_document,
        weight_engagement: fetchedConfig.weight_engagement ?? DEFAULT_SCORING_CONFIG.weight_engagement,
      }

      setConfig(newValues)
      setOriginalConfig(newValues)
    } catch (error) {
      console.error('Failed to fetch config:', error)
      toast.error('Failed to load scoring settings')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!validation.valid) {
      toast.error('Please fix validation errors before saving')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/scoring-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setOriginalConfig({ ...config })
      toast.success('Scoring settings saved')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  function updateConfig(key: keyof ScoringConfigValues, value: number) {
    setConfig(prev => ({ ...prev, [key]: value }))
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

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              {validation.errors.map((error, i) => (
                <p key={i} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium">Category Weights</h3>
            <p className="text-sm text-muted-foreground">
              Allocate points across scoring categories (must total 100)
            </p>
          </div>

          {/* Total Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            validation.totalWeight === 100
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            Total: {validation.totalWeight}/100
            {validation.totalWeight !== 100 && (
              <span className="text-xs">
                ({validation.totalWeight > 100 ? '+' : ''}{validation.totalWeight - 100})
              </span>
            )}
          </div>
        </div>

        <div className="space-y-0 divide-y border rounded-lg">
          {/* Basic Data */}
          <WeightSlider
            label="Basic Data"
            description="Form completeness, email validity, target country"
            value={config.weight_basic}
            onChange={(value) => updateConfig('weight_basic', value)}
          />

          {/* Qualification */}
          <WeightSlider
            label="Qualification"
            description="English level, budget, timeline, program interest"
            value={config.weight_qualification}
            onChange={(value) => updateConfig('weight_qualification', value)}
          />

          {/* Documents */}
          <WeightSlider
            label="Documents"
            description="Passport, CV, English test, transcript readiness"
            value={config.weight_document}
            onChange={(value) => updateConfig('weight_document', value)}
          />

          {/* Engagement */}
          <WeightSlider
            label="Engagement"
            description="Conversation quality and responsiveness"
            value={config.weight_engagement}
            onChange={(value) => updateConfig('weight_engagement', value)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || !validation.valid || isSaving}
        >
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
          <li>Each category contributes points based on its weight allocation</li>
          <li>Form data, qualification, documents, and chat engagement all factor into the score</li>
          <li>Total score (0-100) helps prioritize leads and guide ARI's conversation flow</li>
          <li>Higher scores indicate more qualified and engaged leads</li>
        </ul>
      </div>
    </div>
  )
}

// Weight Input Component
function WeightSlider({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-20 text-center"
        />
        <span className="text-sm text-muted-foreground">pts</span>
      </div>
    </div>
  )
}
