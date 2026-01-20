# Kapso Function Setup Guide

**Last updated:** 2026-01-20

This guide documents how to deploy functions to Kapso. Written after debugging deployment issues.

---

## Critical Rules

### 1. Function Signature (MUST follow exactly)

```javascript
async function handler(request, env) {
  // your code here
}
```

**DO NOT use:**
- `export default { async fetch(request, env) { ... } }` (Cloudflare Workers style)
- `export async function handler(...)` (no export keyword)
- `module.exports = ...` (CommonJS style)

### 2. No Long Strings

Kapso's editor wraps long lines, which **breaks string literals**. This causes silent syntax errors.

**BAD (will break):**
```javascript
return new Response(JSON.stringify({ reply: 'sorry bentar ya, ada gangguan. nanti saya kabarin lagi' }), {
```

**GOOD (safe):**
```javascript
const out = { reply: 'maaf ada gangguan' };
return new Response(JSON.stringify(out), {
```

**Rules:**
- Keep strings under 40 characters
- Use variables for longer text
- Avoid template literals with long content

### 3. Function Name Rules

- Lowercase only
- Numbers allowed
- Hyphens allowed
- **NO spaces**
- **NO uppercase**

Example: `sea-lion-reply-v1` (good), `sea-lion-reply V1` (bad)

---

## Secrets Required

Add these in the **Secrets** tab:

| Key | Value | Description |
|-----|-------|-------------|
| `SEALION_API_KEY` | (from Sea Lion) | AI API key |
| `CRM_API_URL` | `https://www.my21staff.com` | CRM base URL |
| `CRM_API_KEY` | (from Vercel env) | CRM API authentication |
| `WORKSPACE_ID` | (workspace UUID) | Which workspace to query |

---

## Working Code Template

This is the **proven working** code for Eagle's Ari bot (deployed 2026-01-20):

```javascript
async function handler(request, env) {
  const body = await request.json().catch(() => ({}));
  const msg = body.message || body.text || '';
  const phone = body.phone || body.from || '';

  const now = new Date();
  const id = new Date(now.getTime() + 25200000);
  const h = id.getUTCHours();

  let g = "malam";
  if (h >= 5 && h < 11) g = "pagi";
  else if (h >= 11 && h < 15) g = "siang";
  else if (h >= 15 && h < 18) g = "sore";

  let crm = null;
  if (phone && env.CRM_API_URL && env.CRM_API_KEY) {
    try {
      const u = env.CRM_API_URL + "/api/contacts/by-phone";
      const q = "?phone=" + phone + "&workspace_id=" + env.WORKSPACE_ID;
      const r = await fetch(u + q, {
        headers: { 'X-API-Key': env.CRM_API_KEY }
      });
      if (r.ok) crm = await r.json();
    } catch (e) {}
  }

  let hi = g + " kak";
  if (crm && crm.found && crm.contact && crm.contact.name) {
    hi = g + " kak " + crm.contact.name;
  }

  if (!msg) {
    const out = { reply: hi + ", ada yang bisa dibantu?" };
    return new Response(JSON.stringify(out), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const low = msg.toLowerCase();
  const hand = low.includes('harga') || low.includes('booking');
  if (hand) {
    const out = { reply: "oke kak, saya hubungkan ke tim ya", handover: true };
    return new Response(JSON.stringify(out), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sys = "Kamu Ari dari Eagle. Sapaan: " + hi + ". Singkat, no emoji.";
  const res = await fetch('https://api.sea-lion.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.SEALION_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'aisingapore/Gemma-SEA-LION-v4-27B-IT',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: msg }
      ],
      temperature: 0.8,
      max_tokens: 100
    })
  });

  if (!res.ok) {
    const out = { reply: 'maaf ada gangguan' };
    return new Response(JSON.stringify(out), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await res.json();
  const ai = data.choices[0].message.content || 'bentar ya';
  return new Response(JSON.stringify({ reply: ai }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## Deployment Steps

1. Go to: https://app.kapso.ai/projects/{project-id}/functions
2. Click **Edit** on the function (or **+ New Function**)
3. **Code tab**: Paste the code above
4. **Secrets tab**: Add all 4 secrets
5. Click **Save & deploy**
6. Wait for green success (no error banner)

---

## Troubleshooting

### "Must define async function handler(request, env)"

**Cause:** Wrong function format
**Fix:** Use exactly `async function handler(request, env) {` — no export, no default

### "Deployment blocked"

**Cause:** Usually a syntax error from line wrapping
**Fix:**
1. Check for red squiggly lines in the editor
2. Look for strings split across lines
3. Shorten long strings into variables

### Function deploys but doesn't respond

**Cause:** Missing secrets or wrong values
**Fix:** Verify all 4 secrets are set in Secrets tab

---

## Client-Specific Configurations

### Eagle Overseas (eagle-studenthub-bot)

- **Project ID:** `2bdca4dd-e230-4a1a-8639-68f8595defa8`
- **Function:** `sea-lion-reply-v1`
- **WORKSPACE_ID:** `25de3c4e-b9ca-4aff-9639-b35668f0a48e`
- **Persona:** Ari (intern, casual, no emoji)
- **Handover triggers:** harga, booking

---

## Adding New Clients

1. Copy the working code template
2. Update the system prompt (`sys` variable) for the new persona
3. Update `WORKSPACE_ID` in secrets
4. Adjust handover triggers as needed
5. Deploy to new function or update existing

---

*This document created after fixing deployment issues on 2026-01-20*
