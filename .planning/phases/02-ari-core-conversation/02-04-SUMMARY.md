---
phase: 02-ari-core-conversation
plan: 04
subsystem: ai-qualification
tags: [ari, qualification, form-validation, documents, indonesian]
status: complete

dependency-graph:
  requires: [02-02]
  provides:
    - form validation logic
    - missing field detection
    - follow-up question generation
    - document readiness tracking
  affects: [02-05, 02-06]

tech-stack:
  added: []
  patterns:
    - immutable state updates for document tracking
    - field label mapping for i18n

key-files:
  created:
    - src/lib/ari/qualification.ts
  modified:
    - src/lib/ari/context-builder.ts
    - src/lib/ari/index.ts

decisions:
  - decision: "REQUIRED_FIELDS: name, email, english_level, budget, timeline, country"
    rationale: "Core fields needed for lead qualification before scoring"
    reference: "02-04-PLAN context"
  - decision: "Document tracking: passport, cv, english_test, transcript"
    rationale: "Key documents for overseas education consultation"
    reference: "ARI-05 requirement"
  - decision: "Indonesian yes/no detection patterns"
    rationale: "Natural language parsing for document status responses"
    reference: "parseDocumentResponse implementation"

metrics:
  duration: 3 minutes
  completed: 2026-01-20
---

# Phase 02 Plan 04: ARI Form Validation and Qualification Summary

Form validation logic that identifies missing data and generates intelligent follow-up questions in natural Indonesian.

## What Was Built

### 1. Form Validation (qualification.ts)

**Missing Field Detection:**
- `REQUIRED_FIELDS`: name, email, english_level, budget, timeline, country
- `IMPORTANT_FIELDS`: activity, notes
- `getMissingFields()`: Returns list of empty/missing fields by category
- `hasAllRequiredFields()`: Quick check for completion

**Follow-up Questions:**
- `getFieldLabel()`: Indonesian labels for field names
- `getFollowUpQuestion()`: Natural Indonesian questions per field:
  - name: "Boleh tau nama lengkapnya siapa kak?"
  - email: "Email yang aktif apa kak? Buat kirim info lebih lanjut."
  - english_level: "Kalau bahasa Inggris, udah di level mana kak?"
  - budget: "Budget untuk kuliah kira-kira berapa kak?"
  - timeline: "Rencananya mau berangkat kapan kak?"
  - country: "Negara tujuannya kemana kak?"

### 2. Document Readiness Tracking (qualification.ts)

**DocumentStatus Interface:**
```typescript
interface DocumentStatus {
  passport: boolean | null;    // null = not asked yet
  cv: boolean | null;
  english_test: boolean | null;
  transcript: boolean | null;
}
```

**Utilities:**
- `getDocumentQuestions()`: Returns all document questions with keys
- `parseDocumentResponse()`: Detects yes/no in Indonesian (udah, belum, etc.)
- `updateDocumentStatus()`: Immutable update pattern
- `getNextDocumentQuestion()`: Returns next unanswered document question
- `getNextDocumentKey()`: Returns key of next document to ask
- `allDocumentsAsked()`: Check if all documents covered
- `getDocumentSummary()`: Count ready/notReady/unknown documents

### 3. Context Builder Integration (context-builder.ts)

**Extended PromptContext:**
- Added `documents?: DocumentStatus` to conversation.context
- Added `askedFields?: string[]` to track already-asked fields

**Qualifying State Instructions:**
- Checks missing required fields first
- Includes specific follow-up question in system prompt
- When form complete, checks document status
- Enforces "one question per message" rule

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/ari/qualification.ts` | Form validation and document tracking |
| `src/lib/ari/context-builder.ts` | Prompt building with qualification logic |
| `src/lib/ari/index.ts` | Re-exports all qualification utilities |

## Commits

| Hash | Description |
|------|-------------|
| 59fa8d7 | Create form validation and missing field detection |
| a7d82dd | Integrate qualification into context builder |

## Deviations from Plan

None - plan executed exactly as written. Task 2 (document tracking) was implemented in the same file as Task 1 as specified.

## Verification Results

- [x] getMissingFields identifies empty required fields
- [x] Follow-up questions are natural Indonesian
- [x] Document status tracking works (passport, CV, IELTS, transcript)
- [x] Context builder includes qualification instructions
- [x] One question at a time rule enforced in prompt

## Next Phase Readiness

**Dependencies satisfied for:**
- 02-05 (Response Generation): Qualification context ready
- 02-06 (Scoring): Field completeness detection available

**No blockers identified.**
