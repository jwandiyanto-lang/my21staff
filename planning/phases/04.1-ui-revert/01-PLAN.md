# Plan 01: Contact Detail Sheet - Revert to v2.0 Style

## Objective
Convert contact detail from Dialog (centered modal) back to Sheet (slide from right) with 3 tabs: Details, Messages, Activity. Keep Convex backend.

## Reference
- Original v2.0 code: `git show a89369c^:src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`
- Current file: `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

---

## Task 1: Replace Dialog with Sheet

**File:** `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

**Changes:**
```diff
- import {
-   Dialog,
-   DialogContent,
-   DialogHeader,
-   DialogTitle,
- } from '@/components/ui/dialog'
+ import {
+   Sheet,
+   SheetContent,
+   SheetHeader,
+   SheetTitle,
+ } from '@/components/ui/sheet'
```

```diff
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
-     <DialogHeader>
-       <DialogTitle>
+ <Sheet open={open} onOpenChange={onOpenChange}>
+   <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto">
+     <SheetHeader>
+       <SheetTitle>
```

And closing tags accordingly.

**Commit:** `feat(04.1-01): replace Dialog with Sheet component`

---

## Task 2: Change 4 tabs to 3 tabs

**File:** `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

**Changes:**

1. Update default tab state:
```diff
- const [activeTab, setActiveTab] = useState('profile')
+ const [activeTab, setActiveTab] = useState('details')
```

2. Update TabsList:
```diff
- <TabsList className="grid w-full grid-cols-4">
-   <TabsTrigger value="profile">Profile</TabsTrigger>
-   <TabsTrigger value="documents">Documents</TabsTrigger>
-   <TabsTrigger value="conversations">Conversations</TabsTrigger>
-   <TabsTrigger value="notes">Notes</TabsTrigger>
- </TabsList>
+ <TabsList className="grid w-full grid-cols-3">
+   <TabsTrigger value="details">Details</TabsTrigger>
+   <TabsTrigger value="messages">Messages</TabsTrigger>
+   <TabsTrigger value="activity">Activity</TabsTrigger>
+ </TabsList>
```

3. Rename `profile` TabsContent to `details`
4. Delete `documents` TabsContent entirely
5. Rename `conversations` to `messages`
6. Rename `notes` to `activity`

**Commit:** `feat(04.1-01): change to 3 tabs (Details, Messages, Activity)`

---

## Task 3: Update tab content placeholders

**File:** `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

Update the Messages and Activity tab content:

**Messages tab:**
```tsx
<TabsContent value="messages" className="m-0">
  <div className="text-sm text-muted-foreground p-8 text-center">
    <p>Message history will appear here</p>
    <p className="text-xs mt-2">Connect to inbox in Plan 03</p>
  </div>
</TabsContent>
```

**Activity tab** - keep the notes functionality but rename references.

**Commit:** `feat(04.1-01): update tab content structure`

---

## Verification
```bash
npm run build
```
- Sheet opens from right side
- 3 tabs visible: Details, Messages, Activity
- Details tab shows contact fields
- Activity tab shows notes

---

## Files Modified
- `src/app/(dashboard)/[workspace]/database/contact-detail-sheet.tsx`

## Estimated Duration
~5 min
