# Sarah Chat Bot - Kapso Dashboard Setup Guide

**Status:** BLOCKED - Kapso API authentication failing
**Workaround:** Manual setup via Kapso Dashboard

---

## Authentication Issue

```bash
$ curl -X GET "https://api.kapso.ai/platform/v1/workflows?project_id=..." \
  -H "Authorization: Bearer 1bbfd45e..."

{"error":"Invalid or missing API key"}
```

**Both API keys tried:**
- `da99e74e...` (from Phase 2)
- `1bbfd45e...` (current, updated 2026-01-30)

**Status:** Direct HTTP API calls are blocked. Must use Kapso Dashboard for workflow creation.

---

## Prerequisites

Before starting, ensure you have:

1. **Gemini API Key**
   - Get from: https://aistudio.google.com/apikey
   - Add to Kapso: Settings → Secrets → `GEMINI_API_KEY`

2. **Convex Endpoints Ready**
   - ✅ GET `/sarah/state?contact_phone={phone}`
   - ✅ POST `/sarah/state` (body: conversation state)
   - Deployment URL: `https://intent-otter-212.convex.cloud`

3. **Kapso Dashboard Access**
   - Project: my21staff
   - Project ID: `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`

---

## Workflow Overview

```
[Inbound Message Trigger]
         ↓
[Function: Get State from Convex]
         ↓
[Function: Check Keywords]
         ↓
    [Decide Node]
    ┌────┴────────┬──────────┐
    ↓             ↓          ↓
[Handoff]   [Not Interest]  [Sarah Agent (Gemini)]
    ↓             ↓          ↓
[Mark State] [Mark State]   [Extract & Score]
                             ↓
                        [Determine State]
                             ↓
                        [Save to Convex]
```

---

## Step-by-Step Setup

### Step 1: Create New Workflow

1. Go to Kapso Dashboard → Workflows
2. Click "Create Workflow"
3. Name: **Sarah Chat Bot**
4. Description: **AI-powered lead qualification with Gemini 2.5 Flash**
5. Trigger: **Inbound WhatsApp Message**
6. Phone Config: Select `+62 813-1859-025`

### Step 2: Add Environment Variables

In workflow settings, add:
- `CONVEX_DEPLOYMENT_URL` = `https://intent-otter-212.convex.cloud`

### Step 3: Add Function Node - Get State

**Node Name:** Get Conversation State from Convex

**Runtime:** Node.js 20.x

**Timeout:** 10 seconds

**Code:**
```javascript
async function get_state({ trigger, vars, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  try {
    const response = await fetch(`${convexUrl}/sarah/state?contact_phone=${encodeURIComponent(phone)}`);
    const state = await response.json();

    return {
      state: state.state || 'greeting',
      extracted_data: state.extracted_data || {},
      lead_score: state.lead_score || 0,
      lead_temperature: state.lead_temperature || 'cold',
      language: state.language || 'id',
      message_count: state.message_count || 0
    };
  } catch (error) {
    console.error('Failed to get state:', error);
    // Default state for new conversations
    return {
      state: 'greeting',
      extracted_data: {},
      lead_score: 0,
      lead_temperature: 'cold',
      language: 'id',
      message_count: 0
    };
  }
}
```

**Connect to:** Check Keywords node

---

### Step 4: Add Function Node - Check Keywords

**Node Name:** Check for Handoff/Price Keywords

**Runtime:** Node.js 20.x

**Timeout:** 5 seconds

**Code:**
```javascript
async function check_keywords({ trigger, vars, env }) {
  const message = (trigger.message.content || '').toLowerCase();

  // Handoff triggers
  const handoffKeywords = ['human', 'manusia', 'person', 'sales', 'consultant', 'talk to someone', 'operator', 'cs', 'customer service'];
  const wantsHandoff = handoffKeywords.some(k => message.includes(k));

  // Price question detection
  const priceKeywords = ['harga', 'price', 'biaya', 'berapa', 'cost', 'pricing', 'fee'];
  const askingPrice = priceKeywords.some(k => message.includes(k));

  // Not interested detection
  const notInterestedKeywords = ['not interested', 'tidak tertarik', 'no thanks', 'ga jadi', 'nggak dulu'];
  const notInterested = notInterestedKeywords.some(k => message.includes(k));

  return {
    wants_handoff: wantsHandoff,
    asking_price: askingPrice,
    not_interested: notInterested,
    is_image: trigger.message.type === 'image'
  };
}
```

