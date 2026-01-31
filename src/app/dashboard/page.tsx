'use client'

import { useEffect } from 'react'
import { useAuth, useOrganizationList } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

/**
 * Dashboard redirect page.
 *
 * This page handles the post-login redirect logic:
 * 1. Check if user has organizations
 * 2. If no org: Redirect to /onboarding
 * 3. If has org: Find workspace and redirect to /[workspace]
 *
 * Clerk redirects here after sign-in (NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL).
 */
export default function DashboardRedirect() {
  const { userId } = useAuth()
  const router = useRouter()
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })

  useEffect(() => {
    async function redirect() {
      // In dev mode, redirect directly to demo workspace
      if (isDevMode) {
        router.push('/demo')
        return
      }

      if (!userId) {
        // Not authenticated - redirect to sign in
        router.push('/sign-in')
        return
      }

      // Wait for organization list to load
      if (!userMemberships.isLoaded) {
        return
      }

      // No organizations - go to onboarding to create one
      if (!userMemberships.data || userMemberships.data.length === 0) {
        router.push('/onboarding')
        return
      }

      // Has organizations - redirect to first one's workspace
      const firstOrg = userMemberships.data[0].organization

      // Set as active organization
      if (setActive) {
        await setActive({ organization: firstOrg.id })
      }

      // Find workspace for this org
      try {
        const workspace = await convex.query(api.workspaces.getByOrgId, {
          clerk_org_id: firstOrg.id,
        })

        if (workspace) {
          router.push(`/${workspace.slug}`)
        } else {
          // Organization exists but no workspace - this shouldn't happen
          // Redirect to onboarding to create workspace
          console.error('Organization exists but workspace not found:', firstOrg.id)
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error fetching workspace:', error)
        router.push('/onboarding')
      }
    }

    redirect()
  }, [userId, userMemberships, setActive, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    </div>
  )
}
