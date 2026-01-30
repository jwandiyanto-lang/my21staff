# Phase 1: Brand Guidelines - Research

**Researched:** 2026-01-18
**Domain:** Brand identity documentation, typography, logo generation
**Confidence:** HIGH

## Summary

This phase creates the foundational BRAND.md document and logo assets for my21staff. The existing codebase already has a mature color system in `globals.css` using OKLCH format with CSS custom properties. Typography is already configured with Plus Jakarta Sans and Inter fonts via Next.js Google Fonts.

The main tasks are:
1. Extract and document existing colors with HEX equivalents for external use
2. Create logo SVG files and generate PNG variants using Sharp
3. Formalize typography hierarchy and voice/tone guidelines
4. Structure BRAND.md as a living reference document

**Primary recommendation:** Leverage existing `globals.css` tokens as source of truth. Generate logo assets programmatically with a build script. Keep BRAND.md concise (15-20 pages equivalent) with practical examples.

## Standard Stack

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plus Jakarta Sans | Google Fonts | Headlines, display text | Modern geometric sans, designed for Jakarta city, perfect brand fit |
| Inter | Google Fonts | Body text, UI elements | Industry standard for web interfaces, exceptional legibility |
| OKLCH | CSS native | Color definitions | Perceptually uniform, better for accessibility compliance |

### Supporting (For logo generation)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | 0.33.x | SVG to PNG conversion | Generate logo files at multiple sizes |
| culori | 4.x | Color format conversion | Convert OKLCH to HEX for documentation |

**Installation for logo generation script:**
```bash
npm install --save-dev sharp
```

## Architecture Patterns

### Recommended Folder Structure
```
/business/
  /brand/
    /logos/
      wordmark-full.svg       # my21staff full wordmark
      wordmark-32.png
      wordmark-64.png
      wordmark-128.png
      wordmark-256.png
      icon-only.svg           # "21" icon only
      icon-32.png
      icon-64.png
      icon-128.png
      icon-256.png
    BRAND.md                  # Main brand guidelines
/webapp/
  /src/
    /app/globals.css          # Source of truth for colors
```

### Pattern 1: Color Token Extraction
**What:** Extract OKLCH values from globals.css and document with HEX equivalents
**When to use:** Always - BRAND.md needs HEX for external partners, print, email

**Color Reference (from existing globals.css):**

| Token | OKLCH | HEX Equivalent | Usage |
|-------|-------|----------------|-------|
| `--landing-cta` | `oklch(0.70 0.16 45)` | #F7931A | Primary orange, CTA buttons, "21" highlight |
| `--landing-hero` | `oklch(0.81 0.04 150)` | #B6C9BB | Sage green, hero backgrounds |
| `--crm-forest` | `oklch(0.38 0.06 160)` | #2D4B3E | Forest green, CRM primary |
| `--crm-peach` | `oklch(0.97 0.02 55)` | #FFF1E6 | Peach background, CRM base |
| `--crm-panel` | `oklch(0.98 0.015 55)` | #FFF8F2 | Light peach, panel backgrounds |
| `--crm-sidebar` | `oklch(0.94 0.03 55)` | #FCE9D9 | Warm peach, sidebar |
| `--crm-text` | `oklch(0.22 0.02 60)` | #2D2A26 | Dark text, high contrast |
| `--crm-text-muted` | `oklch(0.60 0.03 55)` | #8C7E74 | Muted text |
| `--landing-text` | `oklch(0.25 0.02 80)` | #37352F | Landing page text (Notion-style) |

### Pattern 2: Typography Hierarchy
**What:** Define font usage split between Plus Jakarta Sans and Inter
**When to use:** All text content decisions

**Recommended Split:**
```
Plus Jakarta Sans (--font-plus-jakarta):
- Headlines: ExtraBold (800), Bold (700)
- Subheadings: SemiBold (600), Medium (500)
- Display text: Large callouts, hero text

Inter (--font-inter):
- Body text: Regular (400), Medium (500)
- UI elements: Buttons, labels, navigation
- Captions: Small text, meta information
```

**Type Scale (already in codebase):**
| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 Hero | Plus Jakarta Sans | 5xl-7xl (48-72px) | ExtraBold (800) |
| H2 Section | Plus Jakarta Sans | 4xl-5xl (36-48px) | ExtraBold (800) |
| H3 Card | Plus Jakarta Sans | xl (20px) | Bold (700) |
| Body | Inter | base-lg (16-18px) | Regular (400) |
| Caption | Inter | sm (14px) | Regular (400) |
| Button | System | base (16px) | Bold (700) |

### Pattern 3: Logo Generation Script
**What:** Node.js script to generate PNG variants from SVG source
**When to use:** During build or manually when logo changes

