import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}

    if (body.kapso_phone_id !== undefined) {
      updates.kapso_phone_id = body.kapso_phone_id
    }

    if (body.settings !== undefined) {
      // Merge with existing settings
      const { data: existing } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .single()

      const existingSettings = (existing?.settings as Record<string, unknown>) || {}
      updates.settings = {
        ...existingSettings,
        ...body.settings,
      }
    }

    // Update workspace
    const { error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)

    if (error) {
      console.error('Error updating workspace settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in workspace settings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
