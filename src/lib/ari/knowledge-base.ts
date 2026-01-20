/**
 * ARI Knowledge Base
 *
 * Query functions for university/destination data from ari_destinations table.
 * Provides destination lookup, matching, and formatting for AI prompts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ARIDestination } from './types';

// ===========================================
// Type Definitions
// ===========================================

/**
 * Destination data for AI prompt building
 * Simplified from ARIDestination for cleaner typing
 */
export interface Destination {
  id: string;
  country: string;
  city: string | null;
  university_name: string;
  requirements: {
    ielts_min?: number;
    gpa_min?: number;
    budget_min?: number;
    budget_max?: number;
    deadline?: string;
  };
  programs: string[];
  is_promoted: boolean;
  notes: string | null;
}

/**
 * Search criteria for finding matching destinations
 */
export interface SearchCriteria {
  country?: string;
  maxBudget?: number;
  minIelts?: number;
  program?: string;
}

/**
 * Result of university question detection
 */
export interface UniversityQuestionResult {
  isQuestion: boolean;
  country?: string;
}

// ===========================================
// Country Mapping
// ===========================================

/**
 * Map common country variations to standard names
 */
const COUNTRY_MAP: Record<string, string> = {
  // English variations
  uk: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  england: 'United Kingdom',
  britain: 'United Kingdom',
  us: 'United States',
  usa: 'United States',
  america: 'United States',
  'united states': 'United States',
  au: 'Australia',
  aussie: 'Australia',
  australia: 'Australia',
  nz: 'New Zealand',
  'new zealand': 'New Zealand',
  canada: 'Canada',
  sg: 'Singapore',
  singapore: 'Singapore',
  malaysia: 'Malaysia',
  japan: 'Japan',
  korea: 'South Korea',
  'south korea': 'South Korea',
  germany: 'Germany',
  netherlands: 'Netherlands',
  holland: 'Netherlands',
  // Indonesian variations
  inggris: 'United Kingdom',
  amerika: 'United States',
  kanada: 'Canada',
  jepang: 'Japan',
  belanda: 'Netherlands',
  jerman: 'Germany',
  singapura: 'Singapore',
};

/**
 * Normalize country name to standard format
 */
function normalizeCountry(input: string): string {
  const normalized = input.toLowerCase().trim();
  return COUNTRY_MAP[normalized] || input;
}

// ===========================================
// Query Functions
// ===========================================

/**
 * Get destinations for a specific country
 *
 * Returns destinations ordered by promotion status and priority.
 * Promoted destinations appear first.
 *
 * @param supabase - Supabase client
 * @param workspaceId - Workspace ID
 * @param country - Country name (case-insensitive, handles common variations)
 * @returns Array of destinations
 *
 * @example
 * ```ts
 * const destinations = await getDestinationsForCountry(supabase, workspaceId, 'UK');
 * // Returns all UK universities, promoted first
 * ```
 */
export async function getDestinationsForCountry(
  supabase: SupabaseClient,
  workspaceId: string,
  country?: string | null
): Promise<Destination[]> {
  if (!country) {
    return [];
  }

  const normalizedCountry = normalizeCountry(country);

  const { data, error } = await supabase
    .from('ari_destinations')
    .select('id, country, city, university_name, requirements, programs, is_promoted, notes')
    .eq('workspace_id', workspaceId)
    .ilike('country', normalizedCountry)
    .order('is_promoted', { ascending: false })
    .order('priority', { ascending: false });

  if (error) {
    console.error('[ARI KB] Failed to get destinations:', error);
    return [];
  }

  return (data || []) as Destination[];
}

/**
 * Find destinations matching search criteria
 *
 * Supports filtering by:
 * - Country (case-insensitive with variation mapping)
 * - Maximum budget
 * - Minimum IELTS score (user's score)
 * - Program interest (ILIKE search)
 *
 * @param supabase - Supabase client
 * @param workspaceId - Workspace ID
 * @param criteria - Search criteria object
 * @returns Matching destinations
 *
 * @example
 * ```ts
 * const matches = await findMatchingDestinations(supabase, workspaceId, {
 *   country: 'Australia',
 *   maxBudget: 50000000,
 *   minIelts: 6.0,
 * });
 * ```
 */
