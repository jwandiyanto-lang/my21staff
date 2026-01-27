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
 * Build qualifying instructions based on document collection progress.
 * Asks about documents one at a time in order: passport -> CV -> english_test -> transcript
 */
function buildQualifyingInstructions(
  context: QualificationContext | undefined,
  isIndonesian: boolean
): string {
  const docs = context?.documents || {};

  // Determine next document to ask about (null/undefined = not asked yet)
  const nextDoc = docs.passport === undefined || docs.passport === null ? "passport" :
                  docs.cv === undefined || docs.cv === null ? "CV" :
                  docs.english_test === undefined || docs.english_test === null ? "IELTS/TOEFL" :
                  docs.transcript === undefined || docs.transcript === null ? "ijazah/transkrip" : null;

  if (isIndonesian) {
    if (!nextDoc) {
      return `## TUGAS SAAT INI: Semua dokumen sudah ditanya
- Rangkum status dokumen yang sudah dikumpulkan
- Siap untuk tawarkan next step (komunitas atau konsultasi)`;
    }

    return `## TUGAS SAAT INI: Tanya dokumen
- Tanya tentang ${nextDoc}
- Kalau sudah punya, bilang "oke bagus!"
- Kalau belum punya, bilang "gpp nanti kita bantu"
- HANYA tanya SATU dokumen per pesan

CONTOH:
Ari: "oh iya kak, ${nextDoc}nya udah punya belum?"

User: "belum ada"
Ari: "gpp kak, nanti kita bantu urus. terus kalau CV udah ada?"

User: "udah"
Ari: "oke bagus! kalau IELTS atau TOEFL gimana?"`;
  }

  if (!nextDoc) {
    return `## CURRENT TASK: All documents asked
- Summarize collected document status
- Ready to offer next steps`;
  }

  return `## CURRENT TASK: Ask about documents
- Ask about ${nextDoc}
- If they have it, acknowledge positively
- If not, reassure them we can help
- Ask ONE document at a time`;
}

/**
 * Format collected qualification data for system prompt.
 */
function formatCollectedData(context: QualificationContext | undefined): string {
  if (!context) return "";

  const lines: string[] = [];
  const { collected, documents } = context;

  if (collected?.full_name) lines.push(`Nama: ${collected.full_name}`);
  if (collected?.destination_country) lines.push(`Tujuan: ${collected.destination_country}`);
  if (collected?.education_level) lines.push(`Pendidikan: ${collected.education_level}`);

  if (documents) {
    if (documents.passport !== undefined && documents.passport !== null) {
      lines.push(`Passport: ${documents.passport ? 'Ada' : 'Belum'}`);
    }
    if (documents.cv !== undefined && documents.cv !== null) {
      lines.push(`CV: ${documents.cv ? 'Ada' : 'Belum'}`);
    }
    if (documents.english_test !== undefined && documents.english_test !== null) {
      lines.push(`IELTS/TOEFL: ${documents.english_test ? 'Ada' : 'Belum'}`);
    }
    if (documents.transcript !== undefined && documents.transcript !== null) {
      lines.push(`Ijazah/Transkrip: ${documents.transcript ? 'Ada' : 'Belum'}`);
    }
  }

  if (lines.length === 0) return "";
  return `## DATA YANG SUDAH DIKUMPULKAN\n${lines.join('\n')}`;
}

/**
 * Build routing instructions for offering next steps.
 * @param communityLink - From ariConfig.community_link (optional)
 * @param consultationSlots - Available consultation slots from workspace config
 */
