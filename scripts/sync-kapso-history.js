#!/usr/bin/env node

/**
 * Sync Kapso message history to Convex.
 *
 * Fetches all messages from Kapso API and imports them into Convex.
 * This ensures that historical conversations are available in your inbox.
 */

const API_KEY = '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2';
const PHONE_NUMBER_ID = '930016923526449';
const CONVEX_URL = 'https://intent-otter-212.convex.cloud';

/**
 * Process Kapso v2 webhook payload format
 * Kapso sends: { message, conversation, phone_number_id }
 */
async function fetchAllKapsoMessages(page = 1, allMessages = []) {
  try {
    const response = await fetch(
      `https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/messages?per_page=100&page=${page}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch page ${page}:`, response.status, await response.text());
      return allMessages;
    }

    const data = await response.json();
    const messages = data.data || [];

    console.log(`Fetched page ${page}: ${messages.length} messages`);
    allMessages.push(...messages);

    // Check if there are more pages
    if (messages.length === 100 && data.paging?.has_more) {
      console.log(`Fetching page ${page + 1}...`);
      return await fetchAllKapsoMessages(page + 1, allMessages);
    }

    return allMessages;
  } catch (error) {
    console.error(`Error fetching Kapso messages:`, error.message);
    return allMessages;
  }
}

/**
 * Normalize Kapso v2 phone format (+62 823-9250-8490 -> 6282392508490)
 */
function normalizeKapsoPhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Get workspace ID by Kapso phone number
 * Uses internal query since API endpoint doesn't exist
 */
async function getWorkspaceId(convexUrl, phoneNumber) {
  try {
    // Try to by-kapso-phone endpoint first (for webhook compatibility)
    const response = await fetch(`${convexUrl}/api/workspaces/by-kapso-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kapso_phone_id: phoneNumber }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Workspace endpoint error: ${response.status} - ${errorText}`);
      throw new Error(`Workspace not found for phone ${phoneNumber}`);
    }

    const data = await response.json();
    if (!data.workspaceId) {
      console.error(`Workspace not found in by-kapso-phone response`);
      throw new Error(`Workspace not found for phone ${phoneNumber}`);
    }

    return data.workspaceId;
  } catch (error) {
    console.error('Error getting workspace:', error.message);
    throw error;
  }
}

/**
 * Send messages to Convex for import
 */
async function importToConvex(workspaceId, messages) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/sync/kapso-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to import to Convex:', response.status, errorText);
      throw new Error(`Import failed: ${errorText}`);
    }

    const result = await response.json();
    console.log(`Import result:`, result);
    return result;
  } catch (error) {
    console.error('Error importing to Convex:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting Kapso history sync...\n');

  try {
    // 1. Get workspace ID
    console.log('Step 1: Getting workspace ID...');
    const workspaceId = await getWorkspaceId(CONVEX_URL, PHONE_NUMBER_ID);
    console.log(`Workspace ID: ${workspaceId}`);

    // 2. Fetch all Kapso messages
    console.log('Step 2: Fetching all Kapso messages...');
    const allMessages = await fetchAllKapsoMessages();
    console.log(`Total messages fetched: ${allMessages.length}`);

    // 3. Import to Convex
    console.log('Step 3: Importing to Convex...');
    const importResult = await importToConvex(workspaceId, allMessages);

    console.log(`\n=== Sync Complete ===`);
    console.log(`Workspace: ${workspaceId}`);
    console.log(`Messages imported: ${importResult.imported || importResult.count}`);
    console.log(`Contacts created: ${importResult.contactsCreated || 0}`);
    console.log(`Conversations created: ${importResult.conversationsCreated || 0}`);
    console.log(`Errors: ${importResult.errors || 0}`);

  } catch (error) {
    console.error('\n=== Sync Failed ===');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
