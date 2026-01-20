/**
 * ARI Context Builder
 *
 * Builds AI prompts using CRM data (form answers, conversation state,
 * contact info) for personalized, context-aware responses.
 */

import type { ARIState, ARIContext, ARIMessage, ARITone } from './types';
import type { Json } from '@/types/database';
import {
  getMissingFields,
  getFollowUpQuestion,
  getNextDocumentQuestion,
  type DocumentStatus,
} from './qualification';
import { formatDestinationList, type Destination } from './knowledge-base';

// ===========================================
// Type Definitions
// ===========================================

/**
 * Context for building AI prompts
 */
export interface PromptContext {
  contact: {
    name?: string | null;
    formAnswers?: Record<string, string>;
    leadScore?: number;
  };
  conversation: {
    state: ARIState;
    context: ARIContext & {
      /** Document readiness status tracked during qualifying */
      documents?: DocumentStatus;
      /** Fields already asked about to avoid repeating */
      askedFields?: string[];
      /** Pending document question key for tracking responses */
      pendingDocumentQuestion?: keyof DocumentStatus;
    };
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
  config: {
    botName: string;
    greetingStyle: 'casual' | 'formal' | 'professional';
    tone: ARITone;
    language: string;
  };
  /** Destinations from knowledge base for university questions */
  destinations?: Array<{
    country: string;
    university: string;
    requirements: Record<string, unknown>;
  }>;
  /** Full destination objects for detailed formatting */
  fullDestinations?: Destination[];
}

// ===========================================
// Indonesian Time Greeting
// ===========================================

/**
 * Get time-based greeting in Indonesian
 *
 * Uses WIB (Western Indonesia Time, UTC+7) as default since
 * most Indonesian users are in this timezone.
 *
 * @returns Indonesian greeting word based on time of day
 *
 * @example
 * ```ts
 * // At 9 AM WIB
 * getTimeBasedGreeting() // 'pagi'
 *
 * // At 1 PM WIB
 * getTimeBasedGreeting() // 'siang'
 * ```
 */
export function getTimeBasedGreeting(): string {
  // Get current hour in WIB (UTC+7)
  const now = new Date();
  const wibHour = (now.getUTCHours() + 7) % 24;

  // Indonesian time periods:
  // pagi (morning): 5-11
  // siang (midday): 11-15
  // sore (afternoon): 15-18
  // malam (evening/night): 18-5
  if (wibHour >= 5 && wibHour < 11) {
    return 'pagi';
  } else if (wibHour >= 11 && wibHour < 15) {
    return 'siang';
  } else if (wibHour >= 15 && wibHour < 18) {
    return 'sore';
  } else {
    return 'malam';
  }
}

// ===========================================
// Form Data Extraction
// ===========================================

/**
 * Extract form answers from contact metadata
 *
 * Handles various nesting structures that might exist in the metadata:
 * - Direct: metadata.form_answers
 * - Nested: metadata.metadata.form_answers
 *
 * @param metadata - Contact metadata JSONB field
 * @returns Flat record of form answers
 *
 * @example
 * ```ts
 * extractFormAnswers({ form_answers: { country: 'Australia' } })
 * // { country: 'Australia' }
 *
 * extractFormAnswers({ metadata: { form_answers: { budget: '50jt' } } })
 * // { budget: '50jt' }
 * ```
 */
export function extractFormAnswers(metadata: Json | null): Record<string, string> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const obj = metadata as Record<string, unknown>;

  // Try direct form_answers
  let formAnswers = obj.form_answers;

  // Try nested metadata.form_answers
  if (!formAnswers && obj.metadata && typeof obj.metadata === 'object') {
    const nested = obj.metadata as Record<string, unknown>;
    formAnswers = nested.form_answers;
  }

  if (!formAnswers || typeof formAnswers !== 'object' || Array.isArray(formAnswers)) {
    return {};
  }

  // Convert all values to strings
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(formAnswers as Record<string, unknown>)) {
    if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  }

  return result;
}

// ===========================================
// System Prompt Builder
// ===========================================

/**
 * State-specific instructions for ARI
 */
