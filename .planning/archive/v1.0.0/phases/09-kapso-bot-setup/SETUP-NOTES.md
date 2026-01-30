# Phase 9: Kapso Bot Setup - Setup Notes

**Created:** 2026-01-19
**Status:** Partially complete - needs manual Kapso deployment

## What's Done

### CRM Side (my21staff)
- [x] Bot persona file updated (`business/bots/eagle-studenthub-bot.md`)
  - Renamed Kia → Ari
  - Pronouns: saya/kamu (polite but not formal)
  - Language mirroring (English if customer uses English)
  - Handover triggers added
- [x] Contact lookup API created (`/api/contacts/by-phone`)
- [x] CRM_API_KEY added to Vercel production
- [x] Deployed to https://www.my21staff.com

### Kapso Side (needs manual setup)
- [ ] Update `sea-lion-reply` function code
- [ ] Add secrets to function
- [ ] Save & deploy

---

## Manual Kapso Setup

### 1. Navigate to Function
- URL: https://app.kapso.ai/projects/2bdca4dd-e230-4a1a-8639-68f8595defa8/functions
- Click Edit on `sea-lion-reply`

### 2. Replace Code (Code tab)

```javascript
export default {
  async fetch(request, env) {
    const body = await request.json().catch(() => ({}));
    const userMessage = body.message || body.text || '';
    const userPhone = body.phone || body.from || '';

    // Get Indonesian time (UTC+7)
    const now = new Date();
    const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hour = indonesiaTime.getUTCHours();

    let greeting;
    if (hour >= 5 && hour < 11) greeting = "pagi";
    else if (hour >= 11 && hour < 15) greeting = "siang";
    else if (hour >= 15 && hour < 18) greeting = "sore";
    else greeting = "malam";

    // Fetch CRM context if phone available
    let crmContext = null;
    if (userPhone && env.CRM_API_URL && env.CRM_API_KEY) {
      try {
        const crmResponse = await fetch(
          `${env.CRM_API_URL}/api/contacts/by-phone?phone=${userPhone}&workspace_id=${env.WORKSPACE_ID}`,
          { headers: { 'X-API-Key': env.CRM_API_KEY } }
        );
        if (crmResponse.ok) crmContext = await crmResponse.json();
      } catch (e) { console.log('CRM lookup failed:', e); }
    }

    // Personalized greeting
    let personalizedGreeting = `${greeting} kak`;
    if (crmContext?.found && crmContext.contact?.name) {
      personalizedGreeting = `${greeting} kak ${crmContext.contact.name}`;
    }

    if (!userMessage) {
      return new Response(JSON.stringify({ reply: `${personalizedGreeting}, ada yang bisa dibantu?` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for handover triggers
    const lowerMessage = userMessage.toLowerCase();
    const needsHandover = lowerMessage.includes('konsultasi') || lowerMessage.includes('booking') ||
      lowerMessage.includes('jadwal') || lowerMessage.includes('harga') || lowerMessage.includes('biaya') ||
      lowerMessage.includes('berapa') || lowerMessage.includes('komplain') || lowerMessage.includes('kecewa');

    if (needsHandover) {
      return new Response(JSON.stringify({
        reply: `oke kak, saya connect-kan ke tim kita ya. nanti mereka yang follow up langsung`,
        handover: true,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Build system prompt
    let crmSection = '';
    if (crmContext?.found) {
      const c = crmContext.contact;
      crmSection = `\nCRM CONTEXT:\n- Nama: ${c.name || 'belum diketahui'}\n- Status: ${c.lead_status || 'new'}\n- Returning: ${c.is_returning ? 'Ya' : 'Baru'}\n`;
    }

    const systemPrompt = `Kamu adalah Ari, intern di Eagle Overseas Indonesia.
GREETING: Gunakan "${personalizedGreeting}" untuk sapaan.
${crmSection}
STYLE: Santai, singkat 1-2 kalimat, JANGAN pakai emoji, saya/kamu.
MIRROR bahasa customer (kalau English, balas English).

COMPANY: Eagle Overseas Indonesia - agen studi luar negeri, fokus karir mahasiswa.
Services: perencanaan studi, bimbingan beasiswa, review esai, persiapan IELTS/TOEFL, pendampingan visa.

FLOW: Tanya satu per satu - nama, negara tujuan, background, budget. Lalu dokumen: passport, CV, english test, ijazah.
Kalau closing, tawarkan: konsultasi 1-on-1 (berbayar) atau gabung komunitas (gratis).`;

    const response = await fetch('https://api.sea-lion.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.SEALION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'aisingapore/Gemma-SEA-LION-v4-27B-IT',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ reply: 'sorry bentar ya, ada gangguan. nanti saya kabarin lagi' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const aiReply = result.choices?.[0]?.message?.content || 'hmm bentar ya saya tanya tim dulu';

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### 3. Add Secrets (Secrets tab)

| Key | Value |
|-----|-------|
| `SEALION_API_KEY` | (existing - check if already there) |
| `CRM_API_URL` | `https://www.my21staff.com` |
| `CRM_API_KEY` | `c2950f47951e03a9a291c0493b17c0780f8a185e560d86dd1ee7814d2cd8a5e6` |
| `WORKSPACE_ID` | `25de3c4e-b9ca-4aff-9639-b35668f0a48e` |

### 4. Save & Deploy

---

## Verification Checklist

**Test only with Jonathan Fransisco's number**

### Basic Response
- [ ] Send "halo" → Ari responds with time-appropriate greeting (pagi/siang/sore/malam kak)
- [ ] Response uses saya/kamu pronouns (not aku/kamu)
- [ ] Response is short (1-2 sentences)
- [ ] No emojis in response

### CRM Integration
- [ ] If contact exists in CRM with name → Greeting includes name ("pagi kak [nama]")
- [ ] If new contact → Generic greeting ("pagi kak")

### Language Mirroring
- [ ] Send message in English → Ari responds in English
- [ ] Send message in Bahasa → Ari responds in Bahasa

### Handover Triggers
- [ ] Send "berapa harga konsultasi?" → Ari hands over to team
- [ ] Send "mau booking jadwal" → Ari hands over to team
- [ ] Send "saya kecewa dengan pelayanan" → Ari hands over to team

### Conversation Flow
- [ ] Ari asks questions one at a time (not listing multiple questions)
- [ ] Ari follows flow: intro → documents → closing

---

## Environment Variables

### Vercel (my21staff)
- `CRM_API_KEY` = `c2950f47951e03a9a291c0493b17c0780f8a185e560d86dd1ee7814d2cd8a5e6`

### Kapso (sea-lion-reply function)
- `SEALION_API_KEY` = (existing)
- `CRM_API_URL` = `https://www.my21staff.com`
- `CRM_API_KEY` = `c2950f47951e03a9a291c0493b17c0780f8a185e560d86dd1ee7814d2cd8a5e6`
- `WORKSPACE_ID` = `25de3c4e-b9ca-4aff-9639-b35668f0a48e`

---

*Last updated: 2026-01-19*
