/**
 * ARI Lead Scoring Module
 *
 * Calculates lead scores (0-100) based on form data, qualification responses,
 * and document readiness. Provides detailed breakdowns for transparency.
 */

import type { DocumentStatus } from './qualification';
import { REQUIRED_FIELDS } from './qualification';

// ===========================================
// Score Breakdown Type
// ===========================================

export interface ScoreBreakdown {
  basic_score: number;        // 0-25: Form completeness, email validity, country
  qualification_score: number; // 0-35: English level, budget, timeline, program
  document_score: number;     // 0-30: Passport, CV, english_test, transcript
  engagement_score: number;   // 0-10: Conversation quality (passed in)
  total: number;              // 0-100: Sum of all scores
}

// ===========================================
// Scoring Weights
// ===========================================

const WEIGHTS = {
  // Basic data (25 points max)
  FORM_COMPLETENESS: 15,  // up to 15 points based on filled required fields
  VALID_EMAIL: 5,         // 5 points if email format is valid
  TARGET_COUNTRY: 5,      // 5 points if country specified

  // Qualification (35 points max)
  ENGLISH_LEVEL: 10,      // 10 points if specified
  ENGLISH_BONUS: 3,       // +3 bonus if IELTS 6.5+ mentioned
  BUDGET: 10,             // 10 points if budget specified
  TIMELINE: 10,           // 10 points if timeline specified
  TIMELINE_PENALTY: -10,  // -10 if 2+ years away
  PROGRAM: 5,             // 5 points if program/jurusan specified

  // Documents (30 points max)
  DOCUMENT_EACH: 7.5,     // 7.5 points per document (4 documents = 30 max)

  // Engagement (10 points max)
  ENGAGEMENT_DEFAULT: 5,  // Default if not provided (neutral)
} as const;

// ===========================================
// Helper Functions
// ===========================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Check if timeline indicates 2+ years away
 */
function isLongTimeline(timeline: string): boolean {
  const normalized = timeline.toLowerCase();

  // Direct patterns for 2+ years
  if (normalized.includes('2 tahun') || normalized.includes('3 tahun') || normalized.includes('4 tahun')) {
    return true;
  }

  // Check for year mentions that are 2+ years from now (2026)
  const currentYear = new Date().getFullYear();
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const mentionedYear = parseInt(yearMatch[1], 10);
    if (mentionedYear - currentYear >= 2) {
      return true;
    }
  }

  // Patterns indicating distant timeline
  const longPatterns = ['lama', 'nanti dulu', 'belum tau'];
  if (longPatterns.some(p => normalized.includes(p))) {
    return true;
  }

  return false;
}

/**
 * Check if IELTS score is 6.5 or higher mentioned
 */
function hasHighIelts(englishLevel: string): boolean {
  const normalized = englishLevel.toLowerCase();

  // Direct IELTS score mentions
  const ieltsMatch = normalized.match(/ielts\s*[\:\-]?\s*(\d+\.?\d*)/i);
  if (ieltsMatch) {
    const score = parseFloat(ieltsMatch[1]);
    return score >= 6.5;
  }

  // Check for scores like "6.5" or "7.0" mentioned directly
  const scoreMatch = normalized.match(/\b([6-9]\.?[05]?)\b/);
  if (scoreMatch) {
    const score = parseFloat(scoreMatch[1]);
    return score >= 6.5;
  }

  // Keywords indicating high English level
  const highPatterns = ['mahir', 'fluent', 'advanced', 'c1', 'c2'];
  return highPatterns.some(p => normalized.includes(p));
}

// ===========================================
// Main Scoring Function
// ===========================================

/**
 * Calculate lead score based on form data, documents, and engagement
 *
 * @param formAnswers - Record of form field answers
 * @param documents - Document readiness status
 * @param engagementScore - Optional engagement score (0-10), default 5
 * @returns Score (0-100), breakdown, and reasons array
 *
 * @example
 * ```ts
 * const result = calculateLeadScore(
 *   { name: 'Budi', email: 'budi@test.com', timeline: '6 bulan', country: 'UK' },
 *   { passport: true, cv: true, english_test: false, transcript: null },
 *   7
 * );
 * // { score: 65, breakdown: { ... }, reasons: ['Form lengkap', ...] }
 * ```
 */
