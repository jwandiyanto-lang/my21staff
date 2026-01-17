import { z, ZodError, ZodSchema } from 'zod'
import { NextResponse } from 'next/server'

export { z }

/**
 * Validates request body against a Zod schema
 * Returns parsed data on success, or NextResponse error on failure
 */
export async function validateBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T> | NextResponse> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    throw error
  }
}

/**
 * Common validation patterns
 */
export const patterns = {
  // Indonesian phone: +62 followed by 9-12 digits
  phone: z.string().regex(/^\+?62\d{9,12}$/, 'Invalid Indonesian phone number'),

  // General phone: starts with + followed by 10-15 digits
  phoneGeneral: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),

  // Email
  email: z.string().email('Invalid email address'),

  // Non-empty string
  nonEmpty: z.string().min(1, 'Cannot be empty'),

  // UUID
  uuid: z.string().uuid('Invalid ID format'),
}
