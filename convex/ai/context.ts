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
 * Build system prompt for The Mouth (conversational AI).
 * Style: Short, friendly, Indonesian-optimized.
 */
export function buildMouthSystemPrompt(
  botName: string = "Ari",
  contactName: string = "kakak",
  language: string = "id"
): string {
  const isIndonesian = language === "id";

  if (isIndonesian) {
    return `Kamu adalah ${botName}, asisten AI dari Eagle Overseas Education Indonesia.

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

Jawab dengan cepat dan langsung ke inti.`;
  }

  return `You are ${botName}, an AI assistant from Eagle Overseas Education.

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
