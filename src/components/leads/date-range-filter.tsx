'use client'

import { Button } from '@/components/ui/button'

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
] as const

type DatePreset = (typeof DATE_PRESETS)[number]['value']

interface DateRangeFilterProps {
  value: number | null
  onChange: (cutoff: number | null) => void
}

function getDateCutoff(preset: DatePreset): number | null {
  if (preset === 'all') return null

  const now = new Date()

  switch (preset) {
    case 'today':
      // Start of today at 00:00:00
      return new Date(now.setHours(0, 0, 0, 0)).getTime()
    case 'week':
      // 7 days ago from now
      return Date.now() - 7 * 24 * 60 * 60 * 1000
    case 'month':
      // 30 days ago from now
      return Date.now() - 30 * 24 * 60 * 60 * 1000
    default:
      return null
  }
}

function getActivePreset(cutoff: number | null): DatePreset {
  if (cutoff === null) return 'all'

  // Check which preset matches the current cutoff
  // Allow for small time differences (within 5 minutes)
  const tolerance = 5 * 60 * 1000

  const todayCutoff = getDateCutoff('today')
  const weekCutoff = getDateCutoff('week')
  const monthCutoff = getDateCutoff('month')

  if (todayCutoff && Math.abs(cutoff - todayCutoff) < tolerance) return 'today'
  if (weekCutoff && Math.abs(cutoff - weekCutoff) < tolerance) return 'week'
  if (monthCutoff && Math.abs(cutoff - monthCutoff) < tolerance) return 'month'

  // If no match, default to the closest
  return 'all'
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const activePreset = getActivePreset(value)

  const handlePresetClick = (preset: DatePreset) => {
    const cutoff = getDateCutoff(preset)
    onChange(cutoff)
  }

  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-muted/30">
      {DATE_PRESETS.map((preset) => {
        const isActive = activePreset === preset.value
        return (
          <Button
            key={preset.value}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={`text-xs ${
              isActive
                ? 'bg-background shadow-sm font-semibold'
                : 'hover:bg-background/50'
            }`}
          >
            {preset.label}
          </Button>
        )
      })}
    </div>
  )
}