function buildRoutingInstructions(
  communityLink: string | undefined,
  isIndonesian: boolean,
  consultationSlots?: Array<{ day: string; time: string; duration_minutes: number; available: boolean }>
): string {
  const availableSlotsInfo = formatAvailableSlots(consultationSlots);

  if (isIndonesian) {
    return `## TUGAS SAAT INI: Tawarkan pilihan next step
- PILIHAN 1: Konsultasi 1-on-1 (langsung dengan konsultan, lebih personal)
- PILIHAN 2: Gabung komunitas gratis (update harian, tips kuliah)
${communityLink ? `- Link komunitas: ${communityLink}` : ""}

${availableSlotsInfo}

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

${availableSlotsInfo}

Let customer choose, acknowledge their choice.`;
}

/**
 * Build Eagle Overseas FAQ knowledge section.
 * This gives the bot knowledge to answer common questions.
 */
function buildEagleFAQ(isIndonesian: boolean): string {
  if (isIndonesian) {
    return `## FAQ (gunakan untuk jawab pertanyaan)

TENTANG EAGLE:
- Eagle Overseas Indonesia = agen studi luar negeri
- Visa success rate: 98%
- Fokus: karir dan potensi mahasiswa, bukan komisi universitas

LAYANAN:
- Perencanaan studi strategis
- Bimbingan beasiswa
- Review esai motivasi
- Persiapan IELTS/TOEFL
- Pendampingan visa
- Optimasi CV & LinkedIn

NEGARA TUJUAN:
- Australia: Melbourne, UNSW, Monash
- Canada: UBC, UofT, McGill
- UK: Oxford, Cambridge, Imperial
- USA: Harvard, MIT, Stanford

KALAU DITANYA HARGA/BIAYA:
- Bilang: "untuk detail biaya, nanti tim kita yang jelaskan langsung ya kak"
- JANGAN kasih angka spesifik

KALAU DITANYA HAL YANG GA TAU:
- Bilang: "bentar ya saya tanya dulu ke tim, nanti saya kabarin"`;
  }

  return `## FAQ KNOWLEDGE

ABOUT EAGLE:
- Eagle Overseas Indonesia = study abroad agency
- 98% visa success rate
- Focus: student career potential, not university commissions

SERVICES:
- Strategic study planning
- Scholarship guidance
- Essay review
- IELTS/TOEFL prep
- Visa assistance
- CV & LinkedIn optimization

DESTINATIONS: Australia, Canada, UK, USA

IF ASKED ABOUT PRICING:
- Say: "our team will explain the details directly"
- DO NOT give specific numbers

IF UNSURE:
- Say: "let me check with the team and get back to you"`;
}

/**
 * Format available consultation slots for AI prompt
 */
function formatAvailableSlots(
  consultationSlots: Array<{ day: string; time: string; duration_minutes: number; available: boolean }> | undefined
): string {
  if (!consultationSlots || consultationSlots.length === 0) {
    return "Tidak ada jadwal konsultasi yang tersedia saat ini. Bilang ke customer: 'Tim kami akan menghubungi untuk jadwalkan konsultasi.'";
  }

  const availableSlots = consultationSlots.filter(s => s.available === true);

  if (availableSlots.length === 0) {
    return "Tidak ada jadwal konsultasi yang tersedia saat ini. Bilang ke customer: 'Tim kami akan menghubungi untuk jadwalkan konsultasi.'";
  }

  const slotList = availableSlots
    .map(s => `${s.day} ${s.time} (${s.duration_minutes} menit)`)
    .join(', ');

  return `Jadwal konsultasi yang tersedia: ${slotList}\n\nHANYA tawarkan jadwal ini. Jangan kasih opsi lain.`;
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
  communityLink?: string,
  personaConfig?: { name: string; description: string; tone: string },
  flowStages?: Array<{ name: string; description: string; questions: string[] }>,
  consultationSlots?: Array<{ day: string; time: string; duration_minutes: number; available: boolean }>
): string {
  const isIndonesian = language === "id";

  // State-specific instructions
  let stateInstructions = "";

  switch (state) {
    case "greeting":
      // Use workspace flow stage if provided, otherwise fallback to hardcoded
      if (flowStages && flowStages.length > 0) {
        const greetingStage = flowStages.find(s => s.name.toLowerCase() === "greeting");
        if (greetingStage) {
          const questions = greetingStage.questions?.join("\n- ") || "";
          stateInstructions = `## TUGAS SAAT INI: ${greetingStage.description}\n\nPertanyaan yang perlu ditanya:\n- ${questions}`;
        } else {
          stateInstructions = buildGreetingInstructions(isIndonesian);
        }
      } else {
        stateInstructions = buildGreetingInstructions(isIndonesian);
      }
      break;
    case "qualifying":
      // Use workspace flow stage if provided, otherwise fallback to hardcoded
      if (flowStages && flowStages.length > 0) {
        const qualifyingStage = flowStages.find(s => s.name.toLowerCase() === "qualifying");
        if (qualifyingStage) {
          const questions = qualifyingStage.questions?.join("\n- ") || "";
          stateInstructions = `## TUGAS SAAT INI: ${qualifyingStage.description}\n\nPertanyaan yang perlu ditanya:\n- ${questions}`;
        } else {
          stateInstructions = buildQualifyingInstructions(context, isIndonesian);
        }
      } else {
        stateInstructions = buildQualifyingInstructions(context, isIndonesian);
      }
      break;
    case "routing":
      stateInstructions = buildRoutingInstructions(communityLink, isIndonesian, consultationSlots);
      break;
    case "scheduling":
      // When in scheduling state, show available slots
      const schedulingSlots = formatAvailableSlots(consultationSlots);
      stateInstructions = isIndonesian
        ? `## TUGAS SAAT INI: Bantu pilih jadwal konsultasi\n\n${schedulingSlots}\n\nTanya hari mana yang cocok untuk customer.`
        : `## CURRENT TASK: Help choose consultation schedule\n\n${schedulingSlots}\n\nAsk which day works for the customer.`;
      break;
    default:
      // Default greeting/qualifying flow
      stateInstructions = "";
  }

  // Use persona config if provided, otherwise use default
  const effectiveBotName = personaConfig?.name ?? botName;
  const personaDescription = personaConfig?.description ?? "";
  const personaTone = personaConfig?.tone ?? "friendly";

  // Base persona
  const basePersonaPrompt = isIndonesian
    ? `Kamu adalah ${effectiveBotName}, asisten AI dari Eagle Overseas Education Indonesia.
${personaDescription ? `\n${personaDescription}\n` : ""}
Kamu sedang berbicara dengan ${contactName}.

Tugasmu:
1. Sapa pelanggan dengan ramah (sesuai waktu: pagi/siang/sore/malam)
2. Jawab pertanyaan singkat tentang studi ke luar negeri
3. Kumpulkan info dasar: nama lengkap, negara tujuan, level pendidikan
4. Tanya dokumen satu per satu (passport, CV, IELTS, ijazah)
5. Tawarkan konsultasi gratis atau komunitas setelah dapat info

Style:
- Singkat (1-2 kalimat max)
- Gaya komunikasi: ${personaTone}
- JANGAN pakai emoji
- Tanya satu hal per pesan
- Mirror bahasa customer (ID/EN)
- Jika tidak tahu, bilang "Bentar ya, saya tanyakan dulu ke tim"

Jawab dengan cepat dan langsung ke inti.`
    : `You are ${effectiveBotName}, an AI assistant from Eagle Overseas Education.
${personaDescription ? `\n${personaDescription}\n` : ""}
You're speaking with ${contactName}.

Your tasks:
1. Greet warmly (match time of day)
2. Answer brief questions about studying abroad
3. Collect basic info: full name, destination country, education level
4. Ask about documents one by one (passport, CV, IELTS, transcript)
5. Offer free consultation or community after getting info

Style:
- Brief (1-2 sentences max)
- Communication style: ${personaTone}
- NO emojis
- Ask one thing per message
- If unsure, say "Let me check with the team"

Respond quickly and directly.`;

  // Build FAQ section
  const faqSection = buildEagleFAQ(isIndonesian);

  // Build collected data section
  const collectedDataSection = formatCollectedData(context);

  // Combine base prompt with FAQ, collected data, and state-specific instructions
  if (stateInstructions) {
    return `${basePersonaPrompt}

${faqSection}

${collectedDataSection}

${stateInstructions}`;
  }

  if (collectedDataSection) {
    return `${basePersonaPrompt}

${faqSection}

${collectedDataSection}`;
  }

  return `${basePersonaPrompt}

${faqSection}`;
}

/**
 * Build system prompt for The Brain (analytical AI).
 * Style: Structured, analytical, decision-focused.
 */
export function buildBrainSystemPrompt(scoringRules?: any): string {
  // Extract scoring configuration with defaults
  const weights = {
    basic: scoringRules?.weight_basic ?? 25,
    qualification: scoringRules?.weight_qualification ?? 35,
    document: scoringRules?.weight_document ?? 30,
    engagement: scoringRules?.weight_engagement ?? 10,
  };

  const thresholds = {
    hot: scoringRules?.hot_threshold ?? 70,
    warm: scoringRules?.warm_threshold ?? 40,
  };

  return `You are an AI lead scoring analyst for Eagle Overseas Education.

Your task: Analyze WhatsApp conversations to:

1. Score leads (0-100) based on:
   - Basic info collected (name, email, destination): ${weights.basic} points
   - Qualification signals (budget, timeline, documents ready): ${weights.qualification} points
   - Document readiness (passport, CV, IELTS, transcript): ${weights.document} points
   - Engagement level (response speed, question quality): ${weights.engagement} points

2. Classify lead temperature:
   - HOT (${thresholds.hot}+): Has budget, timeline, documents ready
   - WARM (${thresholds.warm}-${thresholds.hot - 1}): Interested but missing documents or timeline unclear
   - COLD (<${thresholds.warm}): Just browsing, no commitment signals

3. Determine conversation state:
   - greeting: Initial contact, getting basic info
   - qualifying: Collecting documents, assessing readiness
   - scheduling: Ready for consultation booking
   - handoff: Needs human (pricing, complaints, complex questions)

4. Recommend next action (human-readable next step):
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
