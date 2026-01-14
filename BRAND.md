# my21staff Brand Guideline

---

## Brand Overview

**Name:** my21staff
**Tagline:** 21 Staff di Ujung Jari Anda
**Mission:** Memberikan UMKM Indonesia akses ke departemen bisnis profesional melalui AI

---

## Logo

### Primary Logo (Text)

```
my21staff
```

- **"my"** — Black (#000000) or Forest Green (#2D4B3E)
- **"21"** — Orange (#F7931A) — **highlighted**
- **"staff"** — Black (#000000) or Forest Green (#2D4B3E)

### Icon (Square)

```
┌─────┐
│  M  │
└─────┘
```

- Black square with white "M"
- Border radius: 3px (notion-style)

### Usage

| Context | Logo Style |
|---------|------------|
| Navigation | Icon + Text |
| Favicon | Icon only |
| Marketing | Full text with "21" highlight |

---

## Color Palette

### Primary Colors

| Name | Hex | OKLCH | Usage |
|------|-----|-------|-------|
| Forest Green | #2D4B3E | `oklch(0.38 0.06 160)` | CRM primary, buttons, active states |
| Orange | #F7931A | `oklch(0.70 0.16 45)` | CTA, highlights, "21" in logo |

### Background Colors (CRM)

| Name | Hex | OKLCH | Usage |
|------|-----|-------|-------|
| Peach | #FFF1E6 | `oklch(0.97 0.02 55)` | Main background |
| Peach Panel | #FFF8F2 | `oklch(0.98 0.015 55)` | Cards, panels |
| Peach Sidebar | #FCE9D9 | `oklch(0.94 0.03 55)` | Sidebar |

### Background Colors (Landing)

| Name | Hex | OKLCH | Usage |
|------|-----|-------|-------|
| Off-white | #FBFBFA | `oklch(0.985 0.002 90)` | Page background |
| Sage Green | #B6C9BB | `oklch(0.81 0.04 150)` | Hero section |
| Dark | #1A1A1A | `oklch(0.15 0 0)` | CTA section |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Text Main | #2D2A26 | Primary text |
| Text Muted | #8C7E74 | Secondary text, labels |

### Accent Colors (Cards)

| Name | Hex | Usage |
|------|-----|-------|
| Coral | #FF6B6B | Pop accents |
| Lavender | #F3E8FF | AI/Bot cards |
| Blue | #E0F2FE | Workflow cards |
| Mint | #DCFCE7 | Sales/Revenue cards |

---

## Typography

### Font Family

| Font | Usage | Google Fonts |
|------|-------|--------------|
| Plus Jakarta Sans | Headlines, headings | `Plus_Jakarta_Sans` |
| Inter | Body text | `Inter` |
| JetBrains Mono | Labels, badges, code | `JetBrains_Mono` |

### Hero Headlines

```css
font-family: Plus Jakarta Sans
font-weight: 800 (extrabold)
letter-spacing: -0.05em (tracking-tighter)
line-height: 0.85-0.9
text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
```

### Body Text

```css
font-family: Inter
font-weight: 500 (medium)
line-height: 1.6-1.7
```

### Labels & Badges

```css
font-family: JetBrains Mono
font-weight: 700 (bold)
font-size: 10-11px
letter-spacing: 0.1-0.2em
text-transform: uppercase
```

---

## UI Elements

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons, cards | 3px (notion-style) |
| Inputs | 10px |
| Large cards | 40px |

### Borders

```css
/* Notion-style border */
border: 1px solid rgba(55, 53, 47, 0.12);
```

### Shadows

```css
/* Organic shadow for cards */
box-shadow: 0 20px 50px -12px rgba(140, 126, 116, 0.12);

/* Button shadow */
box-shadow: 0 4px 12px rgba(45, 75, 62, 0.2);
```

---

## Application

### CRM App

- Background: Peach (#FFF1E6)
- Primary actions: Forest Green (#2D4B3E)
- Highlights: Orange (#F7931A)
- Font: Plus Jakarta Sans

### Landing Page

- Background: Off-white (#FBFBFA)
- Hero: Sage Green (#B6C9BB)
- CTA: Orange (#F7931A)
- Font: Plus Jakarta Sans + Inter

---

## Voice & Tone

### Language

- **UI Text:** Bahasa Indonesia
- **Code/Docs:** English

### Personality

- Professional but approachable
- Confident, not arrogant
- Helpful like a trusted colleague
- Direct and clear

### Taglines

- "21 Staff di Ujung Jari Anda"
- "Departemen Bisnis untuk UMKM"
- "WhatsApp CRM yang Mengerti Bisnis Anda"

---

*Last updated: 2026-01-14*