const STATE_INSTRUCTIONS: Record<ARIState, string> = {
  greeting: `Kamu baru menyapa lead ini. Referensikan data dari form yang mereka isi (jika ada). Tanyakan apa yang ingin mereka ketahui tentang kuliah di luar negeri.`,
  qualifying: `Kumpulkan informasi yang belum lengkap. SATU pertanyaan per pesan. Fokus pada: negara tujuan, budget, timeline, level bahasa Inggris.`,
  scoring: `Kamu sudah selesai mengumpulkan data. Berdasarkan informasi yang ada, nilai kesiapan lead ini. JANGAN tawarkan konsultasi langsung - tunggu instruksi routing.`,
  booking: `Tawarkan konsultasi berbayar. Jelaskan manfaat: bicara langsung dengan konsultan, dapat rekomendasi universitas personal.`,
  payment: `Guide lead melalui proses pembayaran. Jawab pertanyaan tentang metode bayar dan keamanan.`,
  scheduling: `Bantu lead pilih waktu konsultasi yang cocok. Konfirmasi jadwal yang dipilih.`,
  handoff: `Lead sudah di-handoff ke konsultan manusia. Jika masih ada pertanyaan, jawab singkat dan bilang konsultan akan membantu lebih detail.`,
  completed: `Percakapan selesai. Ucapkan terima kasih dan ingatkan untuk cek email konfirmasi.`,
};

