# 21-07: Webhook Batching Optimization - SUMMARY

## Completed: 2026-01-17

## What Was Done

### Async Processing
- Webhook now returns 200 immediately after signature verification
- Payload processing runs asynchronously via `processWebhookAsync()`
- Errors during async processing are logged but don't affect response

### Batched Database Operations
- **Contacts batch lookup**: Single `IN` query to find all existing contacts
- **Contacts batch create**: Single `INSERT` for all new contacts
- **Conversations batch lookup**: Single `IN` query to find all existing conversations
- **Conversations batch create**: Single `INSERT` for all new conversations
- **Messages duplicate check**: Single `IN` query to filter duplicates
- **Messages batch insert**: Single `INSERT` for all new messages

### Performance Logging
- Start/end timing with duration in milliseconds
- Message count per webhook payload
- PII masking applied to all phone numbers in logs

## Performance Improvement

**Before (O(n) database calls per message):**
- For each message:
  - 1 query: Find existing contact
  - 1 query: Create contact if missing
  - 1 query: Find existing conversation
  - 1 query: Create conversation if missing
  - 1 query: Check duplicate message
  - 1 query: Insert message
  - 1 query: Update conversation metadata

**After (~5 queries regardless of batch size):**
1. Batch find contacts (IN query)
2. Batch create missing contacts (INSERT)
3. Batch find conversations (IN query)
4. Batch create missing conversations (INSERT)
5. Batch check duplicates (IN query)
6. Batch insert messages (INSERT)
7. Update conversations (per conversation, not per message)

For a webhook with 10 messages from 3 unique senders: ~70 queries reduced to ~8 queries.

## Files Modified

- `src/app/api/webhook/kapso/route.ts` - Complete refactor with batch operations

## Commits

1. `perf(21-07): optimize webhook with async processing and batching`
2. `fix(inbox): add missing totalCount prop in dev mode` (pre-existing fix)

## Decisions

- **Async fire-and-forget pattern**: Process async without awaiting, catch errors separately
- **Workspace-scoped batching**: Group messages by workspace first, then batch within each workspace
- **Conversation update per-conversation**: Can't easily batch UPDATE with different values per row
