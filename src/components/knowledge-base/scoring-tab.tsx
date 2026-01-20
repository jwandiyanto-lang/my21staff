'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, Target, Save, AlertCircle } from 'lucide-react'
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

    // Threshold validation
    if (config.hot_threshold <= config.warm_threshold) {
      errors.push('Hot threshold must be greater than warm threshold')
    }
    if (config.hot_threshold < 1 || config.hot_threshold > 100) {
      errors.push('Hot threshold must be between 1 and 100')
    }
    if (config.warm_threshold < 0 || config.warm_threshold >= 100) {
      errors.push('Warm threshold must be between 0 and 99')
    }

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

  // Calculate temperature for preview
  function getTemperatureForScore(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= config.hot_threshold) return 'hot'
    if (score >= config.warm_threshold) return 'warm'
    return 'cold'
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
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Scoring Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Configure lead temperature thresholds and scoring weights
            </p>
          </div>
        </div>
      </div>

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

      {/* Thresholds Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-medium mb-4">Temperature Thresholds</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Define score ranges for lead classification
          </p>

          {/* Visual Zone Preview */}
          <div className="mb-6">
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div
                className="bg-blue-500/80 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${config.warm_threshold}%` }}
              >
                Cold
              </div>
              <div
                className="bg-yellow-500/80 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${config.hot_threshold - config.warm_threshold}%` }}
              >
                Warm
              </div>
              <div
                className="bg-red-500/80 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${100 - config.hot_threshold}%` }}
              >
                Hot
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>{config.warm_threshold}</span>
              <span>{config.hot_threshold}</span>
              <span>100</span>
            </div>
          </div>

          {/* Hot Threshold */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hot_threshold">Hot Lead Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hot_threshold"
                    type="number"
                    min={1}
                    max={100}
                    value={config.hot_threshold}
                    onChange={(e) => updateConfig('hot_threshold', parseInt(e.target.value) || 70)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">+</span>
                </div>
              </div>
              <Slider
                value={[config.hot_threshold]}
                onValueChange={([value]) => updateConfig('hot_threshold', value)}
                min={1}
                max={100}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-red-500"
              />
              <p className="text-xs text-muted-foreground">
                Leads with score {'>='} {config.hot_threshold} are classified as Hot (ready for consultation)
              </p>
            </div>

            {/* Warm Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="warm_threshold">Warm Lead Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="warm_threshold"
                    type="number"
                    min={0}
                    max={99}
                    value={config.warm_threshold}
                    onChange={(e) => updateConfig('warm_threshold', parseInt(e.target.value) || 40)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">+</span>
                </div>
              </div>
              <Slider
                value={[config.warm_threshold]}
                onValueChange={([value]) => updateConfig('warm_threshold', value)}
                min={0}
                max={99}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-yellow-500"
              />
              <p className="text-xs text-muted-foreground">
                Leads with score {'>='} {config.warm_threshold} and {'<'} {config.hot_threshold} are Warm (continue nurturing)
              </p>
            </div>
          </div>

          {/* Preview Examples */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[25, 55, 85].map(score => {
                const temp = getTemperatureForScore(score)
                const colors = {
                  hot: 'bg-red-100 text-red-700 border-red-200',
                  warm: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  cold: 'bg-blue-100 text-blue-700 border-blue-200',
                }
                return (
                  <div key={score} className={`p-2 rounded border ${colors[temp]}`}>
                    <span className="font-medium">Score {score}</span>
                    <span className="block capitalize">{temp} Lead</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weights Section */}
      <div className="space-y-6 pt-6 border-t">
        <div>
          <h3 className="text-md font-medium mb-2">Category Weights</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Allocate points across scoring categories (must total 100)
          </p>

          {/* Total Indicator */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
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

        <div className="space-y-6">
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
          <li>Hot leads are offered consultation booking immediately</li>
          <li>Warm leads continue ARI conversation for nurturing</li>
          <li>Cold leads receive community link and are handed off</li>
          <li>Weights determine how each category contributes to total score</li>
        </ul>
      </div>
    </div>
  )
}

// Weight Slider Component
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={5}
      />
    </div>
  )
}
