/**
 * Date separator for message groups.
 *
 * Displays a centered pill with formatted date label.
 * Shows "Hari Ini" (Today), "Kemarin" (Yesterday), or formatted date
 * like "15 Januari 2026" in Indonesian locale.
 */

import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

interface DateSeparatorProps {
  date: string // yyyy-MM-dd format
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const dateObj = parseISO(date)

  let label: string
  if (isToday(dateObj)) {
    label = 'Hari Ini'
  } else if (isYesterday(dateObj)) {
    label = 'Kemarin'
  } else {
    label = format(dateObj, 'd MMMM yyyy', { locale: id })
  }

  return (
    <div className="flex items-center justify-center py-2">
      <div className="bg-muted/80 text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
        {label}
      </div>
    </div>
  )
}
