#!/usr/bin/env node

/**
 * Directly update workspace Kapso phone ID using Convex CLI
 * This bypasses the broken API routes and uses proven working method
 */

async function updateWorkspacePhone() {
  console.log('=== Updating Workspace Kapso Phone ID ===\n');

  // Use Convex CLI to update workspace (proven working method from Phase 2.1)
  const { spawn } = require('child_process');

  const updateCmd = spawn(
    'npx',
    ['convex', 'run', '--prod', '--json', 'internal:workspaces:update-kapso-phone', '--json', `{"workspace_id":"2bdca4dd-e230-4a1a-8639-68f8595defa8","kapso_phone_id":"930016923526449"}`],
    { stdio: 'pipe' }
  );

  let output = '';
  updateCmd.stdout.on('data', (data) => {
    output += data;
  });

  updateCmd.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to update workspace');
      process.exit(1);
    }

    console.log('\n=== Update Complete ===');
    const result = JSON.parse(output);
    console.log('Kapso Phone ID updated successfully');
  });
}

updateWorkspacePhone();
