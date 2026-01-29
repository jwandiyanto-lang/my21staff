#!/usr/bin/env node

/**
 * Dump all workspaces from Convex to check phone number format
 */

async function dumpWorkspaces() {
  try {
    const response = await fetch('https://intent-otter-212.convex.cloud/api/workspaces', {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed:', response.status);
      return;
    }

    const data = await response.json();
    const workspaces = data.data || [];

    console.log('\n=== Workspaces ===');
    workspaces.forEach((ws, i) => {
      console.log(`[${i + 1}] ID: ${ws._id}`);
      console.log(`     Name: ${ws.name}`);
      console.log(`     Slug: ${ws.slug}`);
      console.log(`     Kapso Phone ID: ${ws.kapso_phone_id || '(none)'}`);
      console.log(`     ---`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

dumpWorkspaces();
