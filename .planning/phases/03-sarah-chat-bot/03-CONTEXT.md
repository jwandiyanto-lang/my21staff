# Phase 3: Sarah Chat Bot - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Natural conversation handling with data extraction — Sarah (Gemini 2.5 Flash) responds to WhatsApp messages, collects lead information through conversational flow, scores lead quality, and detects when qualification is complete for handoff.

This phase delivers the conversational AI that handles initial customer engagement, extracting structured data while maintaining a warm, helpful persona.

</domain>

<decisions>
## Implementation Decisions

### Conversation Personality & Tone
- **Persona:** Friendly intern (Sarah) — warm, helpful, not pushy or robotic
- **Language:** Indonesian by default (casual: Halo, Hai, Sip, Sama-sama, Kakak)
- **Auto-switch:** Detects English messages and switches language automatically
- **Message Length:** Short, readable messages (not verbose)
- **Emoji Usage:** Sparingly (1-2 max per message)
- **Tone:** Curious, supportive, encouraging — "Wah paham banget..." "Betul tuh..."
- **Character Limit:** Under 140 chars per message (WhatsApp best practice)
- **No Hard Selling:** Focus on understanding, not pushing sales

### Data Extraction (5 Fields)
- **Collection Approach:** ONE question per message, wait for response before next question
- **Fields to Extract:**
  1. **Name** (5 pts) — "Boleh tau nama kakak siapa?"
  2. **Business Type** (10 pts) — "Bisnisnya di bidang apa ya kak?"
  3. **Team Size** (15 pts) — "Kalau handle chat/CS, tim ada berapa orang?"
  4. **Pain Points** (20 pts) — "Ada nggak challenge yang sering kakak alamin? Misal slow response, miss message, dll?"
  5. **Goals** (10 pts) — "Terus harapannya apa sih pakai my21staff?"
- **Total Qualifying Points:** 60
- **Skip Logic:** Don't re-ask already-answered fields
- **Empathy:** Show understanding for pain points with context-aware responses

### Lead Scoring System
- **Score Range:** 0-100 points
- **Components:**
  - Basic Data: 25 pts (name + business_type + goals)
  - Team Size: 20 pts (≥3 people = 20pts, 2 people = 15pts, 1 person = 10pts)
  - Pain Points: 30 pts (urgency_high = 30, medium = 20, low = 10)
  - Engagement: 25 pts (responsive = 15, asks_questions = 10)
- **Lead Temperature:**
  - **Hot (70-100):** Immediate handoff to consultant
  - **Warm (40-69):** Nurture, answer questions, then handoff
  - **Cold (0-39):** Marketing blast, no immediate handoff
- **Pain Point Urgency Detection:**
  - High: "overwhelmed", "miss message", "slow response", "complaint", "lost customer"
  - Medium: "busy", "need help", "growth", "expanding", "manual"
  - Low: "curious", "checking", "maybe", "someday"

### State Machine Flow
- **States:** `greeting` → `qualifying` → `scoring` → `handoff`/`completed`
- **Greeting State:** Time-based greeting (Selamat pagi/siang/sore/malam), introduce Sarah, ask ONE open question
- **Qualifying State:** Collect 5 fields sequentially, one question per message
- **Scoring State:** Calculate score, determine temperature, route to handoff or marketing
- **Handoff State:** Transfer hot/warm leads to consultant with full context
- **Completed State:** Terminal state for cold leads or finished conversations

### Routing Decisions
- **Hot Lead (≥70 score):** Immediate handoff with message: "Sip! Data sudah lengkap. Konsultan kami akan segera hubungi kakak ya."
- **Warm Lead (40-69):** Continue conversation, answer questions, then handoff after 5 messages or when no more questions
- **Cold Lead (<40):** Close with: "Oke siap! Kalau ada pertanyaan, langsung chat aja ya kak." → Add to marketing blast
- **User Requests Human:** Immediate handoff regardless of score (keywords: "human", "person", "sales", "consultant")

### Conversation Memory & Context
- **Storage:** Store conversation state, extracted data, and score in Convex
- **Context Preservation:** Remember conversation history across messages
- **Multi-day Support:** Handle conversations that span multiple days
- **Returning Contacts:** Detect returning users, resume from last state (don't re-ask completed fields)
- **Timeout Handling:**
  - No response in 24h → Send follow-up: "Halo kak, masih tertarik ngobrol tentang my21staff?"
  - No response in 48h → Mark as cold, add to marketing blast

### Edge Case Handling
- **Technical Questions During Qualifying:** Give brief answer (1-2 sentences), return to data collection
- **Not Interested Keywords:** "tidak tertarik", "no thanks", "ga jadi" → Close politely, tag as "not_interested"
- **Invalid/Spam Messages:** Ignore, log for review, don't respond
- **Stale Leads:** Qualifying timeout (5 days) → auto-mark cold, scoring timeout (3 days) → auto-handoff

### Integration Points
- **Gemini 2.5 Flash:** Conversational AI model for responses
- **Convex Database:** Store conversation state, extracted data, lead scores
- **Kapso WhatsApp API:** Send messages, receive inbound messages
- **Consultant Notification:** On hot lead handoff, notify consultant with full context (contact info, Sarah data, score breakdown, pain points summary, WhatsApp deep link)

### Claude's Discretion
- Exact message formatting and variations (as long as tone/length guidelines are followed)
- Empathy response variations based on specific pain point details
- Follow-up question phrasing variations
- Error message formatting for technical issues
- Logging and metrics tracking implementation

</decisions>

<specifics>
## Specific Ideas

**Reference Documents:**
- Full persona: `business_21/03_bots/sarah-persona.md`
- Detailed flow: `business_21/03_bots/sarah-detailed-flow.md`

**Key Behaviors:**
- "Wah paham banget..." "Betul tuh..." — Show empathy for pain points
- "Sip!" — Positive acknowledgment (Indonesian casual)
- "Kakak" — Respectful way to address users (Indonesian)
- Time-based greetings: Selamat pagi/siang/sore/malam

**Language Detection Patterns:**
- Indonesian: `/^halo|^hai|^selamat|^kak|ada|nggak|gak|ya|yah|sih/`
- English: `/^hi|^hello|^hey|yeah|okay|sure|thanks/`
- Default to Indonesian if ambiguous

**Example Hot Lead Flow:**
```
User: Halo
Sarah: Selamat siang! 👋 Sarah disini. Bisnis kakak ngelola sendiri atau ada team ya?
User: Ada team, 5 orang
Sarah: Oh nice! Bisnisnya di bidang apa kak?
User: Jualan fashion online
Sarah: Keren! 🛍️ Kalau handle chat customer service, sekarang tim ada berapa orang?
User: 2 orang sering kewalahan
Sarah: Paham banget, kakak sering miss message ya?
User: Iya apalagi jam sibuk
Sarah: Betul tuh. Terus harapannya apa sih pakai my21staff?
User: Pengen bisa auto reply dan assign ke tim
Sarah: Sip! Data sudah lengkap. Konsultan kami akan segera hubungi kakak ya untuk bahas solusinya.
```

**Never Give Specific Prices:**
- Refer pricing questions to consultant
- "Nanti konsultan kita yang jelasin lebih detail ya."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Phase 3 focuses purely on conversational AI with data extraction.

**Future Phases Will Handle:**
- Phase 4: Lead Database (Kapso → Convex sync)
- Phase 5: Grok Manager Bot (Analysis + insights)
- Phase 6: Dashboard (Visual display of leads)
- Phase 7: Handoff Workflow (Notification system)

</deferred>

---

*Phase: 03-sarah-chat-bot*
*Context gathered: 2026-01-30*
