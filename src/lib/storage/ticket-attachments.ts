import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'ticket-attachments'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export interface UploadResult {
  url: string
  path: string
  size: number
}

export async function uploadTicketAttachment(
  ticketId: string,
  file: File
): Promise<UploadResult> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only images are allowed (JPEG, PNG, GIF, WebP)')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be under 5MB')
  }

  const supabase = createClient()
  const fileName = `${ticketId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw error

  // Get public URL (bucket is private but we have RLS)
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: publicUrl,
    path: data.path,
    size: file.size
  }
}

export async function deleteTicketAttachment(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])
  if (error) throw error
}

export function getAttachmentUrl(path: string): string {
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  return publicUrl
}

// Constants for external validation
export { BUCKET_NAME, MAX_FILE_SIZE, ALLOWED_TYPES }
