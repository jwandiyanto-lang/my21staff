/**
 * ARI Form Validation and Qualification
 *
 * Identifies missing form fields and generates follow-up questions
 * for intelligent lead qualification.
 */

// ===========================================
// Required Fields Definition
// ===========================================

/**
 * Fields required for qualification
 * These must be collected before proceeding to scoring
 */
export const REQUIRED_FIELDS = [
  'name',
  'email',
  'english_level',
  'budget',
  'timeline',
  'country',
] as const;

/**
 * Important but not blocking fields
 * Nice to have for better qualification
 */
export const IMPORTANT_FIELDS = [
  'activity',
  'notes',
] as const;

export type RequiredField = typeof REQUIRED_FIELDS[number];
export type ImportantField = typeof IMPORTANT_FIELDS[number];

// ===========================================
// Missing Field Detection
// ===========================================

/**
 * Result of checking for missing fields
 */
export interface MissingFieldsResult {
  required: RequiredField[];
  important: ImportantField[];
}

/**
 * Get list of missing form fields
 *
 * Checks form answers against required and important fields.
 * Empty strings are considered missing.
 *
 * @param formAnswers - Form data record
 * @returns Object with required and important missing fields
 *
 * @example
 * ```ts
 * getMissingFields({ name: 'Budi', email: '' })
 * // { required: ['email', 'english_level', 'budget', 'timeline', 'country'], important: ['activity', 'notes'] }
 * ```
 */
export function getMissingFields(formAnswers: Record<string, string>): MissingFieldsResult {
  const isMissing = (field: string): boolean => {
    const value = formAnswers[field];
    return value === undefined || value === null || value.trim() === '';
  };

  return {
    required: REQUIRED_FIELDS.filter(isMissing) as RequiredField[],
    important: IMPORTANT_FIELDS.filter(isMissing) as ImportantField[],
  };
}

/**
 * Check if all required fields are complete
 *
 * @param formAnswers - Form data record
 * @returns true if all required fields have values
 */
export function hasAllRequiredFields(formAnswers: Record<string, string>): boolean {
  const { required } = getMissingFields(formAnswers);
  return required.length === 0;
}

// ===========================================
// Field Labels
// ===========================================

/**
 * Indonesian labels for form fields
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'nama lengkap',
  email: 'alamat email',
  english_level: 'kemampuan bahasa Inggris',
  budget: 'budget',
  timeline: 'kapan mau mulai kuliah',
  country: 'negara tujuan',
  activity: 'status (kerja/kuliah)',
  notes: 'informasi tambahan',
};

/**
 * Get Indonesian label for a field name
 *
 * @param fieldName - Field name (e.g., 'english_level')
 * @returns Indonesian label (e.g., 'kemampuan bahasa Inggris')
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ');
}

// ===========================================
// Follow-up Questions
// ===========================================

/**
 * Natural Indonesian follow-up questions for each field
 */
const FOLLOW_UP_QUESTIONS: Record<string, string> = {
  name: 'Boleh tau nama lengkapnya siapa kak?',
  email: 'Email yang aktif apa kak? Buat kirim info lebih lanjut.',
  english_level: 'Kalau bahasa Inggris, udah di level mana kak? Pemula, menengah, atau udah mahir?',
  budget: 'Budget untuk kuliah kira-kira berapa kak? Nanti saya carikan yang cocok.',
  timeline: 'Rencananya mau berangkat kapan kak? Tahun ini atau tahun depan?',
  country: 'Negara tujuannya kemana kak? UK, Australia, atau yang lain?',
  activity: 'Sekarang lagi kerja atau masih kuliah kak?',
  notes: 'Ada info tambahan yang mau diceritakan kak?',
};

/**
 * Get follow-up question for a missing field
 *
 * @param missingField - Field name to ask about
 * @returns Natural Indonesian question string
 *
 * @example
 * ```ts
 * getFollowUpQuestion('budget')
 * // 'Budget untuk kuliah kira-kira berapa kak? Nanti saya carikan yang cocok.'
 * ```
 */
export function getFollowUpQuestion(missingField: string): string {
  return FOLLOW_UP_QUESTIONS[missingField] || `Boleh tau ${getFieldLabel(missingField)}-nya kak?`;
}

// ===========================================
// Document Readiness Tracking
// ===========================================

/**
 * Document readiness status
 * null = not asked yet
 * true = has the document
 * false = doesn't have the document
 */
