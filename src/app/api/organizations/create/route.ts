import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * POST /api/organizations/create
 *
 * Create a new Clerk organization and corresponding Convex workspace.
 *
 * Flow:
 * 1. Create organization in Clerk
 * 2. Create workspace in Convex
 * 3. Link org and workspace via workspace_id in org public_metadata
 * 4. Return organization ID and workspace slug for redirect
 *
 * This is called by the onboarding page to auto-create user's workspace.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Create organization in Clerk
    const client = await clerkClient()
    const organization = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    })

    // Create workspace in Convex
    const workspaceId = await convex.mutation(api.workspaces.create, {
      name,
      slug,
      owner_id: userId,
    })

    // Update organization metadata with workspace ID
    // This allows the webhook to link the org to the workspace
    await client.organizations.updateOrganization(organization.id, {
      publicMetadata: {
        convexWorkspaceId: workspaceId,
      },
    })

    // Add user as workspace member
    await convex.mutation(api.workspaceMembers.create, {
      workspace_id: workspaceId,
      user_id: userId,
      role: 'owner',
    })

    return NextResponse.json({
      success: true,
      organizationId: organization.id,
      workspaceId,
      workspaceSlug: slug,
    })
  } catch (error) {
    console.error('Organization creation error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create organization',
      },
      { status: 500 }
    )
  }
}
