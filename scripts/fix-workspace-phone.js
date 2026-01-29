#!/usr/bin/env node

/**
 * Fix Kapso phone ID in Eagle Overseas workspace
 */

async function fixWorkspace() {
  try {
    // Get all workspaces
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

    // Find Eagle Overseas or slug matches
    const eagleOverseas = workspaces.find(ws =>
      ws.slug === 'eagle-overseas' || ws.name?.toLowerCase().includes('eagle')
    );

    if (!eagleOverseas) {
      console.error('\nERROR: Eagle Overseas workspace not found');
      return;
    }

    console.log('\n=== Eagle Overseas Workspace Found ===');
    console.log(`ID: ${eagleOverseas._id}`);
    console.log(`Name: ${eagleOverseas.name}`);
    console.log(`Slug: ${eagleOverseas.slug}`);
    console.log(`Current Kapso Phone ID: ${eagleOverseas.kapso_phone_id || '(none)'}`);

    // Update workspace with correct Kapso phone ID
    const updateResponse = await fetch('https://intent-otter-212.convex.cloud/api/workspaces/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: eagleOverseas._id,
        kapso_phone_id: '930016923526449',
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update workspace:', updateResponse.status);
      return;
    }

    const updateData = await updateResponse.json();
    console.log('\n=== Workspace Updated ===');
    console.log('Kapso Phone ID set to: 930016923526449');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixWorkspace();
