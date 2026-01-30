"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Brain, TrendingUp, AlertCircle, Calendar, ExternalLink, BarChart3, ChevronDown } from "lucide-react"
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
  workspaceId: string
  workspaceSlug: string
}

export function BrainSettings({ workspaceId, workspaceSlug }: BrainSettingsProps) {
  const [config, setConfig] = useState<BrainConfig>(DEFAULT_BRAIN_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [botName, setBotName] = useState("Grok") // Dynamic bot name
  const [openCards, setOpenCards] = useState({
    summary: true,
    scoring: false,
    triggers: false,
  })

  // Load bot name
  useEffect(() => {
    async function loadBotName() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/bot-config`)
        if (res.ok) {
          const data = await res.json()
          setBotName(data.brain_name || "Grok")
        }
      } catch (error) {
        console.error("Failed to load bot name:", error)
      }
    }
    loadBotName()

    // Listen for settings changes in dev mode
    const handleSettingsUpdate = () => {
      loadBotName()
    }
    window.addEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('mockWorkspaceSettingsUpdated', handleSettingsUpdate)
    }
  }, [workspaceId])

  const toggleCard = (card: keyof typeof openCards) => {
    setOpenCards(prev => ({ ...prev, [card]: !prev[card] }))
  }

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
      <Collapsible open={openCards.summary} onOpenChange={() => toggleCard('summary')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Summary Settings
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${openCards.summary ? '' : 'rotate-180'}`} />
              </CardTitle>
              <CardDescription>
                Configure daily summaries and reporting from {botName} Manager Bot
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
          {/* Bot Name Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Bot Name</p>
                <p className="text-sm text-muted-foreground">{botName} (Brain)</p>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card 2: Scoring Configuration */}
      <Collapsible open={openCards.scoring} onOpenChange={() => toggleCard('scoring')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Scoring Configuration
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${openCards.scoring ? '' : 'rotate-180'}`} />
              </CardTitle>
              <CardDescription>
                Set thresholds and weights for lead scoring
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
          {/* Hot Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hotThreshold">Hot Lead Threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hotThreshold"
                  type="number"
                  value={config.scoring.hotThreshold}
                  onChange={(e) => updateScoring("hotThreshold", parseInt(e.target.value) || 50)}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value) || 50
                    if (value < 50) updateScoring("hotThreshold", 50)
                    if (value > 100) updateScoring("hotThreshold", 100)
                  }}
                  min={50}
                  max={100}
                  className="w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">+</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leads scoring above this value are marked as Hot
            </p>
          </div>

          <Separator />

          {/* Warm Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="warmThreshold">Warm Lead Threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="warmThreshold"
                  type="number"
                  value={config.scoring.warmThreshold}
                  onChange={(e) => updateScoring("warmThreshold", parseInt(e.target.value) || 10)}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value) || 10
                    if (value < 10) updateScoring("warmThreshold", 10)
                    if (value > 50) updateScoring("warmThreshold", 50)
                  }}
                  min={10}
                  max={50}
                  className="w-20 text-right"
                />
                <span className="text-sm text-muted-foreground">+</span>
              </div>
            </div>
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
              Weights must add up to 100%. Adjust values to balance scoring.
            </p>

            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightBasic">Basic Info (name, contact)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weightBasic"
                    type="number"
                    value={config.scoring.weights.basicInfo}
                    onChange={(e) => updateScoringWeight("basicInfo", parseInt(e.target.value) || 0)}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value < 0) updateScoringWeight("basicInfo", 0)
                      if (value > 100) updateScoringWeight("basicInfo", 100)
                    }}
                    min={0}
                    max={100}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightQualification">Qualification (education, goals)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weightQualification"
                    type="number"
                    value={config.scoring.weights.qualification}
                    onChange={(e) => updateScoringWeight("qualification", parseInt(e.target.value) || 0)}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value < 0) updateScoringWeight("qualification", 0)
                      if (value > 100) updateScoringWeight("qualification", 100)
                    }}
                    min={0}
                    max={100}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Document */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightDocument">Document Readiness (passport, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weightDocument"
                    type="number"
                    value={config.scoring.weights.document}
                    onChange={(e) => updateScoringWeight("document", parseInt(e.target.value) || 0)}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value < 0) updateScoringWeight("document", 0)
                      if (value > 100) updateScoringWeight("document", 100)
                    }}
                    min={0}
                    max={100}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weightEngagement">Engagement (response rate, activity)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weightEngagement"
                    type="number"
                    value={config.scoring.weights.engagement}
                    onChange={(e) => updateScoringWeight("engagement", parseInt(e.target.value) || 0)}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value < 0) updateScoringWeight("engagement", 0)
                      if (value > 100) updateScoringWeight("engagement", 100)
                    }}
                    min={0}
                    max={100}
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card 3: Analysis Triggers */}
      <Collapsible open={openCards.triggers} onOpenChange={() => toggleCard('triggers')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Analysis Triggers
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${openCards.triggers ? '' : 'rotate-180'}`} />
              </CardTitle>
              <CardDescription>
                Configure when {botName} performs lead analysis
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Validation Warning */}
      {!isWeightValid && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Scoring weights must total 100%</p>
            <p className="text-sm text-muted-foreground">
              Current total: {totalWeight}%. Please adjust the values above.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
