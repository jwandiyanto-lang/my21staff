"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { isDevMode, MOCK_CONVEX_WORKSPACE } from "@/lib/mock-data"
import type { Id } from "convex/_generated/dataModel"

interface TagFilterDropdownProps {
  /** Currently selected tags */
  value: string[]
  /** Callback when selection changes */
  onChange: (tags: string[]) => void
  /** Workspace ID for fetching available tags */
  workspaceId: Id<"workspaces">
}

/**
 * TagFilterDropdown component for filtering conversations by tags.
 *
 * Uses multi-select checkboxes with AND logic - conversations must have ALL selected tags.
 * Fetches workspace tags from workspace.settings.tags.
 */
export function TagFilterDropdown({
  value,
  onChange,
  workspaceId,
}: TagFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  // Fetch workspace for tags
  const workspace = useQuery(
    api.workspaces.get,
    isDevMode() ? "skip" : { id: workspaceId }
  )

  // Dev mode mock tags
  const availableTags = isDevMode()
    ? MOCK_CONVEX_WORKSPACE.settings?.contact_tags || []
    : workspace?.settings?.contact_tags || []

  // Sort tags alphabetically
  const sortedTags = [...availableTags].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )

  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      onChange([...value, tag])
    } else {
      onChange(value.filter((t) => t !== tag))
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const isTagSelected = (tag: string) => value.includes(tag)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
        >
          <Tags className="h-4 w-4" />
          <span>Tags</span>
          {value.length > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs"
            >
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-0"
      >
        <div className="flex flex-col max-h-[300px] overflow-y-auto">
          {sortedTags.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tags configured
            </div>
          ) : (
            sortedTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={isTagSelected(tag)}
                  onCheckedChange={(checked) =>
                    handleTagToggle(tag, checked as boolean)
                  }
                />
                <span className="text-sm">{tag}</span>
              </label>
            ))
          )}
        </div>
        {value.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
