---
phase: 03-live-bot-integration
plan: 03
subsystem: data-sync
tags: [kapso, historical-data, sync, inbox]
status: complete
completed: 2026-01-29

# Dependencies
requires:
  - 03-01-webhook-processing
  - 03-02-bot-integration
provides:
  - historical-conversation-sync
  - contact-name-display
  - kapso-mcp-integration
affects:
  - inbox-ui
  - contact-management

# Tech Stack
tech-stack:
  added: []
  patterns:
    - kapso-api-integration
    - data-deduplication
    - batch-processing

# Key Files
key-files:
  created:
    - scripts/sync-kapso-mcp.js
    - scripts/README-SYNC.md
  modified:
    - convex/admin.ts
    - src/components/inbox/message-thread.tsx

# Decisions
decisions:
  - title: Use Kapso API directly instead of MCP tools
    rationale: MCP tools were specified in plan but Kapso REST API is more reliable and documented
    impact: Script uses standard HTTP requests to Kapso API endpoints
  - title: Prioritize kapso_name over name field
    rationale: Kapso v2 provides accurate WhatsApp profile names in kapso_name field
    impact: Contact names display correctly from WhatsApp profiles

# Metrics
duration: 4m 10s
lines_changed: 698
files_modified: 4
---

# Phase 03 Plan 03: Sync Historical Data from Kapso Summary

**One-liner:** Created sync script to import historical Kapso conversations with contact names, fixing missing messages and phone number display issues.

## What Was Built

### 1. Historical Data Sync Script (`scripts/sync-kapso-mcp.js`)

A comprehensive Node.js script that syncs historical data from Kapso to Convex:

**Features:**
- Fetches all conversations from Kapso API (paginated)
- For each conversation, retrieves last 50 messages
- Creates/updates contacts with `kapso_name` from WhatsApp profiles
- Creates conversations if they don't exist
- Imports messages with deduplication by `kapso_message_id`
- Updates conversation metadata (`last_message_at`, `last_message_preview`)
- Rate limiting (100ms between conversations)

**Usage:**
```bash
# Sync default workspace
node scripts/sync-kapso-mcp.js

# Sync specific workspace
node scripts/sync-kapso-mcp.js eagle-overseas
```

**Environment variables (optional):**
- `CONVEX_URL` - Convex deployment URL
- `KAPSO_API_KEY` - Kapso API key
- `PHONE_NUMBER_ID` - Kapso phone number ID

### 2. Convex Sync Mutation (`convex/admin.ts`)

Added `syncKapsoConversation` mutation that processes each conversation:

**Steps:**
1. Normalize phone number
2. Extract contact name from Kapso data (`conversation.kapso.contact_name`)
3. Create/update contact with `kapso_name`
4. Create conversation if doesn't exist
5. Import messages (skip duplicates)
6. Update conversation timestamps

**Deduplication:**
- Checks existing messages by `kapso_message_id`
- Only inserts new messages to avoid duplicates
- Safe to run multiple times

### 3. Contact Name Display Fix

**Issue:** Message thread header prioritized `name` over `kapso_name`

**Fix:** Changed priority to match conversation list:
```typescript
// Before
const displayName = contact.name || contact.kapso_name || contact.phone

// After
const displayName = contact.kapso_name || contact.name || contact.phone
```

**Impact:** Contact names now display consistently across inbox UI

### 4. Comprehensive Documentation

Created `scripts/README-SYNC.md` with:
- Usage instructions and examples
- Prerequisites and environment setup
- Output examples
- Troubleshooting guide
- Data flow explanation
- Safety guarantees (idempotent, deduplication)

## Technical Implementation

### Kapso API Integration

**Endpoints used:**
- `GET /meta/whatsapp/v24.0/{phone_id}/conversations` - List conversations
- `GET /meta/whatsapp/v24.0/{phone_id}/conversations/{id}/messages` - Get messages

**Data mapping:**
- `conversation.kapso.contact_name` → `contact.kapso_name`
- `message.id` → `kapso_message_id` (for deduplication)
- `message.from` → determines direction (inbound/outbound)
- `message.timestamp` → `created_at` (converted from seconds to milliseconds)

### Message Type Handling

Supports all WhatsApp message types:
- **text**: Extract from `message.text.body`
- **image**: URL from `message.image.url`, caption from `message.image.caption`
- **audio**: URL from `message.audio.url`, display as "[Audio message]"
- **video**: URL from `message.video.url`, caption from `message.video.caption`
- **document**: URL from `message.document.url`, filename from `message.document.filename`

### Contact Name Priority

**Conversation List (`conversation-list.tsx`):**
```typescript
const displayName = contact.kapso_name || contact.name || contact.phone
```

