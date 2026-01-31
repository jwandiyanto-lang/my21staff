import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

async function getAuthenticatedConvexClient() {
  const { getToken } = await auth()
  // Get token from "convex" JWT template (required by Convex auth config)
  const token = await getToken({ template: "convex" })

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  if (token) {
    convex.setAuth(token)
  }

  return convex
}

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

    // Get authenticated Convex client
    const convex = await getAuthenticatedConvexClient()

    // Query workspace by organization ID
    const workspace = await convex.query(api.workspaces.getByOrgId, {
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
