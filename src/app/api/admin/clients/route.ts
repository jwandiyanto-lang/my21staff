import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Super admin check
const SUPER_ADMIN_IDS = ['user_38fViPWAnLiNth62ZaAJj3PQDWU'] // jwandiyanto@gmail.com

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !SUPER_ADMIN_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaces = await convex.query(api.workspaces.listAll, {})
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('List clients error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !SUPER_ADMIN_IDS.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { fullName, email, businessName } = body

    if (!fullName || !email || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, businessName' },
        { status: 400 }
      )
    }

    // Generate slug
    const baseSlug = generateSlug(businessName)

    // Check if slug exists and make unique if needed
    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await convex.query(api.workspaces.getBySlug, {
        slug: slug
      })

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create user in Clerk first
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()

    // Generate a temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let tempPassword = 'Welcome'
    for (let i = 0; i < 4; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    tempPassword += '!'

    try {
      const newUser = await clerk.users.createUser({
        emailAddress: [email],
        password: tempPassword,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
        skipPasswordRequirement: false,
      })

      // Create workspace in Convex
      const workspaceId = await convex.mutation(api.workspaces.create, {
        name: businessName,
        slug,
        owner_id: newUser.id,
      })

      // Note: Workspace membership is handled by Clerk organization webhooks
      // In the current transition, we create a workspace but the full org integration
      // will be completed in a future phase

      return NextResponse.json({
        email,
        password: tempPassword,
        workspace: {
          id: workspaceId,
          name: businessName,
          slug,
        },
      })
    } catch (clerkError: any) {
      console.error('Create user error:', clerkError)
      return NextResponse.json(
        { error: clerkError?.message || 'Failed to create user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
