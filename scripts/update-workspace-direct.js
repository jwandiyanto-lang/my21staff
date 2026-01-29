#!/usr/bin/env node

/**
 * Directly update Kapso phone ID in Convex database
 * Bypasses Next.js API and uses Convex internal functions directly
 */

const WORKSPACE_SLUG = 'eagle-overseas';
const KAPSO_PHONE_ID = '930016923526449';

async function main() {
  console.log('=== Updating Kapso Phone ID in Convex ===');
  console.log(`Workspace slug: ${WORKSPACE_SLUG}`);
  console.log(`New Kapso Phone ID: ${KAPSO_PHONE_ID}`);
  console.log('');

  // Get all workspaces to find Eagle Overseas
  try {
    const { spawn } = require('child_process');

    const result = spawn(
      'npx',
      ['convex', 'run', '--prod', '--json', 'workspaces:get'],
      { stdio: 'pipe' }
    );

    let output = '';
    result.stdout.on('data', (data) => {
      output += data;
    });

    result.on('close', async (code) => {
      if (code !== 0) {
        console.error('Failed to get workspaces');
        process.exit(1);
      }

      const data = JSON.parse(output);
      const workspaces = data.data || [];

      console.log('\n=== Found Workspaces ===');
      workspaces.forEach((ws, i) => {
        console.log(`[${i + 1}] ${ws.name || '(no name)'} - ${ws.slug}`);
      });

      // Find Eagle Overseas
      const eagle = workspaces.find(ws => ws.slug === WORKSPACE_SLUG);

      if (!eagle) {
        console.error(`\nERROR: Workspace "${WORKSPACE_SLUG}" not found`);
        process.exit(1);
      }

      console.log(`\n=== Eagle Overseas Found ===`);
      console.log(`ID: ${eagle._id}`);
      console.log(`Name: ${eagle.name}`);
      console.log(`Slug: ${eagle.slug}`);
      console.log(`Current Kapso Phone ID: ${eagle.kapso_phone_id || '(none)'}`);

      // Check if already has the correct Kapso phone ID
      if (eagle.kapso_phone_id === KAPSO_PHONE_ID) {
        console.log('\nKapso Phone ID already correct! No update needed.');
        process.exit(0);
      }

      // Update workspace with correct Kapso phone ID
      console.log(`\n=== Updating Kapso Phone ID to ${KAPSO_PHONE_ID} ===`);

      const updateResult = spawn(
        'npx',
        ['convex', 'run', '--prod', '--json', 'workspaces:update', '--json', `{"workspace_id":"${eagle._id}","kapso_phone_id":"${KAPSO_PHONE_ID}"}`],
        { stdio: 'pipe' }
      );

      let updateOutput = '';
      updateResult.stdout.on('data', (data) => {
        updateOutput += data;
      });

      updateResult.on('close', (code) => {
        if (code !== 0) {
          console.error('Failed to update workspace');
          process.exit(1);
        }

        console.log('\n=== Update Complete ===');
        console.log('Kapso Phone ID successfully updated to:', KAPSO_PHONE_ID);
      });
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
