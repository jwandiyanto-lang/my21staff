# Sarah Bot Template

Template for setting up Sarah AI assistant for new workspaces.

## Overview

Sarah is the lead qualification bot for my21staff. She greets WhatsApp contacts, qualifies them through conversational questions, and hands off to humans when ready.

Sarah uses a dynamic configuration system that allows workspace owners to customize:
- Bot name (e.g., "Your Intern", "Sarah", "Assistant")
- Language preference (Indonesian or English)
- Pronoun (casual "Kamu" or formal "Anda")
- Trial link (where qualified leads are sent)

## Configuration Settings

### Customer-Editable Settings (via Dashboard)

| Setting | Field | Type | Default | Description |
|---------|-------|------|---------|-------------|
| Bot Name | bot_name | string | "Your Intern" | Display name in conversations |
| Language | language | enum | "id" | "id" (Indonesian) or "en" (English) |
| Pronoun | pronoun | enum | "Kamu" | "Kamu" (casual) or "Anda" (formal) |
| Trial Link | trial_link | url | https://my21staff.com/trial | Link sent to qualified leads |

Customers configure these settings via **Dashboard > Your Team > Intern** tab.

### System Settings (Developer Only)

These settings are in the Kapso workflow and not customer-editable:

| Setting | Value | Location |
|---------|-------|----------|
| Model | groq://grok-3-mini-2025-01-27 | Kapso AI Agent node |
| Max Tokens | 150 | Kapso AI Agent node |
| Temperature | 0.7 | Kapso AI Agent node |
| Workflow ID | 67cf2cdc-a8fd-43fa-9721-4ea5d82f0190 | Kapso Dashboard |

## Persona Prompt

Sarah's persona is defined by her system prompt, which adapts based on customer configuration:

```
You are {bot_name}, a friendly AI assistant for lead qualification.

{Respond in Indonesian (Bahasa Indonesia).|Respond in English.}
{Use "{pronoun}" as the pronoun for addressing the customer.}

Your personality:
- Warm and conversational
- Keep messages under 140 characters
- NO emojis ever
- Ask one question at a time
- Qualify leads by understanding their business needs

When qualification is complete, the trial link is: {trial_link}
```

### Key Characteristics

- **Language First:** Indonesian by default, switches to English if user messages in English
- **Conversational:** Professional but warm, like a capable digital staff member
- **Concise:** Always under 140 characters per message
- **No Emojis:** Completely emoji-free
- **Dynamic Pronoun:** Uses customer's chosen "Kamu" or "Anda"
- **One Question:** Asks one question per message, waits for response

### Sarah's Role

Sarah collects information through natural conversation:

1. **Name** - Who are they?
2. **Business Type** - What do they do?
3. **Location** - Where are they based?
4. **Tenure** - How long in business?
5. **Pain Points** - What challenges do they face?
6. **Interest Level** - Are they ready to proceed?

## Kapso Workflow Setup

### Workflow Structure

```
[start] -> [load-config] -> [sarah_agent] -> [send_trial_link]
```

1. **start**: Triggered by incoming WhatsApp message
2. **load-config**: Function node that fetches workspace config from Convex
3. **sarah_agent**: AI agent with dynamic system prompt
4. **send_trial_link**: Sends trial link when qualification complete

### Adding load-config Function Node

See `kapso-load-config-function.js` for the function code.

**In Kapso Dashboard:**

1. Open workflow editor
2. Add "Function" node after start
3. Paste code from `kapso-load-config-function.js`
4. Configure environment variable: `CONVEX_DEPLOYMENT_URL`
5. Connect output to sarah_agent node
6. Update sarah_agent to use `{{vars.system_prompt}}`

### Convex API Endpoints

The load-config function calls these Convex endpoints:

| Function | Type | Purpose |
|----------|------|---------|
| `sarah/config:getConfigByPhone` | query | Fetch config by Kapso phone_id |

**API Format:**

