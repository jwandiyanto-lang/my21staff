# my21staff Brand Guidelines

**Version:** 1.0
**Last Updated:** 2026-01-18
**Status:** Active

This document is the single source of truth for my21staff brand identity. All visual work, marketing materials, and product interfaces should reference these guidelines.

---

## 1. Logo

### The Wordmark

The my21staff logo is a typographic wordmark using Plus Jakarta Sans ExtraBold (800). The "21" is always highlighted in orange to create brand recognition.

```
my21staff
   ^^
   Orange (#F7931A)
```

**Components:**
- "my" — Dark text (#2D2A26)
- "21" — Orange (#F7931A) — always highlighted
- "staff" — Dark text (#2D2A26)

### Logo Variations

| Variation | Use Case | File |
|-----------|----------|------|
| Wordmark Full | Primary logo, headers, documents | `logos/wordmark-full.svg` |
| Icon Only | Favicons, app icons, small spaces | `logos/icon-only.svg` |

### Clear Space

Maintain minimum clear space equal to the height of the "2" character around all sides of the logo.

```
┌─────────────────────────────┐
│                             │
│    [ my21staff ]            │
│         ↑                   │
│      min space = 2-height   │
└─────────────────────────────┘
```

### Minimum Size

- Wordmark: 120px width minimum (digital)
- Icon Only: 16px minimum (favicons), 32px recommended

### Logo Usage Rules

**Do:**
- Use on light backgrounds (white, off-white, peach)
- Maintain aspect ratio when scaling
- Use provided SVG/PNG files
- Keep the "21" in orange at all times

**Don't:**
- Rotate or skew the logo
- Change the colors (except for single-color applications)
- Add effects (shadows, gradients, outlines)
- Place on busy backgrounds
- Separate "21" from the rest of the wordmark

### Single-Color Applications

For single-color contexts (documents, embossing):
- Use full dark (#2D2A26) for the entire wordmark
- Never use single-color orange

---

## 2. Color Palette

my21staff uses two distinct color themes for different contexts. Colors are defined in OKLCH for perceptual uniformity, with HEX equivalents for external use.

### CRM Theme (Peach + Forest Green)

The CRM dashboard uses warm peach backgrounds with forest green accents for a calm, professional workspace.

| Token | OKLCH | HEX | RGB | Usage |
|-------|-------|-----|-----|-------|
| crm-forest | `oklch(0.38 0.06 160)` | #2D4B3E | 45, 75, 62 | Primary actions, headers, active states |
| crm-orange | `oklch(0.70 0.16 45)` | #F7931A | 247, 147, 26 | Accents, highlights, "21" in logo |
| crm-peach | `oklch(0.97 0.02 55)` | #FFF1E6 | 255, 241, 230 | Page background |
| crm-panel | `oklch(0.98 0.015 55)` | #FFF8F2 | 255, 248, 242 | Card backgrounds |
| crm-sidebar | `oklch(0.94 0.03 55)` | #FCE9D9 | 252, 233, 217 | Sidebar background |
| crm-text | `oklch(0.22 0.02 60)` | #2D2A26 | 45, 42, 38 | Primary text |
| crm-text-muted | `oklch(0.60 0.03 55)` | #8C7E74 | 140, 126, 116 | Secondary/meta text |

### Landing Page Theme (Sage + Orange)

The landing page uses a Notion-inspired off-white with sage green hero sections.

| Token | OKLCH | HEX | RGB | Usage |
|-------|-------|-----|-----|-------|
| landing-bg | `oklch(0.985 0.002 90)` | #FBFBFA | 251, 251, 250 | Page background |
| landing-hero | `oklch(0.81 0.04 150)` | #B6C9BB | 182, 201, 187 | Hero section background |
| landing-cta | `oklch(0.70 0.16 45)` | #F7931A | 247, 147, 26 | CTA buttons |
| landing-cta-dark | `oklch(0.60 0.16 45)` | #D67C0D | 214, 124, 13 | CTA hover state |
| landing-text | `oklch(0.25 0.02 80)` | #37352F | 55, 53, 47 | Body text |
| landing-text-muted | `oklch(0.25 0.02 80 / 0.6)` | #37352F99 | 55, 53, 47 (60%) | Secondary text |
| landing-dark-bg | `oklch(0.15 0 0)` | #1A1A1A | 26, 26, 26 | Dark CTA section |

### Semantic Colors

| Purpose | Color | HEX | Usage |
|---------|-------|-----|-------|
| Success | Green | #22C55E | Confirmations, positive states |
| Warning | Amber | #F59E0B | Caution, pending states |
| Error | Red | #EF4444 | Errors, destructive actions |
| Info | Blue | #3B82F6 | Information, links |

### Orange Philosophy

The orange (#F7931A) is Bitcoin's exact orange — a subtle nod to financial independence and modern business. Use it as a **small hint**, never dominant:

- The "21" in our logo (21 = Bitcoin's 21 million supply cap)
- Accent highlights, not backgrounds
- CTAs that matter, not every button
- A whisper of ambition, not a shout

### Color Application Guidelines

1. **Primary Actions:** Use forest green (#2D4B3E) for buttons, CTAs in CRM
2. **Landing CTAs:** Use orange (#F7931A) sparingly for high-impact conversion buttons
3. **Backgrounds:** Never use orange as a background color
4. **Text:** Use dark text (#2D2A26 or #37352F) for body content
5. **Accents:** Orange for highlights, notifications, emphasis only — keep it subtle

---

## 3. Typography

### Font Families

**Plus Jakarta Sans**
A modern geometric sans-serif designed for the city of Jakarta. Used for headlines and display text. Perfect brand fit for Indonesian-focused product.

**Inter**
Industry standard for web interfaces. Exceptional legibility at all sizes. Used for body text and UI elements.

### Font Loading

Fonts are loaded via `next/font/google` for optimal performance:

```tsx
const plusJakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});
```

### Type Scale

| Element | Font | Size | Weight | Line Height | Usage |
|---------|------|------|--------|-------------|-------|
| H1 Hero | Plus Jakarta Sans | 48-72px (5xl-7xl) | ExtraBold (800) | 1.1 | Landing page hero |
| H2 Section | Plus Jakarta Sans | 36-48px (4xl-5xl) | ExtraBold (800) | 1.2 | Section headers |
| H3 Card | Plus Jakarta Sans | 20-24px (xl-2xl) | Bold (700) | 1.3 | Card titles |
| H4 Subsection | Plus Jakarta Sans | 18px (lg) | SemiBold (600) | 1.4 | Subsection headers |
| Body Large | Inter | 18px (lg) | Regular (400) | 1.6 | Landing page body |
| Body | Inter | 16px (base) | Regular (400) | 1.5 | CRM body text |
| Body Small | Inter | 14px (sm) | Regular (400) | 1.5 | Secondary content |
| Caption | Inter | 12px (xs) | Regular (400) | 1.4 | Meta, timestamps |
| Button | Inter | 16px (base) | SemiBold (600) | 1 | Action buttons |
| Label | Inter | 14px (sm) | Medium (500) | 1 | Form labels |

### Typography Usage Rules

**Headlines (Plus Jakarta Sans):**
- Always use tracking-tight (-0.025em)
- ExtraBold for H1-H2, Bold for H3
- Use for attention-grabbing text only

**Body (Inter):**
- Leading-relaxed (1.625) for long-form content
- Leading-normal (1.5) for UI text
- Regular weight for readability

**Code Examples:**

```tsx
// Headlines - Plus Jakarta Sans
<h1 className="text-5xl font-extrabold tracking-tight">
  Headline
</h1>

// Body - Inter (default via font-sans)
<p className="text-lg leading-relaxed">
  Body text
</p>

// UI Label
<label className="text-sm font-medium">
  Form label
</label>
```

---

## 4. Voice & Tone

### Target Audience

Indonesian middle-class business owners (UMKM). Age 28-45. Running small teams (5-20 people). Seeking growth but overwhelmed by scattered processes.

### Brand Personality

| Attribute | Description | Not This |
|-----------|-------------|----------|
| Confident | We know what works | Arrogant |
| Empathetic | We understand your struggles | Preachy |
| Clear | Simple language, no jargon | Dumbed-down |
| Warm | Like a trusted advisor | Over-familiar |
| Professional | Credible, reliable | Corporate stiff |

### Tone Matrix

| Context | Tone | Example |
|---------|------|---------|
| Marketing | Confident, empathetic | "No system = No growth. Kami bantu Anda membangun sistem itu." |
| Product UI | Clear, helpful | "Tambah lead baru" (not "Inputkan data prospek") |
| Error States | Calm, solution-focused | "Terjadi kesalahan. Coba lagi dalam beberapa saat." |
| Success States | Encouraging, brief | "Berhasil disimpan!" |
| Support | Warm, patient | "Tenang, kami bantu selesaikan masalah ini." |
| Onboarding | Friendly, guiding | "Mari kita mulai dengan menghubungkan WhatsApp Anda." |

### Word Choices

| Prefer | Avoid | Why |
|--------|-------|-----|
| Sistem | Software | More tangible, implies organization |
| Bisnis Anda | Perusahaan | Warmer, personal connection |
| Tim digital | Bot / AI | Humanizes the service |
| Kami bantu | Kami menyediakan | Active voice, partnership feeling |
| Lead | Prospek | Industry-familiar term |
| Follow-up | Tindak lanjut | Commonly used in Indonesian sales |
| Simpan | Submit | Clearer action |
| Coba lagi | Ulangi proses | More natural |

### Language Rules

1. **Customer-facing content:** Bahasa Indonesia
2. **Internal documentation:** English
3. **Technical terms:** Use established English terms (lead, follow-up, dashboard)
4. **Formality:** Use "Anda" (formal you) in product UI, "kamu" in casual support
5. **Avoid:** Excessive formal language (bahasa baku berlebihan), slang

### Writing Guidelines

**Do:**
- Keep sentences short (max 20 words)
- Use active voice
- Start with the action (verbs first)
- Be specific, not abstract
- Use numbers when possible

**Don't:**
- Use corporate jargon ("leverage", "synergy")
- Write walls of text
- Use passive voice for actions
- Assume technical knowledge
- Use humor that doesn't translate

---

## 5. Accessibility

### Color Contrast Requirements (WCAG 2.1)

| Level | Normal Text (<18px) | Large Text (>=18px bold, >=24px) | UI Components |
|-------|---------------------|----------------------------------|---------------|
| AA (Required) | 4.5:1 | 3:1 | 3:1 |
| AAA (Ideal) | 7:1 | 4.5:1 | 4.5:1 |

### Tested Color Combinations

| Foreground | Background | Contrast Ratio | AA Normal | AA Large |
|------------|------------|----------------|-----------|----------|
| #2D2A26 (dark text) | #FFFFFF (white) | 14.2:1 | PASS | PASS |
| #2D2A26 (dark text) | #FFF1E6 (peach) | 13.1:1 | PASS | PASS |
| #2D4B3E (forest) | #FFFFFF (white) | 8.5:1 | PASS | PASS |
| #2D4B3E (forest) | #FFF1E6 (peach) | 7.8:1 | PASS | PASS |
| #37352F (landing text) | #FBFBFA (off-white) | 12.8:1 | PASS | PASS |
| #F7931A (orange) | #FFFFFF (white) | 3.15:1 | FAIL | PASS |
| #F7931A (orange) | #2D2A26 (dark) | 5.2:1 | PASS | PASS |
| #8C7E74 (muted) | #FFFFFF (white) | 3.8:1 | FAIL | PASS |

### Accessibility Rules

**Orange (#F7931A) Usage:**
- NEVER use for body text on white backgrounds
- OK for: Large headlines (18px+ bold), icons, decorative elements
- For text, pair with dark background or use forest green instead

**Muted Text (#8C7E74) Usage:**
- Use only for large text (14px+ minimum)
- OK for: Meta information, timestamps, secondary labels
- Not for: Primary content, instructions

**Focus States:**
- All interactive elements must have visible focus indicators
- Use ring utility: `ring-2 ring-offset-2 ring-primary`

**Color Independence:**
- Don't rely on color alone to convey information
- Add icons or text labels to colored indicators

---

## 6. Usage Examples

### Correct Tailwind Usage

Always use semantic CSS custom property tokens, never hardcoded HEX values.

```tsx
// CORRECT: Semantic tokens
<button className="bg-primary text-primary-foreground">
  CRM Button
</button>

<button className="bg-landing-cta text-white">
  Landing CTA
</button>

<div className="bg-crm-forest text-white">
  Primary Action
</div>

<p className="text-muted-foreground">
  Secondary text
</p>

// CORRECT: Using CRM tokens
<div className="bg-crm-panel border-crm-forest/10">
  <h3 className="text-crm-text">Card Title</h3>
  <p className="text-crm-text-muted">Description</p>
</div>
```

### Incorrect Usage (Avoid)

```tsx
// WRONG: Hardcoded hex
<button className="bg-[#F7931A]">
  Don't do this
</button>

// WRONG: Hardcoded color
<p className="text-[#2D2A26]">
  Use tokens instead
</p>

// WRONG: Generic tailwind colors
<div className="bg-green-700">
  Use crm-forest instead
</div>
```

### Component Patterns

**Primary Button (CRM):**
```tsx
<Button className="bg-crm-forest hover:bg-crm-forest/90 text-white">
  Save Lead
</Button>
```

**CTA Button (Landing):**
```tsx
<Button className="bg-landing-cta hover:bg-landing-cta-dark text-white font-semibold">
  Mulai Sekarang
</Button>
```

**Card (CRM):**
```tsx
<Card className="bg-crm-panel border-crm-forest/10">
  <CardHeader>
    <CardTitle className="text-crm-text">Lead Details</CardTitle>
  </CardHeader>
  <CardContent className="text-crm-text-muted">
    Content here
  </CardContent>
</Card>
```

---

## Appendix A: Source Files

### CSS Custom Properties

All color tokens are defined in `src/app/globals.css` using OKLCH format with HEX comments.

### Font Configuration

Fonts are loaded in `src/app/layout.tsx` via Next.js Google Fonts integration.

### Logo Files

| File | Purpose | Format |
|------|---------|--------|
| `business/brand/logos/wordmark-full.svg` | Primary wordmark | SVG |
| `business/brand/logos/icon-only.svg` | Icon/favicon source | SVG |

---

## Appendix B: Quick Reference

### Primary Colors

| Color | HEX | Use |
|-------|-----|-----|
| Forest Green | #2D4B3E | CRM primary |
| Orange | #F7931A | Accents, CTAs, "21" |
| Dark Text | #2D2A26 | Body text |
| Peach | #FFF1E6 | CRM background |
| Sage | #B6C9BB | Landing hero |

### Font Quick Reference

| Use | Font | Weight |
|-----|------|--------|
| Headlines | Plus Jakarta Sans | 700-800 |
| Body | Inter | 400 |
| UI Labels | Inter | 500 |
| Buttons | Inter | 600 |

---

*Document maintained by my21staff team.*
*For updates, modify this file and update the version number.*
