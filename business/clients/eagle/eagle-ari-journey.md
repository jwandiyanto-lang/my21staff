# Eagle Overseas - ARI Conversation Journey

**Version:** 1.0
**Created:** 2026-01-20
**Purpose:** Detailed user journey map for ARI WhatsApp bot conversations

---

## What Happens When Lead Sends a Message

### Step-by-Step Process (Technical)

```
LEAD SENDS WHATSAPP MESSAGE: "Halo, mau tanya soal kuliah di Australia"
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: KAPSO RECEIVES MESSAGE                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Kapso (WhatsApp Business API) receives the message and sends webhook:     │
│                                                                             │
│  POST /api/webhook/kapso                                                    │
│  {                                                                          │
│    "event": "message",                                                      │
│    "data": {                                                                │
│      "from": "6281234567890",         ← Lead's WhatsApp number             │
│      "to": "6289876543210",           ← Eagle's business number            │
│      "message": {                                                           │
│        "type": "text",                                                      │
│        "text": "Halo, mau tanya soal kuliah di Australia"                  │
│      },                                                                     │
│      "timestamp": "2026-01-20T14:30:00Z"                                   │
│    }                                                                        │
│  }                                                                          │
│                                                                             │
│  Time: 0ms                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: WEBHOOK RETURNS 200 IMMEDIATELY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // route.ts                                                                │
│  export async function POST(request: NextRequest) {                         │
│    const payload = await parseWebhook(request);                            │
│                                                                             │
│    // Return 200 immediately - DO NOT WAIT for AI                          │
│    const response = NextResponse.json({ received: true });                 │
│                                                                             │
│    // Process async in background                                          │
│    processWithARI(payload).catch(console.error);                           │
│                                                                             │
│    return response;  // ← Kapso gets 200 in <100ms                         │
│  }                                                                          │
│                                                                             │
│  WHY: Kapso has 10s timeout. AI can take 3-8s. If we wait, Kapso retries  │
│       and we get duplicate messages.                                        │
│                                                                             │
│  Time: ~50ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: NORMALIZE PHONE NUMBER                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Input:  "6281234567890" (from Kapso)                                      │
│  Output: "+6281234567890" (E.164 format)                                   │
│                                                                             │
│  // Using libphonenumber-js                                                │
│  const normalized = normalizePhone("6281234567890", "ID");                 │
│  // Result: "+6281234567890"                                               │
│                                                                             │
│  WHY: Form might have "081234567890", WhatsApp sends "6281234567890"       │
│       Need consistent format to match contacts.                             │
│                                                                             │
│  Time: ~5ms                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: LOOKUP CONTACT IN CRM                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SQL Query:                                                                 │
│  SELECT * FROM contacts                                                     │
│  WHERE workspace_id = 'eagle-workspace-id'                                 │
│    AND phone_normalized = '+6281234567890'                                 │
│                                                                             │
│  Result:                                                                    │
│  {                                                                          │
│    id: "contact-uuid-123",                                                 │
│    name: "Sarah",                                                          │
│    phone: "081234567890",                                                  │
│    phone_normalized: "+6281234567890",                                     │
│    lead_score: 85,                                                         │
│    lead_status: "new",                                                     │
│    metadata: {                                                              │
│      form_answers: {                    ← Data from Google Form            │
│        "Level Bahasa Inggris": "Mahir",                                    │
│        "Budget": ">500 juta",                                              │
│        "Kapan Mau Berangkat": "<3 bulan",                                  │
│        "Aktivitas": "Bekerja",                                             │
│        "Negara Tujuan": "Australia",                                       │
│        "Remarks": "Tertarik MBA"                                           │
│      }                                                                      │
│    },                                                                       │
│    created_at: "2026-01-19T10:00:00Z"                                      │
│  }                                                                          │
│                                                                             │
│  IF NOT FOUND: Create new contact with phone only (no form data)           │
│                                                                             │
│  Time: ~50ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: GET OR CREATE ARI CONVERSATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SQL Query:                                                                 │
│  SELECT * FROM ari_conversations                                           │
│  WHERE workspace_id = 'eagle-workspace-id'                                 │
│    AND contact_id = 'contact-uuid-123'                                     │
│                                                                             │
│  IF EXISTS (returning conversation):                                        │
│  {                                                                          │
│    id: "conv-uuid-456",                                                    │
│    state: "qualifying",              ← Current state in journey            │
│    context: {                        ← Collected data during chat          │
│      collected: {                                                           │
│        program: "MBA",                                                      │
│        cities: ["Melbourne"]                                               │
│      },                                                                     │
│      documents: {                                                           │
│        passport: true,                                                      │
│        cv: null,                     ← Not asked yet                       │
│        english_test: null,                                                 │
│        transcript: null                                                    │
│      }                                                                      │
│    },                                                                       │
│    ai_model: "grok",                 ← Assigned model for A/B              │
│    message_count: 4                                                        │
│  }                                                                          │
│                                                                             │
│  IF NOT EXISTS (first message ever):                                        │
│  INSERT INTO ari_conversations (                                           │
│    workspace_id, contact_id, state, context, ai_model                      │
│  ) VALUES (                                                                 │
│    'eagle-workspace-id',                                                   │
│    'contact-uuid-123',                                                     │
│    'greeting',                       ← Start at greeting state             │
│    '{}',                             ← Empty context                       │
│    selectModel(contact_id)           ← Deterministic A/B assignment        │
│  )                                                                          │
│                                                                             │
│  Time: ~30ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: LOAD CONVERSATION HISTORY                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SQL Query:                                                                 │
│  SELECT role, content FROM ari_messages                                    │
│  WHERE ari_conversation_id = 'conv-uuid-456'                               │
│  ORDER BY created_at DESC                                                  │
│  LIMIT 10                            ← Only last 10 messages               │
│                                                                             │
│  Result:                                                                    │
│  [                                                                          │
│    { role: "user", content: "MBA di Melbourne atau Sydney" },              │
│    { role: "assistant", content: "MBA bagus banget! Melbourne Uni..." },   │
│    { role: "user", content: "Halo, saya mau tanya soal kuliah..." },       │
│    { role: "assistant", content: "Siang kak Sarah! Wah tertarik..." }      │
│  ]                                                                          │
│                                                                             │
│  WHY LIMIT 10: AI context window is limited. Old messages get summarized.  │
│                                                                             │
│  Time: ~20ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: CHECK IF UNIVERSITY QUESTION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Detect if message asks about specific university                        │
│  const isUniversityQuestion = detectUniversityQuestion(userMessage);       │
│                                                                             │
│  Keywords detected: "kuliah", "Australia"                                  │
│  Result: true                                                              │
│                                                                             │
│  IF TRUE, query knowledge base:                                            │
│  SELECT * FROM ari_destinations                                            │
│  WHERE workspace_id = 'eagle-workspace-id'                                 │
│    AND country ILIKE '%Australia%'                                         │
│    AND is_promoted = true                                                  │
│  ORDER BY priority DESC                                                    │
│  LIMIT 5                                                                   │
│                                                                             │
│  Result:                                                                    │
│  [                                                                          │
│    {                                                                        │
│      university: "University of Melbourne",                                │
│      country: "Australia",                                                 │
│      requirements: { ielts_min: 6.5, gpa_min: 3.0 },                       │
│      programs: ["MBA", "Engineering", "Law"],                              │
│      notes: "Ranked #1 in Australia"                                       │
│    },                                                                       │
│    {                                                                        │
│      university: "UNSW Sydney",                                            │
│      country: "Australia",                                                 │
│      requirements: { ielts_min: 6.5, gpa_min: 3.0 },                       │
│      programs: ["MBA", "IT", "Business"]                                   │
│    }                                                                        │
│  ]                                                                          │
│                                                                             │
│  Time: ~40ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: LOAD ARI CONFIG (PERSONA)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SQL Query:                                                                 │
│  SELECT * FROM ari_config                                                  │
│  WHERE workspace_id = 'eagle-workspace-id'                                 │
│                                                                             │
│  Result:                                                                    │
│  {                                                                          │
│    bot_name: "ARI",                                                        │
│    greeting_style: "casual",         ← casual/formal/professional          │
│    language: "id",                   ← Bahasa Indonesia                    │
│    tone: {                                                                  │
│      supportive: true,                                                      │
│      clear: true,                                                          │
│      encouraging: true                                                      │
│    },                                                                       │
│    community_link: "https://chat.whatsapp.com/xyz123"                      │
│  }                                                                          │
│                                                                             │
│  Time: ~15ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: BUILD SYSTEM PROMPT                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // context-builder.ts                                                      │
│  function buildSystemPrompt(ctx: PromptContext): string                    │
│                                                                             │
│  INPUT:                                                                     │
│  - contact: { name, formAnswers, leadScore }                               │
│  - conversation: { state, context, recentMessages }                        │
│  - config: { botName, greetingStyle, tone }                                │
│  - destinations: [ ... university data ... ]                               │
│                                                                             │
│  OUTPUT (System Prompt):                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Kamu adalah ARI, asisten virtual Eagle Overseas Indonesia.          │   │
│  │                                                                      │   │
│  │ GREETING: Gunakan "siang kak Sarah" untuk sapaan.                   │   │
│  │                                                                      │   │
│  │ ## CRM CONTEXT                                                       │   │
│  │ Data dari formulir:                                                  │   │
│  │ - Level Bahasa Inggris: Mahir                                       │   │
│  │ - Budget: >500 juta                                                  │   │
│  │ - Kapan Mau Berangkat: <3 bulan                                     │   │
│  │ - Aktivitas: Bekerja                                                 │   │
│  │ - Negara Tujuan: Australia                                           │   │
│  │ - Remarks: Tertarik MBA                                              │   │
│  │                                                                      │   │
│  │ Lead Score: 85 (HOT - gunakan tone langsung, tawarkan konsultasi)   │   │
│  │                                                                      │   │
│  │ ## CONVERSATION STATE: qualifying                                    │   │
│  │ - Sudah tau: nama, negara, bahasa inggris, budget, timeline         │   │
│  │ - Belum tau: dokumen (passport, CV, IELTS, transkrip)               │   │
│  │ - Tanyakan dokumen secara natural, SATU per pesan                   │   │
│  │                                                                      │   │
│  │ ## UNIVERSITY DATA (untuk pertanyaan ini)                           │   │
│  │ University of Melbourne:                                             │   │
│  │ - IELTS min: 6.5                                                     │   │
│  │ - Programs: MBA, Engineering, Law                                    │   │
│  │ - Note: Ranked #1 in Australia                                       │   │
│  │                                                                      │   │
│  │ UNSW Sydney:                                                         │   │
│  │ - IELTS min: 6.5                                                     │   │
│  │ - Programs: MBA, IT, Business                                        │   │
│  │                                                                      │   │
│  │ ## COMMUNICATION STYLE                                               │   │
│  │ - Singkat: 1-2 kalimat per pesan                                    │   │
│  │ - JANGAN pakai emoji                                                 │   │
│  │ - Bahasa santai: saya/kamu, bukan formal                            │   │
│  │ - Mirror bahasa customer                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Time: ~10ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 10: SELECT AI MODEL (A/B Testing)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // ai-router.ts                                                            │
│  function selectModel(contactId: string): 'grok' | 'sealion'               │
│                                                                             │
│  // Deterministic hash based on contact_id                                 │
│  const hash = contactId.split('').reduce((acc, char) => {                  │
│    return ((acc << 5) - acc) + char.charCodeAt(0);                         │
│  }, 0);                                                                     │
│                                                                             │
│  const normalized = Math.abs(hash) % 100;  // 0-99                         │
│  const grokWeight = 50;  // 50% Grok, 50% Sea-Lion                         │
│                                                                             │
│  // Sarah's contact_id hashes to 73                                        │
│  // 73 >= 50, so she gets Sea-Lion                                         │
│  Result: "sealion"                                                         │
│                                                                             │
│  WHY DETERMINISTIC: Same user always gets same model.                      │
│                     Valid A/B comparison needs consistency.                 │
│                                                                             │
│  Time: ~1ms                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 11: CALL AI API                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Using OpenAI-compatible SDK                                            │
│  const client = new OpenAI({                                               │
│    apiKey: 'ollama',                                                       │
│    baseURL: 'http://100.113.96.25:11434/v1'  // Sea-Lion via Tailscale    │
│  });                                                                        │
│                                                                             │
│  const startTime = Date.now();                                             │
│                                                                             │
│  const completion = await client.chat.completions.create({                 │
│    model: 'aisingapore/Gemma-SEA-LION-v4-27B-IT',                          │
│    messages: [                                                              │
│      { role: 'system', content: systemPrompt },      // Built in Step 9   │
│      { role: 'user', content: 'Halo, saya mau tanya...' },                │
│      { role: 'assistant', content: 'Siang kak Sarah!...' },               │
│      { role: 'user', content: 'MBA di Melbourne...' },                    │
│      { role: 'assistant', content: 'MBA bagus banget!...' },              │
│      { role: 'user', content: 'Halo, mau tanya soal kuliah di Australia' }│
│    ],                                                                       │
│    temperature: 0.8,                                                       │
│    max_tokens: 150       // Keep short for WhatsApp                        │
│  });                                                                        │
│                                                                             │
│  const responseTimeMs = Date.now() - startTime;  // ~3500ms                │
│                                                                             │
│  Result:                                                                    │
│  {                                                                          │
│    content: "Oh ya, dokumen udah siap belum kak? Passport, CV, IELTS,     │
│              sama transkrip? Buat apply ke Melbourne atau UNSW, IELTS     │
│              minimal 6.5 ya.",                                             │
│    tokens: 87,                                                             │
│    responseTimeMs: 3500                                                    │
│  }                                                                          │
│                                                                             │
│  Time: ~3000-5000ms (this is the slowest step!)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 12: PARSE DOCUMENT RESPONSE (if applicable)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // Check if user's message contains document info                         │
│  const userMessage = "Halo, mau tanya soal kuliah di Australia";          │
│                                                                             │
│  // parseDocumentResponse looks for:                                        │
│  // - "passport udah" / "paspor ada" → passport: true                      │
│  // - "belum ada cv" → cv: false                                           │
│  // - "IELTS 7.5" → english_test: true, ielts_score: 7.5                  │
│                                                                             │
│  Result: null  // No document info in this message                         │
│                                                                             │
│  IF DOCUMENT INFO FOUND:                                                    │
│  UPDATE ari_conversations                                                  │
│  SET context = jsonb_set(context, '{documents,passport}', 'true')          │
│  WHERE id = 'conv-uuid-456'                                                │
│                                                                             │
│  Time: ~5ms (or ~30ms if update needed)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 13: LOG MESSAGES TO DATABASE                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INSERT INTO ari_messages (                                                │
│    ari_conversation_id, workspace_id, role, content,                       │
│    ai_model, tokens_used, response_time_ms                                 │
│  ) VALUES                                                                   │
│  (                                                                          │
│    'conv-uuid-456',                                                        │
│    'eagle-workspace-id',                                                   │
│    'user',                                                                 │
│    'Halo, mau tanya soal kuliah di Australia',                            │
│    NULL, NULL, NULL                                                        │
│  ),                                                                         │
│  (                                                                          │
│    'conv-uuid-456',                                                        │
│    'eagle-workspace-id',                                                   │
│    'assistant',                                                            │
│    'Oh ya, dokumen udah siap belum kak?...',                              │
│    'sealion',                          ← Track which model                 │
│    87,                                 ← Track tokens for cost             │
│    3500                                ← Track response time               │
│  );                                                                         │
│                                                                             │
│  Time: ~25ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 14: DETERMINE STATE TRANSITION                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // state-machine.ts                                                        │
│  function determineNextState(                                              │
│    currentState: ARIState,                                                 │
│    context: ARIContext,                                                    │
│    leadScore: number                                                       │
│  ): ARIState                                                               │
│                                                                             │
│  Current: "qualifying"                                                     │
│  Score: 85                                                                 │
│  Documents collected: 0 of 4                                               │
│                                                                             │
│  Rules check:                                                              │
│  - Score >= 80 AND all docs known? → booking (NO, docs unknown)           │
│  - Score >= 60 AND key data complete? → scoring (NO, docs unknown)        │
│  - Still collecting? → stay in qualifying (YES)                            │
│                                                                             │
│  Result: "qualifying" (no change)                                          │
│                                                                             │
│  IF STATE CHANGED:                                                          │
│  UPDATE ari_conversations                                                  │
│  SET state = 'scoring', updated_at = NOW()                                 │
│  WHERE id = 'conv-uuid-456'                                                │
│                                                                             │
│  Time: ~5ms (or ~20ms if update needed)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 15: UPDATE A/B METRICS                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INSERT INTO ari_ai_comparison (                                           │
│    workspace_id, ai_model, metric_type, value                              │
│  ) VALUES (                                                                 │
│    'eagle-workspace-id',                                                   │
│    'sealion',                                                              │
│    'response_time_ms',                                                     │
│    3500                                                                    │
│  );                                                                         │
│                                                                             │
│  // Also track: tokens, conversation_length, handoff_rate                  │
│                                                                             │
│  Time: ~15ms                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 16: SEND REPLY VIA KAPSO                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  // lib/kapso/client.ts                                                     │
│  await kapsoClient.sendMessage({                                           │
│    to: "+6281234567890",                                                   │
│    message: "Oh ya, dokumen udah siap belum kak? Passport, CV, IELTS,     │
│              sama transkrip? Buat apply ke Melbourne atau UNSW, IELTS     │
│              minimal 6.5 ya."                                              │
│  });                                                                        │
│                                                                             │
│  Kapso API sends WhatsApp message to user.                                 │
│                                                                             │
│  Time: ~200ms                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOTAL TIME BREAKDOWN                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1-2:  Webhook receive & return 200     ~50ms                         │
│  Step 3:    Normalize phone                  ~5ms                          │
│  Step 4:    Lookup contact                   ~50ms                         │
│  Step 5:    Get/create conversation          ~30ms                         │
│  Step 6:    Load message history             ~20ms                         │
│  Step 7:    Check university question        ~40ms                         │
│  Step 8:    Load ARI config                  ~15ms                         │
│  Step 9:    Build system prompt              ~10ms                         │
│  Step 10:   Select AI model                  ~1ms                          │
│  Step 11:   AI API call                      ~3500ms  ← SLOWEST            │
│  Step 12:   Parse document response          ~5ms                          │
│  Step 13:   Log messages                     ~25ms                         │
│  Step 14:   Determine state transition       ~5ms                          │
│  Step 15:   Update A/B metrics               ~15ms                         │
│  Step 16:   Send via Kapso                   ~200ms                        │
│  ─────────────────────────────────────────────────────                     │
│  TOTAL:                                      ~4000ms (4 seconds)           │
│                                                                             │
│  User experience: Sends message → sees "typing..." → gets reply in ~4s    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Journey Tree

```
                              ┌─────────────────┐
                              │  Google Form    │
                              │  Submission     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │           n8n Automation            │
                    │  • Transform data                   │
                    │  • Calculate initial score          │
                    │  • Store in contacts.metadata       │
                    └──────────────────┬──────────────────┘
                                       │
                              ┌────────┴────────┐
                              │  Supabase CRM   │
                              │  contacts table │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │     User Opens WhatsApp & Sends     │
                    │     First Message (User-Initiated)  │
                    └──────────────────┬──────────────────┘
                                       │
                              ┌────────┴────────┐
                              │  Kapso Webhook  │
                              │  Receives Msg   │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
     ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
     │ Phone Matching │      │ Get/Create ARI │      │ Load Context   │
     │ +62 → E.164    │ ───▶ │ Conversation   │ ───▶ │ from CRM       │
     └────────────────┘      └────────────────┘      └────────────────┘
                                                              │
                                                              ▼
                                       ┌──────────────────────────────┐
                                       │     ARI State Machine        │
                                       └──────────────────────────────┘
                                                              │
        ┌─────────────┬─────────────┬─────────────┬──────────┴───────────┐
        ▼             ▼             ▼             ▼                      ▼
   ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐          ┌───────────┐
   │GREETING │─▶│QUALIFYING│─▶│ SCORING │─▶│ BOOKING  │─────────▶│  PAYMENT  │
   │         │  │          │  │         │  │          │          │           │
   │Score:0  │  │Score:0-59│  │Score:60+│  │Score:80+ │          │ Midtrans  │
   └─────────┘  └──────────┘  └─────────┘  └──────────┘          └───────────┘
                     │              │             │                    │
                     │              │             │                    ▼
                     │              ▼             ▼             ┌───────────┐
                     │         ┌─────────┐  ┌──────────┐        │SCHEDULING │
                     │         │COMMUNITY│  │ HANDOFF  │◀───────│           │
                     │         │  LINK   │  │ to Human │        │Pick slot  │
                     │         └─────────┘  └──────────┘        └───────────┘
                     │              ▲             ▲                    │
                     └──────────────┘             │                    ▼
                        Score <40                 │             ┌───────────┐
                                                  └─────────────│ COMPLETED │
                                                                └───────────┘
