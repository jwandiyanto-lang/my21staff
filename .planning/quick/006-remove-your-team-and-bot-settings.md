---
phase: quick-006
completed: 2026-02-03
duration: ~15min
---

# Quick Task 006: Remove Your Team Page and Bot Settings

**Simplified Settings by removing Your Team page and bot name configuration**

## Accomplishments

1. **Deleted Your Team page entirely**
   - Removed route: `src/app/(dashboard)/[workspace]/your-team/`
   - Removed components: `src/components/your-team/`
   - Removed navigation link from sidebar
   - Removed Bot icon import from sidebar

2. **Simplified Settings page**
   - Removed "AI Assistant" tab
   - Removed "Intern Name" settings card
   - Settings now single-page focused on Leads management
   - Kept: Tags and Activity Tracking cards

3. **Updated redirects**
   - Changed knowledge-base redirect from `/your-team` to dashboard

## Files Modified

- `src/components/workspace/sidebar.tsx` - Removed "Your Team" nav link and Bot icon
- `src/app/(dashboard)/[workspace]/settings/settings-client.tsx` - Removed bot name state, handleSave, and AI Assistant tab
- `src/app/(dashboard)/[workspace]/knowledge-base/page.tsx` - Updated redirect to dashboard

## Files Deleted

- `src/app/(dashboard)/[workspace]/your-team/page.tsx`
- `src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx`
- `src/components/your-team/simplified-intern-settings.tsx`
- `src/components/your-team/intern-settings.tsx`
- `src/components/your-team/brain-settings.tsx`
- `src/components/your-team/brain-settings.tsx.backup`

## Impact

- **Removed:** 2,441 lines of code
- **Simplified:** Settings page now has clear focus on Leads management only
- **Cleaner navigation:** Sidebar reduced to core features (Dashboard, Inbox, Leads, Settings)

## Commits

- `7b92e63` - feat(your-team): pre-populate script textarea with current Kapso script
- `8a5204f` - feat(settings): sync bot name changes between Settings and Your Team
- `efa33b6` - refactor: remove Your Team page and bot name settings

## Production

Deployed to: https://www.my21staff.com

---
*Completed: 2026-02-03*