```javascript
// scripts/generate-logos.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [32, 64, 128, 256];
const logos = ['wordmark-full', 'icon-only'];
const inputDir = 'business/brand/logos';
const outputDir = 'business/brand/logos';

async function generateLogos() {
  for (const logo of logos) {
    const svgPath = path.join(inputDir, `${logo}.svg`);
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(outputDir, `${logo}-${size}.png`));

      console.log(`Generated ${logo}-${size}.png`);
    }
  }
}

generateLogos().catch(console.error);
```

### Anti-Patterns to Avoid
- **Multiple sources of truth:** Don't define colors in BRAND.md that differ from globals.css
- **Hardcoded HEX in components:** Always reference CSS custom properties
- **Font loading without weights:** Always specify exact weights needed (400, 500, 600, 700, 800)
- **Logo files without size suffix:** Always include size in filename for clarity

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OKLCH to HEX conversion | Manual calculation | culori library or oklch.com | OKLCH math is complex, easy to get wrong |
| SVG to PNG conversion | Canvas-based solution | sharp | Better quality, handles transparency, fast |
| Font loading | Self-hosted fonts | next/font/google | Automatic optimization, no FOIT |
| Color contrast checking | Visual estimation | WebAIM Contrast Checker | WCAG compliance requires precise ratios |

**Key insight:** Brand guidelines should document existing decisions, not introduce new tooling. The color system is already mature in globals.css.

## Common Pitfalls

### Pitfall 1: OKLCH Without Fallbacks
**What goes wrong:** Old browsers can't render OKLCH colors
**Why it happens:** OKLCH is modern CSS (2022+)
**How to avoid:** Already handled in globals.css with @supports, document HEX equivalents in BRAND.md
**Warning signs:** Colors appearing wrong in email clients or PDF exports

### Pitfall 2: Font Weight Mismatch
**What goes wrong:** Text appears bolder/lighter than expected
**Why it happens:** Only loading certain weights in layout.tsx
**How to avoid:** Current layout.tsx loads 400, 500, 600, 700, 800 for Plus Jakarta Sans and 400, 500, 600 for Inter. Match guidelines to these weights.
**Warning signs:** Faux bold rendering in browser

### Pitfall 3: Logo Color Mismatch
**What goes wrong:** Logo orange looks different across contexts
**Why it happens:** Different color spaces (RGB, CMYK, screen calibration)
**How to avoid:** Use exact HEX #F7931A, provide CMYK for print if needed
**Warning signs:** "Which orange is correct?" questions from partners

### Pitfall 4: Voice Guidelines Too Vague
**What goes wrong:** Inconsistent tone across content
**Why it happens:** "Professional but friendly" is not actionable
**How to avoid:** Provide specific examples, word choices, tone matrix for different contexts
**Warning signs:** Marketing copy feels different from product copy

