import { z } from 'zod'
import { normalizePhone, isValidPhone } from '@/lib/utils/phone'

export const contactRowSchema = z.object({
  name: z.string().max(255).optional().nullable(),
  phone: z.string().refine(
    (val) => isValidPhone(val),
    { message: 'Invalid phone number format' }
  ),
  email: z.string().email().optional().nullable().or(z.literal('')),
  tags: z.string().optional().nullable(), // Comma-separated
  lead_status: z.enum(['new', 'hot', 'warm', 'cold', 'converted', 'lost'])
    .optional()
    .nullable()
    .default('new'),
  lead_score: z.coerce.number().int().min(0).max(100).optional().nullable().default(0),
})

export type ContactRow = z.infer<typeof contactRowSchema>

export interface ValidatedRow {
  row: number
  data: Record<string, unknown>
  valid: boolean
  errors: { path: string; message: string }[]
  normalized?: {
    phone: string
    tags: string[]
  }
}

/**
 * Validate a single CSV row and normalize data
 */
export function validateContactRow(data: Record<string, unknown>, rowIndex: number): ValidatedRow {
  const result = contactRowSchema.safeParse(data)

  if (result.success) {
    const phone = normalizePhone(data.phone as string)
    const tagsString = (data.tags as string) || ''
    const tags = tagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    return {
      row: rowIndex,
      data,
      valid: true,
      errors: [],
      normalized: { phone, tags }
    }
  }

  return {
    row: rowIndex,
    data,
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  }
}
