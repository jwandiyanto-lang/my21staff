#!/usr/bin/env node

/**
 * Find workspace by looking in the database directly
 */

const API_KEY = '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2';
const PHONE_NUMBER_ID = '930016923526449';

async function findWorkspace() {
  try {
    const response = await fetch('https://api.kapso.ai/meta/whatsapp/v24.0/phone_numbers', {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch phone numbers:', response.status);
      return;
    }

    const data = await response.json();
    const phoneNumbers = data.data || [];

    console.log('\n=== Phone Numbers ===');
    phoneNumbers.forEach((pn, i) => {
      console.log(`[${i + 1}] ID: ${pn.id}`);
      console.log(`     Phone: ${pn.phone_number}`);
      console.log(`     Display: ${pn.display_name || pn.phone_number}`);
      console.log(`     Status: ${pn.status}`);
      console.log(`     ---`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findWorkspace();
