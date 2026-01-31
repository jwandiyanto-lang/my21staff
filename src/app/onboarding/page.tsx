'use client'

import { useEffect, useState } from 'react'
import { useAuth, useOrganizationList, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

/**
 * Onboarding page - Auto-creates organization and workspace for new users.
 *
 * Flow:
 * 1. Check if user has any organizations
 * 2. If no org: Create personal org with user's name/email
 * 3. Create workspace linked to org
 * 4. Redirect to workspace dashboard
 *
 * This ensures every user gets their own isolated workspace automatically.
 */
export default function OnboardingPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })

  const [status, setStatus] = useState<'checking' | 'creating' | 'error' | 'complete'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleOnboarding() {
      // In dev mode, redirect directly to demo workspace
      if (isDevMode) {
        router.push('/demo')
        return
      }

      if (!userId || !user) return

      try {
        // Wait for organization list to load
        if (!userMemberships.isLoaded) {
          return
        }

        // If user already has organizations, redirect to first one
        if (userMemberships.data && userMemberships.data.length > 0) {
          const firstOrg = userMemberships.data[0].organization

          // Set as active organization
          if (setActive) {
            await setActive({ organization: firstOrg.id })
          }

          // Find workspace for this org
          const workspace = await convex.query(api.workspaces.getByOrgId, {
            clerk_org_id: firstOrg.id,
          })

          if (workspace) {
            router.push(`/${workspace.slug}`)
          } else {
            // Organization exists but no workspace - shouldn't happen, but handle it
            setError('Organization exists but workspace not found. Please contact support.')
            setStatus('error')
          }
          return
        }

        // No organizations - create one
        setStatus('creating')

        // Generate organization name and slug from user info
        const orgName = user.fullName || user.primaryEmailAddress?.emailAddress || 'My Workspace'
        const orgSlug = generateSlug(orgName, user.id)

        // Create organization + workspace via API
        const response = await fetch('/api/organizations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: orgName,
            slug: orgSlug,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create organization')
        }

        const { organizationId, workspaceSlug } = await response.json()

        // Set new org as active
        if (setActive) {
          await setActive({ organization: organizationId })
        }

        // Redirect to new workspace
        setStatus('complete')
        router.push(`/${workspaceSlug}`)
      } catch (err) {
        console.error('Onboarding error:', err)
        setError(err instanceof Error ? err.message : 'Failed to create workspace')
        setStatus('error')
      }
    }

    handleOnboarding()
  }, [userId, user, userMemberships, setActive, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Setting up your workspace</h1>
          {status === 'checking' && (
            <p className="text-muted-foreground">Checking your account...</p>
          )}
          {status === 'creating' && (
            <p className="text-muted-foreground">Creating your personal workspace...</p>
          )}
          {status === 'complete' && (
            <p className="text-muted-foreground">Redirecting to your workspace...</p>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-destructive">{error || 'Something went wrong'}</p>
              <button
                onClick={() => router.push('/sign-in')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {status !== 'error' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Generate a unique slug from organization name and user ID.
 * Format: name-suffix (e.g., "my-workspace-a1b2c3")
 */
function generateSlug(name: string, userId: string): string {
  // Clean name: lowercase, remove special chars, replace spaces with hyphens
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 20) // Max 20 chars for name part

  // Use last 6 chars of user ID as suffix for uniqueness
  const suffix = userId.slice(-6).toLowerCase()

  return `${cleanName}-${suffix}`
}
