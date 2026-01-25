---
phase: 08-sealion-kapso
plan: 01
subsystem: integration
tags: [kapso, sea-lion, ai, whatsapp]

# Dependency graph
requires:
  - phase: 06-kapso-live
    provides: Kapso webhook handler
provides:
  - Sea Lion AI function in Kapso
  - AI Auto-Reply workflow
  - Automated WhatsApp responses in Bahasa Indonesia
affects: []

# Tech tracking
tech-stack:
  added: [Sea Lion API]
  patterns: [Kapso Functions, Kapso Workflows]

key-files:
  created: []
  modified: []

key-decisions:
  - "Kapso-side configuration only, no Next.js code changes"
  - "Sea Lion model: aisingapore/Gemma-SEA-LION-v4-27B-IT"

patterns-established:
  - Kapso Functions for AI integration
  - Workflow trigger → function → send message pattern

issues-created: []

# Metrics
duration: manual
completed: 2026-01-15
---

# Phase 8 Plan 1: Sea Lion + Kapso Summary

**Connected Sea Lion AI to Kapso for automated WhatsApp responses in Bahasa Indonesia**

## Accomplishments

- SEALION_API_KEY secret configured in Kapso
- `sea-lion-reply` function deployed with Indonesian system prompt
- `AI Auto-Reply` workflow activated
- End-to-end: WhatsApp message → Sea Lion AI → response delivered

## Configuration Details

- **Function name:** sea-lion-reply
- **Workflow name:** AI Auto-Reply
- **Model:** aisingapore/Gemma-SEA-LION-v4-27B-IT
- **API endpoint:** https://api.sea-lion.ai/v1/chat/completions

## System Prompt

Indonesian-focused prompt for UMKM customer support:
- Responds in friendly, professional Bahasa Indonesia
- Keeps answers concise (2-3 paragraphs max)
- Suggests contacting support team when uncertain

## Issues Encountered

None

## Next Step

Phase 8 complete, ready for Phase 9: Sheets to Database

---
*Phase: 08-sealion-kapso*
*Completed: 2026-01-15*
