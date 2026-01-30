"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CheckCircle2, Loader2, AlertCircle, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface SyncStatusIndicatorProps {
  workspaceId: string
}

export function SyncStatusIndicator({ workspaceId }: SyncStatusIndicatorProps) {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"

  // In dev mode, show offline indicator
  if (isDevMode) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1.5">
              <WifiOff className="h-3 w-3 text-orange-500" />
              Offline Mode
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Using local mock data - no network calls</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Fetch sync status from Convex
  const syncStatus = useQuery(api.settingsBackup.getSyncStatus, {
    workspace_id: workspaceId as any,
  })

  const [isRetrying, setIsRetrying] = useState(false)

  // Map status to display state
  const status = syncStatus?.status ?? "pending"
  const lastSync = syncStatus?.lastSync ?? null
  const error = syncStatus?.error ?? null

  // Determine display state
  const getState = () => {
    if (status === "synced") return "synced"
    if (status === "error") return "error"
    return "syncing"
  }

  const state = getState()

  // Handle retry on error
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      // Trigger a fresh backup to retry sync
      await fetch(`/api/workspaces/${workspaceId}/settings-backup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup_type: "manual_retry",
          config_data: { retry: true },
          source: "user_save",
        }),
      })
    } catch (err) {
      console.error("Failed to retry sync:", err)
    } finally {
      setIsRetrying(false)
    }
  }

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return null
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true })
    } catch {
      return null
    }
  }

  const lastSyncText = formatLastSync()

  // Synced state
  if (state === "synced") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              Synced
              {lastSyncText && <span className="text-xs text-green-600">({lastSyncText})</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Settings backed up successfully</p>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                Last sync: {new Date(lastSync).toLocaleString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Syncing state
  if (state === "syncing") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1.5 border-orange-200 bg-orange-50 text-orange-700">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Creating backup of your settings...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Error state
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 cursor-pointer border-red-200 bg-red-50 text-red-700",
              "hover:bg-red-100 transition-colors"
            )}
            onClick={handleRetry}
          >
            {isRetrying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            Sync Error
            {lastSyncText && <span className="text-xs text-red-600">({lastSyncText})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            {error || "Failed to sync settings. Click to retry."}
          </p>
          {lastSync && (
            <p className="text-xs text-muted-foreground mt-1">
              Last successful sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