```
POST {CONVEX_DEPLOYMENT_URL}/api/query
Content-Type: application/json

{
  "path": "sarah/config:getConfigByPhone",
  "args": { "phone_id": "xxx" }
}
```

## Duplicating Sarah for New Workspace

### Prerequisites

1. Workspace created in my21staff
2. Kapso phone number connected to workspace
3. `kapso_phone_id` stored in workspaces table

### Steps

1. **Copy Kapso Workflow**
   - In Kapso Dashboard, duplicate the Sarah workflow
   - Note the new workflow ID
   - Assign to new phone number

2. **Configure Default Settings**
   - New workspaces automatically get default Sarah config
   - Customer can customize via Dashboard > Your Team > Intern tab

3. **Verify Integration**
   - Send test WhatsApp message to new number
   - Verify Sarah responds with correct persona
   - Check config loads (view Kapso execution logs)

### Quick Setup Checklist

- [ ] Duplicate workflow in Kapso Dashboard
- [ ] Assign new phone number to duplicated workflow
- [ ] Create workspace in my21staff (sarahConfigs record auto-created with defaults)
- [ ] Link workspace to Kapso phone (update `kapso_phone_id` in workspaces table)
- [ ] Send test message to verify response

## Troubleshooting

### Config Not Loading

1. Check `kapso_phone_id` is set in workspaces table
2. Verify load-config function node is before sarah_agent
3. Check Convex logs for `getConfigByPhone` errors
4. Verify `CONVEX_DEPLOYMENT_URL` environment variable is set in Kapso

### Wrong Language/Pronoun

1. Customer may not have saved config - defaults apply
2. Ask customer to save settings even if using defaults
3. Check config in Convex Dashboard > sarahConfigs table
4. Verify phone_id matches between workspaces and Kapso conversation

### Trial Link Not Sent

1. Verify trial_link is valid HTTPS URL
2. Check send_trial_link node uses `{{vars.trial_link}}`
3. Test with Kapso's "Test" feature
4. Ensure `send_trial_link` node is connected after sarah_agent

### Bot Name Not Displayed

1. Check sarah_agent node uses `{{vars.system_prompt}}`
2. Verify system_prompt contains `{bot_name}` placeholder replaced
3. Check buildSystemPrompt function in load-config

## API Reference

### Convex Functions

| Function | Type | Args | Returns |
|----------|------|------|---------|
| `sarah.config.getConfig` | query | workspace_id | Config object |
| `sarah.config.updateConfig` | mutation | workspace_id, bot_name, language, pronoun, trial_link | { success, configId } |
| `sarah.config.getConfigByPhone` | query | phone_id | Config object (for Kapso) |

### Config Object Shape

```typescript
{
  bot_name: string,      // 1-50 chars
  language: "id" | "en",
  pronoun: "Kamu" | "Anda",
  trial_link: string,    // https:// URL
  created_at: number,    // Unix timestamp
  updated_at: number,    // Unix timestamp
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_DEPLOYMENT_URL` | Convex deployment URL | Yes |
| `KAPSO_PHONE_ID` | Kapso phone number ID | Yes |

## Related Documentation

- **Sarah Persona:** `business_21/03_bots/SARAH-PERSONA.md`
- **Kapso Prompt:** `business_21/03_bots/Sarah-Kapso-Prompt.md`
- **Kapso CLI Reference:** `.planning/phases/10-sarah-bot-refinement/KAPSO-CLI-REFERENCE.md`
- **Sarah Config Card:** `src/components/team/sarah-config-card.tsx`
- **Phase 12-01 Summary:** `.planning/phases/12-sarah-template-system/12-01-SUMMARY.md`
- **Phase 12-02 Summary:** `.planning/phases/12-sarah-template-system/12-02-SUMMARY.md`

---

*Document: SARAH-TEMPLATE.md*
*Template for Sarah bot setup and configuration*
*Version 1.0 - 2026-02-01*
