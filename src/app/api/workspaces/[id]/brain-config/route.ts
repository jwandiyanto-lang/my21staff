import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { isDevMode, getMockBrainConfig, updateMockBrainConfig } from '@/lib/mock-data'

// GET - Load brain configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Dev mode: return mock data
    if (isDevMode() && id === 'demo') {
      const config = getMockBrainConfig()
      return NextResponse.json(config)
    }

    // Production: query Convex
    const config = await fetchQuery(api.brainConfig.getByWorkspaceId, {
      workspaceId: id as Id<'workspaces'>,
    })

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        summary: {
          enabled: true,
          time: '09:00',
          format: 'bullet',
          includeMetrics: {
            newLeads: true,
            conversions: true,
            responseTimes: true,
            topSources: false,
          },
        },
        scoring: {
          hotThreshold: 70,
          warmThreshold: 40,
          weights: {
            basicInfo: 20,
            qualification: 30,
            document: 25,
            engagement: 25,
          },
        },
        triggers: {
          onHandoff: true,
          onKeyword: true,
          keyword: '!summary',
          onSchedule: false,
          schedule: '0 9 * * *',
          analysisDepth: 'standard',
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to load brain config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

// PATCH - Save brain configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()

    // Dev mode: update mock data
    if (isDevMode() && id === 'demo') {
      const updated = updateMockBrainConfig(updates)
      return NextResponse.json(updated)
    }

    // Production: upsert to Convex
    const result = await fetchMutation(api.brainConfig.upsert, {
      workspaceId: id as Id<'workspaces'>,
      updates,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to save brain config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
