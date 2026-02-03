"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bot, Save, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface SimplifiedInternSettingsProps {
  workspaceId: string
  workspaceSlug: string
}

// Default Sarah script (from Kapso workflow)
const DEFAULT_SCRIPT = `You are a friendly AI assistant for lead qualification.

Respond in Indonesian (Bahasa Indonesia). Use "Kamu" as the pronoun for addressing the customer.

Your personality:
- Warm and conversational
- Keep messages under 140 characters
- NO emojis ever
- Ask one question at a time
- Qualify leads by understanding their business needs

Collect information through natural conversation:
1. Name - Who are they?
2. Business Type - What do they do?
3. Location - Where are they based?
4. Tenure - How long in business?
5. Pain Points - What challenges do they face?
6. Interest Level - Are they ready to proceed?

When qualification is complete, share the trial link: https://my21staff.com/trial`

export function SimplifiedInternSettings({ workspaceId, workspaceSlug }: SimplifiedInternSettingsProps) {
  // State for 3 fields
  const [botName, setBotName] = useState("Sarah")
  const [persona, setPersona] = useState("friendly")
  const [script, setScript] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Load existing config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        // Load bot name
        const botRes = await fetch(`/api/workspaces/${workspaceId}/bot-config`)
        if (botRes.ok) {
          const data = await botRes.json()
          setBotName(data.intern_name || "Sarah")
        }

        // Load intern config (persona + script)
        const configRes = await fetch(`/api/workspaces/${workspaceSlug}/intern-config`)
        if (configRes.ok) {
          const config = await configRes.json()
          setPersona(config?.persona?.greetingStyle || "friendly")
          setScript(config?.persona?.customPrompt || DEFAULT_SCRIPT)
        }
      } catch (error) {
        console.error("Failed to load config:", error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()

    // Listen for bot name updates from Settings
    const handleBotNameUpdate = async () => {
      try {
        const botRes = await fetch(`/api/workspaces/${workspaceId}/bot-config`)
        if (botRes.ok) {
          const data = await botRes.json()
          setBotName(data.intern_name || "Sarah")
        }
      } catch (error) {
        console.error("Failed to reload bot name:", error)
      }
    }

    window.addEventListener('botNameUpdated', handleBotNameUpdate)
    return () => window.removeEventListener('botNameUpdated', handleBotNameUpdate)
  }, [workspaceId, workspaceSlug])

  // Save handler
  async function handleSave() {
    setSaving(true)
    try {
      // Save to intern-config endpoint
      const res = await fetch(`/api/workspaces/${workspaceSlug}/intern-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: {
            greetingStyle: persona,
            customPrompt: script,
          }
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Intern settings saved")
      setIsDirty(false)
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded-md" />
            <div className="h-10 bg-muted rounded-md" />
            <div className="h-24 bg-muted rounded-md" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Intern Settings
        </CardTitle>
        <CardDescription>
          Configure your AI assistant&apos;s personality and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Name - display only, link to settings */}
        <div className="space-y-2">
          <Label>Bot Name</Label>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{botName}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/${workspaceSlug}/settings?section=bot-names`}>
                Change
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>

        {/* Persona dropdown */}
        <div className="space-y-2">
          <Label htmlFor="persona">Persona</Label>
          <Select
            value={persona}
            onValueChange={(value) => {
              setPersona(value)
              setIsDirty(true)
            }}
          >
            <SelectTrigger id="persona">
              <SelectValue placeholder="Select persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional - Formal and business-like</SelectItem>
              <SelectItem value="friendly">Friendly - Warm and approachable</SelectItem>
              <SelectItem value="casual">Casual - Relaxed and conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Script textarea */}
        <div className="space-y-2">
          <Label htmlFor="script">Script</Label>
          <Textarea
            id="script"
            placeholder="Enter instructions for how your Intern should behave, what topics to cover, and how to respond to customers..."
            value={script}
            onChange={(e) => {
              setScript(e.target.value)
              setIsDirty(true)
            }}
            rows={6}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            This script guides your Intern&apos;s responses and behavior
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