export async function findMatchingDestinations(
  supabase: SupabaseClient,
  workspaceId: string,
  criteria: SearchCriteria
): Promise<Destination[]> {
  let query = supabase
    .from('ari_destinations')
    .select('id, country, city, university_name, requirements, programs, is_promoted, notes')
    .eq('workspace_id', workspaceId);

  // Filter by country
  if (criteria.country) {
    const normalizedCountry = normalizeCountry(criteria.country);
    query = query.ilike('country', normalizedCountry);
  }

  // Filter by budget (user's max budget >= university's minimum)
  // We filter by budget_max to find universities within user's range
  if (criteria.maxBudget !== undefined) {
    query = query.lte('requirements->budget_min', criteria.maxBudget);
  }

  // Filter by IELTS (user's score >= university's minimum)
  if (criteria.minIelts !== undefined) {
    query = query.lte('requirements->ielts_min', criteria.minIelts);
  }

  // Order by promoted first, then priority
  query = query
    .order('is_promoted', { ascending: false })
    .order('priority', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[ARI KB] Failed to find matching destinations:', error);
    return [];
  }

  // Filter by program if specified (done in JS since arrays)
  let results = (data || []) as Destination[];

  if (criteria.program) {
    const programLower = criteria.program.toLowerCase();
    results = results.filter(dest =>
      dest.programs.some(p => p.toLowerCase().includes(programLower))
    );
  }

  return results;
}

/**
 * Get promoted destinations for proactive recommendations
 *
 * Returns top promoted destinations that the business wants to highlight.
 *
 * @param supabase - Supabase client
 * @param workspaceId - Workspace ID
 * @param limit - Maximum destinations to return (default: 3)
 * @returns Array of promoted destinations
 */
export async function getPromotedDestinations(
  supabase: SupabaseClient,
  workspaceId: string,
  limit: number = 3
): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('ari_destinations')
    .select('id, country, city, university_name, requirements, programs, is_promoted, notes')
    .eq('workspace_id', workspaceId)
    .eq('is_promoted', true)
    .order('priority', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ARI KB] Failed to get promoted destinations:', error);
    return [];
  }

  return (data || []) as Destination[];
}

// ===========================================
// Formatting Functions
// ===========================================

/**
 * Format a single destination for AI prompt
 *
 * Creates readable text with all relevant information.
 *
 * @param destination - Destination to format
 * @returns Formatted string
 *
 * @example
 * ```ts
 * formatDestinationInfo(dest)
 * // "- University of Melbourne, Melbourne, Australia
 * //    IELTS min: 6.5
 * //    Budget: Rp400-600 juta/tahun
 * //    Program: Business, IT, Engineering
 * //    Info: Scholarship available for Indonesian students"
 * ```
 */
export function formatDestinationInfo(destination: Destination): string {
  const parts: string[] = [];

  // University name and location
  const location = destination.city
    ? `${destination.city}, ${destination.country}`
    : destination.country;
  parts.push(`- ${destination.university_name}, ${location}`);

  // Requirements
  const req = destination.requirements;
  if (req.ielts_min !== undefined) {
    parts.push(`  IELTS min: ${req.ielts_min}`);
  } else {
    parts.push(`  IELTS min: tidak ditentukan`);
  }

  if (req.budget_min !== undefined || req.budget_max !== undefined) {
    const min = req.budget_min ? `Rp${formatBudget(req.budget_min)}` : '?';
    const max = req.budget_max ? `Rp${formatBudget(req.budget_max)}` : '?';
    parts.push(`  Budget: ${min}-${max} juta/tahun`);
  }

  if (req.deadline) {
    parts.push(`  Deadline: ${req.deadline}`);
  }

  // Programs
  if (destination.programs.length > 0) {
    parts.push(`  Program: ${destination.programs.join(', ')}`);
  }

  // Notes (scholarships, etc.)
  if (destination.notes) {
    parts.push(`  Info: ${destination.notes}`);
  }

  return parts.join('\n');
}

/**
 * Format budget number to millions (juta)
 */
function formatBudget(amount: number): string {
  // Assume amount is in IDR, convert to millions
  const millions = amount / 1000000;
  return millions.toFixed(0);
}

/**
 * Format multiple destinations for AI prompt
 *
 * Groups by country if multiple countries present.
 * Marks promoted destinations with [PROMO].
 *
 * @param destinations - Array of destinations
 * @returns Formatted string for AI prompt
 */
