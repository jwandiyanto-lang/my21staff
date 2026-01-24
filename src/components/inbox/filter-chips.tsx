'use client'

import { Badge } from '@/components/ui/badge'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'new', label: 'Baru' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Hangat' },
  { value: 'cold', label: 'Dingin' },
  { value: 'converted', label: 'Terjual' },
  { value: 'lost', label: 'Hilang' },
]

interface FilterChipsProps {
  statusFilters: string[]
  tagFilters: string[]
  availableTags: string[]
  onStatusChange: (filters: string[]) => void
  onTagChange: (filters: string[]) => void
}

export function FilterChips({
  statusFilters,
  tagFilters,
  availableTags,
  onStatusChange,
  onTagChange,
}: FilterChipsProps) {
  const handleStatusClick = (status: string) => {
    if (status === 'all') {
      // Clear all filters
      onStatusChange([])
    } else {
      // Toggle status filter
      if (statusFilters.includes(status)) {
        onStatusChange(statusFilters.filter((s) => s !== status))
      } else {
        onStatusChange([...statusFilters, status])
      }
    }
  }

  const handleTagClick = (tag: string) => {
    if (tagFilters.includes(tag)) {
      onTagChange(tagFilters.filter((t) => t !== tag))
    } else {
      onTagChange([...tagFilters, tag])
    }
  }

  const isStatusSelected = (status: string) => {
    if (status === 'all') {
      return statusFilters.length === 0
    }
    return statusFilters.includes(status)
  }

  return (
    <div className="space-y-3">
      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={isStatusSelected(option.value) ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() => handleStatusClick(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableTags.map((tag) => (
            <Badge
              key={tag}
              variant={tagFilters.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
