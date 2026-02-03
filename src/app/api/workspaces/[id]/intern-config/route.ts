import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { isDevMode, getMockInternConfig, updateMockInternConfig } from '@/lib/mock-data'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// GET - Load intern configuration
// Note: [id] is the workspace SLUG, not Convex ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceSlug } = await params

    // Dev mode: return mock data
    if (isDevMode() && workspaceSlug === 'demo') {
      const config = getMockInternConfig()
      return NextResponse.json(config)
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Production: query Convex with proper workspace ID
    const config = await convex.query(api.internConfig.getByWorkspaceId, {
      workspaceId: workspace._id,
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
// Note: [id] is the workspace SLUG, not Convex ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceSlug } = await params
    const updates = await request.json()

    // Dev mode: update mock data
    if (isDevMode() && workspaceSlug === 'demo') {
      const updated = updateMockInternConfig(updates)
      return NextResponse.json(updated)
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, { slug: workspaceSlug })
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Production: upsert to Convex with proper workspace ID
    const result = await convex.mutation(api.internConfig.upsert, {
      workspaceId: workspace._id,
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
