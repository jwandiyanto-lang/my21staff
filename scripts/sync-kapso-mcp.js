#!/usr/bin/env node

/**
 * Sync Kapso Historical Data using MCP Tools
 *
 * This script syncs historical conversations and messages from Kapso to Convex.
 * It uses Kapso MCP tools to fetch data and directly inserts into Convex.
 *
 * Usage:
 *   node scripts/sync-kapso-mcp.js [workspace-slug]
 *
 * Example:
 *   node scripts/sync-kapso-mcp.js eagle-overseas
 *
 * What it does:
 * 1. Fetches all conversations for the workspace from Kapso
 * 2. For each conversation, fetches the last 50 messages
 * 3. Creates/updates contacts with names from Kapso
 * 4. Creates conversations if they don't exist
 * 5. Imports messages (deduplicates by kapso_message_id)
 * 6. Updates conversation metadata (last_message_at, unread_count)
 */

const CONVEX_URL = process.env.CONVEX_URL || 'https://intent-otter-212.convex.cloud';
const KAPSO_API_KEY = process.env.KAPSO_API_KEY || '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '930016923526449';

// Maximum messages to fetch per conversation (default: 50)
const MAX_MESSAGES_PER_CONVERSATION = 50;

/**
 * Normalize phone number (remove all non-digit characters)
 */
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Fetch all conversations from Kapso using search_conversations
 *
 * Kapso API: GET /meta/whatsapp/v24.0/{phone_number_id}/conversations
 * Returns: { data: [...], paging: {...} }
 */
async function fetchKapsoConversations(page = 1, allConversations = []) {
  try {
    const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/conversations?per_page=100&page=${page}`;
    console.log(`[Kapso] Fetching conversations page ${page}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kapso] Failed to fetch conversations:`, response.status, errorText);
      return allConversations;
    }

    const data = await response.json();
    const conversations = data.data || [];

    console.log(`[Kapso] Page ${page}: ${conversations.length} conversations`);
    allConversations.push(...conversations);

    // Fetch next page if available
    if (conversations.length === 100 && data.paging?.has_more) {
      return await fetchKapsoConversations(page + 1, allConversations);
    }

    return allConversations;
  } catch (error) {
    console.error(`[Kapso] Error fetching conversations:`, error.message);
    return allConversations;
  }
}

/**
 * Fetch messages for a specific conversation
 *
 * Kapso API: GET /meta/whatsapp/v24.0/{phone_number_id}/conversations/{conversation_id}/messages
 * Returns: { data: [...], paging: {...} }
 */
async function fetchConversationMessages(conversationId, limit = MAX_MESSAGES_PER_CONVERSATION) {
  try {
    const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/conversations/${conversationId}/messages?per_page=${limit}&page=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Kapso] Failed to fetch messages for ${conversationId}:`, response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`[Kapso] Error fetching messages for ${conversationId}:`, error.message);
    return [];
  }
}

/**
 * Get workspace by slug from Convex
 */
async function getWorkspaceBySlug(slug) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'workspaces:getBySlug',
        args: { slug },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Convex] Failed to get workspace:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error(`[Convex] Error getting workspace:`, error.message);
    return null;
  }
}

/**
 * Import conversation and messages to Convex
 *
 * This sends the conversation and its messages to Convex for processing.
 * Convex will:
 * 1. Create/update contact with kapso_name
 * 2. Create conversation if doesn't exist
 * 3. Insert messages (skip duplicates by kapso_message_id)
 * 4. Update conversation metadata
 */
async function importConversationToConvex(workspaceId, conversation, messages) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'admin:syncKapsoConversation',
        args: {
          workspace_id: workspaceId,
          conversation: conversation,
          messages: messages,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Convex] Failed to import conversation:`, response.status, errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data: data.value };
  } catch (error) {
    console.error(`[Convex] Error importing conversation:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main sync function
 */
async function syncHistoricalData(workspaceSlug) {
  console.log('=== Kapso Historical Data Sync ===\n');
  console.log(`Workspace: ${workspaceSlug}`);
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(`Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`Messages per conversation: ${MAX_MESSAGES_PER_CONVERSATION}\n`);

  // Step 1: Get workspace
  console.log('[Step 1] Getting workspace from Convex...');
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    console.error(`ERROR: Workspace "${workspaceSlug}" not found in Convex`);
    process.exit(1);
  }

  console.log(`✓ Workspace found: ${workspace._id}\n`);

  // Step 2: Fetch all conversations from Kapso
  console.log('[Step 2] Fetching all conversations from Kapso...');
  const conversations = await fetchKapsoConversations();
  console.log(`✓ Total conversations: ${conversations.length}\n`);

  if (conversations.length === 0) {
    console.log('No conversations found in Kapso. Exiting.');
    return;
  }

  // Step 3: Process each conversation
  console.log('[Step 3] Processing conversations...\n');

  let stats = {
    total: conversations.length,
    processed: 0,
    failed: 0,
    messagesImported: 0,
    contactsCreated: 0,
    conversationsCreated: 0,
  };

  for (const conversation of conversations) {
    const conversationId = conversation.id;
    const phoneNumber = conversation.phone_number || conversation.from || 'unknown';
    const contactName = conversation.kapso?.contact_name || 'Unknown';

    console.log(`\n[${stats.processed + 1}/${stats.total}] Processing: ${contactName} (${phoneNumber})`);

    // Fetch messages for this conversation
    console.log(`  → Fetching messages...`);
    const messages = await fetchConversationMessages(conversationId);
    console.log(`  → Found ${messages.length} messages`);

    // Import to Convex
    console.log(`  → Importing to Convex...`);
    const result = await importConversationToConvex(workspace._id, conversation, messages);

    if (result.success) {
      stats.processed++;
      stats.messagesImported += result.data?.messagesImported || 0;
      stats.contactsCreated += result.data?.contactCreated ? 1 : 0;
      stats.conversationsCreated += result.data?.conversationCreated ? 1 : 0;
      console.log(`  ✓ Success: ${result.data?.messagesImported || 0} messages imported`);
    } else {
      stats.failed++;
      console.log(`  ✗ Failed: ${result.error}`);
    }

    // Rate limiting - wait 100ms between conversations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Final summary
  console.log('\n=== Sync Complete ===\n');
  console.log(`Total conversations: ${stats.total}`);
  console.log(`Successfully processed: ${stats.processed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Messages imported: ${stats.messagesImported}`);
  console.log(`Contacts created: ${stats.contactsCreated}`);
  console.log(`Conversations created: ${stats.conversationsCreated}`);
  console.log('\n✓ Historical data sync complete!\n');
}

// Entry point
const workspaceSlug = process.argv[2] || 'eagle-overseas';

syncHistoricalData(workspaceSlug)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Sync Failed ===');
    console.error('Error:', error);
    process.exit(1);
  });