```

---

## State Details

### State 1: GREETING

**Trigger:** User sends first message
**Data Used:** `contact.name`, `contact.metadata.form_answers.country`
**Goal:** Welcome user by name, reference their interest

### State 2: QUALIFYING

**Trigger:** After greeting
**Data Used:** Form answers, missing field detection
**Goal:** Fill gaps in data, assess document readiness, understand intent

**Sub-phases within QUALIFYING:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ QUALIFYING SUB-FLOW                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │ 2a. COLLECT  │────▶│ 2b. ANSWER   │────▶│ 2c. ASSESS   │                │
│  │ Missing Data │     │ User Questions│     │ & Ultimatum  │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  • Document status      • 1-2 questions     • Score >= 80: Book now        │
│  • Timeline clarity     • About destination  • Score 60-79: Book or        │
│  • Budget confirmation  • About requirements          community            │
│  • Program interest     • About process      • Score < 60: Community       │
│                                                                             │
│  Question Counter: Max 2 free questions before ultimatum                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What ARI learns from questions:**

| User Asks About | ARI Learns | Score Impact |
|-----------------|------------|--------------|
| Specific university requirements | Serious intent, researched | +10 |
| Scholarship opportunities | Budget-conscious but motivated | +5 |
| Application timeline/deadline | Ready to act | +10 |
| General "how to study abroad" | Early stage, needs nurturing | -5 |
| Visa process details | Practical, ready for next steps | +5 |
| Cost comparison | Budget is a concern | 0 (neutral) |

**Fast-Track Logic (BEFORE questions):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FAST-TRACK CHECK (runs immediately after greeting)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  IF score >= 85                                                             │
│     AND english_level = "Mahir"                                            │
│     AND (documents.passport = true OR documents mentioned in form):        │
│                                                                             │
│     → SKIP QUALIFYING ENTIRELY                                             │
│     → GO STRAIGHT TO BOOKING                                               │
│                                                                             │
│  "Kak [name], dari form yang kakak isi, kayaknya udah siap banget!         │
│   Bahasa Inggris mahir, dokumen lengkap, timeline jelas. Mau langsung      │
│   konsultasi sama konsultan spesialis [country] kami? Bisa bahas           │
│   langkah konkret buat apply."                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why fast-track?**
- High-intent leads don't need nurturing
- They already know what they want
- Longer conversation = risk of losing them
- Respect their time, be direct

**Ultimatum Logic (for leads who DO ask questions):**

```
IF question_count >= 2:
  IF score >= 80:
    "Kak, banyak yang mau kakak tau ya! Biar lebih jelas dan personal,
     mending langsung konsultasi 1-on-1 sama konsultan kami. Bisa bahas
     semua detail sesuai situasi kakak. Mau?"

  ELSE IF score >= 60:
    "Pertanyaan bagus kak! Untuk jawaban yang lebih lengkap, ada 2 opsi:
     1. Konsultasi 1-on-1 (Rp500rb) - bahas detail personal
     2. Join komunitas WA kami (gratis) - sharing sesama yang mau kuliah
        di luar negeri
     Mau yang mana?"

  ELSE:
    "Makasih udah tanya kak! Untuk info lebih lengkap, yuk join
     komunitas WA kami. Banyak tips dan sharing dari yang udah
     berhasil kuliah di luar negeri: [link]"
