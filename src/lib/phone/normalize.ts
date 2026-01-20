import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

/**
 * Normalize phone number to E.164 format
 * @param phone - Phone number in any format
 * @param defaultCountry - Default country if no country code (default: ID for Indonesia)
 * @returns E.164 formatted phone number (e.g., +6281234567890) or null if invalid
 */
export function normalizePhone(phone: string, defaultCountry: CountryCode = 'ID'): string | null {
  if (!phone) return null

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  if (!cleaned) return null

  // Handle Indonesian format: 0812 -> +62812
  if (cleaned.startsWith('0') && defaultCountry === 'ID') {
    const normalized = '+62' + cleaned.slice(1)
    return isValidPhone(normalized) ? normalized : null
  }

  // Handle already E.164 format
  if (cleaned.startsWith('+')) {
    return isValidPhone(cleaned) ? cleaned : null
  }

  // Handle 62xxx format (Indonesian without +)
  if (cleaned.startsWith('62') && cleaned.length >= 10) {
    const normalized = '+' + cleaned
    return isValidPhone(normalized) ? normalized : null
  }

  // Try parsing with default country
  try {
    const parsed = parsePhoneNumber(cleaned, defaultCountry)
    if (parsed && isValidPhoneNumber(parsed.number)) {
      return parsed.format('E.164')
    }
  } catch {
    // Fall through to basic normalization
  }

  // Fallback: assume Indonesian if no country code and reasonable length
  if (cleaned.length >= 9 && cleaned.length <= 15) {
    const normalized = '+62' + cleaned
    return isValidPhone(normalized) ? normalized : null
  }

  return null
}

/**
 * Check if phone number is valid
 * @param phone - Phone number (preferably E.164 format)
 * @returns true if valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false

  try {
    // For E.164 format, just check basic structure
    if (phone.startsWith('+')) {
      const digits = phone.slice(1)
      return digits.length >= 8 && digits.length <= 15 && /^\d+$/.test(digits)
    }

    // For other formats, try parsing
    return isValidPhoneNumber(phone, 'ID')
  } catch {
    return false
  }
}

/**
 * Format phone for display
 * @param phone - E.164 phone number
 * @returns Formatted display string (e.g., +62 812-3456-7890)
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return ''

  try {
    const parsed = parsePhoneNumber(phone)
    if (parsed) {
      return parsed.formatInternational()
    }
  } catch {
    // Fall through
  }

  return phone
}
