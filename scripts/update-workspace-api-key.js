#!/usr/bin/env node

/**
 * Update workspace Kapso API key
 *
 * This script updates the meta_access_token for the workspace to fix
 * the 401 error when sending messages.
 */

const { ConvexHttpClient } = require('convex/browser')
const { api } = require('../convex/_generated/api.js')

const CONVEX_URL = 'https://intent-otter-212.convex.cloud'
const WORKSPACE_ID = 'js7b1cwpdpadcgds1cr8dqw7dh7zv3a3'
const NEW_API_KEY = '52ec95ff42ce9db848e54c6a16fa73c3e20f50c2b0296563fd8707039fead2c8'

async function main() {
  console.log('=== Update Workspace API Key ===\n')
  console.log(`Workspace ID: ${WORKSPACE_ID}`)
  console.log(`New API Key: ${NEW_API_KEY.substring(0, 16)}...\n`)

  const convex = new ConvexHttpClient(CONVEX_URL)

  try {
    console.log('[Step 1] Updating workspace Kapso credentials...')

    await convex.mutation(api.workspaces.updateKapsoCredentials, {
      workspace_id: WORKSPACE_ID,
      meta_access_token: NEW_API_KEY,
    })

    console.log('✓ Workspace API key updated successfully!\n')
    console.log('=== Complete ===')
    console.log('You can now send messages through the inbox.')
  } catch (error) {
    console.error('✗ Error updating workspace:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
