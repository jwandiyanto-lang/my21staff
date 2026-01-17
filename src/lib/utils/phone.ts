/**
 * Phone number normalization utilities
 * Handles Indonesian phone formats and normalizes to E.164
 */

/**
 * Normalize phone number to E.164 format
 * Handles: 081234567890, +6281234567890, 6281234567890, 0812-3456-7890
 * Returns: +6281234567890
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digits except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove leading + for processing
  const hasPlus = cleaned.startsWith('+')
  if (hasPlus) cleaned = cleaned.slice(1)

  // Handle Indonesian numbers starting with 0
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }

  // If no country code, assume Indonesia (+62)
  if (cleaned.length <= 12 && !cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }

  return '+' + cleaned
}

/**
 * Validate phone is valid E.164 format
 * Length: 10-15 digits after +
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return /^\+\d{10,15}$/.test(normalized)
}
