# Eagle Overseas Bot - Simple Guide

**Date:** 2026-01-29
**Purpose:** Simple explanation of bot persona, conversation flow, and implementation

---

## 1. Bot Persona & Technical Setup

### Who is ARI?

**Name:** ARI
**Role:** Virtual education consultant for Eagle Overseas
**Language:** Bahasa Indonesia (casual, friendly)
**Tone:** Supportive + Clear + Encouraging

**Communication Rules:**
- ✅ Short messages (1-2 sentences)
- ✅ NO emojis
- ✅ Casual language ("saya/kamu" not formal)
- ✅ Mirror customer's language

**Example:** *"Siang kak! Wah tertarik kuliah di luar negeri ya? Udah isi form kita belum?"*

---

### Technical Setup

**AI Model:**
- Primary: **Grok** (via xAI API)
- Alternative: **Sea-Lion** (local via Ollama)
- Selection: 50/50 A/B testing (deterministic by contact ID)

**Kapso Connection:**
```
Webhook: POST /api/webhook/kapso
↓
Process message → Check if AI enabled
↓
If enabled → Call ARI bot
↓
Generate response → Send via Kapso API
↓
Store in database
```

**Kapso Phone Number:** Eagle Overseas WhatsApp Business Number
**Workspace ID:** `js7b1cwpdpadcgds1cr8dqw7dh7zv3a3`

---

## 2. How ARI Talks to Clients (4 Main Stages)

### Stage 1: GREETING
**Goal:** Greet warmly and wait for their question

**Greeting Formula:**
```
{time_of_day} kak {name}! Gimana kabarnya?
```

**Examples:**
```
Morning (00:00-11:59):   "Pagi kak Sarah! Gimana kabarnya?"
Afternoon (12:00-17:59): "Siang kak Sarah! Gimana kabarnya?"
Evening (18:00-23:59):   "Malam kak Sarah! Gimana kabarnya?"

Without name:            "Siang kak! Gimana kabarnya?"
```

**Handling Responses:**
- ❌ **Short/Generic** ("Hi", "Halo", "Test", < 3 words) → **Repeat greeting**
- ❌ **Inappropriate** content → **Repeat greeting**
- ✅ **Real question** → **Go to Stage 2**

**Example:**
```
Customer: "Halo"
ARI: "Siang kak! Gimana kabarnya?" (repeats)

Customer: "Mau tanya soal kuliah di Australia"
ARI: (proceeds to Stage 2)
```

---

### Stage 2: DOCUMENTS + AGE + IELTS → ASK QUESTIONS
**Goal:** Collect qualification data (documents, age, IELTS), then ask if they have questions

**Complete Flow:**
```
Customer: "Mau tanya soal kuliah di Australia"

ARI: "Untuk kuliah di Australia ya. Biar aku bisa kasih info yang tepat,
      dokumen apa aja yang udah kamu siapkan?

      - Passport
      - CV/Resume
      - Transkrip/Ijazah
      - Sertifikat Bahasa Inggris (IELTS/TOEFL)"

Customer: "Udah ada passport, CV, transkrip, sama IELTS"

ARI: "Oke kak, dan untuk sekarang usia nya berapa?"

Customer: "22 tahun"

ARI: "Baik kak, dan untuk IELTS score nya berapa?"

Customer: "6.5"

ARI: "Oke kak, sejauh ini ada yang mau di tanyakan?"

→ Segway to Stage 3 (Q&A + Consultation)
```

**If they don't have IELTS:**
```
Customer: "Udah ada passport sama CV aja"

ARI: "Oke kak, dan untuk sekarang usia nya berapa?"

Customer: "25 tahun"

ARI: "Baik kak, sejauh ini ada yang mau di tanyakan?"

→ Skip IELTS question, proceed to Stage 3
```

**Important Rules:**
- ✅ Always acknowledge their response first (use variations: "Baik kak", "Oke kak", "Siap kak")
- ✅ Ask age after documents
- ✅ Ask IELTS score only if they mentioned having IELTS
- ✅ End with: "Baik/Oke kak, sejauh ini ada yang mau di tanyakan?"
- ❌ Never use "Wah lengkap!" or excited responses (feels robotic)

**Document List:**
```typescript
documents: [
  "Passport",
  "CV/Resume",
  "Transkrip/Ijazah",
  "Sertifikat Bahasa Inggris (IELTS/TOEFL)"
]
```

**Data Collected:**
- Documents (array)
- Age (number)
- IELTS score (number, optional)

**Next:** Always ask "sejauh ini ada yang mau di tanyakan?" → Stage 3

---

