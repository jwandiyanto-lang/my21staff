# Quick Task 001: Fix Layout Design - Brand Colors & Apple-like Minimalism

## Description

Update the CRM app layout to be lighter, cleaner, and more Apple-like. Currently using sage/green tint background - should be cleaner white. Also document design principles for future development.

## Tasks

### Task 1: Lighten Main Content Background
**File:** `src/app/globals.css`

Update CSS variables to use cleaner white/cream backgrounds:
- `--background`: Change from sage-tinted `oklch(0.96 0.01 145)` to pure off-white `oklch(0.985 0.002 90)` (matching landing page)
- `--card`: Keep pure white `oklch(1 0 0)`
- `--secondary`: Lighten to cleaner sage `oklch(0.96 0.02 145)`

### Task 2: Update Footer Bar
**File:** `src/app/(dashboard)/[workspace]/layout.tsx`

The footer uses `bg-sidebar/40` which creates a dark tinted bar. Change to lighter secondary color for cleaner look.

### Task 3: Document Design Principles
**File:** `business/brand/docs/DESIGN-PRINCIPLES.md` (new)

Create a design principles document capturing:
- Sleek, minimalistic, Apple-like aesthetic
- No heavy textboxes - content should breathe
- Clean whitespace
- Subtle shadows instead of borders
- Key UI patterns to follow

## Success Criteria

- [x] Main content area feels light and clean (white/cream, not sage-tinted)
- [x] Footer bar matches light theme
- [x] DESIGN-PRINCIPLES.md exists with guidelines
- [x] App still looks cohesive with dark green sidebar

## Commit Message

```
style(layout): lighten CRM background for Apple-like minimalism

- Update CSS --background to pure off-white (#FBFBFA)
- Lighten footer bar from sidebar-tinted to secondary color
- Add DESIGN-PRINCIPLES.md for future development guidance
```
