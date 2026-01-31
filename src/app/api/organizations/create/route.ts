import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

async function getAuthenticatedConvexClient() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'convex' })

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  convex.setAuth(token!)

  return convex
}

/**
 * POST /api/organizations/create
 *
 * Create a new Clerk organization and corresponding Convex workspace.
 * OR create a workspace for an existing organization.
 *
 * Flow:
 * 1. If existingOrgId provided: Use existing org, skip Clerk creation
 * 2. Otherwise: Create new organization in Clerk
 * 3. Create workspace in Convex
 * 4. Link org and workspace via workspace_id in org public_metadata
 * 5. Return organization ID and workspace slug for redirect
 *
 * This is called by the onboarding page to auto-create user's workspace.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug, existingOrgId } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Get authenticated Convex client
    const convex = await getAuthenticatedConvexClient()

    const client = await clerkClient()
    let organization

    // Use existing organization or create new one
    if (existingOrgId) {
      // Organization already exists in Clerk, just fetch it
      organization = await client.organizations.getOrganization({
        organizationId: existingOrgId,
      })
    } else {
      // Create new organization in Clerk
      organization = await client.organizations.createOrganization({
        name,
        slug,
        createdBy: userId,
      })
    }

    // Create workspace in Convex
    const workspaceId = await convex.mutation(api.workspaces.create, {
      name,
      slug,
      owner_id: userId,
    })

    // Create organization record in Convex (links Clerk org to workspace)
    const orgId = await convex.mutation(api.organizations.create, {
      clerk_org_id: organization.id,
      workspace_id: workspaceId,
      name: organization.name,
      slug: organization.slug || slug,
    })

    // Create organization member record
    await convex.mutation(api.organizations.createMember, {
      organization_id: orgId,
      clerk_user_id: userId,
      role: 'org:admin',
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
