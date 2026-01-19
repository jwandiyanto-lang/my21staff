# Phase 6: Security Info Page - Research

**Researched:** 2026-01-19
**Domain:** Static trust/security information page for SaaS
**Confidence:** HIGH

## Summary

This phase involves creating a simple, trust-building security information page written in Bahasa Indonesia for Indonesian SME clients. The page explains where their data is stored, what control they have over it, and how to contact support for security questions.

The research confirms this is a straightforward static page implementation with no complex technical requirements. The existing codebase already has all necessary patterns established via the pricing page (`/pricing`) and landing page (`/`), both using framer-motion for subtle animations and the landing page design system.

**Primary recommendation:** Create a simple static page at `/keamanan` following the pricing page pattern (client component with framer-motion), using the landing page design system (cream background, forest green accents), with three clear information blocks and a WhatsApp contact button.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 15 | 16.1.1 | App router, page routing | Already in use |
| React 19 | 19.2.3 | UI components | Already in use |
| TypeScript | - | Type safety | Already in use |
| Tailwind CSS | 4.x | Styling | Already in use |
| framer-motion | 12.26.2 | Subtle animations | Used on pricing/landing pages |
| lucide-react | 0.562.0 | Icons | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Plus_Jakarta_Sans | Google Font | Headings | Landing page typography |
| Inter | Google Font | Body text | Landing page typography |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion | CSS animations | framer-motion already used in codebase, provides consistent patterns |
| Client component | Server component | Need client for consistent nav pattern with pricing page |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/app/
  keamanan/
    page.tsx           # Single file - static trust page
```

### Pattern 1: Static Marketing Page (Client Component)
**What:** Single-file page component with inline content
**When to use:** Static informational pages like pricing, security info
**Example:**
```typescript
// Source: Existing /pricing/page.tsx pattern
"use client";

import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { motion } from "framer-motion";
import Link from "next/link";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function KeamananPage() {
  return (
    <div className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
         style={{ fontFamily: "var(--font-inter)" }}>
      {/* Navigation */}
      {/* Content sections */}
      {/* Footer */}
    </div>
  );
}
```

### Pattern 2: Information Block Layout
**What:** Simple stacked sections with consistent spacing
**When to use:** Trust pages with multiple topic areas
**Example:**
```typescript
// Source: Derived from pricing page section pattern
<section className="bg-[#FDFBF7] px-6 py-12 md:py-16">
  <div className="mx-auto max-w-3xl">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Section content */}
    </motion.div>
  </div>
</section>
```

### Pattern 3: WhatsApp Contact Button
**What:** External link with pre-filled message
**When to use:** WhatsApp contact CTAs
**Example:**
```typescript
// Source: Common WhatsApp link pattern
const waNumber = "6281234567890"; // my21staff support number
const waMessage = encodeURIComponent("Halo, saya ingin bertanya tentang keamanan data di my21staff");

