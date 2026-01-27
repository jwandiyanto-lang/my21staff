# Phase 4.2: Inbox Rework to v2.0 Style

## Objective
Fully restore the inbox UI to match the v2.0 design that user prefers.

## Reference Commits
- v2.0 inbox-client: `git show 94b020e:src/app/(dashboard)/[workspace]/inbox/inbox-client.tsx`
- v2.0 conversation-list: `git show 94b020e:src/app/(dashboard)/[workspace]/inbox/conversation-list.tsx`
- v2.0 message-thread: `git show 94b020e:src/app/(dashboard)/[workspace]/inbox/message-thread.tsx`

## Current State
The inbox has been partially updated but doesn't match the v2.0 feel.

## Key v2.0 Design Elements

### 1. Inbox Layout
- Search bar + icon-only filter button (badge on top-right corner)
- 320px left sidebar
- Two-panel layout with conversation list and message thread

### 2. Conversation List (v2.0 style)
- **ScrollArea wrapper** for scrolling
- **Status dot** - small colored circle (not tags/badges)
- **Simple layout:**
  - Avatar | Name + Status dot + Unread badge
  - Message preview
  - Time ago
- **Button-based items** - full-width, text-left
- **Empty states** - different for search vs no data

### 3. Message Thread Header (v2.0 style)
- Avatar + Name + **Status Badge** (colored outline badge)
- Phone number + Lead score displayed
- Clean border-b separation

### 4. Message Bubbles (v2.0 style)
- **70% max-width**
- Outbound: `ml-auto bg-primary text-primary-foreground`
- Inbound: `bg-muted`
- **ScrollArea wrapper** for messages
- Simple timestamp below each bubble

### 5. Color Usage
- Status dots use `LEAD_STATUS_CONFIG[status].color`
- Status badges use `color`, `borderColor`, `backgroundColor` from config

## Files to Modify

1. `src/components/inbox/conversation-list.tsx` - Full rewrite to v2.0 style
2. `src/components/inbox/conversation-item.tsx` - May be removed/merged into list
3. `src/components/inbox/message-thread.tsx` - Update header styling
4. `src/components/inbox/message-bubble.tsx` - Verify matches v2.0

## Data Compatibility Notes

The v2.0 used Supabase types (`ConversationWithContact`, `Message`, `Contact`).
Current uses Convex types. Need to map appropriately:

| v2.0 Type | Convex Type |
|-----------|-------------|
| `conversation.id` | `conversation._id` |
| `conversation.contact` | `conversation.contact` (same) |
| `conversation.contact.lead_status` | `conversation.contact.lead_status` |

## Success Criteria
- [ ] Conversation list uses ScrollArea with v2.0 item styling
- [ ] Status shown as colored dot (not tags)
- [ ] Message thread header shows status badge + score
- [ ] Message bubbles match v2.0 styling (70% width, proper colors)
- [ ] Search + filter work correctly
- [ ] English text throughout
