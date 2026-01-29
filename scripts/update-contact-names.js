#!/usr/bin/env node
const { ConvexHttpClient } = require('convex/browser')
const { api } = require('../convex/_generated/api.js')

const CONVEX_URL = 'https://intent-otter-212.convex.cloud'
const WORKSPACE_ID = 'js7b1cwpdpadcgds1cr8dqw7dh7zv3a3'
const KAPSO_API_KEY = process.env.KAPSO_API_KEY || 'sk-proj-KQPbH19fUqz2HhtzW_7r70RLkA3YNdqnEhYxw8JGLfSN2EtuwrRVi9vYfLRuEzmrQDDjNnPUOQ'
const PROJECT_ID = '2bdca4dd-e230-4a1a-8639-68f8595defa8'
const PHONE_NUMBER_ID = '930016923526449'

async function main() {
  console.log('=== Update Contact Names from Kapso ===\n')

  const convex = new ConvexHttpClient(CONVEX_URL)

  // Fetch conversations from Kapso API
  console.log('[Step 1] Fetching conversations from Kapso...')
  const response = await fetch(
    `https://api.kapso.ai/platform/v1/whatsapp/conversations?phone_number_id=${PHONE_NUMBER_ID}&per_page=100`,
    {
      headers: {
        'X-API-Key': KAPSO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Kapso API error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  const conversations = data.data || []
  console.log(`✓ Found ${conversations.length} conversations\n`)

  // Update each contact
  console.log('[Step 2] Updating contact names in Convex...\n')
  let updated = 0
  let skipped = 0

  for (const conv of conversations) {
    const phone = conv.phone_number.replace(/\D/g, '')
    const contactName = conv.kapso?.contact_name || null

    if (!contactName) {
      console.log(`⊘ ${phone} - no name in Kapso`)
      skipped++
      continue
    }

    try {
      await convex.mutation(api.admin.syncKapsoConversation, {
        workspace_id: WORKSPACE_ID,
        conversation: conv,
        messages: [],
      })

      console.log(`✓ ${phone} → ${contactName}`)
      updated++
    } catch (error) {
      console.log(`✗ ${phone} - ${error.message}`)
    }
  }

  console.log(`\n=== Complete ===`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${conversations.length}`)
}

main().catch(console.error)
