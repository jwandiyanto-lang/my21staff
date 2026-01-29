#!/usr/bin/env node

/**
 * Directly update Kapso phone ID in database using Convex internal API
 */

const SLUG = 'eagle-overseas';
const KAPSO_PHONE_ID = '930016923526449';

async function updateKapsoPhone() {
  try {
    // Get all workspaces
    const response = await fetch('https://intent-otter-212.convex.cloud/api/workspaces', {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to get workspaces:', response.status);
      return;
    }

    const data = await response.json();
    const workspaces = data.data || [];

    console.log('\n=== Workspaces ===');
    workspaces.forEach((ws, i) => {
      console.log(`[${i + 1}] ID: ${ws._id}`);
      console.log(`     Name: ${ws.name}`);
      console.log(`     Slug: ${ws.slug}`);
      console.log(`     Current Kapso Phone ID: ${ws.kapso_phone_id || '(none)'}`);
      console.log(`     ---`);
    });

    // Find Eagle Overseas
    const eagleOverseas = workspaces.find(ws => ws.slug === SLUG);

    if (!eagleOverseas) {
      console.error(`\nERROR: Workspace with slug "${SLUG}" not found`);
      return;
    }

    console.log(`\n=== Found Eagle Overseas ===`);
    console.log(`ID: ${eagleOverseas._id}`);
    console.log(`Name: ${eagleOverseas.name}`);
    console.log(`Current Kapso Phone ID: ${eagleOverseas.kapso_phone_id || '(none)'}`);

    // Check if already has the correct Kapso phone ID
    if (eagleOverseas.kapso_phone_id === KAPSO_PHONE_ID) {
      console.log('\nKapso Phone ID already correct! No update needed.');
      return;
    }

    // Update using internal mutation
    console.log('\n=== Updating Kapso Phone ID ===');
    const updateResponse = await fetch('https://intent-otter-212.convex.cloud/api/internal/workspaces/update-kapso-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: eagleOverseas._id,
        kapso_phone_id: KAPSO_PHONE_ID,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update:', updateResponse.status, await updateResponse.text());
      return;
    }

    const updateData = await updateResponse.json();
    console.log('\n=== Update Complete ===');
    console.log('Kapso Phone ID set to:', KAPSO_PHONE_ID);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateKapsoPhone();
