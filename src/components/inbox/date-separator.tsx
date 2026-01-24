/**
 * Date separator for message groups.
 *
 * Displays a centered pill with formatted date label.
 * Shows "Today", "Yesterday", or formatted date like "January 15, 2026".
 */

import { format, isToday, isYesterday, parseISO } from 'date-fns'

interface DateSeparatorProps {
  date: string // yyyy-MM-dd format
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const dateObj = parseISO(date)

  let label: string
  if (isToday(dateObj)) {
    label = 'Today'
  } else if (isYesterday(dateObj)) {
    label = 'Yesterday'
  } else {
    label = format(dateObj, 'MMMM d, yyyy')
  }

  return (
    <div className="flex items-center justify-center py-2">
      <div className="bg-muted/80 text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
        {label}
      </div>
    </div>
  )
}
