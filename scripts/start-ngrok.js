#!/usr/bin/env node

/**
 * ngrok Tunnel Startup Script
 *
 * Creates a public tunnel to localhost:3000 for webhook testing.
 * This enables Kapso webhooks to reach the local development environment.
 *
 * Usage:
 *   node scripts/start-ngrok.js
 *
 * Press Ctrl+C to stop the tunnel and exit cleanly.
 */

const ngrok = require('ngrok');

async function startTunnel() {
  try {
    console.log('Starting ngrok tunnel...\n');

    // Connect ngrok to localhost:3000
    const url = await ngrok.connect({
      addr: 3000,
      proto: 'http',
    });

    console.log('=====================================');
    console.log('NGROK TUNNEL ACTIVE');
    console.log('=====================================\n');

    console.log('Public URL:');
    console.log(`  ${url}\n`);

    console.log('Webhook Configuration:');
    console.log(`  Update Kapso webhook to: ${url}/api/webhook/kapso\n`);

    console.log('=====================================\n');
    console.log('Press Ctrl+C to stop the tunnel and exit.\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down tunnel...');
      try {
        await ngrok.disconnect();
        await ngrok.kill();
        console.log('Tunnel closed. Goodbye!');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Ensure localhost:3000 is running (npm run dev)');
    console.error('- Check your internet connection');
    console.error('- Try again in a few seconds if rate limited');
    process.exit(1);
  }
}

// Start the tunnel
startTunnel();
