'use client'

import { useOrganization, useOrganizationList } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to get current organization from Clerk.
 * Also provides workspace ID from organization metadata.
 */
export function useCurrentOrganization() {
  const { organization, isLoaded } = useOrganization()

  return {
    organization,
    isLoaded,
    // Extract workspace ID from organization metadata
    workspaceId: organization?.publicMetadata?.convexWorkspaceId as string | undefined,
  }
}

/**
 * Hook to get organization members.
 * Returns list of members with their roles.
 */
export function useOrganizationMembers() {
  const { organization } = useOrganization()

  return useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async () => {
      if (!organization) return []
      const memberships = await organization.getMemberships()
      return memberships.data.map((m) => ({
        id: m.id,
        userId: m.publicUserData?.userId,
        identifier: m.publicUserData?.identifier,
        firstName: m.publicUserData?.firstName,
        lastName: m.publicUserData?.lastName,
        imageUrl: m.publicUserData?.imageUrl,
        role: m.role,
        createdAt: m.createdAt,
      }))
    },
    enabled: !!organization,
    staleTime: 30 * 1000, // 30 seconds - member list updates are important
  })
}
