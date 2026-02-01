---
status: diagnosed
phase: 12-sarah-template-system
source: 12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md
started: 2026-02-01T17:00:00Z
updated: 2026-02-01T18:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. View Sarah Configuration Form
expected: Navigate to /demo/your-team page. Form visible with 4 fields (bot name, language, pronoun, trial link), disabled in dev mode with offline badge
result: issue
reported: "brain should be hidden. And this intern should just be simple Bot Name, Persona , and a text box for the script they want or set, get rid of the other stuff"
severity: major

### 2. Update Sarah Bot Name
expected: In production (non-dev mode), edit bot name field, click Save, see success toast notification
result: skipped
reason: Form needs redesign per Test 1 feedback

### 3. Change Language Setting
expected: Select different language from dropdown, save, configuration updates successfully
result: skipped
reason: Form needs redesign per Test 1 feedback

### 4. Update Pronoun Setting
expected: Switch between Kamu/Anda pronoun options, save, configuration persists
result: skipped
reason: Form needs redesign per Test 1 feedback

### 5. Modify Trial Link URL
expected: Update trial link field with valid https:// URL, save, configuration accepts new link
result: skipped
reason: Form needs redesign per Test 1 feedback

### 6. Insights Hidden from Navigation
expected: Check sidebar navigation - "Insights" menu item should NOT appear in sidebar
result: pass

### 7. Brain Settings Hidden
expected: Navigate to Settings page - Brain configuration section should NOT appear
result: issue
reported: "still there"
severity: major

### 8. Configuration API Available
expected: Convex functions (getConfig, updateConfig, getConfigByPhone) deployed and accessible via Convex dashboard
result: pass

### 9. Sarah Template Documentation Exists
expected: File business/bots/SARAH-TEMPLATE.md exists with complete setup guide (workflow steps, configuration, Kapso integration)
result: pass

### 10. Kapso Function Code Available
expected: File business/bots/kapso-load-config-function.js exists with ready-to-copy function node code for Convex config loading
result: pass

## Summary

total: 10
passed: 4
issues: 2
pending: 0
skipped: 4

## Gaps

- truth: "Your Team page shows simplified Intern settings with just Bot Name, Persona field, and script text box"
  status: failed
  reason: "User reported: brain should be hidden. And this intern should just be simple Bot Name, Persona , and a text box for the script they want or set, get rid of the other stuff"
  severity: major
  test: 1
  root_cause: |
    ARCHITECTURE MISMATCH - Phase 12 created duplicate/conflicting configuration systems:

    PROBLEM 1: SarahConfigCard is redundant
    - File: src/components/team/sarah-config-card.tsx
    - Shows 4 fields (bot_name, language, pronoun, trial_link)
    - Reads from sarah.config Convex functions
    - Duplicates functionality of existing InternSettings component
    - User didn't ask for this configuration

    PROBLEM 2: InternSettings is too complex
    - File: src/components/your-team/intern-settings.tsx (730 lines)
    - Has 4 collapsible cards: Persona, Behavior Rules, Response Settings, Slot Extraction
    - DOES have "Custom System Prompt" textarea (user's "script" requirement)
    - DOES have Persona card with language/tone settings
    - But TOO COMPLEX - user wants simplified 3-field form, not advanced multi-card UI

    USER REQUIREMENT (from user feedback):
    - Bot Name (single field) - already in Settings page (correct)
    - Persona (single field/dropdown for personality type)
    - Script text box (single textarea for bot instructions/behavior)

    CURRENT STATE:
    - SarahConfigCard + InternSettings both render on Intern tab
    - SarahConfigCard fields don't match user needs
    - InternSettings has the right fields but buried in complexity
    - No simple "Persona" dropdown exists

    SOLUTION NEEDED:
    1. Remove SarahConfigCard component entirely
    2. Create new SimplifiedInternSettings with ONLY 3 fields
    3. Replace current InternSettings usage
    4. Keep Bot Name in Settings (that's correct location)
    5. Optional: Provide "Advanced Settings" link for power users
  artifacts:
    - src/components/team/sarah-config-card.tsx
    - src/components/your-team/intern-settings.tsx
    - src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx
    - convex/sarah/config.ts
  missing:
    - src/components/your-team/simplified-intern-settings.tsx (new simplified component)
    - Design decision: Persona field options (dropdown values like "Professional", "Friendly", "Casual")
    - Design decision: Keep advanced settings accessible via toggle, or completely remove?
    - API route modifications if switching from intern-config to simpler data model
  debug_session: ".planning/debug/sarah-ui-simplification.md"

- truth: "Brain configuration section does not appear on Settings page"
  status: failed
  reason: "User reported: still there"
  severity: major
  test: 7
  root_cause: "Brain tab is still visible on Your Team page. Settings page was correctly cleaned (commit cdee408), but Your Team page (src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx) still shows Brain tab trigger (lines 58-61) and full Brain TabsContent section (lines 92-109) with BrainSettings component."
  artifacts: ["src/app/(dashboard)/[workspace]/your-team/your-team-client.tsx"]
  missing: ["Remove Brain tab trigger from TabsList", "Remove Brain TabsContent section", "Remove BrainSettings component import and usage", "Remove Brain icon import if no longer used"]
  debug_session: ".planning/debug/brain-settings-visible.md"
