---
status: resolved
trigger: "brain should be hidden. And this intern should just be simple Bot Name, Persona , and a text box for the script they want or set, get rid of the other stuff"
created: 2026-02-01T18:20:00Z
updated: 2026-02-01T18:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - Architecture mismatch. SarahConfigCard was created for Phase 12 (Sarah Template System) but duplicates/conflicts with existing InternSettings component. User wants simplified UI, not the complex advanced settings.
test: Complete - all files examined
expecting: Root cause identified - need to document for UAT gap
next_action: Update UAT.md with root cause and required changes

## Symptoms

expected: Simple form with Bot Name, Persona field, and script text box
actual: Form shows 4 fields (Bot Name, Language, Pronoun, Trial Link)
errors: None - UI mismatch with requirements
reproduction: Navigate to /demo/your-team
started: Test 1 of Phase 12 UAT

## Eliminated

## Evidence

- timestamp: 2026-02-01T18:20:00Z
  checked: src/components/team/sarah-config-card.tsx
  found: Component has 4 fields - bot_name (Input), language (Select), pronoun (Select), trial_link (Input)
  implication: Current implementation doesn't match user's simplified requirements. Missing "Persona" and "script" fields entirely.

- timestamp: 2026-02-01T18:25:00Z
  checked: src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx
  found: Page has TWO tabs - "Intern" tab and "Brain" tab (lines 53-62). Brain tab is fully visible and functional.
  implication: User wants Brain tab hidden but it's currently exposed in the UI with TabsTrigger component.

- timestamp: 2026-02-01T18:26:00Z
  checked: src/components/your-team/intern-settings.tsx
  found: Large complex component (730 lines) with 4 collapsible cards - Persona, Behavior Rules, Response Settings, Slot Extraction. Contains advanced fields like customPrompt (Textarea), greeting style, tone badges, handoff keywords, quiet hours, etc.
  implication: This is the REAL configuration UI that already exists. It has a "Custom System Prompt" field (line 338-351) which matches user's "script text box" requirement. However, user wants SIMPLE form, not this complex multi-card UI.

- timestamp: 2026-02-01T18:30:00Z
  checked: src/app/(dashboard)/[workspace]/settings/settings-client.tsx
  found: Settings page only shows "Intern Name" field (line 97-143). No Brain configuration section exists.
  implication: Test 7 GAP ("still there") is INVALID - there is no Brain settings on Settings page. User may be confused about which page they're on, or referencing the Brain TAB on Your Team page (not Settings page).

## Resolution

root_cause: |
  ARCHITECTURE MISMATCH - Two competing configuration systems exist on Your Team page:

  1. SarahConfigCard (src/components/team/sarah-config-card.tsx)
     - Created in Phase 12 for Sarah Template System
     - Shows 4 simple fields: bot_name, language, pronoun, trial_link
     - Reads from sarah.config.getConfig (Convex function)
     - This is DUPLICATIVE and NOT what user wants

  2. InternSettings (src/components/your-team/intern-settings.tsx)
     - Pre-existing component (730 lines)
     - Complex multi-card UI with 4 collapsible sections
     - Already has "Custom System Prompt" textarea (line 338-351) = user's "script" field
     - Already has Persona card with greeting style, language, tone
     - TOO COMPLEX - user wants simplified version

  3. Brain Tab visibility (your-team-client.tsx line 58-61)
     - Brain tab is fully visible with TabsTrigger component
     - User explicitly wants Brain hidden ("brain should be hidden")
     - Test 7 reports "still there" - likely referring to Brain tab, NOT Settings page

  USER WANTS: Simple form with ONLY:
  - Bot Name (already exists in Settings)
  - Persona (single field/dropdown, not complex card)
  - Script text box (like customPrompt, but simplified)

  CURRENT STATE: Two overlapping config systems + exposed Brain tab

  FIX REQUIRED:
  - Remove SarahConfigCard entirely (it's redundant)
  - Replace InternSettings with simplified version
  - Hide Brain tab from Your Team page navigation
  - Keep Settings page as-is (only Intern Name) - that's correct

fix:
verification:
files_changed: []