### Stage 3: Q&A + CONSULTATION OFFER (STEP BY STEP)
**Goal:** Answer questions, share program template, offer 1-on-1 consultation

**When they ask about universities/programs:**
```
Customer: "Universitas mana yang bagus?"
          "Program apa yang cocok buat saya?"

ARI: "Oh ya kak untuk itu saya izin share ya"

(Sends formatted template):

1️⃣ FRESH GRAD / GAP YEAR (Usia 18 - 24)
Status: Lulusan SMA/Kuliah baru
Rekomendasi: Cert III/IV atau Diploma
Modal Awal: ± IDR 200 Juta
Fokus: Eksplorasi skill baru / Gap Year

2️⃣ YOUNG PRO (Usia 25 - 35)
Status: Pengalaman kerja 2-5 tahun
Rekomendasi: Adv. Diploma / Graduate Diploma
Modal Awal: ± IDR 300 Juta
Fokus: Career Upgrade / Upskilling (Wajib linier dengan kerjaan)

3️⃣ MATURE / EXECUTIVE (Usia 36 - 50)
Status: Senior level / Business Owner
Rekomendasi: Specialized Management / Leadership
Modal Awal: ± IDR 350 - 400 Juta
Fokus: Strategic Leadership (Dokumen GTE/SOP harus sangat kuat)

⚠️ NOTE: Semua kategori di atas Wajib POF Rp 450 Juta dan
saat ini belum bisa membawa pasangan di awal.
```

**After answering questions, offer consultation (step by step):**
```
Step 1: Answer their question → WAIT
Step 2: "Oke kak, untuk detail nya saya saranin konsultasi 1 on 1, sudah pernah dengar sebelumnya?" → WAIT
Step 3A: If NO → Explain pricing + benefits → WAIT
Step 3B: If YES → "Oh udah tau ya. Tertarik untuk coba kak?" → WAIT
Step 4: Customer responds YES or NO
```

**Customer response options:**
```
Customer: "Oke boleh" / "Tertarik"
ARI: → Ask schedule → Handoff (QUALIFIED LEAD)

Customer: "Mahal ya" / "Nggak dulu deh"
ARI: → Polite close → Handoff (NOT QUALITY)
```

**Complete Stage 3 Flow (WhatsApp Format - No Lists):**

**Step 1: Share template → WAIT**
```
Customer: "Universitas mana yang bagus?"
ARI: "Oh ya kak untuk itu saya izin share ya"
     (Sends formatted template with 3 age tiers)
→ WAIT for response
```

**Step 2A: If they just nod/acknowledge**
```
Customer: "Oke", "Terima kasih", "Wah lengkap"
ARI: "Gimana kak mana yang cocok?"
→ WAIT for them to ask a question
```

**Step 2B: If they ask a question**
```
Customer: "Berapa lama prosesnya?" / "IELTS minimal berapa?"
ARI: "Proses biasanya 3-6 bulan kak dari apply sampai visa keluar."
→ WAIT for response

Customer: "Oh gitu" / "Oke"
ARI: "Oke kak, untuk detail nya saya saranin konsultasi 1 on 1, sudah pernah dengar sebelumnya?"
→ WAIT for response
```

**Step 3A: If they haven't heard about consultation**
```
Customer: "Belum" / "Apa itu?"
ARI: "Untuk konsultasi kita itu berbayar 500k selama satu jam dan kakak akan dapatkan profile evaluation supaya tau kekuatan kakak dan peluang yang cocok, guidance untuk visa sama sertifikasi yang dibutuhin, optimasi CV dan LinkedIn biar lebih menarik, sama career roadmap yang jelas untuk kuliah di luar negeri. Tertarik kak?"
→ WAIT for response
```

**Step 3B: If they already know about consultation**
```
Customer: "Udah pernah dengar"
ARI: "Oh udah tau ya. Tertarik untuk coba kak?"
→ WAIT for response
```

**Step 4A: If YES to consultation**
```
Customer: "Oke boleh" / "Tertarik"
ARI: "Okay kak, kira kira kakak kosong hari apa?"
→ FLAG FOR HANDOFF with note: "QUALIFIED LEAD - Interested in consultation"
→ Human consultant takes over immediately
```

**Step 4B: If NO to consultation**
```
Customer: "Nggak dulu deh" / "Mahal" / "Belum tertarik"
ARI: "Baik kak nanti kalau ada yang mau di tanyakan lagi boleh di sesi kita ya"
→ DONE
→ FLAG FOR HANDOFF with note: "NOT QUALITY - Declined consultation"
→ Human can review but marked as low priority
```

