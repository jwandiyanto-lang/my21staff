#!/usr/bin/env node

/**
 * Directly update Eagle Overseas workspace kapso_phone_id via internal Convex mutation
 * This bypasses the broken API routes and uses the working convex internal endpoints
 */

async function fixWorkspace() {
  console.log('=== Fixing Workspace Kapso Phone ID ===');
  console.log('');

  const { spawn } = require('child_process');

  // Find Eagle Overseas workspace
  console.log('Step 1: Looking up Eagle Overseas workspace...');

  const listResult = spawn(
    'npx',
    ['convex', 'run', '--prod', '--json', 'workspaces:get'],
    { stdio: 'pipe' }
  );

  let listOutput = '';
  listResult.stdout.on('data', (data) => {
    listOutput += data;
  });

  listResult.on('close', async (code) => {
    if (code !== 0) {
      console.error('Failed to get workspaces');
      process.exit(1);
    }

    const data = JSON.parse(listOutput);
    const workspaces = data.data || [];

    const eagle = workspaces.find(ws =>
      ws.slug === 'eagle-overseas' || ws.name?.toLowerCase().includes('eagle')
    );

    if (!eagle) {
      console.error('ERROR: Eagle Overseas workspace not found');
      process.exit(1);
    }

    console.log(`\nFound: ${eagle.name} (${eagle.slug})`);
    console.log(`ID: ${eagle._id}`);
    console.log(`Current Kapso Phone ID: ${eagle.kapso_phone_id || '(none)'}`);

    // Check if already correct
    if (eagle.kapso_phone_id === '930016923526449') {
      console.log('\nKapso Phone ID already correct! No update needed.');
      process.exit(0);
    }

    // Update using internal mutation
    console.log('\nStep 2: Updating Kapso Phone ID via internal mutation...');
    console.log('Target: 930016923526449');

    const updateResult = spawn(
      'npx',
      ['convex', 'run', '--prod', '--json', 'workspaces:update', '--json', `{"workspace_id":"${eagle._id}","kapso_phone_id":"930016923526449"}`],
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
      console.log('Kapso Phone ID set to: 930016923526449');
    });
  });
}

fixWorkspace();
