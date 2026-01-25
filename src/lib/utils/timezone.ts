import { format, formatDistanceToNow } from 'date-fns'

// WIB is UTC+7 (Indonesia Western Time)
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/**
 * Convert a UTC date to WIB timezone
 * Handles Date objects, ISO strings, and numeric timestamps (Convex)
 */
export function toWIB(date: Date | string | number): Date {
  let d: Date
  if (typeof date === 'number') {
    d = new Date(date)
  } else if (typeof date === 'string') {
    d = new Date(date)
  } else {
    d = date
  }
  return new Date(d.getTime() + WIB_OFFSET_MS)
}

/**
 * Format a date in WIB timezone
 * @param date - Date to format (assumed UTC) - accepts Date, string, or number (timestamp)
 * @param formatStr - date-fns format string (default: 'MMM d, HH:mm')
 */
export function formatWIB(date: Date | string | number, formatStr: string = 'MMM d, HH:mm'): string {
  return format(toWIB(date), formatStr)
}

/**
 * Format relative time in WIB
 * @param date - Date to format (assumed UTC) - accepts Date, string, or number (timestamp)
 */
export function formatDistanceWIB(date: Date | string | number, options?: { addSuffix?: boolean }): string {
  return formatDistanceToNow(toWIB(date), options)
}

/**
 * Check if date is today in WIB timezone
 */
export function isTodayWIB(date: Date | string | number): boolean {
  const wibDate = toWIB(date)
  const now = toWIB(new Date())
  return wibDate.toDateString() === now.toDateString()
}

/**
 * Standard date formats for consistency
 */
export const DATE_FORMATS = {
  DATE_SHORT: 'MMM d',           // Jan 15
  DATE_LONG: 'MMM d, yyyy',      // Jan 15, 2026
  TIME: 'HH:mm',                 // 14:30
  TIME_12H: 'hh:mm a',           // 02:30 PM
  DATETIME: 'MMM d, HH:mm',      // Jan 15, 14:30
  DATETIME_LONG: 'MMM d, yyyy HH:mm', // Jan 15, 2026 14:30
} as const
