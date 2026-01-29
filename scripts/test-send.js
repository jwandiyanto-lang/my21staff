#!/usr/bin/env node

const PHONE_NUMBER_ID = '930016923526449'
const API_KEY = '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2'
const TEST_PHONE = '6281574574450'

async function testSend() {
  console.log('Testing message send with API key:', API_KEY.substring(0, 16) + '...\n')

  const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/messages`

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
      text: { body: 'Test from my21staff - verifying API key' },
    }),
  })

  const result = await response.text()
  console.log('Status:', response.status)
  console.log('Response:', result)

  if (response.ok) {
    console.log('\n✓ SUCCESS! Message sent.')
  } else {
    console.log('\n✗ FAILED! API key still invalid.')
  }
}

testSend()
