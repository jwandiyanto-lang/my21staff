# Plan 04: Contact Detail - Messages & Activity Tabs

## Objective
Connect Messages tab to conversation history and enhance Activity tab with timeline.

## Reference
- Messages query: `convex/messages.ts`
- ContactNotes query: `convex/contactNotes.ts`

---

## Task 1: Add Messages tab content

**File:** `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

Fetch messages for contact's conversation:
```tsx
// Add import
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

// Add query for contact's conversation messages
const conversation = useQuery(api.conversations.getByContactId, {
  contact_id: contact?.id as any,
})

const messages = useQuery(
  api.messages.listByConversation,
  conversation?._id ? { conversation_id: conversation._id } : 'skip'
)
```

Messages tab content:
```tsx
<TabsContent value="messages" className="m-0 h-[400px] overflow-hidden flex flex-col">
  {messages === undefined ? (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading messages...</p>
    </div>
  ) : messages.length === 0 ? (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">No messages yet</p>
    </div>
  ) : (
    <ScrollArea className="flex-1">
      <div className="space-y-3 p-2">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={cn(
              "flex",
              msg.direction === 'outbound' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              msg.direction === 'outbound'
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )}
</TabsContent>
```

**Commit:** `feat(04.1-04): add Messages tab with conversation history`

---

## Task 2: Enhance Activity tab with timeline

**File:** `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

Add icons import:
```tsx
import { MessageCircle, StickyNote, TrendingUp, Calendar } from 'lucide-react'
```

Update Activity tab to show timeline:
```tsx
<TabsContent value="activity" className="m-0 space-y-4">
  {/* Add note form */}
  <form onSubmit={handleAddNote} className="space-y-2">
    <Textarea
      value={newNote}
      onChange={(e) => setNewNote(e.target.value)}
      placeholder="Add a note..."
      className="min-h-[60px]"
    />
    <div className="flex justify-end">
      <Button type="submit" size="sm" disabled={!newNote.trim() || addNoteMutation.isPending}>
        {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
      </Button>
    </div>
  </form>

  {/* Activity Timeline */}
  <div className="space-y-3">
    <h4 className="text-sm font-medium text-muted-foreground">Activity</h4>
    {notes.map((note: any) => (
      <div key={note._id} className="flex gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">{note.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>
    ))}
    {notes.length === 0 && (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    )}
  </div>
</TabsContent>
```

**Commit:** `feat(04.1-04): enhance Activity tab with timeline view`

---

## Task 3: Add conversation query to Convex (if missing)

**File:** `convex/conversations.ts`

Check if `getByContactId` query exists, if not add:
```ts
export const getByContactId = query({
  args: { contact_id: v.id('contacts') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('conversations')
      .withIndex('by_contact', (q) => q.eq('contact_id', args.contact_id))
      .first()
  },
})
```

**Commit:** `feat(04.1-04): add getByContactId query`

---

## Verification
```bash
npm run build
npm run dev
```
- Messages tab shows conversation history
- Activity tab shows notes with timeline icons
- Add note form works

---

## Files Modified
- `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`
- `convex/conversations.ts` (if needed)

## Estimated Duration
~8 min
