"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Brain, TrendingUp, AlertCircle, Calendar, ExternalLink, BarChart3 } from "lucide-react"
import { backupSettings } from "@/lib/settings-backup"

// Default brain configuration
const DEFAULT_BRAIN_CONFIG = {
  summary: {
    enabled: true,
    time: "09:00",
    format: "bullet",
    includeMetrics: {
      newLeads: true,
      conversions: true,
      responseTimes: true,
      topSources: false,
    },
  },
  scoring: {
    hotThreshold: 70,
    warmThreshold: 40,
    weights: {
      basicInfo: 20,
      qualification: 30,
      document: 25,
      engagement: 25,
    },
  },
  triggers: {
    onHandoff: true,
    onKeyword: true,
    keyword: "!summary",
    onSchedule: false,
    schedule: "0 9 * * *",
    analysisDepth: "standard",
  },
}

export type BrainConfig = typeof DEFAULT_BRAIN_CONFIG

interface BrainSettingsProps {
  workspaceSlug: string
}

export function BrainSettings({ workspaceSlug }: BrainSettingsProps) {
  const [config, setConfig] = useState<BrainConfig>(DEFAULT_BRAIN_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceSlug}/brain-config`)
        if (res.ok) {
          const data = await res.json()
          setConfig({ ...DEFAULT_BRAIN_CONFIG, ...data })
        }
      } catch (error) {
        console.error("Failed to load brain config:", error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [workspaceSlug])

  // Auto-save functionality
  async function saveConfig(updates: Partial<BrainConfig>) {
    setSaving(true)
    try {
      const newConfig = { ...config, ...updates }
      setConfig(newConfig)

      const res = await fetch(`/api/workspaces/${workspaceSlug}/brain-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Settings saved", {
        description: "Your Brain configuration has been updated.",
      })

      // Create backup after successful save
      await backupSettings(workspaceSlug, "brain_config", newConfig)
    } catch (error) {
      console.error("Failed to save config:", error)
      toast.error("Failed to save settings", {
        description: "Please try again later.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Update handlers
  function updateSummary(key: string, value: string | boolean) {
    saveConfig({ summary: { ...config.summary, [key]: value } })
  }

  function updateSummaryMetrics(key: string, checked: boolean) {
    saveConfig({
      summary: {
        ...config.summary,
        includeMetrics: { ...config.summary.includeMetrics, [key]: checked },
      },
    })
  }

  function updateScoring(key: string, value: number) {
    saveConfig({ scoring: { ...config.scoring, [key]: value } })
  }

  function updateScoringWeight(key: string, value: number) {
    saveConfig({
      scoring: {
        ...config.scoring,
        weights: { ...config.scoring.weights, [key]: value },
      },
    })
  }

  function updateTrigger(key: string, value: string | boolean) {
    saveConfig({ triggers: { ...config.triggers, [key]: value } })
  }

  // Calculate total weight
  const totalWeight =
    config.scoring.weights.basicInfo +
    config.scoring.weights.qualification +
    config.scoring.weights.document +
    config.scoring.weights.engagement

  const isWeightValid = totalWeight === 100

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-56 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Summary Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Summary Settings
          </CardTitle>
          <CardDescription>
            Configure daily summaries and reporting from Grok Manager Bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bot Name Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Bot Name</p>
                <p className="text-sm text-muted-foreground">Grok (Brain)</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/${workspaceSlug}/settings?section=bot-names`}>
                Change
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>

          <Separator />

          {/* Daily Summary Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="summaryEnabled">Daily Summary</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate daily lead summaries
              </p>
            </div>
            <Switch
              id="summaryEnabled"
              checked={config.summary.enabled}
              onCheckedChange={(checked) => updateSummary("enabled", checked)}
            />
          </div>

          {config.summary.enabled && (
            <>
              <Separator />

              {/* Summary Time */}
              <div className="space-y-3">
                <Label htmlFor="summaryTime">Summary Time</Label>
                <Input
                  id="summaryTime"
                  type="time"
                  value={config.summary.time}
                  onChange={(e) => updateSummary("time", e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Timezone will be based on your workspace settings
                </p>
              </div>

              <Separator />

              {/* Summary Format */}
              <div className="space-y-3">
                <Label htmlFor="summaryFormat">Summary Format</Label>
                <Select
                  value={config.summary.format}
                  onValueChange={(value) => updateSummary("format", value)}
                >
                  <SelectTrigger id="summaryFormat">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullet">Bullet Points - Quick overview</SelectItem>
                    <SelectItem value="paragraph">Paragraph - Narrative format</SelectItem>
                    <SelectItem value="detailed">Detailed - Full analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Include Metrics */}
              <div className="space-y-3">
                <Label>Include in Summary</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metricNewLeads" className="cursor-pointer">
                      New Leads
                    </Label>
                    <Switch
                      id="metricNewLeads"
                      checked={config.summary.includeMetrics.newLeads}
                      onCheckedChange={(checked) => updateSummaryMetrics("newLeads", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metricConversions" className="cursor-pointer">
                      Conversions
                    </Label>
                    <Switch
                      id="metricConversions"
                      checked={config.summary.includeMetrics.conversions}
                      onCheckedChange={(checked) => updateSummaryMetrics("conversions", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metricResponseTimes" className="cursor-pointer">
                      Response Times
                    </Label>
                    <Switch
                      id="metricResponseTimes"
                      checked={config.summary.includeMetrics.responseTimes}
                      onCheckedChange={(checked) => updateSummaryMetrics("responseTimes", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metricTopSources" className="cursor-pointer">
                      Top Sources
                    </Label>
                    <Switch
                      id="metricTopSources"
                      checked={config.summary.includeMetrics.topSources}
                      onCheckedChange={(checked) => updateSummaryMetrics("topSources", checked)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Scoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Scoring Configuration
          </CardTitle>
          <CardDescription>
            Set thresholds and weights for lead scoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hot Threshold */}
          <div className="space-y-3">
            <Label htmlFor="hotThreshold">
              Hot Lead Threshold: {config.scoring.hotThreshold}+
            </Label>
            <Slider
              id="hotThreshold"
              value={[config.scoring.hotThreshold]}
              onValueChange={([value]) => updateScoring("hotThreshold", value)}
              min={50}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Leads scoring above this value are marked as Hot
            </p>
          </div>

          <Separator />

          {/* Warm Threshold */}
          <div className="space-y-3">
            <Label htmlFor="warmThreshold">
              Warm Lead Threshold: {config.scoring.warmThreshold}+
            </Label>
            <Slider
              id="warmThreshold"
              value={[config.scoring.warmThreshold]}
              onValueChange={([value]) => updateScoring("warmThreshold", value)}
              min={10}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Leads scoring between warm and hot thresholds are marked as Warm
            </p>
          </div>

          <Separator />

          {/* Scoring Weights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Scoring Weights</Label>
              <div className={`text-sm font-medium ${isWeightValid ? "text-green-600" : "text-red-600"}`}>
                Total: {totalWeight}%
                {!isWeightValid && <AlertCircle className="w-4 h-4 inline ml-1" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Weights must add up to 100%. Adjust sliders to balance scoring.
            </p>

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightBasic">Basic Info (name, contact)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.scoring.weights.basicInfo}%
                </span>
              </div>
              <Slider
                id="weightBasic"
                value={[config.scoring.weights.basicInfo]}
                onValueChange={([value]) => updateScoringWeight("basicInfo", value)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* Qualification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightQualification">Qualification (education, goals)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.scoring.weights.qualification}%
                </span>
              </div>
              <Slider
                id="weightQualification"
                value={[config.scoring.weights.qualification]}
                onValueChange={([value]) => updateScoringWeight("qualification", value)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* Document */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightDocument">Document Readiness (passport, etc.)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.scoring.weights.document}%
                </span>
              </div>
              <Slider
                id="weightDocument"
                value={[config.scoring.weights.document]}
                onValueChange={([value]) => updateScoringWeight("document", value)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* Engagement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightEngagement">Engagement (response rate, activity)</Label>
                <span className="text-sm text-muted-foreground">
                  {config.scoring.weights.engagement}%
                </span>
              </div>
              <Slider
                id="weightEngagement"
                value={[config.scoring.weights.engagement]}
                onValueChange={([value]) => updateScoringWeight("engagement", value)}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Analysis Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Analysis Triggers
          </CardTitle>
          <CardDescription>
            Configure when Grok performs lead analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trigger on Handoff */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="triggerHandoff">Analyze on Handoff</Label>
              <p className="text-sm text-muted-foreground">
                Automatically analyze lead when conversation is handed to human
              </p>
            </div>
            <Switch
              id="triggerHandoff"
              checked={config.triggers.onHandoff}
              onCheckedChange={(checked) => updateTrigger("onHandoff", checked)}
            />
          </div>

          <Separator />

          {/* Trigger on Keyword */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="triggerKeyword">Keyword Trigger</Label>
                <p className="text-sm text-muted-foreground">
                  Trigger analysis with specific keyword command
                </p>
              </div>
              <Switch
                id="triggerKeyword"
                checked={config.triggers.onKeyword}
                onCheckedChange={(checked) => updateTrigger("onKeyword", checked)}
              />
            </div>

            {config.triggers.onKeyword && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Input
                  value={config.triggers.keyword}
                  onChange={(e) => updateTrigger("keyword", e.target.value)}
                  className="flex-1 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Message this keyword to trigger analysis
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Scheduled Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="triggerSchedule">Scheduled Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Run analysis on a recurring schedule
                </p>
              </div>
              <Switch
                id="triggerSchedule"
                checked={config.triggers.onSchedule}
                onCheckedChange={(checked) => updateTrigger("onSchedule", checked)}
              />
            </div>

            {config.triggers.onSchedule && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={config.triggers.schedule}
                    onChange={(e) => updateTrigger("schedule", e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="0 9 * * *"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cron format (e.g., &quot;0 9 * * *&quot; = daily at 9am)
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Analysis Depth */}
          <div className="space-y-3">
            <Label htmlFor="analysisDepth">Analysis Depth</Label>
            <Select
              value={config.triggers.analysisDepth}
              onValueChange={(value) => updateTrigger("analysisDepth", value)}
            >
              <SelectTrigger id="analysisDepth">
                <SelectValue placeholder="Select depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick - Fast surface-level analysis</SelectItem>
                <SelectItem value="standard">Standard - Balanced analysis</SelectItem>
                <SelectItem value="deep">Deep - Comprehensive detailed analysis</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Deeper analysis takes longer but provides more insights
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Warning */}
      {!isWeightValid && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Scoring weights must total 100%</p>
            <p className="text-sm text-muted-foreground">
              Current total: {totalWeight}%. Please adjust the sliders above.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
