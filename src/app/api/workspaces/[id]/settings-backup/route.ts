import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * POST /api/workspaces/[id]/settings-backup
 * Create a backup of settings configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: workspace } = await params
    const body = await request.json()

    const {
      backup_type,
      config_data,
      source = 'user_save',
    } = body

    // Validate required fields
    if (!backup_type || !config_data) {
      return NextResponse.json(
        { error: 'Missing required fields: backup_type, config_data' },
        { status: 400 }
      )
    }

    // Validate backup_type
    const validTypes = ['intern_config', 'brain_config', 'bot_names', 'full']
    if (!validTypes.includes(backup_type)) {
      return NextResponse.json(
        { error: `Invalid backup_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate source
    const validSources = ['user_save', 'auto_backup', 'import']
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      )
    }

    // Create backup via Convex
    try {
      const result = await convex.mutation(api.settingsBackup.createBackup, {
        workspace_id: workspace as Id<'workspaces'>,
        backup_type,
        config_data,
        source,
        created_by: userId,
      })

      return NextResponse.json({
        success: true,
        backup_id: result.backupId,
        synced_at: result.syncedAt,
      })
    } catch (convexError: any) {
      console.error('Convex backup error:', convexError)

      // Try to mark sync as error
      try {
        await convex.mutation(api.settingsBackup.markSyncError, {
          workspace_id: workspace as Id<'workspaces'>,
          error_message: convexError.message || 'Failed to create backup',
        })
      } catch (e) {
        // Ignore error marking failure
        console.error('Failed to mark sync error:', e)
      }

      return NextResponse.json(
        {
          success: false,
          error: convexError.message || 'Failed to create backup',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Settings backup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
