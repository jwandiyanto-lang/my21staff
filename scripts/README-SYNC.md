# Kapso Historical Data Sync

## Overview

The `sync-kapso-mcp.js` script syncs historical conversations and messages from Kapso to your Convex database.

## What It Does

1. **Fetches Conversations**: Gets all conversations from Kapso API
2. **Fetches Messages**: For each conversation, retrieves the last 50 messages
3. **Creates/Updates Contacts**: Stores contact names from Kapso in `kapso_name` field
4. **Creates Conversations**: Creates conversation records if they don't exist
5. **Imports Messages**: Inserts messages (skips duplicates by `kapso_message_id`)
6. **Updates Metadata**: Sets `last_message_at` and `last_message_preview` for conversations

## Prerequisites

Before running the script, ensure you have:

1. **Convex deployed** - The script calls Convex mutations
2. **Workspace configured** - Workspace must exist in Convex with correct slug
3. **Environment variables** (optional):
   - `CONVEX_URL` - Your Convex deployment URL (default: https://intent-otter-212.convex.cloud)
   - `KAPSO_API_KEY` - Your Kapso API key (default: from script)
   - `PHONE_NUMBER_ID` - Your Kapso phone number ID (default: from script)

## Usage

### Basic Usage

```bash
# Sync for default workspace (eagle-overseas)
node scripts/sync-kapso-mcp.js
```

### Specify Workspace

```bash
# Sync for a specific workspace
node scripts/sync-kapso-mcp.js my-workspace-slug
```

### With Custom Environment Variables

```bash
# Override defaults with environment variables
CONVEX_URL=https://my-deployment.convex.cloud \
KAPSO_API_KEY=your-api-key \
PHONE_NUMBER_ID=your-phone-id \
node scripts/sync-kapso-mcp.js eagle-overseas
```

## Output Example

```
=== Kapso Historical Data Sync ===

Workspace: eagle-overseas
Convex URL: https://intent-otter-212.convex.cloud
Phone Number ID: 930016923526449
Messages per conversation: 50

[Step 1] Getting workspace from Convex...
✓ Workspace found: j97h8x9w2q3r4s5t6u7v8w9x

[Step 2] Fetching all conversations from Kapso...
[Kapso] Fetching conversations page 1...
[Kapso] Page 1: 23 conversations
✓ Total conversations: 23

[Step 3] Processing conversations...

[1/23] Processing: John Doe (+62 812-3456-7890)
  → Fetching messages...
  → Found 15 messages
  → Importing to Convex...
  ✓ Success: 15 messages imported

[2/23] Processing: Jane Smith (+62 813-9876-5432)
  → Fetching messages...
  → Found 8 messages
  → Importing to Convex...
  ✓ Success: 8 messages imported

...

=== Sync Complete ===

Total conversations: 23
Successfully processed: 23
Failed: 0
Messages imported: 342
Contacts created: 5
Conversations created: 18

✓ Historical data sync complete!
```

## What Gets Synced

### Contacts
- **Created** if phone number doesn't exist
- **Updated** with `kapso_name` from Kapso profile
- If contact has no `name`, uses `kapso_name` as `name`

### Conversations
- **Created** if contact has no conversation
- **Updated** with latest message timestamp and preview

### Messages
- **All message types**: text, image, audio, video, document
- **Deduplication**: Skips messages that already exist (by `kapso_message_id`)
- **Direction**: Correctly identifies inbound (from contact) vs outbound (from bot)
- **Metadata**: Preserves reply context if message is a reply

## Troubleshooting

### "Workspace not found"
- Verify the workspace slug exists in Convex
- Check that the workspace has been created (not just organization)

### "No conversations found in Kapso"
- Verify `PHONE_NUMBER_ID` is correct
- Check Kapso API key has permission to access conversations
- Ensure you have actual WhatsApp conversations in Kapso

### "Failed to import conversation"
- Check Convex logs for detailed error
- Ensure Convex deployment is running
- Verify network connectivity

### Rate Limiting
- The script waits 100ms between conversations to avoid rate limits
- If you hit rate limits, increase the delay in the script

## Implementation Details

### API Endpoints Used

**Kapso API:**
- `GET /meta/whatsapp/v24.0/{phone_number_id}/conversations` - List conversations
- `GET /meta/whatsapp/v24.0/{phone_number_id}/conversations/{id}/messages` - Get messages

**Convex Mutation:**
- `admin:syncKapsoConversation` - Processes each conversation

### Data Flow

```
Kapso API → Script → Convex Mutation → Database
              ↓
         Deduplication
         Name extraction
         Message parsing
```

## Configuration

You can modify these constants in the script:

```javascript
// Maximum messages to fetch per conversation
const MAX_MESSAGES_PER_CONVERSATION = 50;
```

To sync more or fewer messages, edit this value before running.

## Safety

- **Idempotent**: Running the script multiple times is safe
- **Deduplication**: Messages are deduplicated by `kapso_message_id`
- **No data loss**: Existing contacts and conversations are updated, not replaced

## After Syncing

Once the sync is complete:

1. **Check Inbox**: Visit `/[workspace]/inbox` to see historical conversations
2. **Verify Names**: Contact names should display correctly (not phone numbers)
3. **Check Messages**: Click on a conversation to see imported messages

## Support

If you encounter issues:
1. Check Convex logs for detailed errors
2. Verify Kapso API credentials
3. Ensure workspace configuration is correct