```

### State 3: SCORING

**Trigger:** Score >= 60 OR all key fields collected
**Data Used:** All collected data, scoring weights
**Goal:** Finalize score, determine route

### State 4: BOOKING

**Trigger:** Score >= 80 (Hot lead)
**Data Used:** Lead temperature, urgency signals
**Goal:** Offer paid consultation

### State 5: PAYMENT

**Trigger:** User accepts booking offer
**Data Used:** Payment link, Midtrans callback
**Goal:** Complete Rp500,000 payment

### State 6: SCHEDULING

**Trigger:** Payment confirmed
**Data Used:** Available consultant slots
**Goal:** Book consultation time

### State 7: HANDOFF

**Trigger:** Appointment confirmed OR human needed
**Data Used:** Full conversation summary, score breakdown
**Goal:** Transfer to consultant with context

### State 8: COMPLETED

**Trigger:** Consultation done
**Data Used:** Outcome notes
**Goal:** Archive conversation

---

## Detailed Conversation Examples

### Scenario A: Full Qualifying Flow with Questions → Ultimatum (Score 65→85)

User: Dina, English=Menengah, Budget=300-500jt, Timeline=6-12 bulan, Student, UK

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: GREETING                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Halo, mau tanya dong soal kuliah di UK                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI reads from CRM:                                                  │   │
│  │ • name: "Dina"                                                       │   │
│  │ • country: "UK"                                                      │   │
│  │ • english_level: "Menengah" (20 pts)                                │   │
│  │ • budget: "300-500jt" (20 pts)                                      │   │
│  │ • timeline: "6-12 bulan" (10 pts)                                   │   │
│  │ • activity: "Mahasiswa" (10 pts)                                    │   │
│  │ • Initial score: 65 (WARM)                                          │   │
│  │ • question_count: 0                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Sore kak Dina! Wah mau kuliah di UK ya, keren! Dari form yang        │
│       kakak isi, rencananya berangkat dalam 6-12 bulan ya. Boleh tau       │
│       mau ambil jurusan apa?                                                │
│                                                                             │
│  → State: GREETING → QUALIFYING (2a: Collect)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (2a - Collect Missing Data)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Mau ambil Business atau Marketing gitu                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI updates context:                                                 │   │
│  │ • context.collected.program = "Business/Marketing"                   │   │
│  │ • Score: +0 (info collected, no impact)                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Business atau Marketing bagus banget di UK! Banyak uni top.          │
│       Oh ya kak, dokumen udah siap belum? Passport sama IELTS/TOEFL?       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (2a - Document Check)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Passport udah, tapi IELTS belum. Masih mau belajar dulu             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI updates context:                                                 │   │
│  │ • context.documents.passport = true (+5)                             │   │
│  │ • context.documents.english_test = false (no bonus)                  │   │
│  │ • Detected: "mau belajar dulu" = still preparing                     │   │
│  │ • Score: 65 + 5 = 70 (still WARM)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Oke, passport udah siap! Untuk IELTS, kebanyakan uni UK butuh        │
│       minimal 6.0-6.5. Ada yang mau ditanyakan soal persiapan atau         │
│       kuliahnya kak?                                                        │
│                                                                             │
│  → Transition: QUALIFYING (2a) → QUALIFYING (2b: Answer Questions)         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (2b - User Question #1)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Kalo di UK yang bagus untuk Business apa ya?                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Question type: Specific university inquiry                         │   │
│  │ • Intent signal: Researching seriously (+10)                         │   │
│  │ • question_count: 0 → 1                                              │   │
│  │ • Score: 70 + 10 = 80 (now HOT!)                                    │   │
│  │                                                                       │   │
│  │ Query ari_destinations:                                              │   │
│  │ WHERE country = 'UK' AND 'Business' = ANY(programs)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Untuk Business di UK, beberapa yang top:                             │
│       - London Business School (paling prestisius, tapi mahal)            │
│       - Warwick Business School (bagus, lebih affordable)                 │
│       - Manchester, Leeds, Birmingham juga oke buat undergrad             │
│                                                                             │
│       Tergantung budget dan target kakak sih. Mau yang tier 1 atau        │
│       yang lebih realistis?                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (2b - User Question #2)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Yang realistis aja deh. Ada beasiswa gak ya?                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Question type: Scholarship inquiry                                 │   │
│  │ • Intent signal: Budget-conscious but motivated (+5)                 │   │
│  │ • question_count: 1 → 2 (LIMIT REACHED!)                             │   │
│  │ • Score: 80 + 5 = 85 (HOT)                                          │   │
│  │                                                                       │   │
│  │ ULTIMATUM TRIGGER: question_count >= 2 AND score >= 80              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Ada beberapa beasiswa kak:                                           │
│       - Chevening (full scholarship, tapi kompetitif banget)              │
│       - LPDP kalau mau S2                                                  │
│       - Beberapa uni kasih partial scholarship untuk nilai bagus          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (2c - ULTIMATUM)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ULTIMATUM DECISION:                                                  │   │
│  │ • Score: 85 (HOT)                                                    │   │
│  │ • Questions asked: 2 (limit reached)                                 │   │
│  │ • Route: Direct booking offer                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Kak Dina, banyak yang mau kakak tau ya! Biar lebih jelas dan         │
│       personal sesuai situasi kakak (budget, timeline, target uni),        │
│       mending langsung konsultasi 1-on-1 sama konsultan kami.              │
│                                                                             │
│       Bisa bahas:                                                           │
│       - Uni mana yang cocok sama profile kakak                             │
│       - Strategy dapet beasiswa                                            │
│       - Timeline persiapan yang realistis                                  │
│                                                                             │
│       Biaya konsultasi Rp500.000 untuk 1 jam. Mau?                         │
│                                                                             │
│  → State: QUALIFYING (2c) → BOOKING (if yes)                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ USER ACCEPTS BOOKING                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Boleh, gimana caranya?                                               │
│                                                                             │
│  ARI: Oke kak! Ini link pembayarannya: [Midtrans Payment Link]             │
│       Bisa bayar pake QRIS, GoPay, transfer bank, atau kartu.              │
│       Link berlaku 24 jam ya.                                               │
│                                                                             │
│  → State: QUALIFYING → BOOKING → PAYMENT                                   │
│  → Continue to payment & scheduling flow...                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Alternative: User Hesitates After Ultimatum**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER HESITATES                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Hmm masih mikir-mikir dulu deh                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Hesitation signal: "masih mikir-mikir"                            │   │
│  │ • Score adjustment: -10                                              │   │
│  │ • New score: 75 (WARM)                                               │   │
│  │ • Fallback: Offer community as alternative                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Oke gak masalah kak, gak usah buru-buru! Sambil mikir-mikir,         │
│       boleh join komunitas WA kami dulu. Isinya:                           │
│       - Info beasiswa terbaru                                              │
│       - Tips IELTS dari yang udah berhasil                                 │
│       - Sharing pengalaman kuliah di UK                                    │
│                                                                             │
│       Link: [Community Link]                                               │
│                                                                             │
│       Kalau nanti udah siap mau konsultasi, tinggal chat lagi ya kak!     │
│                                                                             │
│  → State: QUALIFYING → HANDOFF (nurture via community)                     │
│  → Set follow_up_date: +30 days                                            │
│  → Add tag: "community-member"                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Scenario B: FAST-TRACK - Super Ready Lead (Score 90+, Skip Qualifying!)

User: Sarah, English=Mahir, Budget=>500jt, Timeline=<3 bulan, Working, Australia
Form notes: "Udah punya IELTS 7.5, passport ready"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: GREETING + FAST-TRACK CHECK                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Halo, saya mau tanya soal kuliah di Australia                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI reads from CRM:                                                  │   │
│  │ • name: "Sarah"                                                      │   │
│  │ • country: "Australia"                                               │   │
│  │ • english_level: "Mahir" (30 pts)                                   │   │
│  │ • budget: ">500jt" (25 pts)                                         │   │
│  │ • timeline: "<3 bulan" (20 pts)                                     │   │
│  │ • activity: "Bekerja" (15 pts)                                      │   │
│  │ • form_remarks: "Udah punya IELTS 7.5, passport ready"              │   │
│  │                                                                       │   │
│  │ FAST-TRACK CHECK:                                                    │   │
│  │ ✓ Score: 90 (>=85)                                                   │   │
│  │ ✓ English: Mahir                                                     │   │
│  │ ✓ Documents: Mentioned in form (IELTS, passport)                    │   │
│  │                                                                       │   │
│  │ RESULT: FAST-TRACK ACTIVATED!                                        │   │
│  │ → Skip qualifying, go straight to booking offer                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Siang kak Sarah! Wah dari form yang kakak isi, kayaknya udah         │
│       siap banget ya - IELTS 7.5, passport ready, mau berangkat dalam      │
│       3 bulan. Keren!                                                       │
│                                                                             │
│       Mau langsung konsultasi sama konsultan spesialis Australia kami?     │
│       Bisa bahas langkah konkret: pilih uni, timeline apply, visa.         │
│       Biaya konsultasi Rp500.000 untuk 1 jam. Gimana?                      │
│                                                                             │
│  → State: GREETING → BOOKING (skip QUALIFYING entirely!)                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ USER ACCEPTS IMMEDIATELY                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Boleh, gimana caranya bayar?                                        │
│                                                                             │
│  ARI: Oke kak! Ini link pembayarannya: [Midtrans Payment Link]             │
│       Bisa bayar pake QRIS, GoPay, transfer bank, atau kartu.              │
│       Link berlaku 24 jam ya.                                               │
│                                                                             │
│  → State: BOOKING → PAYMENT                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT SUCCESS → SCHEDULING                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Midtrans callback: payment_success]                                       │
│                                                                             │
│  ARI: Pembayaran diterima! Makasih kak Sarah. Pilih jadwal konsultasi:     │
│                                                                             │
│       1. Senin 22 Jan, 10:00 WIB - Kak Rina                                │
│       2. Senin 22 Jan, 14:00 WIB - Kak Rina                                │
│       3. Selasa 23 Jan, 09:00 WIB - Kak Dedi                               │
│                                                                             │
│       Balas nomor pilihannya ya.                                            │
│                                                                             │
│  USER: 2                                                                    │
│                                                                             │
│  ARI: Oke, terjadwal! Konsultasi: Senin 22 Jan, 14:00 WIB dengan           │
│       Kak Rina. Link meeting dikirim 1 jam sebelumnya.                     │
│                                                                             │
│  → State: PAYMENT → SCHEDULING → HANDOFF                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CONSULTANT RECEIVES HANDOFF                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ NOTIFICATION TO CONSULTANT RINA:                                     │   │
│  │                                                                       │   │
│  │ NEW CONSULTATION - FAST-TRACK LEAD                                   │   │
│  │ ════════════════════════════════════                                 │   │
│  │                                                                       │   │
│  │ Lead: Sarah (Score: 90 - SUPER HOT)                                  │   │
│  │ Time: Mon 22 Jan 14:00 WIB                                           │   │
│  │                                                                       │   │
│  │ PROFILE:                                                             │   │
│  │ • Target: Australia                                                  │   │
│  │ • English: IELTS 7.5 (Mahir)                                        │   │
│  │ • Budget: >500jt                                                     │   │
│  │ • Timeline: <3 months (URGENT!)                                     │   │
│  │ • Status: Working professional                                       │   │
│  │ • Docs: Passport ready, IELTS done                                  │   │
│  │                                                                       │   │
│  │ FAST-TRACK NOTE:                                                     │   │
│  │ This lead skipped qualifying - already ready.                        │   │
│  │ Direct consultation, no nurturing needed.                            │   │
│  │ Focus on: uni selection, application timeline, visa prep.            │   │
│  │                                                                       │   │
│  │ CONVERSATION: 3 messages total (very short!)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  TOTAL TIME FROM FIRST MESSAGE TO BOOKING: ~2 minutes                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Fast-Track vs Normal Flow Comparison:**

| Metric | Fast-Track (Sarah) | Normal Flow (Dina) |
|--------|-------------------|-------------------|
| Messages before booking | 2 | 8-10 |
| Time to booking | ~2 minutes | ~10-15 minutes |
| Questions answered | 0 | 2 |
| Risk of losing lead | LOW | MEDIUM |
| Qualifying state | SKIPPED | FULL |

---

### Scenario C: Hot Lead with Questions (Score 85+)

User: Sarah, English=Mahir, Budget=>500jt, Timeline=<3 bulan, Working, Australia

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: GREETING                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Halo, saya mau tanya soal kuliah di Australia                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI reads:                                                           │   │
│  │ • contact.name = "Sarah"                                             │   │
│  │ • form_answers.country = "Australia"                                 │   │
│  │ • form_answers.english_level = "Mahir"                               │   │
│  │ • form_answers.budget = ">500 juta"                                  │   │
│  │ • lead_score = 85                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Siang kak Sarah! Wah tertarik kuliah di Australia ya. Dari form      │
│       yang kakak isi, bahasa Inggrisnya udah mahir dan budgetnya oke.      │
│       Boleh tau mau ambil program apa?                                      │
│                                                                             │
│  → State transition: GREETING → QUALIFYING                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: MBA di Melbourne atau Sydney                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI updates context:                                                 │   │
│  │ • context.collected.program = "MBA"                                  │   │
│  │ • context.collected.cities = ["Melbourne", "Sydney"]                 │   │
│  │ • Score adjustment: +0 (already high)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: MBA bagus banget! Melbourne Uni sama UNSW Sydney punya program       │
│       MBA top. Oh ya, dokumen udah siap belum kak? Passport, CV,           │
│       IELTS/TOEFL, sama transkrip?                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (Document Check)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Passport udah, CV udah, IELTS 7.5, transkrip juga ada               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI parses document response:                                        │   │
│  │ • context.documents.passport = true                                  │   │
│  │ • context.documents.cv = true                                        │   │
│  │ • context.documents.english_test = true (IELTS 7.5)                  │   │
│  │ • context.documents.transcript = true                                │   │
│  │ • Score bonus: +20 (all docs ready)                                  │   │
│  │ • New score: 85 + 20 = 105 → capped at 100                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Wah lengkap banget! IELTS 7.5 udah cukup buat semua uni top.         │
│       Kakak siap banget ini.                                                │
│                                                                             │
│  → State transition: QUALIFYING → SCORING                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: SCORING → BOOKING                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI calculates final score:                                          │   │
│  │ • English: 30 (Mahir)                                                │   │
│  │ • Budget: 25 (>500jt)                                                │   │
│  │ • Timeline: 20 (<3 bulan)                                            │   │
│  │ • Activity: 15 (Working)                                             │   │
│  │ • Country: 10 (Australia)                                            │   │
│  │ • Docs bonus: 20                                                     │   │
│  │ • TOTAL: 100 (HOT)                                                   │   │
│  │                                                                       │   │
│  │ Route decision: Score >= 80 → BOOKING                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Kak Sarah, dengan persiapan selengkap ini, mau langsung konsultasi   │
│       sama konsultan kami? Bisa bahas detail uni, persyaratan, sama        │
│       timeline aplikasi. Biaya konsultasi Rp500.000 untuk 1 jam session    │
│       dengan konsultan spesialis Australia. Mau?                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: BOOKING                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Boleh, gimana caranya?                                               │
│                                                                             │
│  ARI: Oke kak! Ini link pembayarannya: [Midtrans Payment Link]             │
│       Bisa bayar pake QRIS, GoPay, transfer bank, atau kartu.              │
│       Link berlaku 24 jam ya.                                               │
│                                                                             │
│  → State transition: BOOKING → PAYMENT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: PAYMENT                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Midtrans callback: payment_success]                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ System updates:                                                      │   │
│  │ • ari_payments.status = "paid"                                       │   │
│  │ • contact.lead_status = "Hot"                                        │   │
│  │ • ari_conversation.state = "scheduling"                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Pembayaran diterima! Makasih kak Sarah. Sekarang pilih jadwal        │
│       konsultasi ya:                                                        │
│                                                                             │
│       1. Senin 22 Jan, 10:00 WIB - Kak Rina                                │
│       2. Senin 22 Jan, 14:00 WIB - Kak Rina                                │
│       3. Selasa 23 Jan, 09:00 WIB - Kak Dedi                               │
│       4. Selasa 23 Jan, 15:00 WIB - Kak Dedi                               │
│                                                                             │
│       Balas nomor pilihannya ya.                                            │
│                                                                             │
│  → State transition: PAYMENT → SCHEDULING                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: SCHEDULING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: 2                                                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ System books appointment:                                            │   │
│  │ • ari_appointments.slot = "2026-01-22 14:00"                         │   │
│  │ • ari_appointments.consultant = "Rina"                               │   │
│  │ • ari_appointments.status = "scheduled"                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Oke, terjadwal!                                                       │
│                                                                             │
│       Konsultasi: Senin, 22 Januari 2026                                   │
│       Jam: 14:00 WIB                                                        │
│       Konsultan: Kak Rina                                                   │
│                                                                             │
│       Link meeting akan dikirim 1 jam sebelum jadwal ya.                   │
│       Ada yang mau ditanyakan lagi?                                         │
│                                                                             │
│  → State transition: SCHEDULING → HANDOFF                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: HANDOFF                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Gak ada, makasih ya!                                                 │
│                                                                             │
│  ARI: Sama-sama kak Sarah! Sampai ketemu di konsultasi. Kak Rina udah      │
│       siap bantu perjalanan kuliah kakak ke Australia.                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Consultant Rina receives notification:                               │   │
│  │                                                                       │   │
│  │ NEW CONSULTATION BOOKED                                              │   │
│  │ Lead: Sarah (Score: 100 - HOT)                                       │   │
│  │ Time: Mon 22 Jan 14:00 WIB                                           │   │
│  │                                                                       │   │
│  │ Profile:                                                             │   │
│  │ • Target: MBA in Melbourne/Sydney                                    │   │
│  │ • English: IELTS 7.5                                                 │   │
│  │ • Budget: >500jt                                                     │   │
│  │ • Timeline: <3 months                                                │   │
│  │ • Status: Working professional                                       │   │
│  │ • Docs: All ready (passport, CV, IELTS, transcript)                  │   │
│  │                                                                       │   │
│  │ Conversation Summary:                                                │   │
│  │ Sarah asked about MBA programs. Very prepared candidate,             │   │
│  │ all documents ready, high budget, urgent timeline.                   │   │
│  │ Interested in Melbourne Uni and UNSW Sydney.                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  → State transition: HANDOFF → COMPLETED (after consultation)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Scenario B: Warm Lead (Score 55)

User: Budi, English=Menengah, Budget=100-300jt, Timeline=6-12 bulan, Student, UK

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: GREETING                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Halo                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI reads:                                                           │   │
│  │ • contact.name = "Budi"                                              │   │
│  │ • form_answers.country = "UK"                                        │   │
│  │ • form_answers.english_level = "Menengah"                            │   │
│  │ • form_answers.budget = "100-300 juta"                               │   │
│  │ • lead_score = 55                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Sore kak Budi! Makasih udah isi form. Tertarik kuliah di UK ya?      │
│       Boleh cerita lebih detail mau ambil program apa?                     │
│                                                                             │
│  → State transition: GREETING → QUALIFYING                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Masih bingung sih antara S1 atau foundation dulu                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Uncertainty signal: "masih bingung"                                │   │
│  │ • Score adjustment: -5 (uncertainty)                                 │   │
│  │ • Missing: document status                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Foundation bisa jadi pilihan bagus kalau mau adaptasi dulu.          │
│       Btw, udah punya IELTS atau TOEFL belum kak?                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Belum, masih mau persiapan dulu                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI updates:                                                         │   │
│  │ • context.documents.english_test = false                             │   │
│  │ • Score: No bonus (docs not ready)                                   │   │
│  │ • Current score: 50 (below booking threshold)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Oke gak masalah! Banyak uni UK yang terima tanpa IELTS dulu,         │
│       bisa tes bahasa Inggris internal mereka. Untuk foundation,           │
│       biasanya butuh IELTS 5.0-5.5 aja.                                    │
│                                                                             │
│       Oh ya, udah punya passport belum kak?                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Passport udah ada                                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI updates:                                                         │   │
│  │ • context.documents.passport = true                                  │   │
│  │ • Score bonus: +5 (1 doc ready)                                      │   │
│  │ • Current score: 55                                                  │   │
│  │                                                                       │   │
│  │ Route check: Score 55 < 60, stay in QUALIFYING                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Bagus! Satu langkah udah beres.                                      │
│                                                                             │
│       Kak Budi, sambil persiapan IELTS, mau join komunitas WhatsApp        │
│       kita gak? Isinya info beasiswa, tips IELTS, sama sharing dari        │
│       alumni yang udah kuliah di UK.                                       │
│                                                                             │
│       Link: [Community Link]                                               │
│                                                                             │
│       Kalau nanti udah siap mau konsultasi detail, kabarin aja ya!         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI sets follow-up:                                                  │   │
│  │ • contact.follow_up_date = +30 days                                  │   │
│  │ • contact.notes = "Warm lead, belum ada IELTS, join community"       │   │
│  │ • State: Stay in QUALIFYING (can resume later)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Scenario C: Cold Lead (Score 35)

User: Andi, English=Pemula, Budget=<100jt, Timeline=>1 tahun, Student, Malaysia

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: GREETING                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Min, mau nanya soal kuliah di luar negeri                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI reads:                                                           │   │
│  │ • contact.name = "Andi"                                              │   │
│  │ • form_answers.country = "Malaysia"                                  │   │
│  │ • form_answers.english_level = "Pemula"                              │   │
│  │ • form_answers.budget = "<100 juta"                                  │   │
│  │ • lead_score = 35                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Malam kak Andi! Dari form yang kakak isi, tertarik kuliah di         │
│       Malaysia ya? Malaysia emang pilihan bagus, biaya lebih terjangkau    │
│       dan gak terlalu jauh dari rumah. Mau tau info apa dulu?              │
│                                                                             │
│  → State transition: GREETING → QUALIFYING                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Yang murah2 aja ada gak?                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Price sensitivity signal                                           │   │
│  │ • Score: stays at 35 (cold)                                          │   │
│  │                                                                       │   │
│  │ Route check: Score 35 < 40 → Route to COMMUNITY                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Ada kak! Malaysia punya beberapa opsi terjangkau. Beberapa uni       │
│       publik kayak UM, USM, UTM biayanya sekitar 30-50 juta per tahun.     │
│                                                                             │
│       Kak Andi, kami punya komunitas WhatsApp khusus info beasiswa dan     │
│       kuliah budget-friendly. Banyak tips dari alumni yang berhasil        │
│       dapet beasiswa.                                                       │
│                                                                             │
│       Join di sini ya: [Community Link]                                    │
│                                                                             │
│       Kalau nanti udah lebih siap dan mau konsultasi personal,             │
│       tinggal chat lagi aja!                                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI sets:                                                            │   │
│  │ • contact.notes = "Cold lead, budget concern, sent to community"     │   │
│  │ • contact.follow_up_date = +60 days                                  │   │
│  │ • contact.tags += ["community-member", "budget-sensitive"]           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Scenario D: University Question (Knowledge Base)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING (Mid-conversation)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: IELTS berapa sih buat masuk University of Melbourne?                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects university question:                                     │   │
│  │ • Keyword: "IELTS", "University of Melbourne"                        │   │
│  │ • Query ari_destinations WHERE university ILIKE '%melbourne%'        │   │
│  │                                                                       │   │
│  │ Result:                                                              │   │
│  │ {                                                                     │   │
│  │   country: "Australia",                                              │   │
│  │   university: "University of Melbourne",                             │   │
│  │   requirements: {                                                     │   │
│  │     ielts_min: 6.5,                                                  │   │
│  │     gpa_min: 3.0,                                                    │   │
│  │     deadline: "October 2026"                                         │   │
│  │   },                                                                  │   │
│  │   programs: ["MBA", "Engineering", "Arts"],                          │   │
│  │   notes: "Ranked #1 in Australia"                                    │   │
│  │ }                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: University of Melbourne butuh minimal IELTS 6.5 overall, dengan      │
│       minimal 6.0 di setiap section. Untuk beberapa program kayak Law      │
│       atau Medicine bisa lebih tinggi, sekitar 7.0.                        │
│                                                                             │
│       Melbourne Uni ranked #1 di Australia btw! Deadline aplikasi          │
│       biasanya Oktober untuk intake tahun depan.                           │
│                                                                             │
│       Kakak udah punya skor IELTS berapa?                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Scenario E: Handoff to Human

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATE: QUALIFYING                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER: Kalau saya punya masalah visa sebelumnya, masih bisa apply gak?     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ARI detects:                                                         │   │
│  │ • Complex topic: "masalah visa"                                      │   │
│  │ • Outside ARI scope (legal/immigration)                              │   │
│  │ • Trigger: HANDOFF                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ARI: Pertanyaan bagus kak! Untuk masalah visa sebelumnya, ini perlu       │
│       dibahas langsung sama konsultan kami yang lebih paham soal           │
│       imigrasi. Bentar ya, saya sambungkan ke tim kami.                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ System:                                                              │   │
│  │ • ari_conversation.state = "handoff"                                 │   │
│  │ • Toggle AI → Human in CRM                                           │   │
│  │ • Notification sent to available consultant                          │   │
│  │                                                                       │   │
│  │ Consultant sees:                                                     │   │
│  │ "Lead asking about previous visa issues. Needs human help."          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [5 minutes later - Human consultant takes over]                           │
│                                                                             │
│  CONSULTANT: Halo kak! Saya Rina dari Eagle. Soal masalah visa             │
│              sebelumnya, bisa cerita lebih detail? Tergantung kasusnya,    │
│              ada beberapa opsi yang bisa kita explore bareng.              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Value Summary

### What Data is Used Where

| Data Point | Greeting | Qualifying | Scoring | Booking | Scheduling | Handoff |
|------------|:--------:|:----------:|:-------:|:-------:|:----------:|:-------:|
| contact.name | HIGH | LOW | - | LOW | LOW | HIGH |
| form_answers.country | HIGH | MEDIUM | HIGH | - | - | HIGH |
| form_answers.english_level | LOW | MEDIUM | HIGH | - | - | HIGH |
| form_answers.budget | LOW | MEDIUM | HIGH | - | - | HIGH |
| form_answers.timeline | LOW | MEDIUM | HIGH | HIGH | - | HIGH |
| context.documents | - | HIGH | HIGH | MEDIUM | - | HIGH |
| ari_destinations | - | HIGH | LOW | - | - | HIGH |
| lead_score | LOW | MEDIUM | HIGH | HIGH | - | HIGH |
| message_history | LOW | HIGH | MEDIUM | LOW | LOW | HIGH |
| ari_config.persona | HIGH | HIGH | HIGH | HIGH | HIGH | - |

### Scoring Impact by Response

| User Says | Score Impact | Why |
|-----------|--------------|-----|
| "IELTS 7.5" | +30 | Mahir level English confirmed |
| "Dokumen lengkap" | +20 | All documents ready |
| "Mau cepat" / "urgent" | +10 | High intent signal |
| "Masih bingung" | -5 | Uncertainty |
| "Belum yakin" | -10 | Low intent signal |
| "Budget terbatas" | -5 | Financial constraint |
| Asks specific university question | +5 | Research = serious intent |
| Quick response (<5 min) | +5 | High engagement |

---

## State Transition Rules

```
FROM          TO              CONDITION
─────────────────────────────────────────────────────────

