# 21-01 Summary: WIB Timezone Utilities

**Status:** Complete
**Duration:** ~3 minutes
**Date:** 2026-01-17

## What Was Built

Created timezone utility module for WIB (Indonesia Western Time, UTC+7) date handling.

### Files Created/Modified

| File | Change |
|------|--------|
| `src/lib/utils/timezone.ts` | New - WIB timezone functions |
| `src/lib/utils.ts` | Modified - Re-export timezone utilities |

### Functions Added

- `toWIB(date)` - Convert UTC date to WIB
- `formatWIB(date, formatStr)` - Format date in WIB timezone
- `formatDistanceWIB(date, options)` - Relative time formatting
- `isTodayWIB(date)` - Check if date is today in WIB

### Constants Added

```typescript
DATE_FORMATS = {
  DATE_SHORT: 'MMM d',           // Jan 15
  DATE_LONG: 'MMM d, yyyy',      // Jan 15, 2026
  TIME: 'HH:mm',                 // 14:30
  TIME_12H: 'hh:mm a',           // 02:30 PM
  DATETIME: 'MMM d, HH:mm',      // Jan 15, 14:30
  DATETIME_LONG: 'MMM d, yyyy HH:mm', // Jan 15, 2026 14:30
}
```

## Commits

1. `ee0787a` - feat(utils): add WIB timezone utilities
2. `59165aa` - feat(utils): export timezone utilities from main utils

## Verification

- [x] File `src/lib/utils/timezone.ts` exists and exports all functions
- [x] Functions handle both Date objects and ISO strings
- [x] DATE_FORMATS constants provide consistent formatting options
- [x] Import from `@/lib/utils` works (via re-export)

## Usage Example

```typescript
import { formatWIB, DATE_FORMATS, isTodayWIB } from '@/lib/utils'

// Format a date in WIB
formatWIB(contact.created_at) // "Jan 15, 14:30"
formatWIB(contact.created_at, DATE_FORMATS.DATE_LONG) // "Jan 15, 2026"

// Check if date is today
if (isTodayWIB(note.due_date)) {
  // Show "Due today" indicator
}
```

## Notes

- WIB offset is hardcoded (UTC+7) as it doesn't observe daylight saving time
- date-fns v4.1.0 already installed in project
- Existing TypeScript errors in database page are unrelated to this plan
