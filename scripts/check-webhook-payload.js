#!/usr/bin/env node

/**
 * Check actual webhook payload from Kapso test
 */

const KAPSO_API_KEY = '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2';
const PHONE_NUMBER_ID = '930016923526449';

async function checkWebhookTest() {
  try {
    const response = await fetch('https://api.kapso.ai/meta/whatsapp/v24.0/phone_numbers', {
      method: 'GET',
      headers: {
        'X-API-Key': KAPSO_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed:', response.status);
      return;
    }

    const data = await response.json();
    const phoneNumbers = data.data || [];

    console.log('\n=== Phone Numbers from Kapso API ===');
    phoneNumbers.forEach((pn) => {
      console.log(`Phone Number ID: ${pn.id}`);
      console.log(`Display Phone: ${pn.phone_number}`);
      console.log(`Status: ${pn.status}`);
      console.log(`---`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkWebhookTest();
