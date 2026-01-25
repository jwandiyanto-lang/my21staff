# Plan 02: Inbox Filters - Revert to Popover Style

## Objective
Replace filter chips/badges with popover checkboxes matching v2.0 design.

## Reference
- Original v2.0 inbox: `git show 94b020e:src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`
- Current file: `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

---

## Task 1: Update inbox-client.tsx imports

**File:** `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

Add popover and checkbox imports:
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Filter, ChevronDown, X } from 'lucide-react'
import { LEAD_STATUS_CONFIG, LEAD_STATUSES } from '@/lib/lead-status'
```

**Commit:** `feat(04.1-02): add popover imports to inbox`

---

## Task 2: Replace ConversationList filter props

**File:** `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

Move filter UI from ConversationList to inbox-client header. The ConversationList should just receive filtered data, not handle filters.

Update the left panel to include filter header:
```tsx
<div className="w-80 border-r flex flex-col bg-background">
  {/* Filter Header */}
  <div className="p-3 border-b flex items-center gap-2">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Status
          {statusFilters.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 rounded">
              {statusFilters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-2">
        {/* Status checkboxes */}
      </PopoverContent>
    </Popover>
  </div>

  {/* Conversation List */}
  <ConversationList ... />
</div>
```

**Commit:** `feat(04.1-02): add status filter popover to inbox header`

---

## Task 3: Build status filter popover content

**File:** `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`

Popover content with checkboxes:
```tsx
<PopoverContent align="start" className="w-56 p-2">
  <div className="space-y-1">
    {LEAD_STATUSES.map((status) => {
      const config = LEAD_STATUS_CONFIG[status]
      const isSelected = statusFilters.includes(status)
      return (
        <div
          key={status}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
          onClick={() => {
            setStatusFilters(prev =>
              isSelected
                ? prev.filter(s => s !== status)
                : [...prev, status]
            )
          }}
        >
          <Checkbox checked={isSelected} />
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm">{config.label}</span>
        </div>
      )
    })}
    {statusFilters.length > 0 && (
      <>
        <div className="border-t my-1" />
        <button
          onClick={() => setStatusFilters([])}
          className="w-full text-xs text-muted-foreground hover:text-foreground text-left px-2 py-1"
        >
          Clear all
        </button>
      </>
    )}
  </div>
</PopoverContent>
```

**Commit:** `feat(04.1-02): implement status filter checkboxes`

---

## Task 4: Simplify ConversationList component

**File:** `src/components/inbox/conversation-list.tsx`

Remove filter UI from ConversationList - it should just display conversations:
```tsx
interface ConversationListProps {
  conversations: Conversation[]
  selectedId: Id<'conversations'> | null
  onSelect: (id: Id<'conversations'>) => void
  members: Member[]
}
```

Remove FilterChips import and usage.

**Commit:** `feat(04.1-02): simplify ConversationList to display only`

---

## Task 5: Delete unused filter-chips.tsx

**File:** `src/components/inbox/filter-chips.tsx`

Delete this file - no longer needed with popover style.

**Commit:** `chore(04.1-02): remove unused filter-chips component`

---

## Verification
```bash
npm run build
```
- Status filter button visible in inbox header
- Clicking opens popover with checkboxes
- Selecting status filters the conversation list
- Clear all button works

---

## Files Modified
- `src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`
- `src/components/inbox/conversation-list.tsx`

## Files Deleted
- `src/components/inbox/filter-chips.tsx`

## Estimated Duration
~8 min
