#!/usr/bin/env node

/**
 * Convex deployment script
 * Separated from package.json to avoid Vercel build parser issues
 */

const { spawnSync } = require('child_process');

console.log('[Convex Deploy] Starting deployment...');

// Run convex deploy
const deploy = spawnSync('npx', ['convex', 'deploy'], {
  stdio: 'inherit',
  shell: true
});

deploy.on('close', (code) => {
  if (code === 0) {
    console.log('[Convex Deploy] Deployment successful!');
    process.exit(0);
  } else {
    console.error('[Convex Deploy] Deployment failed with code:', code);
    process.exit(1);
  }
});

deploy.stderr.on('data', (data) => {
  console.error('[Convex Deploy] Error:', data);
});
