# Brand Guidelines

**my21staff** — Your AI Sales Team in a Box

---

## Logo & Identity

### Logo Files

All logo assets are available in the [`logos/`](./logos/) folder:

| File | Description |
|------|-------------|
| `wordmark-full.svg` | Full wordmark (SVG vector) |
| `wordmark-full-*.png` | Wordmark at 32, 64, 128, 256px |
| `icon-only.svg` | Icon-only version (SVG vector) |
| `icon-only-*.png` | Icon at 32, 64, 128, 256px |

### Logo Colors

| Element | Color | Hex |
|---------|-------|-----|
| Wordmark text | Dark Brown | #2D2A26 |
| Logo icon | Orange | #F7931A |

### Logo Usage Rules

- **Do:** Use SVG for print/web; PNG for documents
- **Do:** Maintain aspect ratio (don't stretch)
- **Do:** Use on light or dark backgrounds (ensure contrast)
- **Don't:** Add effects, shadows, or outlines
- **Don't:** Change colors
- **Don't:** Rotate or reposition elements

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Brown | #2D2A26 | Headings, footer, logo text |
| Orange | #F7931A | Logo icon, CTAs, highlights, active states |

### Secondary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Green | #284b31 | Primary buttons, headings |
| Sage Green | #DCE8DC | Subtle backgrounds, accents |
| Light Sage | #B8C9B8 | Hover states, borders |
| Off White | #F1F5F0 | Main background |

### CRM Interface Colors

| Element | Hex | Usage |
|---------|-----|-------|
| Sidebar | #1A1A1A | Dashboard sidebar |
| Chat Background | #E8E0D5 | Conversation area |
| Outgoing Message | #DCF8C6 | User/bot messages |
| Incoming Message | #FFFFFF | Contact messages |

---

## Typography

### Font Families

| Font | Usage |
|------|-------|
| **Plus Jakarta Sans** | Headings, logo, emphasis text |
| **Inter** | Body text, UI elements, paragraphs |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Extra Bold | 800 | Logo wordmark |
| Bold | 700 | Headings, buttons |
| Semibold | 600 | Subheadings, emphasis |
| Regular | 400 | Body text, labels |

### Type Scale

| Size | Line Height | Usage |
|------|-------------|-------|
| 32px | 1.2 | Page titles |
| 24px | 1.3 | Section headings |
| 18px | 1.4 | Subheadings |
| 16px | 1.5 | Body text |
| 14px | 1.5 | Captions, labels |

---

## Voice & Tone

### Core Attributes

| Attribute | Description |
|-----------|-------------|
| **Capable** | Confident, expert, professional. We know what we're doing. |
| **Proactive** | Forward-thinking, action-oriented. We anticipate needs. |
| **Insightful** | Deep understanding, smart analysis. We see the bigger picture. |
| **Approachable** | Warm, helpful, not intimidating. We're on your side. |

### Do Say / Don't Say

| Context | Do Say | Don't Say |
|---------|--------|-----------|
| Explaining the product | "Your AI Sales Team in a Box" | "Chatbot solution" |
| Describing features | "The Intern handles initial conversations" | "The bot responds to messages" |
| Pricing | "Transparent pricing, no hidden fees" | "Contact us for custom pricing" |
| Support | "We're here to help you succeed" | "That's not our responsibility" |
| Technical details | "Your digital staff works 24/7" | "The system runs automated responses" |

---

## Design Principles

**Sleek. Minimalistic. Apple-like.**

### 5 Design Pillars

#### 1. Content Breathes
- Generous whitespace around elements
- No heavy borders or boxes
- Information flows naturally
- Remove until it breaks, then stop

#### 2. Clean Backgrounds
- Main content: Off-white (#F1F5F0)
- Cards: White (#FFFFFF) with subtle shadows
- Sidebar: Deep forest green (#14261a) for contrast
- Avoid sage/colored backgrounds in content areas

#### 3. Subtle Depth
- Use shadows instead of borders where possible
- Shadows should be soft: `shadow-sm` or `shadow-md`
- Hover states add depth, not color
- Cards lift slightly on interaction

#### 4. Purposeful Color
- Green (#284b31) for primary actions
- Orange (#F7931A) for CTAs and highlights
- Neutral backgrounds for content areas
- Color should guide attention, not decorate

#### 5. Typography Hierarchy
- Headings: Plus Jakarta Sans, semibold/bold
- Body: Inter, regular
- Use font weight, not color, for emphasis
- Limit to 3-4 text sizes per page

### Anti-Patterns (Avoid)

| Don't | Do Instead |
|-------|-----------|
| Heavy borders around inputs | Subtle shadow or 1px light border |
| Colored/tinted backgrounds | Pure white/off-white |
| Dense packed information | Cards with generous padding |
| Multiple competing CTAs | One primary action per section |
| Decorative icons | Functional icons only |
| Text-heavy interfaces | Concise labels, whitespace |

### Component Guidelines

#### Cards
```css
background: white;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
padding: 24px;
```

#### Buttons
- **Primary:** Dark green, rounded, subtle shadow
- **Secondary:** White with border, no shadow
- **Ghost:** No background, just text + icon
- All buttons: Consistent padding, not too tall

#### Forms
- Labels above inputs, not inline
- Inputs: White background, light border
- Focus state: Primary color ring
- No heavy outlines or colored backgrounds

#### Tables
- No row borders, use subtle alternating backgrounds if needed
- Generous row height (48-56px)
- Left-aligned text, right-aligned numbers
- Hover highlights entire row

### Spacing Scale (4px Grid)

| Token | Pixels | Usage |
|-------|--------|-------|
| `xs` | 4px | Tight spacing between related items |
| `sm` | 8px | Standard gap within components |
| `md` | 16px | Padding inside cards |
| `lg` | 24px | Section gaps |
| `xl` | 32px+ | Major section separation |

---

## Naming Conventions

### Approved Terms

| Use This | Not This | Reason |
|----------|----------|--------|
| The Intern | Bot, Chatbot | Humanizes the AI, avoids "bot" stigma |
| The Brain | Claude, Grok, Gemini | Brand differentiation, not tech specs |
| digital staff | AI team | Our preferred term |
| messaging system | Kapso | Backend tech is hidden from customers |

### Anti-Patterns

| Don't Say | Say Instead |
|-----------|-------------|
| Kapso | WhatsApp integration |
| Kapso API | Messaging system |
| Bot | The Intern, digital staff |

**Kapso is hidden from customers.** It's our backend technology, not a customer-facing term.

---

## Imagery Guidelines

### Style
- Clean, minimal, professional
- No stock photos of people at desks
- Screenshots of the actual product
- Subtle gradients, not jarring colors

### Subjects
- Product UI and dashboards
- Notification examples ( WhatsApp-style bubbles)
- Before/after comparisons
- Quiet, focused work environments

### Avoid
- Overly corporate stock photography
- Hands typing on keyboards
- Overcrowded desk scenes
- Cartoon or playful illustrations (except for playful explainer graphics)

---

## Content Strategy

### Content Types

| Type | Purpose | Example |
|------|---------|---------|
| **"Silent" Demo** | Show value without explaining | Screen recording of bot handling lead while you sleep |
| **"Data" Deep Dive** | Build trust through transparency | Brain Bot weekly report screenshots |
| **"Client Win"** | Social proof and FOMO | Recording of client's notifications blowing up |

### Content Principles

1. **Show, don't tell** — Screenshots > paragraphs
2. **Specific > vague** — "Rp 15M more revenue" > "increased revenue"
3. **Problem first** — Acknowledge the pain before presenting solution
4. **Social proof** — Client wins, testimonials, case studies

---

## Language Rules

| Context | Language |
|---------|----------|
| Code & documentation | English |
| App UI (Indonesia) | Bahasa Indonesia |
| Marketing (local) | Bahasa Indonesia |
| Marketing (international) | English |

---

## References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Linear App Design](https://linear.app/design)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

*Last updated: January 2026*

---

**my21staff** — AI handles the routine. Humans handle the complex.
