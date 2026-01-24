import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * Send Media Message API - Temporarily disabled during Supabase removal
 *
 * This route previously used Supabase Storage for media uploads.
 * TODO: Migrate to Convex file storage in Phase 2 (CRM Features)
 *
 * Original flow:
 * 1. Upload file to Supabase Storage
 * 2. Get public URL
 * 3. Send media message via Kapso API
 * 4. Save message to Convex database
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      error: 'Media messaging temporarily unavailable',
      message: 'This feature is being rebuilt with new architecture',
    },
    { status: 503 }
  )
}
