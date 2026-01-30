# Plan 09-01 Summary: Deploy sea-lion-reply Function to Kapso

**Status:** Complete
**Completed:** 2026-01-20

## What Was Built

Deployed Ari bot to Kapso with full CRM integration:

1. **Kapso Function** (`sea-lion-reply-v1`)
   - Time-appropriate Indonesian greetings (pagi/siang/sore/malam)
   - CRM contact lookup for personalized greetings
   - Sea Lion AI for conversational responses
   - Handover triggers for sales keywords

2. **Workflow** (`Eagle Overseas - SEALION`)
   - WhatsApp inbound message trigger
   - Routes to sea-lion-reply-v1 function
   - Sends AI response back to user

3. **Documentation** (`business/bots/KAPSO-SETUP.md`)
   - Critical deployment rules (no export keyword, short strings)
   - Working code template
   - Secrets configuration
   - Troubleshooting guide

## Secrets Configured

| Key | Purpose |
|-----|---------|
| SEALION_API_KEY | Sea Lion AI API |
| CRM_API_URL | my21staff.com base URL |
| CRM_API_KEY | CRM API authentication |
| WORKSPACE_ID | Eagle workspace UUID |

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Documentation | 18f5678 | business/bots/KAPSO-SETUP.md |

## Lessons Learned

1. **Function format**: Kapso requires `async function handler(request, env)` — no export keyword
2. **String length**: Long strings break when editor wraps lines — keep under 40 chars
3. **Function naming**: Lowercase, numbers, hyphens only — no spaces or uppercase
4. **Data structure**: Kapso passes message in `body.execution_context.inbound_message.text`, NOT `body.message`

## Verification

- [x] Function deployed to Kapso
- [x] All 4 secrets configured
- [x] Workflow trigger enabled
- [x] WhatsApp test message received response
- [x] Ari bot responds correctly