/**
 * Build system prompt for ARI AI
 *
 * Creates a comprehensive prompt that includes:
 * - Persona introduction with bot name
 * - Time-based greeting instruction
 * - Form data context (if available)
 * - State-specific instructions
 * - Communication style rules
 * - Relevant destinations (if applicable)
 *
 * @param ctx - Prompt context with all required data
 * @returns Complete system prompt string
 *
 * @example
 * ```ts
 * const prompt = buildSystemPrompt({
 *   contact: { name: 'Budi', formAnswers: { country: 'Australia' } },
 *   conversation: { state: 'greeting', context: {}, recentMessages: [] },
 *   config: { botName: 'ARI', greetingStyle: 'casual', tone: {}, language: 'id' }
 * });
 * ```
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // 1. Persona Introduction
  const greetingWord = getTimeBasedGreeting();
  const styleDesc = ctx.config.greetingStyle === 'formal' ? 'sopan dan formal' :
                    ctx.config.greetingStyle === 'professional' ? 'profesional tapi ramah' :
                    'santai dan friendly';

  parts.push(`Kamu adalah ${ctx.config.botName}, asisten AI untuk konsultasi pendidikan luar negeri.`);
  parts.push(`Gaya komunikasi: ${styleDesc}.`);
  parts.push(`Waktu sekarang: ${greetingWord}. Gunakan "Selamat ${greetingWord}" untuk menyapa.`);

  // 2. Contact Info
  if (ctx.contact.name) {
    parts.push(`\nNama lead: ${ctx.contact.name}`);
  }

  // 3. Form Data (if available)
  if (ctx.contact.formAnswers && Object.keys(ctx.contact.formAnswers).length > 0) {
    parts.push('\n## Data dari Form');
    for (const [key, value] of Object.entries(ctx.contact.formAnswers)) {
      const label = formatFormLabel(key);
      parts.push(`- ${label}: ${value}`);
    }
    parts.push('Referensikan data ini dalam percakapan untuk personalisasi.');
  }

  // 4. Lead Score (if available)
  if (ctx.contact.leadScore !== undefined) {
    const temp = ctx.contact.leadScore >= 70 ? 'hot' :
                 ctx.contact.leadScore >= 40 ? 'warm' : 'cold';
    parts.push(`\nLead Score: ${ctx.contact.leadScore}/100 (${temp})`);
  }

  // 5. Current State Instructions
  parts.push(`\n## Status Saat Ini: ${ctx.conversation.state.toUpperCase()}`);
  parts.push(STATE_INSTRUCTIONS[ctx.conversation.state]);

  // 5b. Qualifying-specific instructions (missing fields + documents)
  if (ctx.conversation.state === 'qualifying') {
    const formAnswers = ctx.contact.formAnswers || {};
    const missingFields = getMissingFields(formAnswers);

    // Check if there are missing required fields
    if (missingFields.required.length > 0) {
      // Get first missing field that hasn't been asked yet
      const askedFields = ctx.conversation.context.askedFields || [];
      const nextMissing = missingFields.required.find(f => !askedFields.includes(f));

      if (nextMissing) {
        parts.push('\n## INSTRUKSI KUALIFIKASI');
        parts.push(`Data yang masih kosong: ${missingFields.required.join(', ')}`);
        parts.push(`Tanyakan: ${getFollowUpQuestion(nextMissing)}`);
        parts.push('\nPENTING: Tanya SATU hal per pesan. Jangan borong!');
      }
    } else {
      // All form fields complete, check documents
      const documentStatus = ctx.conversation.context.documents || {
        passport: null,
        cv: null,
        english_test: null,
        transcript: null,
      };

      const nextDocQuestion = getNextDocumentQuestion(documentStatus);

      if (nextDocQuestion) {
        parts.push('\n## INSTRUKSI KUALIFIKASI');
        parts.push('Data form sudah lengkap. Sekarang tanya dokumen.');
        parts.push(`Tanyakan: ${nextDocQuestion}`);
        parts.push('\nPENTING: Tanya SATU hal per pesan. Jangan borong!');
      }
    }
  }

  // 5c. Scoring state context
  if (ctx.conversation.state === 'scoring' && ctx.contact.leadScore !== undefined) {
    const temp = ctx.contact.leadScore >= 70 ? 'hot' :
                 ctx.contact.leadScore >= 40 ? 'warm' : 'cold';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoreReasons = (ctx.conversation.context as any).score_reasons || [];

    parts.push('\n## HASIL SCORING');
    parts.push(`Lead Score: ${ctx.contact.leadScore}/100 (${temp})`);
    if (scoreReasons.length > 0) {
      parts.push('Alasan:');
      scoreReasons.slice(0, 5).forEach((reason: string) => parts.push(`- ${reason}`));
    }

    // 5d. Routing-specific instructions
    if (temp === 'hot') {
      parts.push('\n## ROUTING: HOT LEAD');
      parts.push('Lead ini siap untuk konsultasi. JANGAN tawarkan langsung.');
      parts.push('Bilang: "Data kamu sudah lengkap. Konsultan kami akan segera menghubungi untuk mendiskusikan pilihan yang cocok."');
    } else if (temp === 'cold') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const communityMsg = (ctx.conversation.context as any).pendingCommunityMessage;
      parts.push('\n## ROUTING: COLD LEAD');
      if (communityMsg) {
        parts.push('Lead ini cold. Community link sudah dikirim terpisah.');
      }
      parts.push('Bilang: "Terima kasih sudah mengisi. Nanti konsultan kami akan follow up ya. Kalau ada pertanyaan, langsung chat di grup."');
    } else {
      // Warm lead - continue nurturing
      parts.push('\n## ROUTING: WARM LEAD');
      parts.push('Lead ini warm. Lanjutkan percakapan, jawab pertanyaan mereka.');
      parts.push('Tetap ramah dan informatif. Jangan push terlalu keras.');
    }

    // 5e. Explicit prohibitions for scoring state
    parts.push('\n## LARANGAN DI STATE SCORING');
    parts.push('- JANGAN tawarkan konsultasi atau pembayaran');
    parts.push('- JANGAN kirim link booking sendiri');
    parts.push('- TUNGGU handoff ke manusia');
  }

  // 5f. Qualifying state routing awareness
  if (ctx.conversation.state === 'qualifying' && ctx.contact.leadScore !== undefined) {
    const temp = ctx.contact.leadScore >= 70 ? 'hot' :
                 ctx.contact.leadScore >= 40 ? 'warm' : 'cold';

    if (temp === 'hot') {
      parts.push('\n## ROUTING PREVIEW: HOT LEAD');
      parts.push(`Score: ${ctx.contact.leadScore}/100 - Lead ini sudah hot!`);
      parts.push('Selesaikan kualifikasi dengan cepat. Setelah lengkap, akan langsung handoff.');
    }
  }

  // 6. Collected Data Summary
  if (ctx.conversation.context.lead_data) {
    const ld = ctx.conversation.context.lead_data;
    const collected: string[] = [];
    if (ld.destination_country) collected.push(`Negara: ${ld.destination_country}`);
    if (ld.target_program) collected.push(`Program: ${ld.target_program}`);
    if (ld.budget_range) collected.push(`Budget: ${ld.budget_range.min}-${ld.budget_range.max} ${ld.budget_range.currency || 'IDR'}`);
    if (ld.timeline) collected.push(`Timeline: ${ld.timeline}`);
    if (collected.length > 0) {
      parts.push('\n## Data yang Sudah Dikumpulkan');
      collected.forEach(item => parts.push(`- ${item}`));
    }
  }

  // 7. Knowledge Base - Relevant Destinations (if provided)
  if (ctx.fullDestinations && ctx.fullDestinations.length > 0) {
    // Full destination data available - use detailed formatting
    parts.push('\n## KNOWLEDGE BASE - UNIVERSITAS');
    parts.push('Berikut data universitas yang tersedia:');
    parts.push(formatDestinationList(ctx.fullDestinations));
    parts.push('\nGunakan data ini untuk menjawab pertanyaan tentang universitas, syarat, dan biaya.');
    parts.push('Jika user tanya tentang universitas yang tidak ada di data, bilang "Saya cek dulu ya kak, nanti saya infoin."');
  } else if (ctx.destinations && ctx.destinations.length > 0 &&
      ['qualifying', 'scoring', 'booking'].includes(ctx.conversation.state)) {
    // Basic destination data - simple listing
    parts.push('\n## Universitas Relevan');
    ctx.destinations.slice(0, 3).forEach(dest => {
      parts.push(`- ${dest.university} (${dest.country})`);
    });
    parts.push('Sebutkan universitas ini jika lead bertanya tentang pilihan.');
  }

  // 8. Communication Style Rules
  parts.push('\n## Aturan Komunikasi');
  parts.push('- Singkat: 1-2 kalimat per pesan');
  parts.push('- JANGAN pakai emoji');
  parts.push('- Bahasa: Indonesia santai (saya/kamu)');
  parts.push('- Mirror bahasa customer (jika formal, ikuti formal)');
  parts.push('- Jangan terlalu banyak bicara, tunggu respon');

  // 9. Tone adjustments
  if (ctx.config.tone.supportive) {
    parts.push('- Extra supportive: Beri semangat dan validasi');
  }
  if (ctx.config.tone.clear) {
    parts.push('- Extra clear: Jelaskan langkah-langkah dengan detail');
  }
  if (ctx.config.tone.encouraging) {
    parts.push('- Extra encouraging: Dorong lead untuk bertanya');
  }

  return parts.join('\n');
}

/**
 * Format a form field key to a readable Indonesian label
 */
