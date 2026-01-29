#!/usr/bin/env node

/**
 * Test Kapso API credentials
 *
 * Sends a test message to verify the API key works
 */

const PHONE_NUMBER_ID = '930016923526449'
const API_KEY = '52ec95ff42ce9db848e54c6a16fa73c3e20f50c2b0296563fd8707039fead2c8'
const TEST_PHONE = '6281574574450' // Your phone number for testing

async function testKapsoAPI() {
  console.log('=== Testing Kapso API ===\n')
  console.log(`Phone ID: ${PHONE_NUMBER_ID}`)
  console.log(`API Key: ${API_KEY.substring(0, 16)}...`)
  console.log(`Test Phone: ${TEST_PHONE}\n`)

  const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/messages`

  try {
    console.log('[Step 1] Sending test message...')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: TEST_PHONE,
        type: 'text',
        text: {
          body: 'Test message from my21staff - API key verification'
        },
      }),
    })

    const result = await response.text()
    console.log(`\nResponse Status: ${response.status}`)
    console.log(`Response Body: ${result}\n`)

    if (!response.ok) {
      console.error('✗ API call failed!')
      console.error(`Error: ${response.status} - ${result}`)
      process.exit(1)
    }

    const data = JSON.parse(result)
    console.log('✓ Message sent successfully!')
    console.log(`Message ID: ${data.messages?.[0]?.id || 'unknown'}`)

  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  }
}

testKapsoAPI()
