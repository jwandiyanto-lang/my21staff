'use client'

import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'

// Import the exact types expected by consumer components
import type { WorkspaceMember, Profile } from '@/types/database'

// Dev mode check
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Re-export the same shape consumers expect
export type TeamMember = WorkspaceMember & { profile: Profile | null }

interface WorkspaceSettingsResponse {
  teamMembers: TeamMember[]
  contactTags: string[]
}

// Mock data for dev mode
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-001',
    workspace_id: 'dev-workspace-001',
    user_id: 'dev-user-001',
    role: 'owner',
    must_change_password: false,
    settings: null,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'dev-user-001',
      email: 'jonathan@eagle.edu',
      full_name: 'Jonathan Wandiyanto',
      avatar_url: null,
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

const MOCK_CONTACT_TAGS = ['Hot Lead', 'Student', 'Parent', 'Follow Up']

// Conditionally use Clerk hooks only in production
function useClerkAuth() {
  if (isDevMode) {
    return { userId: 'dev-user-001', user: { fullName: 'Dev User', primaryEmailAddress: { emailAddress: 'dev@localhost' }, imageUrl: null } }
  }
  // Dynamic require to avoid Clerk initialization in dev mode
  const { useAuth, useUser } = require('@clerk/nextjs')
  const { userId } = useAuth()
  const { user } = useUser()
  return { userId, user }
}

export function useWorkspaceSettings(workspaceId: string | null) {
  const { userId, user } = useClerkAuth()

  // Dev mode: return mock data immediately, skip Convex queries
  const workspace = useQuery(
    api.workspaces.getById,
    isDevMode ? 'skip' : (workspaceId ? { id: workspaceId } : 'skip')
  )

  const members = useQuery(
    api.workspaceMembers.listByWorkspaceWithUsers,
    isDevMode ? 'skip' : (workspaceId ? { workspace_id: workspaceId } : 'skip')
  )

  // In dev mode, return mock data
  if (isDevMode) {
    return {
      data: {
        teamMembers: MOCK_TEAM_MEMBERS,
        contactTags: MOCK_CONTACT_TAGS,
      },
      isLoading: false,
    }
  }

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
