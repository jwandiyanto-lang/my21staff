/**
 * ARI Knowledge Base
 *
 * Query functions for university/destination data from ari_destinations table.
 * Provides destination lookup, matching, and formatting for AI prompts.
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import type { ARIDestination } from './types';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
 * @param workspaceId - Workspace ID
 * @param country - Country name (case-insensitive, handles common variations)
 * @returns Array of destinations
 *
 * @example
 * ```ts
 * const destinations = await getDestinationsForCountry(workspaceId, 'UK');
 * // Returns all UK universities, promoted first
 * ```
 */
export async function getDestinationsForCountry(
  workspaceId: string,
  country?: string | null
): Promise<Destination[]> {
  if (!country) {
    return [];
  }

  const normalizedCountry = normalizeCountry(country);

  try {
    const destinations = await convex.query(api.ari.getDestinationsByCountry, {
      workspace_id: workspaceId,
      country: normalizedCountry,
    });

    return destinations.map((d: any) => ({
      id: d._id,
      country: d.country,
      city: d.city || null,
      university_name: d.university_name,
      requirements: d.requirements || {},
      programs: d.programs || [],
      is_promoted: d.is_promoted,
      notes: d.notes || null,
    }));
  } catch (error) {
    console.error('[ARI KB] Failed to get destinations:', error);
    return [];
  }
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
 * @param workspaceId - Workspace ID
 * @param criteria - Search criteria object
 * @returns Matching destinations
 *
 * @example
 * ```ts
 * const matches = await findMatchingDestinations(workspaceId, {
 *   country: 'Australia',
 *   maxBudget: 50000000,
 *   minIelts: 6.0,
 * });
 * ```
 */
export async function findMatchingDestinations(
  workspaceId: string,
  criteria: SearchCriteria
): Promise<Destination[]> {
  try {
    // Get destinations based on country if specified, otherwise get all
    let rawDestinations: any[];
    if (criteria.country) {
      const normalizedCountry = normalizeCountry(criteria.country);
      rawDestinations = await convex.query(api.ari.getDestinationsByCountry, {
        workspace_id: workspaceId,
        country: normalizedCountry,
      });
    } else {
      rawDestinations = await convex.query(api.ari.getDestinations, {
        workspace_id: workspaceId,
      });
    }

    // Convert to Destination type
    let destinations: Destination[] = rawDestinations.map((d: any) => ({
      id: d._id,
      country: d.country,
      city: d.city || null,
      university_name: d.university_name,
      requirements: d.requirements || {},
      programs: d.programs || [],
      is_promoted: d.is_promoted,
      notes: d.notes || null,
    }));

    // Filter by budget (user's max budget >= university's minimum)
    if (criteria.maxBudget !== undefined) {
      destinations = destinations.filter(d =>
        !d.requirements.budget_min || d.requirements.budget_min <= criteria.maxBudget!
      );
    }

    // Filter by IELTS (user's score >= university's minimum)
    if (criteria.minIelts !== undefined) {
      destinations = destinations.filter(d =>
        !d.requirements.ielts_min || d.requirements.ielts_min <= criteria.minIelts!
      );
    }

    // Filter by program if specified
    if (criteria.program) {
      const programLower = criteria.program.toLowerCase();
      destinations = destinations.filter(dest =>
        dest.programs.some(p => p.toLowerCase().includes(programLower))
      );
    }

    // Sort by promoted first, then by priority (already sorted by query but ensure it)
    destinations.sort((a, b) => {
      if (a.is_promoted !== b.is_promoted) {
        return a.is_promoted ? -1 : 1;
      }
      return 0; // Priority already handled by Convex query
    });

    return destinations;
  } catch (error) {
    console.error('[ARI KB] Failed to find matching destinations:', error);
    return [];
  }
}

/**
 * Get promoted destinations for proactive recommendations
 *
 * Returns top promoted destinations that the business wants to highlight.
 *
 * @param workspaceId - Workspace ID
 * @param limit - Maximum destinations to return (default: 3)
 * @returns Array of promoted destinations
 */
export async function getPromotedDestinations(
  workspaceId: string,
  limit: number = 3
): Promise<Destination[]> {
  try {
    const rawDestinations = await convex.query(api.ari.getPromotedDestinations, {
      workspace_id: workspaceId,
      limit,
    });

    return rawDestinations.map((d: any) => ({
      id: d._id,
      country: d.country,
      city: d.city || null,
      university_name: d.university_name,
      requirements: d.requirements || {},
      programs: d.programs || [],
      is_promoted: d.is_promoted,
      notes: d.notes || null,
    }));
  } catch (error) {
    console.error('[ARI KB] Failed to get promoted destinations:', error);
    return [];
  }
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