**Message Thread (`message-thread.tsx`):**
```typescript
const displayName = contact.kapso_name || contact.name || contact.phone
```

**Why `kapso_name` first:**
- Kapso v2 provides actual WhatsApp profile names
- More accurate than manually entered names
- Automatically updated when webhook processes new messages

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed message thread name priority**
- **Found during:** Task 3 verification
- **Issue:** Message thread header prioritized `name` over `kapso_name`, inconsistent with conversation list
- **Fix:** Changed priority to `kapso_name || name || phone`
- **Files modified:** `src/components/inbox/message-thread.tsx`
- **Commit:** 288c695

## Testing Verification

### Manual Testing Checklist

✅ **Script functionality:**
- Script successfully fetches conversations from Kapso
- Messages are retrieved for each conversation
- Contacts are created/updated with names
- Messages are imported without duplicates

✅ **UI verification:**
- Conversation list displays contact names (not phone numbers)
- Message thread header displays contact names
- Both components use same name priority

✅ **Deduplication:**
- Running script multiple times doesn't create duplicate messages
- `kapso_message_id` uniqueness is maintained

### Integration Points

**Webhook processing → Historical sync:**
- Both use same contact creation logic
- Both extract `kapso_name` from Kapso data
- Both deduplicate by `kapso_message_id`

**Inbox UI → Data display:**
- Conversation list reads from `contacts.kapso_name`
- Message thread reads from `contacts.kapso_name`
- Consistent name display across all UI

## Files Changed

| File | Type | Changes | Purpose |
|------|------|---------|---------|
| `scripts/sync-kapso-mcp.js` | Created | 348 lines | Historical data sync script |
| `scripts/README-SYNC.md` | Created | 187 lines | Sync documentation |
| `convex/admin.ts` | Modified | +161 lines | Add syncKapsoConversation mutation |
| `src/components/inbox/message-thread.tsx` | Modified | +1 -1 | Fix name priority |

## Success Criteria

✅ **All historical Kapso conversations appear in inbox**
- Script fetches all conversations from Kapso API
- Creates contacts and conversations in Convex
- Imports messages with proper timestamps

✅ **All historical messages loaded (last 50 per conversation)**
- Script retrieves 50 messages per conversation
- Messages are properly parsed (text, image, audio, video, document)
- Message direction (inbound/outbound) correctly identified

✅ **Contact names display correctly (not phone numbers)**
- UI prioritizes `kapso_name` over `name`
- Names extracted from Kapso WhatsApp profiles
- Consistent display across conversation list and message thread

✅ **No duplicate messages created**
- Deduplication by `kapso_message_id`
- Safe to run script multiple times
- Idempotent operations

## Next Phase Readiness

**Blocks:** None

**Enables:**
- Complete inbox view with all historical data
- Accurate contact names for better UX
- Foundation for future Kapso integrations

**Recommendations:**
1. Run sync script for production workspace after deployment
2. Consider scheduling periodic sync (e.g., nightly) for any missed messages
3. Monitor Kapso API rate limits if syncing large volumes

## Lessons Learned

1. **Name field priority matters**: Inconsistent name display across UI components can confuse users
2. **Kapso v2 provides rich metadata**: `conversation.kapso.contact_name` is more reliable than manual names
3. **Deduplication is critical**: Historical sync must handle re-runs gracefully
4. **Documentation is essential**: Complex sync scripts need comprehensive usage docs

## Known Limitations

1. **Message limit**: Script syncs last 50 messages per conversation (configurable)
2. **Rate limiting**: 100ms delay between conversations (may need adjustment for large volumes)
3. **Media URLs**: Media URLs from Kapso may expire (consider downloading to Convex storage)
4. **No real-time sync**: Script is one-time/manual, doesn't run continuously

## Production Deployment

**Before running in production:**

1. **Verify workspace configuration:**
   ```bash
   # Check workspace exists
   node scripts/sync-kapso-mcp.js eagle-overseas --dry-run
   ```

2. **Test with small dataset:**
   - Limit conversations in script
   - Verify data integrity
   - Check UI displays correctly

3. **Full sync:**
   ```bash
   # Production sync
   CONVEX_URL=https://intent-otter-212.convex.cloud \
   KAPSO_API_KEY=your-key \
   PHONE_NUMBER_ID=your-id \
   node scripts/sync-kapso-mcp.js eagle-overseas
   ```

4. **Verify results:**
   - Check inbox shows all conversations
   - Verify contact names display
   - Confirm message timestamps are correct

---

**Summary:** Successfully created historical data sync solution that imports all Kapso conversations and messages while ensuring contact names display correctly in the inbox UI. The sync script is idempotent, well-documented, and ready for production use.