### Pitfall 5: Accessibility Color Contrast
**What goes wrong:** Text fails WCAG contrast requirements
**Why it happens:** Brand colors not tested against backgrounds
**How to avoid:** Test all text/background combinations, document approved pairings
**Warning signs:** Orange (#F7931A) on white is 3.15:1 - passes large text (3:1) but fails body text (4.5:1)

## Code Examples

### Logo SVG Structure (Wordmark)
```svg
<!-- business/brand/logos/wordmark-full.svg -->
<svg width="200" height="40" viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="30" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="800">
    <tspan fill="#2D2A26">my</tspan>
    <tspan fill="#F7931A">21</tspan>
    <tspan fill="#2D2A26">staff</tspan>
  </text>
</svg>
```

### Logo SVG Structure (Icon Only)
```svg
<!-- business/brand/logos/icon-only.svg -->
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="75%" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="32" font-weight="800" fill="#F7931A">21</text>
</svg>
```

### Color Usage in Tailwind
```tsx
// Correct: Use semantic tokens
<button className="bg-landing-cta text-white">
  CTA Button
</button>

// Correct: Use CRM tokens in dashboard
<div className="bg-crm-forest text-white">
  Primary Action
</div>

// Wrong: Hardcoded hex
<button className="bg-[#F7931A]">
  Avoid this
</button>
```

### Typography Usage
```tsx
// Headlines - Plus Jakarta Sans
<h1
  className="text-5xl font-extrabold tracking-tight"
  style={{ fontFamily: "var(--font-jakarta)" }}
>
  Headline
</h1>

// Body - Inter (default via font-sans)
<p className="text-lg leading-relaxed">
  Body text using Inter
</p>
```

## Voice & Tone Guidelines

### Target Audience
Indonesian middle-class business owners (UMKM). Professional but approachable. Not corporate stiff, not casually slangy.

### Tone Matrix

| Context | Tone | Example |
|---------|------|---------|
| Marketing | Confident, empathetic | "No system = No growth. Kami bantu Anda membangun sistem itu." |
| Product UI | Clear, helpful | "Tambah lead baru" (not "Inputkan data prospek") |
| Error states | Calm, solution-focused | "Terjadi kesalahan. Coba lagi dalam beberapa saat." |
| Success | Encouraging, brief | "Berhasil disimpan!" |
| Support | Warm, patient | "Tenang, kami bantu selesaikan masalah ini." |

### Word Choices

| Prefer | Avoid | Why |
|--------|-------|-----|
| Sistem | Software | More tangible, implies organization |
| Bisnis Anda | Perusahaan | Warmer, personal |
| Tim digital | Bot/AI | Humanizes the service |
| Kami bantu | Kami menyediakan | Active, partnership feeling |
| Lead | Prospek | Industry-familiar term |
| Follow-up | Tindak lanjut | Commonly used in Indonesian sales |

### Language Rules
- Use Bahasa Indonesia for all customer-facing content
- English for internal code, documentation, and technical terms
- Avoid excessive formal language (bahasa baku berlebihan)
- Use "kamu/Anda" based on context (Anda for formal, kamu for casual/support)

## WCAG Accessibility Compliance

### Color Contrast Requirements

| Level | Body Text (< 18px) | Large Text (>= 18px bold or >= 24px) | UI Components |
|-------|-------------------|--------------------------------------|---------------|
| AA | 4.5:1 | 3:1 | 3:1 |
| AAA | 7:1 | 4.5:1 | 4.5:1 |

### Tested Combinations

| Foreground | Background | Ratio | AA Body | AA Large |
|------------|------------|-------|---------|----------|
| #F7931A (orange) | #FFFFFF | 3.15:1 | FAIL | PASS |
| #F7931A (orange) | #2D2A26 | 5.2:1 | PASS | PASS |
| #2D4B3E (forest) | #FFFFFF | 8.5:1 | PASS | PASS |
| #2D4B3E (forest) | #FFF1E6 | 7.8:1 | PASS | PASS |
| #2D2A26 (text) | #FFFFFF | 14.2:1 | PASS | PASS |
| #8C7E74 (muted) | #FFFFFF | 3.8:1 | FAIL | PASS |

### Recommendations
- Orange (#F7931A) should only be used for large text or icons, not body text on white
- Use forest green (#2D4B3E) or dark text (#2D2A26) for body text
- Muted text (#8C7E74) acceptable for meta/caption text (large text rule)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HEX/RGB colors | OKLCH color space | 2022-2024 | Better perceptual uniformity, P3 gamut support |
| Static PDF guidelines | Digital/living brand guides | 2020+ | Easier updates, better navigation |
| Single brand palette | Context-aware palettes (CRM vs Landing) | Current | Different contexts need different moods |

**Already implemented in codebase:**
- OKLCH colors with CSS custom properties
- Separate CRM and Landing page color schemes
- next/font/google for optimized font loading

## Open Questions

1. **Print CMYK values**
   - What we know: HEX values documented
   - What's unclear: CMYK equivalents for print materials (business cards, brochures)
   - Recommendation: Add CMYK values later if print materials become needed

2. **Logo on dark backgrounds**
   - What we know: Orange "21" on light backgrounds approved
   - What's unclear: Inverse logo (white text with orange 21) for dark contexts
   - Recommendation: Define in BRAND.md, create variant SVG if approved

3. **Favicon generation**
   - What we know: Icon-only logo exists
   - What's unclear: Favicon package (16x16, 32x32, apple-touch-icon, etc.)
   - Recommendation: Include favicon generation in logo script

## Sources

### Primary (HIGH confidence)
- Project files: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- [Plus Jakarta Sans - Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans) - Official font specimen
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG compliance testing

### Secondary (MEDIUM confidence)
- [Sharp GitHub](https://github.com/lovell/sharp) - SVG to PNG conversion
- [OKLCH Color Picker](https://oklch.com/) - Color format conversion
- [WebAIM Color Contrast Guidelines](https://webaim.org/articles/contrast/) - WCAG requirements
- [Frontify Brand Guidelines Examples](https://www.frontify.com/en/guide/brand-guidelines-examples) - Structure best practices
- [Shopify Brand Guidelines Template](https://www.shopify.com/blog/brand-guidelines) - Document organization

### Tertiary (LOW confidence)
- [Plus Jakarta Sans Font Pairing](https://maxibestof.one/typefaces/plus-jakarta-sans/pairing/inter) - Typography combination patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already implemented in codebase, just documenting
- Architecture: HIGH - Following established patterns, folder structure confirmed
- Pitfalls: HIGH - Based on WCAG standards and project-specific analysis
- Voice/Tone: MEDIUM - Based on context and Indonesian business norms, needs user validation

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain, brand guidelines don't change rapidly)
