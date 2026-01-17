import { z } from './index'

export const updateContactSchema = z.object({
  name: z.string().max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number').optional(),
  lead_status: z.enum(['prospect', 'cold_lead', 'hot_lead', 'client', 'student', 'alumni', 'lost']).optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  assigned_to: z.string().uuid('Invalid user ID').optional().nullable(),
}).strict()

export const mergeContactSchema = z.object({
  keepContactId: z.string().uuid('Invalid keep contact ID'),
  mergeContactId: z.string().uuid('Invalid merge contact ID'),
  activePhone: z.string().optional(),
  activeEmail: z.string().email().optional().nullable(),
})
