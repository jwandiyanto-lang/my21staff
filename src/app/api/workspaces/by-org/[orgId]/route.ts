import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/../convex/_generated/api'

/**
 * GET /api/workspaces/by-org/[orgId]
 *
 * Get workspace by Clerk organization ID.
 * Used during onboarding to check if a workspace exists for an organization.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId } = await params

    // Query workspace by organization ID
    const workspace = await fetchQuery(api.workspaces.getByOrgId, {
      clerk_org_id: orgId,
    })

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Get workspace by org error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get workspace',
      },
      { status: 500 }
    )
  }
}
