"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Bot, Clock, MessageSquare, Settings2, Zap, Plus, X, ExternalLink } from "lucide-react"
import { backupSettings } from "@/lib/settings-backup"

// Default intern configuration
const DEFAULT_INTERN_CONFIG = {
  persona: {
    greetingStyle: "friendly",
    language: "indonesian",
    tone: ["supportive", "clear"],
    customPrompt: "",
  },
  behavior: {
    autoRespondNewLeads: true,
    handoffKeywords: ["human", "operator", "manager", "cs", "customer service"],
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    maxMessagesBeforeHuman: 10,
  },
  response: {
    maxMessageLength: 280,
    emojiUsage: "moderate",
    priceMentions: "ranges",
    responseDelay: "instant",
  },
  slotExtraction: {
    enabled: true,
    slots: {
      name: { enabled: true, required: true },
      serviceInterest: { enabled: true, required: false },
      budgetRange: { enabled: true, required: false },
      timeline: { enabled: true, required: false },
    },
    customSlots: [],
  },
}

export type InternConfig = typeof DEFAULT_INTERN_CONFIG

interface InternSettingsProps {
  workspaceSlug: string
}

export function InternSettings({ workspaceSlug }: InternSettingsProps) {
  const [config, setConfig] = useState<InternConfig>(DEFAULT_INTERN_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCustomSlot, setNewCustomSlot] = useState("")

  // Load configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceSlug}/intern-config`)
        if (res.ok) {
          const data = await res.json()
          setConfig({ ...DEFAULT_INTERN_CONFIG, ...data })
        }
      } catch (error) {
        console.error("Failed to load intern config:", error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [workspaceSlug])

  // Auto-save functionality
  async function saveConfig(updates: Partial<InternConfig>) {
    setSaving(true)
    try {
      const newConfig = { ...config, ...updates }
      setConfig(newConfig)

      const res = await fetch(`/api/workspaces/${workspaceSlug}/intern-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Settings saved", {
        description: "Your Intern configuration has been updated.",
      })

      // Create backup after successful save
      await backupSettings(workspaceSlug, "intern_config", newConfig)
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
  function updatePersona(key: string, value: string | string[]) {
    saveConfig({ persona: { ...config.persona, [key]: value } })
  }

  function updateBehavior(key: string, value: string | number | boolean | string[]) {
    saveConfig({ behavior: { ...config.behavior, [key]: value } })
  }

  function updateResponse(key: string, value: string | number) {
    saveConfig({ response: { ...config.response, [key]: value } })
  }

  function updateSlotExtraction(key: string, value: boolean | Record<string, { enabled: boolean; required: boolean }>) {
    saveConfig({ slotExtraction: { ...config.slotExtraction, [key]: value } })
  }

  function toggleTone(tone: string) {
    const currentTones = config.persona.tone
    const newTones = currentTones.includes(tone)
      ? currentTones.filter((t) => t !== tone)
      : [...currentTones, tone]
    updatePersona("tone", newTones)
  }

  function toggleSlot(slotName: string) {
    const currentSlots = config.slotExtraction.slots
    saveConfig({
      slotExtraction: {
        ...config.slotExtraction,
        slots: {
          ...currentSlots,
          [slotName]: {
            ...currentSlots[slotName as keyof typeof currentSlots],
            enabled: !currentSlots[slotName as keyof typeof currentSlots].enabled,
          },
        },
      },
    })
  }

  function toggleSlotRequired(slotName: string) {
    const currentSlots = config.slotExtraction.slots
    saveConfig({
      slotExtraction: {
        ...config.slotExtraction,
        slots: {
          ...currentSlots,
          [slotName]: {
            ...currentSlots[slotName as keyof typeof currentSlots],
            required: !currentSlots[slotName as keyof typeof currentSlots].required,
          },
        },
      },
    })
  }

  function addCustomSlot() {
    if (newCustomSlot.trim() && !config.slotExtraction.customSlots.includes(newCustomSlot.trim())) {
      saveConfig({
        slotExtraction: {
          ...config.slotExtraction,
          customSlots: [...config.slotExtraction.customSlots, newCustomSlot.trim()],
        },
      })
      setNewCustomSlot("")
    }
  }

  function removeCustomSlot(slot: string) {
    saveConfig({
      slotExtraction: {
        ...config.slotExtraction,
        customSlots: config.slotExtraction.customSlots.filter((s) => s !== slot),
      },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-36 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Persona
          </CardTitle>
          <CardDescription>
            Configure how the Intern (Sarah) presents herself to leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bot Name Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Bot Name</p>
                <p className="text-sm text-muted-foreground">Sarah (Intern)</p>
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

          {/* Greeting Style */}
          <div className="space-y-3">
            <Label htmlFor="greetingStyle">Greeting Style</Label>
            <Select
              value={config.persona.greetingStyle}
              onValueChange={(value) => updatePersona("greetingStyle", value)}
            >
              <SelectTrigger id="greetingStyle">
                <SelectValue placeholder="Select greeting style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional - Formal and business-like</SelectItem>
                <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
                <SelectItem value="casual">Casual - Relaxed and conversational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <Label htmlFor="language">Primary Language</Label>
            <Select
              value={config.persona.language}
              onValueChange={(value) => updatePersona("language", value)}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indonesian">Indonesian (Bahasa Indonesia)</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <Label>Tone (select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {["supportive", "clear", "encouraging", "professional", "warm"].map((tone) => (
                <Badge
                  key={tone}
                  variant={config.persona.tone.includes(tone) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTone(tone)}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-3">
            <Label htmlFor="customPrompt">Custom System Prompt</Label>
            <Textarea
              id="customPrompt"
              placeholder="You are Sarah, an educational consultant..."
              value={config.persona.customPrompt}
              onChange={(e) => updatePersona("customPrompt", e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Add specific instructions for Sarah&apos;s behavior and knowledge base
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Behavior Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Behavior Rules
          </CardTitle>
          <CardDescription>
            Control when and how the Intern responds to conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-respond to new leads */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoRespond">Auto-respond to New Leads</Label>
              <p className="text-sm text-muted-foreground">
                Automatically start conversation when new leads message
              </p>
            </div>
            <Switch
              id="autoRespond"
              checked={config.behavior.autoRespondNewLeads}
              onCheckedChange={(checked) => updateBehavior("autoRespondNewLeads", checked)}
            />
          </div>

          <Separator />

          {/* Handoff Keywords */}
          <div className="space-y-3">
            <Label htmlFor="handoffKeywords">Handoff Trigger Keywords</Label>
            <p className="text-sm text-muted-foreground">
              When leads use these words, conversation is flagged for human handoff
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.behavior.handoffKeywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <button
                    onClick={() =>
                      updateBehavior(
                        "handoffKeywords",
                        config.behavior.handoffKeywords.filter((k) => k !== keyword)
                      )
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add keyword..."
                value={newCustomSlot}
                onChange={(e) => setNewCustomSlot(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (newCustomSlot.trim() && !config.behavior.handoffKeywords.includes(newCustomSlot.trim())) {
                      updateBehavior("handoffKeywords", [
                        ...config.behavior.handoffKeywords,
                        newCustomSlot.trim(),
                      ])
                      setNewCustomSlot("")
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newCustomSlot.trim() && !config.behavior.handoffKeywords.includes(newCustomSlot.trim())) {
                    updateBehavior("handoffKeywords", [
                      ...config.behavior.handoffKeywords,
                      newCustomSlot.trim(),
                    ])
                    setNewCustomSlot("")
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="quietHours">Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Disable auto-responses during specific hours
                </p>
              </div>
              <Switch
                id="quietHours"
                checked={config.behavior.quietHoursEnabled}
                onCheckedChange={(checked) => updateBehavior("quietHoursEnabled", checked)}
              />
            </div>

            {config.behavior.quietHoursEnabled && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="quietStart">From</Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={config.behavior.quietHoursStart}
                    onChange={(e) => updateBehavior("quietHoursStart", e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="quietEnd">To</Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={config.behavior.quietHoursEnd}
                    onChange={(e) => updateBehavior("quietHoursEnd", e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Max Messages Before Human */}
          <div className="space-y-3">
            <Label htmlFor="maxMessages">
              Max Messages Before Human Handoff: {config.behavior.maxMessagesBeforeHuman}
            </Label>
            <Slider
              id="maxMessages"
              value={[config.behavior.maxMessagesBeforeHuman]}
              onValueChange={([value]) => updateBehavior("maxMessagesBeforeHuman", value)}
              min={3}
              max={20}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Automatically suggest human handoff after this many messages
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Response Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Response Settings
          </CardTitle>
          <CardDescription>
            Control how the Intern generates and delivers responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Message Length */}
          <div className="space-y-3">
            <Label htmlFor="maxLength">
              Max Message Length: {config.response.maxMessageLength} chars
            </Label>
            <Slider
              id="maxLength"
              value={[config.response.maxMessageLength]}
              onValueChange={([value]) => updateResponse("maxMessageLength", value)}
              min={50}
              max={500}
              step={10}
            />
          </div>

          <Separator />

          {/* Emoji Usage */}
          <div className="space-y-3">
            <Label htmlFor="emojiUsage">Emoji Usage</Label>
            <Select
              value={config.response.emojiUsage}
              onValueChange={(value) => updateResponse("emojiUsage", value)}
            >
              <SelectTrigger id="emojiUsage">
                <SelectValue placeholder="Select emoji usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never - No emojis</SelectItem>
                <SelectItem value="minimal">Minimal - Rare use for emphasis</SelectItem>
                <SelectItem value="moderate">Moderate - Normal conversational use</SelectItem>
                <SelectItem value="frequent">Frequent - Expressive and friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Mentions */}
          <div className="space-y-3">
            <Label htmlFor="priceMentions">Price/Budget Mentions</Label>
            <Select
              value={config.response.priceMentions}
              onValueChange={(value) => updateResponse("priceMentions", value)}
            >
              <SelectTrigger id="priceMentions">
                <SelectValue placeholder="Select price handling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never - Avoid discussing prices</SelectItem>
                <SelectItem value="ranges">Ranges Only - Mention ranges, not exact figures</SelectItem>
                <SelectItem value="exact">Exact - Can provide exact pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Response Delay */}
          <div className="space-y-3">
            <Label htmlFor="responseDelay">Response Delay</Label>
            <Select
              value={config.response.responseDelay}
              onValueChange={(value) => updateResponse("responseDelay", value)}
            >
              <SelectTrigger id="responseDelay">
                <SelectValue placeholder="Select response delay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant - Immediate response</SelectItem>
                <SelectItem value="2-5sec">2-5 seconds - Slight human-like delay</SelectItem>
                <SelectItem value="5-10sec">5-10 seconds - More natural delay</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adding slight delays makes responses feel more natural
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Slot Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Slot Extraction
          </CardTitle>
          <CardDescription>
            Configure what information to extract from conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="slotExtraction">Enable Slot Extraction</Label>
              <p className="text-sm text-muted-foreground">
                Automatically extract key information from conversations
              </p>
            </div>
            <Switch
              id="slotExtraction"
              checked={config.slotExtraction.enabled}
              onCheckedChange={(checked) => updateSlotExtraction("enabled", checked)}
            />
          </div>

          {config.slotExtraction.enabled && (
            <>
              <Separator />

              {/* Standard Slots */}
              <div className="space-y-4">
                <Label>Standard Slots</Label>
                {Object.entries(config.slotExtraction.slots).map(([slotKey, slot]) => (
                  <div
                    key={slotKey}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`slot-${slotKey}`}
                        checked={slot.enabled}
                        onCheckedChange={() => toggleSlot(slotKey)}
                      />
                      <Label htmlFor={`slot-${slotKey}`} className="capitalize">
                        {slotKey.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Required</span>
                      <Switch
                        checked={slot.required}
                        onCheckedChange={() => toggleSlotRequired(slotKey)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Custom Slots */}
              <div className="space-y-3">
                <Label>Custom Slots</Label>
                <div className="flex flex-wrap gap-2">
                  {config.slotExtraction.customSlots.map((slot) => (
                    <Badge key={slot} variant="outline" className="gap-1">
                      {slot}
                      <button onClick={() => removeCustomSlot(slot)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {config.slotExtraction.customSlots.length === 0 && (
                    <p className="text-sm text-muted-foreground">No custom slots added</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom slot..."
                    value={newCustomSlot}
                    onChange={(e) => setNewCustomSlot(e.target.value)}
                  />
                  <Button variant="outline" size="icon" onClick={addCustomSlot}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add custom information to extract (e.g., &quot;current school&quot;, &quot;work experience&quot;)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
