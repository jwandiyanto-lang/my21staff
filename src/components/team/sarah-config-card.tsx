"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bot, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Id } from "convex/_generated/dataModel"

interface SarahConfigCardProps {
  workspaceId: Id<"workspaces">
  isDevMode: boolean
}

// Default config for dev mode
const DEV_MODE_CONFIG = {
  bot_name: "Your Intern (Demo)",
  language: "id",
  pronoun: "Kamu",
  trial_link: "https://example.com/trial",
}

export function SarahConfigCard({ workspaceId, isDevMode }: SarahConfigCardProps) {
  // Form state - always defined
  const [botName, setBotName] = useState("")
  const [language, setLanguage] = useState("id")
  const [pronoun, setPronoun] = useState("Kamu")
  const [trialLink, setTrialLink] = useState("")
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Production mode queries - skip in dev mode
  // In dev mode, we use static config. In production, we fetch from Convex.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = useQuery(
    api.sarah.config.getConfig as any,
    isDevMode ? "skip" : { workspace_id: workspaceId as any }
  )
  const updateConfig = useMutation(api.sarah.config.updateConfig)

  // Initialize form from config data (handles both dev and production)
  useEffect(() => {
    if (isDevMode) {
      setBotName(DEV_MODE_CONFIG.bot_name)
      setLanguage(DEV_MODE_CONFIG.language)
      setPronoun(DEV_MODE_CONFIG.pronoun)
      setTrialLink(DEV_MODE_CONFIG.trial_link)
      setIsDirty(false)
    } else if (config) {
      setBotName(config.bot_name)
      setLanguage(config.language)
      setPronoun(config.pronoun)
      setTrialLink(config.trial_link)
      setIsDirty(false)
    }
  }, [isDevMode, config])

  // Track changes
  const handleChange = (field: string, value: string) => {
    setIsDirty(true)
    switch (field) {
      case "bot_name":
        setBotName(value)
        break
      case "language":
        setLanguage(value)
        // Reset pronoun when language changes
        if (value === "en") {
          setPronoun("Kamu")
        } else {
          setPronoun("Kamu")
        }
        break
      case "pronoun":
        setPronoun(value)
        break
      case "trial_link":
        setTrialLink(value)
        break
    }
  }

  // Save config
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateConfig({
        workspace_id: workspaceId,
        bot_name: botName,
        language: language,
        pronoun: language === "en" ? "Kamu" : pronoun,
        trial_link: trialLink,
      })
      toast.success("Sarah configuration saved")
      setIsDirty(false)
    } catch (error) {
      console.error("Failed to save config:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  // Dev mode UI - static disabled form
  if (isDevMode) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Your AI Assistant
          </CardTitle>
          <CardDescription>
            Customize Sarah&apos;s behavior for your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name-dev">Bot Name</Label>
              <Input
                id="bot-name-dev"
                value={DEV_MODE_CONFIG.bot_name}
                disabled
                placeholder="Enter bot name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-dev">Language</Label>
              <Select value={DEV_MODE_CONFIG.language} disabled>
                <SelectTrigger id="language-dev">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesian</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pronoun-dev">Pronoun</Label>
              <Select value={DEV_MODE_CONFIG.pronoun} disabled>
                <SelectTrigger id="pronoun-dev">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kamu">Kamu</SelectItem>
                  <SelectItem value="Anda">Anda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial-link-dev">Trial Link</Label>
              <Input
                id="trial-link-dev"
                type="url"
                value={DEV_MODE_CONFIG.trial_link}
                disabled
                placeholder="https://your-trial-page.com"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Offline mode - settings not saved
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Production loading state
  if (config === undefined) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Your AI Assistant
          </CardTitle>
          <CardDescription>
            Customize Sarah&apos;s behavior for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded-md" />
            <div className="h-10 bg-muted rounded-md" />
            <div className="h-10 bg-muted rounded-md" />
            <div className="h-10 bg-muted rounded-md" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Production mode - editable form
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Your AI Assistant
        </CardTitle>
        <CardDescription>
          Customize Sarah&apos;s behavior for your customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Bot Name</Label>
            <Input
              id="bot-name"
              value={botName}
              onChange={(e) => handleChange("bot_name", e.target.value)}
              placeholder="Enter bot name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={language}
              onValueChange={(value) => handleChange("language", value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Indonesian</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {language === "id" && (
            <div className="space-y-2">
              <Label htmlFor="pronoun">Pronoun</Label>
              <Select
                value={pronoun}
                onValueChange={(value) => handleChange("pronoun", value)}
              >
                <SelectTrigger id="pronoun">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kamu">Kamu</SelectItem>
                  <SelectItem value="Anda">Anda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="trial-link">Trial Link</Label>
            <Input
              id="trial-link"
              type="url"
              value={trialLink}
              onChange={(e) => handleChange("trial_link", e.target.value)}
              placeholder="https://your-trial-page.com"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