**Connect to:** Decide node

---

### Step 5: Add Decide Node - Route Decision

**Node Name:** Route to Handoff or Sarah

**Type:** Condition-based decision

**Conditions:**
1. **Handoff:** `{{nodes.check_keywords.wants_handoff}} === true` → Go to "Send Handoff Message"
2. **Not Interested:** `{{nodes.check_keywords.not_interested}} === true` → Go to "Send Not Interested Message"
3. **Continue:** `true` (default) → Go to "Sarah Agent"

---

### Step 6: Add Send Text Node - Handoff Message

**Node Name:** Send Handoff Message

**Message:**
```
Siap! Saya hubungkan ke konsultan kami ya. Mereka akan segera menghubungi kakak.
```

**Connect to:** Mark Handoff State function

---

### Step 7: Add Function Node - Mark Handoff State

**Code:**
```javascript
async function mark_handoff({ trigger, nodes, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  await fetch(`${convexUrl}/sarah/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_phone: phone,
      state: 'handoff',
      lead_score: nodes.get_state.lead_score,
      lead_temperature: 'hot',
      extracted_data: nodes.get_state.extracted_data,
      language: nodes.get_state.language,
      message_count: nodes.get_state.message_count + 1
    })
  });

  return { saved: true };
}
```

---

### Step 8: Add Send Text Node - Not Interested Message

**Message:**
```
Oke siap, ga masalah. Kalau suatu saat butuh bantuan, langsung chat aja ya!
```

**Connect to:** Mark Completed State function

---

### Step 9: Add Function Node - Mark Completed State

**Code:**
```javascript
async function mark_completed({ trigger, nodes, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  await fetch(`${convexUrl}/sarah/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_phone: phone,
      state: 'completed',
      lead_score: nodes.get_state.lead_score,
      lead_temperature: 'cold',
      extracted_data: nodes.get_state.extracted_data,
      language: nodes.get_state.language,
      message_count: nodes.get_state.message_count + 1
    })
  });

  return { saved: true };
}
```

---

### Step 10: Add Agent Node - Sarah (Gemini 2.5 Flash)

**Node Name:** Sarah (Gemini 2.5 Flash)

**Provider Model:** Google Gemini 2.5 Flash

**Temperature:** 0.7

**Max Tokens:** 150

**API Key:** `{{secrets.GEMINI_API_KEY}}` (must be added to Kapso Secrets first)

**System Prompt:**
```
You are Sarah, a friendly AI assistant for my21staff - a WhatsApp CRM for Indonesian SMEs.

PERSONALITY:
- Warm, helpful, like chatting with a knowledgeable friend
- Indonesian by default (casual: Halo, Hai, Sip, Kakak)
- Switch to English if user messages in English
- Professional but casual - like a capable intern
- Not pushy or salesy - genuinely want to understand and help

MESSAGE RULES:
- Keep responses under 140 characters (WhatsApp best practice)
- Maximum 1-2 emoji per message (sparingly)
- ONE question per message - wait for response before asking next
- Show empathy: "Wah paham banget..." "Betul tuh..."

CURRENT STATE: {{nodes.get_state.state}}
EXTRACTED DATA: {{nodes.get_state.extracted_data}}
LANGUAGE: {{nodes.get_state.language}}
IS IMAGE: {{nodes.check_keywords.is_image}}

Based on the state, respond appropriately:

**greeting state:**
- Use time-based greeting (Selamat pagi/siang/sore/malam based on time)
- Introduce yourself: "Saya Sarah dari my21staff."
- Ask ONE open question: "Bisnis kakak ngelola sendiri atau ada team ya?"

**qualifying state:**
Ask for the NEXT missing field in this order:
1. Name: "Boleh tau nama siapa?"
2. Business type: "Bisnisnya di bidang apa kak?"
3. Team size: "Kalau handle chat/CS, tim ada berapa orang?"
4. Pain points: "Ada nggak challenge yang sering ketemu? Misal slow response, miss message, dll?"
5. Goals: "Terus harapannya apa sih pakai layanan kita?"

Only ask for missing fields. If field exists in EXTRACTED DATA, skip it.

**scoring state:**
- Answer any questions helpfully (1-2 sentences max)
- Stay conversational and friendly
- Don't push for more data

**handoff state:**
- Say: "Sip! Data sudah lengkap. Konsultan kami akan segera hubungi kakak ya."

**completed state:**
- Say goodbye warmly: "Terima kasih sudah chat! Kalau ada yang mau ditanyakan lagi, langsung aja ya."

SPECIAL CASES:

**If IS_IMAGE is true:**
- Acknowledge: "Sip, saya terima fotonya."
- If it looks like a product: "Produknya keren! Bisnisnya jualan apa kak?"
- Continue the qualifying flow

**If user asks about PRICE:**
- NEVER give specific prices
- Say: "Untuk harga, nanti konsultan kita yang jelasin lebih detail ya kak."
- Continue conversation

**Language detection:**
- If user writes in English, switch to English
- Keep same friendly tone in English
- Update language preference for future messages
```

**Enabled Tools:**
- send_notification_to_user
- get_current_datetime

**Connect to:** Extract and Score function

---

### Step 11: Add Function Node - Extract and Score

**Node Name:** Extract Data and Calculate Lead Score

**Runtime:** Node.js 20.x

**Timeout:** 10 seconds

**Code:** (See `sarah-workflow-spec.json` - extract_and_score function)

**Connect to:** Determine State function

---

### Step 12: Add Function Node - Determine State

**Node Name:** Determine Next State

**Code:** (See `sarah-workflow-spec.json` - determine_state function)

**Connect to:** Save State function

---

### Step 13: Add Function Node - Save State

**Node Name:** Save State to Convex

**Code:** (See `sarah-workflow-spec.json` - save_state function)

---

## Testing

### Test 1: New Conversation

1. Send WhatsApp message: "Halo"
2. Expected: Sarah greets in Indonesian, asks about business
3. Verify: State saved to Convex as "qualifying"

### Test 2: Handoff Keyword

1. Send: "I want to talk to a human"
2. Expected: Immediate handoff message
3. Verify: State changed to "handoff" in Convex

### Test 3: Price Question

1. Send: "Berapa harganya?"
2. Expected: Sarah deflects to consultant
3. Verify: Flow continues (not terminated)

### Test 4: Image Message

1. Send an image
2. Expected: Sarah acknowledges image, continues conversation
3. Verify: Flow doesn't break

### Test 5: Full Qualification Flow

1. Send: "Halo"
2. Provide: name, business, team size, pain points, goals
3. Expected: State transitions greeting → qualifying → scoring
4. Verify: Lead score calculated, data extracted correctly

---

## Integration with Rules Engine

After Sarah workflow is complete and tested:

1. Go to existing "Rules Engine - Keyword Triggers" workflow
2. Find the "ai_fallback" decision path
3. Change it to call "Sarah Chat Bot" workflow instead of generic Agent
4. This creates the flow: Rules Engine (keyword check) → Sarah (conversational AI)

---

## Troubleshooting

### Agent not responding
- Check GEMINI_API_KEY is added to Kapso Secrets
- Verify API key is valid at https://aistudio.google.com/apikey

### State not saving
- Check Convex deployment URL is correct
- Test Convex endpoint directly: `curl https://intent-otter-212.convex.cloud/sarah/state?contact_phone=+1234567890`

### Messages too long
- Verify max_tokens is set to 150
- Check system prompt emphasizes 140 character limit

### Wrong language
- Language detection happens in save_state function
- Check trigger.message.content is being analyzed correctly

---

## Next Steps

After manual setup is complete:

1. Test all flows thoroughly
2. Monitor first 10 real conversations
3. Adjust prompts based on actual user responses
4. Add more edge case handling if needed
5. Connect to Rules Engine workflow

**Documentation:** All workflow configuration is in `sarah-workflow-spec.json` for reference.
