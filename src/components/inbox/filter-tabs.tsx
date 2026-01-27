"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { isDevMode } from "@/lib/mock-data"
import { MOCK_CONVERSATIONS } from "@/lib/mock-data"
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status"
import type { Id } from "@/convex/_generated/dataModel"

// Status configuration for tabs (ordered as specified)
const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "hot", label: "Hot" },
  { key: "warm", label: "Warm" },
  { key: "cold", label: "Cold" },
  { key: "client", label: "Client" },
  { key: "lost", label: "Lost" },
] as const

export type StatusTabKey = typeof STATUS_TABS[number]["key"]

interface FilterTabsProps {
  /** Currently selected status filter - empty array means "all" */
  value: LeadStatus[]
  /** Callback when selection changes */
  onChange: (statuses: LeadStatus[]) => void
  /** Workspace ID for fetching counts */
  workspaceId: Id<"workspaces">
  /** Filter for active conversations only */
  activeOnly?: boolean
}

/**
 * FilterTabs component for filtering conversations by lead status.
 *
 * Displays horizontal tabs (WhatsApp-style) with real-time conversation counts.
 * Single selection - clicking a tab replaces the current filter.
 */
export function FilterTabs({
  value,
  onChange,
  workspaceId,
  activeOnly = false,
}: FilterTabsProps) {
  // Fetch real-time counts from Convex
  const counts = useQuery(
    api.conversations.getConversationCountsByStatus,
    isDevMode()
      ? "skip"
      : { workspace_id: workspaceId, active: activeOnly }
  )

  // Dev mode mock counts
  const mockCounts = isDevMode()
    ? {
        new: MOCK_CONVERSATIONS.filter(
          (c) => c.contact?.lead_status === "new" || !c.contact?.lead_status
        ).length,
        hot: MOCK_CONVERSATIONS.filter((c) => c.contact?.lead_status === "hot")
          .length,
        warm: MOCK_CONVERSATIONS.filter((c) => c.contact?.lead_status === "warm")
          .length,
        cold: MOCK_CONVERSATIONS.filter((c) => c.contact?.lead_status === "cold")
          .length,
        client: MOCK_CONVERSATIONS.filter(
          (c) => c.contact?.lead_status === "client"
        ).length,
        lost: MOCK_CONVERSATIONS.filter((c) => c.contact?.lead_status === "lost")
          .length,
      }
    : null

  // Current counts (real or mock)
  const currentCounts = isDevMode() ? mockCounts : counts

  // Current selection as tab key
  const selectedKey: StatusTabKey = value.length === 0 ? "all" : (value[0] as StatusTabKey)

  const handleTabClick = (key: StatusTabKey) => {
    if (key === "all") {
      onChange([])
    } else {
      onChange([key as LeadStatus])
    }
  }

  // Calculate total count
  const totalCount =
    currentCounts !== null
      ? Object.values(currentCounts).reduce((sum, c) => sum + (c || 0), 0)
      : null

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_TABS.map((tab) => {
        const count =
          currentCounts !== null
            ? tab.key === "all"
              ? totalCount
              : currentCounts[tab.key as LeadStatus] || 0
            : null

        const isSelected = selectedKey === tab.key
        const config = tab.key === "all" ? null : LEAD_STATUS_CONFIG[tab.key]

        return (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            onClick={() => handleTabClick(tab.key)}
            className={`
              flex items-center gap-1.5 whitespace-nowrap transition-colors
              ${isSelected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }
            `}
          >
            <span>{tab.label}</span>
            {count !== null && count > 0 && (
              <Badge
                variant="secondary"
                className={`
                  h-5 min-w-[1.25rem] px-1 text-xs
                  ${isSelected
                    ? "bg-white/20 text-white"
                    : "bg-background/80 text-foreground"
                  }
                `}
              >
                {count}
              </Badge>
            )}
            {count === null && (
              <Badge
                variant="secondary"
                className="h-5 min-w-[1.25rem] px-1 text-xs bg-transparent"
              >
                ...
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