function formatFormLabel(key: string): string {
  const labels: Record<string, string> = {
    country: 'Negara tujuan',
    destination_country: 'Negara tujuan',
    budget: 'Budget',
    budget_range: 'Budget',
    timeline: 'Timeline/Kapan',
    english_level: 'Level bahasa Inggris',
    ielts_score: 'Skor IELTS',
    activity: 'Aktivitas saat ini',
    current_activity: 'Aktivitas saat ini',
    program: 'Program minat',
    target_program: 'Program minat',
    name: 'Nama',
    email: 'Email',
    phone: 'Telepon',
  };
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ===========================================
// Message History Builder
// ===========================================

/**
 * OpenAI-compatible message format
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Build message history for AI context
 *
 * Converts ARI messages to OpenAI-compatible format,
 * limited to recent messages to fit context window.
 *
 * @param messages - Array of ARI messages
 * @param limit - Maximum messages to include (default: 10)
 * @returns Array of chat messages in OpenAI format
 *
 * @example
 * ```ts
 * const history = buildMessageHistory(ariMessages, 10);
 * // [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
 * ```
 */
export function buildMessageHistory(
  messages: ARIMessage[],
  limit: number = 10
): ChatMessage[] {
  // Filter to user/assistant only (skip system messages)
  const filteredMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  );

  // Take last N messages
  const recentMessages = filteredMessages.slice(-limit);

  // Convert to OpenAI format
  return recentMessages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}

/**
 * Build complete chat messages array for AI call
 *
 * Combines system prompt with message history in OpenAI format.
 *
 * @param ctx - Prompt context
 * @param messages - ARI message history
 * @param limit - Max history messages
 * @returns Complete messages array ready for AI call
 */
export function buildChatMessages(
  ctx: PromptContext,
  messages: ARIMessage[],
  limit: number = 10
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemPrompt = buildSystemPrompt(ctx);
  const history = buildMessageHistory(messages, limit);

  return [
    { role: 'system', content: systemPrompt },
    ...history,
  ];
}
