import { NextRequest, NextResponse } from 'next/server'
import { isDevMode, getMockInternConfig, updateMockInternConfig } from '@/lib/mock-data'

// GET - Load intern configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string }> }
) {
  try {
    const { workspace } = await params

    // Dev mode: return mock data
    if (isDevMode() && workspace === 'demo') {
      const config = getMockInternConfig()
      return NextResponse.json(config)
    }

    // Production: query Convex
    // TODO: Implement Convex query when intern-config table is created
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
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
  { params }: { params: Promise<{ workspace: string }> }
) {
  try {
    const { workspace } = await params
    const updates = await request.json()

    // Dev mode: update mock data
    if (isDevMode() && workspace === 'demo') {
      const updated = updateMockInternConfig(updates)
      return NextResponse.json(updated)
    }

    // Production: update in Convex
    // TODO: Implement Convex mutation when intern-config table is created
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
  } catch (error) {
    console.error('Failed to save intern config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
