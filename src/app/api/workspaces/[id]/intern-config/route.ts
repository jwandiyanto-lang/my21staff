import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { isDevMode, getMockInternConfig, updateMockInternConfig } from '@/lib/mock-data'

// GET - Load intern configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Dev mode: return mock data
    if (isDevMode() && id === 'demo') {
      const config = getMockInternConfig()
      return NextResponse.json(config)
    }

    // Production: query Convex
    const config = await fetchQuery(api.internConfig.getByWorkspaceId, {
      workspaceId: id as Id<'workspaces'>,
    })

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        persona: {
          greetingStyle: 'friendly',
          language: 'indonesian',
          tone: ['supportive', 'clear'],
          customPrompt: '',
        },
        behavior: {
          autoRespondNewLeads: true,
          handoffKeywords: ['human', 'operator', 'manager', 'cs', 'customer service'],
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          maxMessagesBeforeHuman: 10,
        },
        response: {
          maxMessageLength: 280,
          emojiUsage: 'moderate',
          priceMentions: 'ranges',
          responseDelay: 'instant',
        },
        slotExtraction: {
          enabled: true,
          slots: {
            name: { enabled: true, required: true },
            serviceInterest: { enabled: true, required: false },
            budgetRange: { enabled: true, required: false },
            timeline: { enabled: true, required: false },
          },
          customSlots: [],
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to load intern config:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

// PATCH - Save intern configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()

    // Dev mode: update mock data
    if (isDevMode() && id === 'demo') {
      const updated = updateMockInternConfig(updates)
      return NextResponse.json(updated)
    }

    // Production: upsert to Convex
    const result = await fetchMutation(api.internConfig.upsert, {
      workspaceId: id as Id<'workspaces'>,
      updates,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to save intern config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
