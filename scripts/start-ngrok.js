#!/usr/bin/env node

/**
 * ngrok Tunnel Startup Script
 *
 * Creates a public tunnel to localhost for webhook testing.
 * This enables Kapso webhooks to reach the local development environment.
 *
 * Usage:
 *   PORT=3001 node scripts/start-ngrok.js
 *
 * Press Ctrl+C to stop the tunnel and exit cleanly.
 */

require('dotenv').config({ path: '.env.local' });

const ngrok = require('@ngrok/ngrok');

async function startTunnel() {
  const port = process.env.PORT || 3000;

  console.log('Starting ngrok tunnel...');
  console.log(`Target: localhost:${port}\n`);

  try {
    // Use forward() which returns a listener with url() method
    const listener = await ngrok.forward({
      addr: parseInt(port),
      authtoken: process.env.NGROK_AUTHTOKEN,
    });

    // Get URL - might be a string or have url() method
    const url = typeof listener === 'string' ? listener : (listener.url ? listener.url() : listener);

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
        if (listener && listener.close) {
          await listener.close();
        }
        await ngrok.disconnect();
      } catch (e) {
        // Ignore shutdown errors
      }
      console.log('Tunnel closed. Goodbye!');
      process.exit(0);
    });

    // Keep the process alive
    await new Promise(() => {});
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error.message);
    console.error('\nTroubleshooting:');
    console.error(`- Ensure localhost:${port} is running (npm run dev)`);
    console.error('- Check your internet connection');
    console.error('- Verify NGROK_AUTHTOKEN is correct');
    process.exit(1);
  }
}

startTunnel();
