import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export interface UploadResult {
  url: string
  storageId: string
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

  // Get upload URL from Convex
  const uploadUrl = await convex.mutation(api.storage.generateUploadUrl, {})

  // Upload file to Convex storage
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!result.ok) {
    throw new Error('Failed to upload file')
  }

  const { storageId } = await result.json()

  // Get serving URL
  const url = await convex.query(api.storage.getUrl, {
    storageId: storageId as Id<"_storage">,
  })

  return {
    url: url || '',
    storageId,
    size: file.size,
  }
}

export async function deleteTicketAttachment(storageId: string): Promise<void> {
  await convex.mutation(api.storage.deleteById, {
    storageId: storageId as Id<"_storage">,
  })
}

export async function getAttachmentUrl(storageId: string): Promise<string> {
  const url = await convex.query(api.storage.getUrl, {
    storageId: storageId as Id<"_storage">,
  })
  return url || ''
}

// Constants for external validation
export { MAX_FILE_SIZE, ALLOWED_TYPES }
