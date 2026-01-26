'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useAuth, useUser } from '@clerk/nextjs'

// Import the exact types expected by consumer components
import type { WorkspaceMember, Profile } from '@/types/database'

// Re-export the same shape consumers expect
export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface WorkspaceSettingsResponse {
  teamMembers: TeamMember[]
  contactTags: string[]
}

export function useWorkspaceSettings(workspaceId: string | null) {
  const { userId } = useAuth()
  const { user } = useUser()

  // Fetch workspace data
  const workspace = useQuery(
    api.workspaces.getById,
    workspaceId ? { id: workspaceId } : 'skip'
  )

  // Fetch team members with user data
  const members = useQuery(
    api.workspaceMembers.listByWorkspaceWithUsers,
    workspaceId ? { workspace_id: workspaceId } : 'skip'
  )

  const isLoading = workspace === undefined || members === undefined

  if (isLoading || !workspace || !members) {
    return {
      data: undefined,
      isLoading,
    }
  }

  // Extract contact tags from workspace settings
  const contactTags = ((workspace as { settings?: Record<string, unknown> }).settings)?.contact_tags as string[] || []

  // Map Convex members to expected TeamMember structure
  const teamMembers: TeamMember[] = members.map((m: Record<string, unknown>) => {
    const userObj = m.user as Record<string, unknown> | null
    return {
      id: m._id as string,
      user_id: m.user_id as string,
      workspace_id: m.workspace_id as string,
      role: m.role as string,
      must_change_password: false,
      settings: null,
      created_at: new Date(m.created_at as number).toISOString(),
      profile: userObj ? {
        id: m.user_id as string,
        full_name: userObj.name as string || null,
        email: userObj.email as string || null,
        avatar_url: null,
        created_at: null,
        is_admin: null,
        updated_at: null,
      } : null,
    }
  })

  // Ensure current user is in the team members list
  if (userId && !teamMembers.some(m => m.user_id === userId)) {
    teamMembers.unshift({
      id: `temp-${userId}`,
      user_id: userId,
      workspace_id: workspaceId || '',
      role: 'owner',
      must_change_password: false,
      settings: null,
      created_at: new Date().toISOString(),
      profile: user ? {
        id: userId,
        full_name: user.fullName || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        avatar_url: user.imageUrl || null,
        created_at: null,
        is_admin: null,
        updated_at: null,
      } : null,
    })
  }

  return {
    data: {
      teamMembers,
      contactTags,
    },
    isLoading: false,
  }
}
