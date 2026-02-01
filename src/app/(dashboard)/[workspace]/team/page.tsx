'use client'

import { OrganizationProfile, useOrganization } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Users } from 'lucide-react'
import { SarahConfigCard } from '@/components/team/sarah-config-card'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export default function TeamPage() {
  const { organization, isLoaded } = useOrganization()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  // Get workspace ID from organization
  const workspaceQuery = useQuery(
    api.workspaces.getByOrgId,
    isDevMode ? "skip" : organization ? { clerk_org_id: organization.id } : "skip"
  )

  const workspaceId = isDevMode
    ? 'demo' as any
    : workspaceQuery?._id

  // Loading state
  if (!isLoaded) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No organization - user is on a workspace without Clerk org
  if (!organization) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their access
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This workspace is not connected to an organization. Contact admin for setup.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their access in {organization.name}
          </p>
        </div>
      </div>

      {/* Sarah Config Card - above Team Members */}
      {workspaceId && (
        <SarahConfigCard
          workspaceId={workspaceId}
          isDevMode={isDevMode}
        />
      )}

      {/* Clerk OrganizationProfile handles:
          - Member list with avatars
          - Invite new members button
          - Role management (admin/member)
          - Remove members
          - Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Invite new members, manage roles, and configure team access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <OrganizationProfile
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 rounded-none',
                navbar: 'hidden',
                navbarMobileMenuRow: 'hidden',
                pageScrollBox: 'p-6',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                profileSection: {
                  '& .cl-avatarBox': {
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  },
                },
              },
            }}
            routing="hash"
          />
        </CardContent>
      </Card>
    </div>
  )
}