export interface DocumentStatus {
  passport: boolean | null;
  cv: boolean | null;
  english_test: boolean | null;
  transcript: boolean | null;
}

/**
 * Initial document status (all unknown)
 */
export const INITIAL_DOCUMENT_STATUS: DocumentStatus = {
  passport: null,
  cv: null,
  english_test: null,
  transcript: null,
};

/**
 * Document question definitions
 */
const DOCUMENT_QUESTIONS: Array<{ key: keyof DocumentStatus; question: string }> = [
  {
    key: 'passport',
    question: 'Paspor udah punya belum kak?',
  },
  {
    key: 'cv',
    question: 'CV atau resume udah siap kak?',
  },
  {
    key: 'english_test',
    question: 'Udah punya skor IELTS atau TOEFL kak? Atau masih rencana mau ambil?',
  },
  {
    key: 'transcript',
    question: 'Transkrip akademik dari kampus/sekolah udah ada kak?',
  },
];

/**
 * Get all document questions
 *
 * @returns Array of document questions with keys
 */
export function getDocumentQuestions(): Array<{ key: keyof DocumentStatus; question: string }> {
  return DOCUMENT_QUESTIONS;
}

/**
 * Parse user response to determine document status
 *
 * Recognizes common Indonesian affirmative/negative responses.
 *
 * @param response - User's text response
 * @returns true (has), false (doesn't have), or null (unclear)
 *
 * @example
 * ```ts
 * parseDocumentResponse('udah ada') // true
 * parseDocumentResponse('belum') // false
 * parseDocumentResponse('mungkin') // null
 * ```
 */
export function parseDocumentResponse(response: string): boolean | null {
  const normalized = response.toLowerCase().trim();

  // Positive indicators (has the document)
  const positivePatterns = [
    'sudah',
    'udah',
    'ada',
    'punya',
    'yes',
    'iya',
    'ya',
    'siap',
    'ready',
    'done',
    'ok',
    'oke',
  ];

  // Negative indicators (doesn't have)
  const negativePatterns = [
    'belum',
    'tidak',
    'gak',
    'no',
    'nggak',
    'engga',
    'enggak',
    'ga',
    'blm',
    'tdk',
  ];

  // Check for positive match
  for (const pattern of positivePatterns) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }

  // Check for negative match
  for (const pattern of negativePatterns) {
    if (normalized.includes(pattern)) {
      return false;
    }
  }

  // Unclear response
  return null;
}

/**
 * Update document status with new value
 *
 * Returns new object (immutable pattern).
 *
 * @param current - Current document status
 * @param key - Document key to update
 * @param value - New value (true/false)
 * @returns Updated document status
 */
export function updateDocumentStatus(
  current: DocumentStatus,
  key: keyof DocumentStatus,
  value: boolean
): DocumentStatus {
  return {
    ...current,
    [key]: value,
  };
}

/**
 * Get next document question to ask
 *
 * Returns the question for the first document with null status.
 *
 * @param status - Current document status
 * @returns Question string or null if all asked
 *
 * @example
 * ```ts
 * getNextDocumentQuestion({ passport: true, cv: null, english_test: null, transcript: null })
 * // 'CV atau resume udah siap kak?'
 * ```
 */
export function getNextDocumentQuestion(status: DocumentStatus): string | null {
  for (const doc of DOCUMENT_QUESTIONS) {
    if (status[doc.key] === null) {
      return doc.question;
    }
  }
  return null;
}

/**
 * Get the key of the next document to ask about
 *
 * @param status - Current document status
 * @returns Document key or null if all asked
 */
export function getNextDocumentKey(status: DocumentStatus): keyof DocumentStatus | null {
  for (const doc of DOCUMENT_QUESTIONS) {
    if (status[doc.key] === null) {
      return doc.key;
    }
  }
  return null;
}

/**
 * Check if all documents have been asked about
 *
 * @param status - Current document status
 * @returns true if all documents have been asked
 */
export function allDocumentsAsked(status: DocumentStatus): boolean {
  return Object.values(status).every(v => v !== null);
}

/**
 * Get document readiness summary
 *
 * @param status - Current document status
 * @returns Summary object with counts
 */
export function getDocumentSummary(status: DocumentStatus): {
  ready: number;
  notReady: number;
  unknown: number;
} {
  let ready = 0;
  let notReady = 0;
  let unknown = 0;

  for (const value of Object.values(status)) {
    if (value === true) ready++;
    else if (value === false) notReady++;
    else unknown++;
  }

  return { ready, notReady, unknown };
}
