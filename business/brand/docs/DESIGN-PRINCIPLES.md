# my21staff Design Principles

## Core Philosophy

**Sleek. Minimalistic. Apple-like.**

The CRM interface should feel effortless to use. Every element earns its place on screen. No visual clutter.

---

## Design Pillars

### 1. Content Breathes

- Generous whitespace around elements
- No heavy borders or boxes
- Information flows naturally
- Less is more - remove until it breaks

### 2. Clean Backgrounds

- Main content: Pure off-white (`#FBFBFA`)
- Cards: White (`#FFFFFF`) with subtle shadows
- Sidebar: Deep forest green (`#14261a`) for contrast
- Avoid sage/colored backgrounds in content areas

### 3. Subtle Depth

- Use shadows instead of borders where possible
- Shadows should be soft: `shadow-sm` or `shadow-md`
- Hover states add depth, not color
- Cards lift slightly on interaction

### 4. Purposeful Color

| Color | Usage |
|-------|-------|
| Dark Green `#284b31` | Primary buttons, headings |
| Orange `#F7931A` | CTAs, highlights, active states |
| Off-white `#FBFBFA` | Background |
| Pure White `#FFFFFF` | Cards, inputs |

### 5. Typography Hierarchy

- Headings: Plus Jakarta Sans, semibold
- Body: Inter, regular
- Use font weight, not color, for emphasis
- Limit text sizes to 3-4 variants per page

---

## Anti-Patterns (Avoid)

| Don't | Do Instead |
|-------|-----------|
| Heavy borders around inputs | Subtle shadow or 1px light border |
| Colored/tinted backgrounds | Pure white/off-white |
| Dense packed information | Cards with generous padding |
| Multiple competing CTAs | One primary action per section |
| Decorative icons | Functional icons only |
| Text-heavy interfaces | Concise labels, whitespace |

---

## Component Guidelines

### Cards

```css
/* Apple-like card */
background: white;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
padding: 24px;
```

### Buttons

- Primary: Dark green, rounded, subtle shadow
- Secondary: White with border, no shadow
- Ghost: No background, just text + icon
- All buttons: Consistent padding, not too tall

### Forms

- Labels above inputs, not inline
- Inputs: White background, light border
- Focus state: Primary color ring
- No heavy outlines or colored backgrounds

### Tables

- No row borders, use subtle alternating backgrounds if needed
- Generous row height (48-56px)
- Left-aligned text, right-aligned numbers
- Hover highlights entire row

---

## Spacing Scale

Follow 4px grid:
- `4px` - Tight spacing between related items
- `8px` - Standard gap within components
- `16px` - Padding inside cards
- `24px` - Section gaps
- `32px+` - Major section separation

---

## Reference

These principles align with:
- Apple Human Interface Guidelines
- Linear App design
- Notion's visual language
- Vercel dashboard

The goal: Users should feel the interface "gets out of the way" and lets them focus on their work.

---

*Last updated: January 2026*
