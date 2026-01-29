---
phase: 03-live-bot-integration
plan: 03
type: execute
wave: 3
autonomous: true
---

# Plan 03-03 REVISED: Sync Historical Data from Kapso

## Issues to Fix

1. **Historical messages missing** - Inbox only shows messages after webhook configured
2. **Contact names missing** - Shows phone numbers instead of names from Kapso

## Tasks

### Task 1: Use Kapso MCP to fetch historical conversations

Use the `whatsapp_search_conversations` MCP tool to get all conversations:
- Fetch all conversations for Eagle Overseas workspace
- For each conversation, get contact context (includes name)
- Import into database if not already exists

### Task 2: Fetch historical messages for each conversation

Use `whatsapp_get_conversation_context` to get recent messages:
- Get last 50 messages per conversation
- Import into messages table (skip duplicates by kapso_message_id)
- Update conversation metadata (last_message_at, unread_count)

### Task 3: Verify contact names are displayed in UI

Check inbox code to ensure it displays `contact.name` or `contact.kapso_name`:
- Read inbox conversation list component
- Verify it shows name, not just phone number
- Fix if needed

## Success Criteria

- ✅ All historical Kapso conversations appear in inbox
- ✅ All historical messages loaded (last 50 per conversation)
- ✅ Contact names display correctly (not phone numbers)
- ✅ No duplicate messages created