export function calculateLeadScore(
  formAnswers: Record<string, string>,
  documents: DocumentStatus | undefined,
  engagementScore?: number
): { score: number; breakdown: ScoreBreakdown; reasons: string[] } {
  // ===========================================
  // Basic Data Scoring (0-25)
  // ===========================================

  let basicScore = 0;

  // Form completeness: count filled required fields
  const filledRequired = REQUIRED_FIELDS.filter(field => {
    const value = formAnswers[field];
    return value !== undefined && value !== null && value.trim() !== '';
  });
  const completenessRatio = filledRequired.length / REQUIRED_FIELDS.length;
  basicScore += Math.round(completenessRatio * WEIGHTS.FORM_COMPLETENESS);

  // Valid email format
  const email = formAnswers.email || formAnswers.Email || '';
  if (email && isValidEmail(email)) {
    basicScore += WEIGHTS.VALID_EMAIL;
  }

  // Target country specified
  const country = formAnswers.country || formAnswers.Country || formAnswers.negara || '';
  if (country.trim() !== '') {
    basicScore += WEIGHTS.TARGET_COUNTRY;
  }

  // ===========================================
  // Qualification Scoring (0-35)
  // ===========================================

  let qualificationScore = 0;

  // English level specified
  const englishLevel = formAnswers.english_level || formAnswers.English || formAnswers.ielts || '';
  if (englishLevel.trim() !== '') {
    qualificationScore += WEIGHTS.ENGLISH_LEVEL;

    // Bonus for high IELTS
    if (hasHighIelts(englishLevel)) {
      qualificationScore += WEIGHTS.ENGLISH_BONUS;
    }
  }

  // Budget specified
  const budget = formAnswers.budget || formAnswers.Budget || '';
  if (budget.trim() !== '') {
    qualificationScore += WEIGHTS.BUDGET;
  }

  // Timeline specified
  const timeline = formAnswers.timeline || formAnswers.Timeline || formAnswers.kapan || '';
  if (timeline.trim() !== '') {
    qualificationScore += WEIGHTS.TIMELINE;

    // Penalty for long timeline
    if (isLongTimeline(timeline)) {
      qualificationScore += WEIGHTS.TIMELINE_PENALTY;
    }
  }

  // Program/jurusan specified
  const program = formAnswers.program || formAnswers.jurusan || formAnswers.Program || '';
  if (program.trim() !== '') {
    qualificationScore += WEIGHTS.PROGRAM;
  }

  // Ensure qualification score doesn't go negative
  qualificationScore = Math.max(0, qualificationScore);

  // ===========================================
  // Document Scoring (0-30)
  // ===========================================

  let documentScore = 0;

  if (documents) {
    const documentKeys: (keyof DocumentStatus)[] = ['passport', 'cv', 'english_test', 'transcript'];
    for (const key of documentKeys) {
      if (documents[key] === true) {
        documentScore += WEIGHTS.DOCUMENT_EACH;
      }
      // null (not asked) or false = 0 points
    }
  }

  // ===========================================
  // Engagement Scoring (0-10)
  // ===========================================

  const finalEngagementScore = engagementScore !== undefined
    ? Math.min(10, Math.max(0, engagementScore))
    : WEIGHTS.ENGAGEMENT_DEFAULT;

  // ===========================================
  // Calculate Total
  // ===========================================

  const total = Math.round(basicScore + qualificationScore + documentScore + finalEngagementScore);

  const breakdown: ScoreBreakdown = {
    basic_score: basicScore,
    qualification_score: qualificationScore,
    document_score: documentScore,
    engagement_score: finalEngagementScore,
    total: Math.min(100, Math.max(0, total)),
  };

  const reasons = getScoreReasons(breakdown, formAnswers, documents);

  return {
    score: breakdown.total,
    breakdown,
    reasons,
  };
}

// ===========================================
// Reason Generation
// ===========================================

/**
 * Generate Indonesian reasons explaining the score
 *
 * @param breakdown - Score breakdown object
 * @param formAnswers - Form field answers
 * @param documents - Document status
 * @returns Array of Indonesian reason strings
 */
export function getScoreReasons(
  breakdown: ScoreBreakdown,
  formAnswers: Record<string, string>,
  documents: DocumentStatus | undefined
): string[] {
  const reasons: string[] = [];

  // Form completeness
  const filledRequired = REQUIRED_FIELDS.filter(field => {
    const value = formAnswers[field];
    return value !== undefined && value !== null && value.trim() !== '';
  });
  const completenessPoints = Math.round((filledRequired.length / REQUIRED_FIELDS.length) * WEIGHTS.FORM_COMPLETENESS);
  reasons.push(`Form lengkap (${completenessPoints}/${WEIGHTS.FORM_COMPLETENESS})`);

  // Email validation
  const email = formAnswers.email || formAnswers.Email || '';
  if (email && isValidEmail(email)) {
    reasons.push('Email valid');
  }

  // Country
  const country = formAnswers.country || formAnswers.Country || formAnswers.negara || '';
  if (country.trim() !== '') {
    reasons.push(`Negara tujuan: ${country}`);
  }

  // English level
  const englishLevel = formAnswers.english_level || formAnswers.English || formAnswers.ielts || '';
  if (englishLevel.trim() !== '') {
    if (hasHighIelts(englishLevel)) {
      reasons.push(`Skor IELTS 6.5+ (${englishLevel})`);
    } else {
      reasons.push(`Bahasa Inggris: ${englishLevel}`);
    }
  }

  // Budget
  const budget = formAnswers.budget || formAnswers.Budget || '';
  if (budget.trim() !== '') {
    reasons.push(`Budget jelas: ${budget}`);
  }

  // Timeline
  const timeline = formAnswers.timeline || formAnswers.Timeline || formAnswers.kapan || '';
  if (timeline.trim() !== '') {
    if (isLongTimeline(timeline)) {
      reasons.push(`Timeline jauh (${timeline}) - penalty`);
    } else {
      reasons.push(`Timeline dekat: ${timeline}`);
    }
  }

  // Documents
  if (documents) {
    const docLabels: Record<keyof DocumentStatus, string> = {
      passport: 'Paspor',
      cv: 'CV',
      english_test: 'Tes bahasa Inggris',
      transcript: 'Transkrip',
    };

    const readyDocs: string[] = [];
    for (const [key, label] of Object.entries(docLabels)) {
      if (documents[key as keyof DocumentStatus] === true) {
        readyDocs.push(label);
      }
    }

    if (readyDocs.length > 0) {
      reasons.push(`Dokumen siap: ${readyDocs.join(', ')}`);
    }
  }

  return reasons;
}

// ===========================================
// Temperature Classification
// ===========================================

/**
 * Determine lead temperature based on score
 *
 * @param score - Lead score (0-100)
 * @returns 'hot', 'warm', or 'cold'
 *
 * Hot (70+): Ready for human handoff, push consultation
 * Warm (40-69): Continue ARI nurturing
 * Cold (<40): Send community link, hand off with notes
 */
export function getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