FAST-TRACK (highest priority):
greeting   → booking         Score >= 85 AND english = Mahir AND docs ready
                             (SKIP qualifying entirely!)

NORMAL FLOW:
greeting   → qualifying      Otherwise (after first exchange)

QUALIFYING SUB-STATES:
qualifying → qualifying      Score < 60 AND more questions needed
                             (2a: Collect → 2b: Answer Questions)
qualifying → booking         question_count >= 2 AND score >= 80 (ultimatum)
qualifying → community       question_count >= 2 AND score < 60 (ultimatum)
qualifying → handoff         Complex question (visa/legal) detected

AFTER QUALIFYING:
booking    → payment         User accepts consultation offer
booking    → community       User hesitates, offer community as fallback
payment    → scheduling      Payment confirmed
payment    → payment         Payment pending (reminder after 12h)
payment    → handoff         Payment failed 2x
scheduling → handoff         Appointment confirmed
handoff    → completed       Consultation done

ESCAPE HATCHES (any state):
ANY        → handoff         User requests human ("mau bicara sama orang")
ANY        → handoff         Visa/legal/complaint detected
ANY        → community       User says "masih mikir" or hesitates 2x
```

**Visual Decision Tree:**

```
                    ┌───────────────────┐
                    │ First Message     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ FAST-TRACK CHECK  │
                    │ Score>=85 + Mahir │
                    │ + Docs Ready?     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │ YES                           │ NO
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ STRAIGHT TO     │             │ QUALIFYING      │
    │ BOOKING OFFER   │             │ (2a → 2b → 2c)  │
    │ "Siap banget!"  │             │ Max 2 questions │
    └────────┬────────┘             └────────┬────────┘
             │                               │
             │                    ┌──────────┴──────────┐
             │                    │ After 2 Questions   │
             │                    │ (ULTIMATUM)         │
             │                    └──────────┬──────────┘
             │                               │
             │              ┌────────────────┼────────────────┐
             │              │ Score>=80      │ Score 60-79    │ Score<60
             │              ▼                ▼                ▼
             │    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
             │    │ BOOKING     │   │ CHOICE:     │   │ COMMUNITY   │
             │    │ OFFER       │   │ Book OR     │   │ LINK        │
             │    │ (direct)    │   │ Community   │   │ (nurture)   │
             └────┴──────┬──────┘   └──────┬──────┘   └──────┬──────┘
                         │                 │                 │
                         │     ┌───────────┴───────────┐     │
                         │     │ User chooses          │     │
                         │     │ Book / Community      │     │
                         │     └───────────┬───────────┘     │
                         │                 │                 │
                         ├─────────────────┤                 │
                         │ Accepts Book    │ Chooses         │
                         ▼                 │ Community       │
               ┌─────────────────┐         │                 │
               │ PAYMENT         │         └─────────────────┤
               │ (Midtrans)      │                           │
               └────────┬────────┘                           │
                        │                                    │
               ┌────────▼────────┐                           │
               │ SCHEDULING      │                           │
               │ (Pick slot)     │                           │
               └────────┬────────┘                           │
                        │                                    │
               ┌────────▼────────┐              ┌────────────▼────────────┐
               │ HANDOFF         │              │ COMMUNITY NURTURE       │
               │ (Consultant     │              │ + Follow-up in 30 days  │
               │ takes over)     │              │                         │
               └─────────────────┘              └─────────────────────────┘
```

---

*Last updated: 2026-01-20*
