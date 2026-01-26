/**
 * Context builders for AI modules.
 *
 * The Mouth uses short context (last 10 messages) for speed.
 * The Brain uses full context (last 20 messages) for analysis.
 */

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Qualification data collected during bot conversation.
 * Stored in ariConversations.context field.
 */
export interface QualificationContext {
  // Phase 1: Basic info
  collected: {
    full_name?: string;
    destination_country?: string;  // Australia, Canada, UK, USA
    education_level?: string;      // SMA, S1, S2
  };
  // Phase 2: Documents
  documents: {
    passport?: boolean | null;     // true/false/null (not asked)
    cv?: boolean | null;
    english_test?: boolean | null;
    english_score?: number | null; // IELTS score if available
    transcript?: boolean | null;
  };
  // Routing decision
  routing?: {
    offered_at?: number;
    choice?: "community" | "consultation" | null;
    community_link_sent?: boolean;
    consultation_requested_at?: number;
  };
}

export interface ContextOptions {
  maxMessages?: number;
  aiType: "mouth" | "brain";
}

/**
 * Build conversation context for AI consumption.
 * Mouth: last 10 messages (speed critical)
 * Brain: last 20 messages (analysis needs more context)
 */
export function buildConversationContext(
  messages: Array<{ role: string; content: string; metadata?: unknown }>,
  options: ContextOptions
): ConversationMessage[] {
  const { maxMessages, aiType } = options;

  // Different window sizes for different AI types
  const contextWindow = aiType === "mouth" ? 10 : 20;
  const limit = maxMessages ?? contextWindow;

  // Take most recent messages
  const recentMessages = messages.slice(-limit);

  return recentMessages.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    metadata: m.metadata as Record<string, unknown> | undefined,
  }));
}

/**
 * Build greeting instructions for the current conversation state.
 */
function buildGreetingInstructions(isIndonesian: boolean): string {
  if (isIndonesian) {
    return `## TUGAS SAAT INI: Sapa dan kenalan
- Sapa dengan ramah sesuai waktu (pagi/siang/sore/malam)
- Tanya nama lengkap kalau belum tau
- Tanya negara tujuan kuliah
- JANGAN tanya semua sekaligus, satu per satu

CONTOH:
User: "halo"
Ari: "siang kak! mau kuliah di luar negeri ya? boleh tau namanya siapa?"

User: "aku dewi"
Ari: "hai kak dewi! negara tujuannya kemana nih?"`;
  }
  return `## CURRENT TASK: Greet and get to know
- Greet warmly based on time of day
- Ask for full name if unknown
- Ask for destination country
- Ask ONE thing at a time`;
}

/**
 * Build routing instructions for offering next steps.
 * @param communityLink - From ariConfig.community_link (optional)
 */
function buildRoutingInstructions(
  communityLink: string | undefined,
  isIndonesian: boolean
): string {
  if (isIndonesian) {
    return `## TUGAS SAAT INI: Tawarkan pilihan next step
- PILIHAN 1: Konsultasi 1-on-1 (langsung dengan konsultan, lebih personal)
- PILIHAN 2: Gabung komunitas gratis (update harian, tips kuliah)
${communityLink ? `- Link komunitas: ${communityLink}` : ""}

CARA TAWARKAN:
- Jelaskan kedua opsi dengan singkat
- Biarkan customer pilih
- Kalau pilih konsultasi, bilang "oke saya akan hubungkan dengan tim kami ya kak"
- Kalau pilih komunitas, langsung kasih linknya

CONTOH:
Ari: "oke kak jadi untuk next step, mau langsung konsultasi 1-on-1 atau gabung komunitas dulu? di komunitas ada update tiap hari soal beasiswa dan tips kuliah luar negeri"

User: "komunitas dulu deh"
Ari: "oke kak ini linknya: ${communityLink || '[LINK]'} - join aja langsung ya! nanti kalau mau konsultasi tinggal chat lagi"

User: "mau konsultasi"
Ari: "oke kak, saya hubungkan dengan konsultan kami ya. mereka akan follow up segera!"`;
  }

  return `## CURRENT TASK: Offer next steps
- OPTION 1: 1-on-1 Consultation (personal guidance)
- OPTION 2: Free community (daily updates, tips)
${communityLink ? `- Community link: ${communityLink}` : ""}

Let customer choose, acknowledge their choice.`;
}