export function formatDestinationList(destinations: Destination[]): string {
  if (destinations.length === 0) {
    return 'Tidak ada data universitas untuk kriteria ini.';
  }

  // Group by country
  const byCountry = new Map<string, Destination[]>();
  for (const dest of destinations) {
    const existing = byCountry.get(dest.country) || [];
    existing.push(dest);
    byCountry.set(dest.country, existing);
  }

  const parts: string[] = [];

  byCountry.forEach((dests, country) => {
    if (byCountry.size > 1) {
      parts.push(`\n### ${country}`);
    }

    for (const dest of dests) {
      const prefix = dest.is_promoted ? '[PROMO] ' : '';
      parts.push(prefix + formatDestinationInfo(dest));
    }
  });

  return parts.join('\n');
}

// ===========================================
// Question Detection
// ===========================================

/**
 * University-related keywords in Indonesian and English
 */
const UNIVERSITY_KEYWORDS = [
  // Indonesian
  'universitas',
  'kampus',
  'kuliah',
  'perguruan tinggi',
  'syarat',
  'persyaratan',
  'biaya',
  'budget',
  'program',
  'jurusan',
  'beasiswa',
  'scholarship',
  // English
  'university',
  'college',
  'requirements',
  'cost',
  'tuition',
  'major',
  'degree',
];

/**
 * Country patterns to detect in messages
 */
const COUNTRY_PATTERNS = Object.keys(COUNTRY_MAP);

/**
 * Detect if a message is asking about universities
 *
 * Checks for university-related keywords and extracts country if mentioned.
 *
 * @param message - User's message
 * @returns Detection result with country if found
 *
 * @example
 * ```ts
 * detectUniversityQuestion('Berapa biaya kuliah di UK?')
 * // { isQuestion: true, country: 'United Kingdom' }
 *
 * detectUniversityQuestion('Halo')
 * // { isQuestion: false }
 * ```
 */
export function detectUniversityQuestion(message: string): UniversityQuestionResult {
  const normalized = message.toLowerCase();

  // Check for university keywords
  const hasKeyword = UNIVERSITY_KEYWORDS.some(kw => normalized.includes(kw));

  if (!hasKeyword) {
    return { isQuestion: false };
  }

  // Try to extract country
  let detectedCountry: string | undefined;

  for (const pattern of COUNTRY_PATTERNS) {
    if (normalized.includes(pattern)) {
      detectedCountry = COUNTRY_MAP[pattern];
      break;
    }
  }

  return {
    isQuestion: true,
    country: detectedCountry,
  };
}

// ===========================================
// Recommendation Generation
// ===========================================

/**
 * Generate natural Indonesian recommendation text
 *
 * Creates personalized recommendation based on destinations and user's budget.
 *
 * @param destinations - Available destinations
 * @param userBudget - User's budget in IDR (optional)
 * @returns Natural Indonesian recommendation text
 *
 * @example
 * ```ts
 * getRecommendationText(destinations, 500000000)
 * // "Berdasarkan budget kamu sekitar Rp500 juta/tahun, saya rekomendasikan..."
 * ```
 */
export function getRecommendationText(
  destinations: Destination[],
  userBudget?: number
): string {
  if (destinations.length === 0) {
    return 'Saya belum punya data universitas untuk kriteria ini. Mau coba negara lain?';
  }

  const parts: string[] = [];

  // Budget-based intro
  if (userBudget !== undefined) {
    const budgetMil = formatBudget(userBudget);
    parts.push(`Berdasarkan budget kamu sekitar Rp${budgetMil} juta/tahun, berikut rekomendasinya:`);
  } else {
    parts.push('Berikut beberapa pilihan universitas yang bagus:');
  }

  // Get promoted first, limit to 3
  const promoted = destinations.filter(d => d.is_promoted);
  const others = destinations.filter(d => !d.is_promoted);
  const toShow = [...promoted, ...others].slice(0, 3);

  // List universities
  for (const dest of toShow) {
    const location = dest.city ? `${dest.city}, ${dest.country}` : dest.country;
    let line = `- ${dest.university_name} (${location})`;

    if (dest.requirements.ielts_min) {
      line += ` - IELTS min ${dest.requirements.ielts_min}`;
    }

    if (dest.is_promoted && dest.notes) {
      line += ` - ${dest.notes}`;
    }

    parts.push(line);
  }

  // More options hint
  if (destinations.length > 3) {
    parts.push(`\nMasih ada ${destinations.length - 3} pilihan lain. Mau tau lebih detail yang mana?`);
  }

  return parts.join('\n');
}
