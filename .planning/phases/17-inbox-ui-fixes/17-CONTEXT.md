# Phase 17: Inbox UI/UX Fixes - Context

**Gathered:** 2026-01-16
**Status:** Ready for planning

<vision>
## How This Should Work

The inbox should feel more like WhatsApp - familiar, clean, and functional. The conversation area needs a subtle background pattern instead of plain white. All the filter and assignment features should actually work, not just be there for show.

The header buttons should be logically arranged: Notes and Merge together on the left (actions on the contact), AI Aktif on the right edge (mode toggle). No hidden 3-dot menu - everything visible.

</vision>

<essential>
## What Must Be Nailed

1. **Filters that work** - Status, tags, and Unread filters must actually filter the conversation list
2. **Responsive Info panel** - Must not get cut off on narrow screens
3. **Clear button layout** - Notes | Merge on left, AI Aktif on right edge

</essential>

<boundaries>
## What's Out of Scope

- Major inbox redesign - just fixes and polish
- New features beyond what's listed
- Mobile-specific optimizations (desktop first)

</boundaries>

<specifics>
## Specific Ideas

1. **WhatsApp background** - Subtle pattern/texture in conversation area (like WhatsApp's light gray pattern)
2. **Info panel** - Make it responsive or scrollable when screen is narrow
3. **Header layout**: `[Notes] [Merge] ──── [AI Aktif]`
4. **Filters**:
   - Status dropdown → filter by lead_status
   - Tags → filter by tags array
   - Unread button → filter where unread_count > 0
5. **Assigned to dropdown** - Query workspace_members, show names, default to owner if empty
6. **Cascade delete** - When a contact is deleted, automatically delete their conversation

</specifics>

<notes>
## Additional Context

All fixes are in the inbox (`src/app/(dashboard)/[workspace]/inbox/`):
- `inbox-client.tsx` - Main inbox component with filters
- `message-thread.tsx` - Conversation view with header buttons

Priority: Filters working > Header layout > Background > Info panel responsive

**Also from Phase 16:**
- Ensure header/footer consistency between all public pages (home, pricing, etc.)
- Check "21" logo styling matches across pages

</notes>

---

*Phase: 16-inbox-ui-fixes*
*Context gathered: 2026-01-16*
