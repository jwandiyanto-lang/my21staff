#!/usr/bin/env node

const API_KEY = '92cd6a46d316b8977ee85fcd81666ba79e2e433c7f7aeddc583f5194a69f0ec2';
const PHONE_NUMBER_ID = '930016923526449';

async function checkKapsoMessages() {
  try {
    const response = await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${PHONE_NUMBER_ID}/messages?per_page=5`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error:', response.status, await response.text());
      return;
    }

    const messages = data.data || [];
    console.log('\n=== Kapso Messages ===');
    console.log(`Total messages: ${messages.length}`);

    messages.forEach((msg, i) => {
      console.log(`\n[${i + 1}] Message ID: ${msg.id}`);
      console.log(`  Direction: ${msg.kapso?.direction}`);
      console.log(`  Type: ${msg.type}`);
      console.log(`  From: ${msg.from}`);
      console.log(`  To: ${msg.to}`);
      console.log(`  Timestamp: ${msg.timestamp}`);
      console.log(`  Content:`, msg.text?.body || '[none]');
      console.log(`  Caption:`, msg.image?.caption || '[none]');
      console.log(`  Image URL:`, msg.image?.url || '[none]');
      console.log(`  Media ID:`, msg.image?.id || '[none]');
      console.log(`  Contact Name:`, msg.kapso?.contact_name || '[none]');
      console.log(`  Conversation Status:`, msg.conversation?.status);
      console.log(`  ---`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkKapsoMessages();