**Stage 3 Parameters:**
```typescript
stage3_config: {
  program_template: `1️⃣ FRESH GRAD / GAP YEAR (Usia 18 - 24)...`,
  triggers: ["universitas", "program", "rekomendasi", "cocok", "jurusan"],
  consultation_price: "500k",
  consultation_intro: "Oke kak, untuk detail nya saya saranin konsultasi 1 on 1, sudah pernah dengar sebelumnya?",
  consultation_benefits: "Untuk konsultasi kita itu berbayar 500k selama satu jam dan kakak akan dapatkan profile evaluation supaya tau kekuatan kakak dan peluang yang cocok, guidance untuk visa sama sertifikasi yang dibutuhin, optimasi CV dan LinkedIn biar lebih menarik, sama career roadmap yang jelas untuk kuliah di luar negeri. Tertarik kak?",
  consultation_followup: "Oh udah tau ya. Tertarik untuk coba kak?",
  handoff_yes: "Okay kak, kira kira kakak kosong hari apa?",
  handoff_no: "Baik kak nanti kalau ada yang mau di tanyakan lagi boleh di sesi kita ya",
  handoff_note_qualified: "QUALIFIED LEAD - Interested in consultation",
  handoff_note_not_quality: "NOT QUALITY - Declined consultation"
}
```

**What happens:**
- If YES to consultation → Flag handoff as "QUALIFIED LEAD" (human takes over)
- If NO to consultation → Flag handoff as "NOT QUALITY" (low priority review)

---

### Stage 4: HANDOFF (Route to Human)
**Goal:** Hand over to human consultant with proper tagging

**Scenario A: QUALIFIED LEAD (Interested in Consultation)**
```
Customer: "Oke boleh" / "Tertarik"
ARI: "Okay kak, kira kira kakak kosong hari apa?"

What happens:
- Set conversation status = "handover"
- Tag contact with note: "QUALIFIED LEAD - Interested in consultation"
- Mark lead_status = "hot"
- Stop bot responses
- Human consultant takes over immediately
```

**Scenario B: NOT QUALITY (Declined Consultation)**
```
Customer: "Nggak dulu deh" / "Mahal" / "Belum tertarik"
ARI: "Baik kak nanti kalau ada yang mau di tanyakan lagi boleh di sesi kita ya"

What happens:
- Set conversation status = "handover"
- Tag contact with note: "NOT QUALITY - Declined consultation"
- Mark lead_status = "warm" (low priority)
- Stop bot responses
- Human can review but marked as low priority
```

---

## 3. Implementation Steps

### Prerequisites
- ✅ Kapso account with WhatsApp Business API access
- ✅ Eagle Overseas phone number connected to Kapso
- ✅ Grok API key (xAI) or Ollama setup for Sea-Lion
- ✅ Convex database deployed

---

### Step 1: Update Database Schema
Add extended context fields to `ariConversations` table:

```typescript
// In convex/schema.ts
context: v.optional(v.any()) // Will store:
{
  qualification: {
    age: number,
    documents: string[],
    documentCount: number,
    isQualified: boolean,
    qualifiedReason: string
  },
  sales: {
    questionsAnswered: number,
    qaHistory: [...],
    consultationOffered: boolean,
    consultationInterest: boolean,
    objection: string,
    objectionDetails: string,
    circleBackAttempts: number
  },
  analytics: {
    stateTransitions: string[],
    finalOutcome: 'handoff' | 'community' | 'disengaged'
  }
}
```

---

### Step 2: Create Helper Functions
In `convex/ai/context.ts`:

```typescript
// Qualification logic
export function evaluateQualification(context) {
  const { age, documents } = context.qualification;

  // Highly qualified criteria
  if (age <= 25 && documents.length >= 4) {
    return { qualified: true, reason: 'all_docs_young_age' };
  }

  if (documents.includes('english_cert') && documents.length >= 2) {
    return { qualified: true, reason: 'english_plus_two' };
  }

  return { qualified: false, reason: 'not_qualified' };
}

// Objection handling
export function canOvercomeObjection(objection: string): boolean {
  const canOvercome = ['price', 'timing', 'not_ready', 'need_info'];
  return canOvercome.includes(objection);
}
```

---

### Step 3: Create State-Specific Prompts
In `convex/ai/mouth.ts`, add prompts for each stage:

