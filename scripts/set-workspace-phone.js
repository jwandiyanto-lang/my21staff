#!/usr/bin/env node

/**
 * Directly set Kapso phone ID in Eagle Overseas workspace
 */

async function setWorkspacePhone() {
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

    // Find Eagle Overseas
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

    // Update workspace with correct Kapso phone ID via internal mutation
    console.log('\n=== Setting Kapso Phone ID via internal query ===');

    // Use the internal endpoint for workspace lookup
    const lookupResponse = await fetch('https://intent-otter-212.convex.cloud/api/internal/workspaces/get-by-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '6282392508490' }),
    });

    if (!lookupResponse.ok) {
      console.error('Failed to lookup workspace by phone:', lookupResponse.status);
      return;
    }

    const lookupData = await lookupResponse.json();
    if (!lookupData.workspaceId) {
      console.error('Workspace not found by phone lookup');
      return;
    }

    console.log(`Found workspace ID: ${lookupData.workspaceId}`);

    // Update workspace using standard update endpoint
    const updateResponse = await fetch('https://intent-otter-212.convex.cloud/api/workspaces/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: lookupData.workspaceId,
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

setWorkspacePhone();