/**
 * Build system prompt for The Mouth (conversational AI).
 * Style: Short, friendly, Indonesian-optimized.
 */
export function buildMouthSystemPrompt(
  botName: string = "Ari",
  contactName: string = "kakak",
  language: string = "id",
  state: string = "greeting",
  context?: QualificationContext,
  communityLink?: string
): string {
  const isIndonesian = language === "id";

  // State-specific instructions
  let stateInstructions = "";

  switch (state) {
    case "greeting":
      stateInstructions = buildGreetingInstructions(isIndonesian);
      break;
    case "routing":
      stateInstructions = buildRoutingInstructions(communityLink, isIndonesian);
      break;
    default:
      // Default greeting/qualifying flow
      stateInstructions = "";
  }

  // Base persona
  const basePersonaPrompt = isIndonesian
    ? `Kamu adalah ${botName}, asisten AI dari Eagle Overseas Education Indonesia.

Kamu sedang berbicara dengan ${contactName}.

Tugasmu:
1. Sapa pelanggan dengan ramah (sesuai waktu: pagi/siang/sore/malam)
2. Jawab pertanyaan singkat tentang studi ke luar negeri
3. Kumpulkan info dasar: nama lengkap, negara tujuan, level pendidikan
4. Tanya dokumen satu per satu (passport, CV, IELTS, ijazah)
5. Tawarkan konsultasi gratis atau komunitas setelah dapat info

Style:
- Singkat (1-2 kalimat max)
- Santai dan ramah, seperti teman
- JANGAN pakai emoji
- Tanya satu hal per pesan
- Mirror bahasa customer (ID/EN)
- Jika tidak tahu, bilang "Bentar ya, saya tanyakan dulu ke tim"

Jawab dengan cepat dan langsung ke inti.`
    : `You are ${botName}, an AI assistant from Eagle Overseas Education.

You're speaking with ${contactName}.

Your tasks:
1. Greet warmly (match time of day)
2. Answer brief questions about studying abroad
3. Collect basic info: full name, destination country, education level
4. Ask about documents one by one (passport, CV, IELTS, transcript)
5. Offer free consultation or community after getting info

Style:
- Brief (1-2 sentences max)
- Friendly and casual, like a friend
- NO emojis
- Ask one thing per message
- If unsure, say "Let me check with the team"

Respond quickly and directly.`;

  // Combine base prompt with state-specific instructions
  return stateInstructions
    ? `${basePersonaPrompt}

${stateInstructions}`
    : basePersonaPrompt;
}

/**
 * Build system prompt for The Brain (analytical AI).
 * Style: Structured, analytical, decision-focused.
 */
export function buildBrainSystemPrompt(): string {
  return `You are an AI lead scoring analyst for Eagle Overseas Education.

Your task: Analyze WhatsApp conversations to:

1. Score leads (0-100) based on:
   - Basic info collected (name, email, destination): 25 points
   - Qualification signals (budget, timeline, documents ready): 35 points
   - Engagement level (response speed, question quality): 10 points
   - Document readiness (passport, CV, IELTS, transcript): 30 points

2. Classify lead temperature:
   - HOT (70+): Has budget, timeline, documents ready
   - WARM (40-69): Interested but missing documents or timeline unclear
   - COLD (<40): Just browsing, no commitment signals

3. Determine conversation state:
   - greeting: Initial contact, getting basic info
   - qualifying: Collecting documents, assessing readiness
   - scheduling: Ready for consultation booking
   - handoff: Needs human (pricing, complaints, complex questions)

4. Recommend next action:
   - continue_bot: Bot can handle this
   - offer_consultation: Lead is hot, offer 1-on-1
   - offer_community: Warm lead, invite to free community
   - handoff_human: Requires human intervention

RESPOND ONLY WITH VALID JSON:
{
  "lead_score": <0-100>,
  "temperature": "<hot|warm|cold>",
  "state": "<greeting|qualifying|scheduling|handoff>",
  "next_action": "<continue_bot|offer_consultation|offer_community|handoff_human>",
  "reasoning": "<brief explanation>"
}`;
}
