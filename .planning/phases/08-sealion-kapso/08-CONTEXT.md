# Phase 8: Sea Lion + Kapso Integration

## Goal

Connect Sea Lion AI (Indonesian-focused LLM) to Kapso workflow for AI-powered WhatsApp responses.

## Background

- Sea Lion is an OpenAI-compatible API optimized for Southeast Asian languages
- Base URL: `https://api.sea-lion.ai/v1`
- Model: `aisingapore/Gemma-SEA-LION-v4-27B-IT`
- API Key: stored as Kapso secret `SEALION_API_KEY`

## Requirements

1. **Kapso Function** — Create a serverless function that:
   - Receives WhatsApp message webhook
   - Calls Sea Lion API with Indonesian system prompt
   - Returns AI-generated response

2. **Kapso Workflow** — Wire up:
   - Trigger: WhatsApp incoming message
   - Action: Call Sea Lion function
   - Response: Send reply via WhatsApp

3. **System Prompt** — Configure AI persona:
   - Bahasa Indonesia responses
   - UMKM-friendly tone
   - my21staff context awareness

## Technical Details

### Sea Lion API Call

```javascript
fetch('https://api.sea-lion.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.SEALION_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'aisingapore/Gemma-SEA-LION-v4-27B-IT',
    messages: [
      { role: 'system', content: 'Kamu adalah asisten AI...' },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1024
  })
})
```

### Kapso Function Structure

```javascript
async function handler(request, env) {
  const webhook = await request.json();
  const userMessage = webhook.message?.content || webhook.body;
  // Call Sea Lion, return response
}
```

## Success Criteria

- [ ] Kapso secret `SEALION_API_KEY` configured
- [ ] Kapso Function deployed and tested
- [ ] Workflow triggers on WhatsApp message
- [ ] AI responds in Bahasa Indonesia
- [ ] Response sent back via WhatsApp

## Dependencies

- Kapso.ai account access
- Sea Lion API key (have it)
- WhatsApp Business API via Kapso

## Notes

- Sea Lion optimized for Indonesian/Malay languages
- Consider rate limiting and error handling
- May want to add conversation history for context