```typescript
const STATE_PROMPTS = {
  greeting: `Kamu ARI, asisten Eagle Overseas. Sapa hangat dan tanyakan
             "Udah isi form kita belum?"`,

  qualification: `Tanya umur dan dokumen yang udah disiapkan. List:
                  Passport, CV, Transkrip, IELTS. Singkat dan jelas.`,

  q_and_a: `Jawab pertanyaan seputar universitas. Setelah 1-2 pertanyaan,
            tawarkan konsultasi gratis. Jangan pushy.`,

  objection_handling: `Tangkap alasan kenapa nggak mau konsultasi.
                       Tawarkan komunitas. Tetap ramah dan respect pilihan mereka.`,

  circle_back: `Coba SATU kali lagi dengan gentle. Jelaskan value konsultasi gratis.
                Kalau tetap no, terima dengan baik.`,

  handoff: `Bilang "Konsultan kita bakal hubungi sebentar lagi". STOP responding.`,

  community_fallback: `Kirim link komunitas, ucapkan good luck. END dengan positif.`
};
```

---

### Step 4: Create Mutations
In `convex/ari.ts`:

```typescript
// 1. Store qualification data
export const updateQualificationData = mutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    age: v.number(),
    documents: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // Evaluate if qualified
    // Update context
    // Return next state
  }
});

// 2. Track Q&A and offer consultation
export const trackQAAndOfferConsultation = mutation({...});

// 3. Capture objection
export const captureObjection = mutation({...});

// 4. Handle circle back
export const handleCircleBack = mutation({...});

// 5. Mark for handoff
export const markForHandoff = mutation({...});
```

---

### Step 5: Update Kapso Webhook Handler
In `src/app/api/webhook/kapso/route.ts`:

```typescript
// After receiving message:
1. Normalize phone number
2. Find/create contact
3. Get/create ariConversation
4. Load conversation history
5. Build system prompt based on current state
6. Call AI model (Grok or Sea-Lion)
7. Parse response & extract data (age, documents, objection, etc.)
8. Update ariConversation context
9. Determine next state
10. Send response via Kapso
11. Update conversation state
```

---

### Step 6: Configure Bot
Run setup script:

```bash
npx tsx scripts/setup-eagle-bot.ts
```

This configures:
- Bot name: ARI
- Style: casual
- Language: Bahasa Indonesia
- Tone: supportive + clear + encouraging
- Community link

---

### Step 7: Seed Knowledge Base (Optional but Recommended)
Create FAQ entries in database:

**Topics:**
- Services (consultation, pricing, timeline)
- Universities (which countries, programs, rankings)
- Requirements (documents, IELTS, GPA)
- Process (how long, success rate)

---

### Step 8: Test the Bot

**Test Scenarios:**

1. **Highly Qualified Path:**
   ```
   User: "Halo"
   Bot: [Greeting]
   User: "Umur 22, ada passport, CV, transkrip, IELTS"
   Bot: [Qualification → Handoff immediately]
   Expected: Bot marks as hot lead, stops responding
   ```

2. **Standard Path with Consultation Yes:**
   ```
   User: "Halo"
   Bot: [Greeting]
   User: "Umur 24, ada passport sama CV"
   Bot: [Q&A stage]
   User: "Berapa biayanya?"
   Bot: [Answers, offers consultation]
   User: "Oke boleh"
   Bot: [Handoff]
   Expected: Consultant gets notification
   ```

3. **Objection Path:**
   ```
   User: "Halo"
   Bot: [Greeting]
   User: "23 tahun, punya passport"
   Bot: [Q&A stage]
   Bot: [Offers consultation]
   User: "Nggak dulu deh"
   Bot: [Captures objection, offers community]
   User: "Mahal soalnya"
   Bot: [Circle back once]
   User: "Tetap nggak mau"
   Bot: [Community link, goodbye]
   Expected: Objection logged, community link sent
   ```

---

### Step 9: Monitor & Iterate

**Check daily:**
- How many conversations started?
- How many qualified handoffs?
- What are the common objections?

**Adjust based on data:**
- If too many "price" objections → Consider payment plans
- If too many "timing" objections → Create urgency campaigns
- If low qualification rate → Adjust criteria

---

## Quick Reference

### Bot Flow Diagram
```
greeting → qualification → q_and_a
                              ├─ (yes to consultation) → handoff (QUALIFIED) ✅
                              └─ (no to consultation) → handoff (NOT QUALITY) 🔶
```

### Key Files
- **Strategy:** `business/integration/BOT-STRATEGY.md`
- **Implementation Plan:** `business/integration/BOT-IMPLEMENTATION-PLAN.md`
- **Technical Journey:** `business/clients/eagle/eagle-ari-journey.md`
- **Setup Script:** `scripts/setup-eagle-bot.ts`

### Key Metrics
- **Qualified Lead Rate Target:** > 30%
- **Response Time Target:** < 5 seconds
- **Conversation Duration Target:** < 10 minutes to handoff
- **Data Capture Rate Target:** > 90% (age + documents)

---

*Last updated: 2026-01-29*
*For Eagle Overseas WhatsApp Bot Implementation*
