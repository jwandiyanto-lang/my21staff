"use client"

import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { isDevMode } from "@/lib/mock-data"
import { MOCK_CONVERSATIONS } from "@/lib/mock-data"
import { LEAD_STATUS_CONFIG, LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status"
import type { Id } from "convex/_generated/dataModel"

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
 * Displays dropdown menu with checkboxes (matches database filter style).
 * Single selection - clicking an option replaces the current filter.
 */
export function FilterTabs({
  value,
  onChange,
  workspaceId,
  activeOnly = false,
}: FilterTabsProps) {
  // Fetch workspace status config (custom or default)
  const statusConfig = useQuery(
    api.workspaces.getStatusConfig,
    isDevMode() ? "skip" : { workspaceId }
  )

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

  // Use workspace status config or fall back to default LEAD_STATUSES
  const workspaceStatuses = isDevMode()
    ? LEAD_STATUSES.map(key => LEAD_STATUS_CONFIG[key])
    : statusConfig || LEAD_STATUSES.map(key => LEAD_STATUS_CONFIG[key])

  // Current counts (real or mock)
  const currentCounts = isDevMode() ? mockCounts : counts

  // Current selection as tab key
  const selectedKey: StatusTabKey = value.length === 0 ? "all" : (value[0] as StatusTabKey)

  const handleSelect = (key: string) => {
    if (key === "all") {
      onChange([])
    } else {
      onChange([key as LeadStatus])
    }
  }

  // Get current selection label
  const selectedStatus = workspaceStatuses.find((s) => s.key === selectedKey)
  const displayLabel = selectedKey === "all" ? "All Status" : selectedStatus?.label || "All Status"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 flex-1">
          <Filter className="h-4 w-4 mr-2" />
          {displayLabel}
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuCheckboxItem
          checked={selectedKey === "all"}
          onCheckedChange={() => handleSelect("all")}
        >
          All Status
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {workspaceStatuses.map((status) => {
          const isChecked = selectedKey === status.key
          return (
            <DropdownMenuCheckboxItem
              key={status.key}
              checked={isChecked}
              onCheckedChange={() => handleSelect(status.key)}
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: status.color }}
              />
              {status.label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
