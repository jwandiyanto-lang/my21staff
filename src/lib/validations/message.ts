import { z } from './index'

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message too long (max 4096 characters)'),
})

export const sendMediaMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  mediaUrl: z.string().url('Invalid media URL'),
  caption: z.string().max(1024, 'Caption too long').optional(),
  mediaType: z.enum(['image', 'video', 'document', 'audio']),
})
