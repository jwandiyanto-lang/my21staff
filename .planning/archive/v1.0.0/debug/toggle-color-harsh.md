---
status: resolved
trigger: "Toggle color too orange, hurts eyes"
created: 2026-01-27T15:45:00Z
updated: 2026-01-27T15:45:00Z
---

## Current Focus
investigation: complete
hypothesis: AIToggle wrapper uses full accent orange (#F7931A) as background instead of muted variant
test: reviewed component and theme configuration
expecting: diagnosed root cause
next_action: return diagnosis

## Symptoms
expected: Toggle UI with pleasant, readable colors that match brand
actual: Toggle background is harsh orange that strains eyes
errors: none - visual/UX issue
reproduction: view the AIToggle component on Your Intern settings page
started: after initial component implementation

## Eliminated
none - first pass investigation

## Evidence
- checked: AIToggle component (src/components/knowledge-base/ai-toggle.tsx)
  found: Line 83 uses `className="bg-accent rounded-lg p-4"`
  implication: Container background is full accent color

- checked: Theme configuration (src/app/globals.css)
  found: Line 82 defines `--accent: oklch(0.70 0.16 45); /* #F7931A */`
  implication: This is Bitcoin Orange - too harsh for large background surfaces

- checked: Brand usage patterns
  found: BRAND.md line 45 specifies orange for "CTAs, highlights, accent" not backgrounds
  implication: Using accent as background violates design system

- checked: Component patterns
  found: Status badge (lines 101-105) uses `bg-green-500/10` with 10% opacity for soft background
  implication: Design precedent in same component shows muted backgrounds work better

## Resolution
root_cause: AIToggle wrapper uses full-saturation accent orange (#F7931A) as background. The accent color is designed for logos, CTAs, and small highlights - not as a large background surface. This creates visual harshness.

fix: Replace `bg-accent` with `bg-accent/10` to use 10% opacity orange, similar to the status badge pattern already in use

verification: Visual inspection - toggle should have subtle orange-tinted background that doesn't strain eyes

files_changed:
- src/components/knowledge-base/ai-toggle.tsx (line 83)