<a
  href={`https://wa.me/${waNumber}?text=${waMessage}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold"
>
  <MessageCircle className="w-5 h-5" />
  Hubungi via WhatsApp
</a>
```

### Anti-Patterns to Avoid
- **Over-engineering:** Don't create separate components for a single-use static page
- **Technical jargon:** Per CONTEXT.md, use simple reassurance language
- **Accordion/FAQ pattern:** CONTEXT.md explicitly says "No FAQ accordion"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page animations | Custom animation system | framer-motion (already in codebase) | Consistent with existing pages |
| WhatsApp link | Custom chat widget | Standard wa.me link with pre-filled message | Simple, no dependencies |
| Navigation | New nav component | Copy pricing page nav pattern | Consistent branding |
| Footer | New footer component | Copy pricing page footer pattern | Already established |

**Key insight:** This is a static informational page. All patterns already exist in the codebase - just follow the pricing page structure.

## Common Pitfalls

### Pitfall 1: Over-complicating the design
**What goes wrong:** Adding too many features, accordions, interactive elements
**Why it happens:** Developer instinct to make things dynamic
**How to avoid:** Follow CONTEXT.md explicitly - three simple sections, no accordion
**Warning signs:** Reaching for state management, adding toggle logic

### Pitfall 2: Using technical security language
**What goes wrong:** Using terms like "AES-256", "encryption at rest", "TLS"
**Why it happens:** Security pages often use technical language
**How to avoid:** Per CONTEXT.md - simple reassurance tone for Indonesian SME clients
**Warning signs:** Copy that sounds like a security whitepaper

### Pitfall 3: Wrong color scheme
**What goes wrong:** Using CRM colors (peach/forest) instead of landing page colors
**Why it happens:** Confusion between dashboard and marketing page design systems
**How to avoid:** Use landing page tokens: `bg-[#FDFBF7]`, `text-landing-text`, `landing-hero`
**Warning signs:** Using `bg-background`, `text-foreground` (CRM tokens)

### Pitfall 4: Footer link placement confusion
**What goes wrong:** Adding link to navigation header
**Why it happens:** Wanting the page to be easily discoverable
**How to avoid:** Per CONTEXT.md - footer link only, not header
**Warning signs:** Modifying nav component

## Code Examples

Verified patterns from official sources:

### Navigation (from pricing page)
```typescript
// Source: /src/app/pricing/page.tsx lines 138-152
<nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
  <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
    <div className="flex items-center gap-8">
      <Link href="/" className="flex items-center">
        <span className="text-2xl font-black text-white">21</span>
      </Link>
    </div>
    <Link
      href="/pricing"
      className="text-sm text-white px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30 transition-all"
    >
      Mulai
    </Link>
  </div>
</nav>
```

### Footer (from pricing page)
```typescript
// Source: /src/app/pricing/page.tsx lines 492-500
<footer className="bg-white border-t border-notion py-4">
  <div className="mx-auto max-w-7xl px-6">
    <div className="flex items-center justify-center gap-4 text-xs text-landing-text-muted">
      <span className="font-black text-landing-cta">21</span>
      <span>&copy; 2026</span>
      {/* Add security link here */}
      <Link href="/keamanan" className="hover:text-landing-text transition-colors">
        Keamanan Data
      </Link>
    </div>
  </div>
</footer>
```

### Section with Animation
```typescript
// Source: Derived from pricing page patterns
<section className="bg-[#FDFBF7] text-landing-text py-12 md:py-16">
  <div className="mx-auto max-w-3xl px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Tempat Data Disimpan
      </h2>
      <div className="space-y-4 text-lg leading-relaxed">
        {/* Content */}
      </div>
    </motion.div>
  </div>
</section>
```

### Icon Usage
```typescript
// Source: lucide-react (already installed)
import { Shield, Database, Lock, MessageCircle, Mail, Download, Trash2 } from "lucide-react";

// Relevant icons for security page:
// - Shield: general security/protection
// - Database: data storage
// - Lock: encryption/protection
// - MessageCircle: WhatsApp contact
// - Mail: email contact
// - Download: data export
// - Trash2: data deletion
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static HTML pages | Next.js App Router with client components | 2024 | Better DX, consistent patterns |
| Complex security documentation | Simple trust-building pages | 2024-2025 | Higher conversion, better SME comprehension |

**Deprecated/outdated:**
- Technical security whitepapers for SME audiences - replaced by simple trust pages
- FAQ accordions for simple content - replaced by straightforward information blocks

## Indonesian Data Protection Context

**Indonesia's PDP Law (UU PDP 2022):**
- Enforced October 2024 after 2-year grace period
- Modeled on GDPR
- Key requirements: transparency, data subject rights, cross-border transfer rules
- Fines up to IDR 6 billion for violations

**Relevance for my21staff:**
- Data stored in Singapore (Supabase) - must communicate this clearly
- Users must understand what data is collected and stored
- Export and deletion rights must be mentioned (per CONTEXT.md decisions)

**Supabase Security (already in use):**
- SOC 2 Type 2 compliant
- AES-256 encryption at rest
- TLS encryption in transit
- Singapore region available (ap-southeast-1)

**Note:** Don't mention these technical details on the page - just use simple language like "data disimpan dengan aman" and "data dienkripsi."

## Open Questions

Things that couldn't be fully resolved:

1. **WhatsApp support number**
   - What we know: Need a WhatsApp number for security questions
   - What's unclear: Which my21staff number to use
   - Recommendation: Use the main support number (to be provided by user)

2. **Support email address**
   - What we know: Per CONTEXT.md, need email option
   - What's unclear: Which email to use (admin@my21staff.com?)
   - Recommendation: Use admin@my21staff.com or support@my21staff.com

## Sources

### Primary (HIGH confidence)
- `/src/app/pricing/page.tsx` - Existing marketing page pattern
- `/src/app/page.tsx` - Landing page design system
- `/src/app/globals.css` - Design tokens and color system
- `06-CONTEXT.md` - User decisions constraining implementation

### Secondary (MEDIUM confidence)
- [Supabase Security](https://supabase.com/security) - Security features of underlying infrastructure
- [Indonesia PDP Law](https://iclg.com/practice-areas/data-protection-laws-and-regulations/indonesia) - Data protection requirements

### Tertiary (LOW confidence)
- [SaaS Security Best Practices](https://www.jit.io/resources/app-security/7-saas-security-best-practices-for-2025) - General industry context
- [Trust Signals](https://www.crazyegg.com/blog/trust-signals/) - Conversion optimization context

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase, patterns established
- Architecture: HIGH - Direct pattern from pricing page
- Pitfalls: HIGH - Clear guidance from CONTEXT.md

**Research date:** 2026-01-19
**Valid until:** 2026-03-19 (60 days - stable static page requirements)
